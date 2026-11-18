# Deploying Bareeq Cloud Starter

This guide takes a fresh checkout to a running production pilot. Read it top to bottom once;
each step lists the exact commands. For a shorter Render + Netlify walkthrough see
`prod-deployment.md`.

```
 Browser ──► Static host (web app, dist/)
    │
    └──── /api/v1 + Bearer token ──► API container ──► PostgreSQL
                                     (Docker image)    (data, users, password hashes, logo)
```

- The **browser** talks only to the **API**: sign-in, data and the school logo all go through it.
- The **API** is the only component holding database credentials and the token-signing secret.
- Sign-in is **username + password**. Passwords are stored as bcrypt hashes; the API issues
  signed session tokens (JWT, 12 hours by default). There is no external auth service.

---

## 1. What you need

| Item                          | Notes                                                                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A PostgreSQL 14+ database     | Managed (Render, Neon, RDS, Azure, …) or self-hosted. Daily backups recommended (see §9).                                                                        |
| A container host for the API  | Anything that runs a Docker image and provides HTTPS: Render, Fly.io, Railway, Azure Container Apps, AWS ECS/App Runner, or a VM with Docker + a reverse proxy. |
| A static host for the web app | Netlify, Cloudflare Pages, Vercel, Azure Static Web Apps, S3 + CloudFront, or nginx.                                                                            |
| Two HTTPS URLs                | e.g. `https://app.school.om` (web) and `https://api.school.om` (API).                                                                                           |
| Locally                       | Node 22+, pnpm 10 (`npm i -g pnpm`), Docker.                                                                                                                    |

No SMTP/e-mail provider is needed: admins create accounts and reset passwords in the app.

---

## 2. Prepare the database

1. **Create a database** in the same region as the API host, and store its password in your
   password manager.
2. **Collect the connection strings:**

   | Value                                         | Where it goes                                 |
   | --------------------------------------------- | --------------------------------------------- |
   | Connection URI used by the app                | `DATABASE_URL` (API runtime)                  |
   | Direct (non-pooled) URI, if the above is a pooler | `DIRECT_DATABASE_URL` (migrations; optional) |

   If you connect through a transaction pooler (PgBouncer and similar), set the direct URI as
   `DIRECT_DATABASE_URL`; the API already disables prepared statements for poolers.
   URL-encode special characters in the password. SSL is enabled automatically for remote hosts;
   override with `DATABASE_SSL` (`require`, `prefer`, `disable`) if needed.

3. **Generate the token-signing secret** and keep it with the other secrets:

   ```bash
   openssl rand -base64 48
   ```

**Moving from the earlier Supabase setup:** keep using the same database. Running the migrations
(§4) adds the username/password columns, copies each user's existing password hash, and makes
their **old e-mail address their username** — everyone keeps their password. The school logo was
stored outside the database and must be uploaded again (§8).

---

## 3. Environment variables

### API (`.env.example` in the API repo)

| Variable                | Example                                       | Notes                                                                                                                  |
| ----------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`              | `production`                                  |                                                                                                                        |
| `PORT`                  | `4000`                                        | The container listens here.                                                                                            |
| `CORS_ORIGIN`           | `https://app.school.om`                       | Web origin(s), comma-separated.                                                                                        |
| `DATABASE_URL`          | `postgresql://bareeq:<pw>@db.host:5432/bareeq` |                                                                                                                        |
| `DIRECT_DATABASE_URL`   | `postgresql://bareeq:<pw>@db.host:5432/bareeq` | Optional; used by migrations only. Defaults to `DATABASE_URL`.                                                         |
| `JWT_SECRET`            | output of `openssl rand -base64 48`           | **Required in production**, 32+ characters. Changing it signs everyone out.                                            |
| `SESSION_TTL_HOURS`     | `12`                                          | Optional. How long a sign-in lasts.                                                                                    |
| `SEED_ADMIN_USERNAME`   | `admin`                                       | Only needed when running the seed (§5).                                                                                |
| `SEED_ADMIN_PASSWORD`   | (strong, ≥ 8 chars)                           | Only for the seed; remove afterwards.                                                                                  |
| `SETUP_TOKEN`           | 24+ random characters                         | Optional. Enables the one-time `POST /setup/admin` (§5); remove after use.                                             |
| `LOG_LEVEL`             | `info`                                        | Optional (`debug`, `warn`, …).                                                                                         |
| `RATE_LIMIT_PER_MINUTE` | `300`                                         | Optional. Requests per minute per client IP; raise it (e.g. `1200`) if all staff share one school internet connection. |

The API validates these at startup and exits with a list of what is missing or malformed.

### Web (`.env.example` in the web repo) — baked in at **build** time

| Variable       | Example                        |
| -------------- | ------------------------------ |
| `VITE_API_URL` | `https://api.school.om/api/v1` |

This is the only web variable, and it is public. Never put secrets in `VITE_*` variables.

---

## 4. Build the API image and run the migrations

From the API repository root:

```bash
docker build -t bareeq-api:1.0.0 .
```

Put the API variables from §3 in a file that is **not** committed (e.g. `api.prod.env`), then
apply the database migrations (tables, enums, balance views, triggers, privileges):

```bash
docker run --rm --env-file api.prod.env bareeq-api:1.0.0 node dist/db/migrate.js
```

Expected log line: `"msg":"Migrations applied successfully"`. Migrations are tracked in the
`drizzle.__drizzle_migrations` table, so re-running is safe (only new ones are applied).

_Without Docker:_ `pnpm install && pnpm build`, put the variables in `.env`, then
`pnpm start:migrate`.

---

## 5. Create the school and the first admin

The seed creates the organization ("Bareeq School" — rename it in the app), the current
academic year (September → June), three starter classes, and the first **admin** account:

```bash
docker run --rm --env-file api.prod.env \
  -e SEED_ADMIN_USERNAME=admin -e SEED_ADMIN_PASSWORD='<strong password>' \
  bareeq-api:1.0.0 node dist/db/seed.js
```

- It is idempotent: running it again changes nothing (an existing admin keeps its password).
- Do **not** pass `--demo` in production (that adds sample students and payments).
- Afterwards remove `SEED_ADMIN_PASSWORD` from any stored env file. The admin can change the
  password at any time from the user menu → **Change password**.

**No shell access on the host?** Set `SETUP_TOKEN`, deploy, and call once:

```bash
curl -X POST https://api.school.om/api/v1/setup/admin \
  -H "Content-Type: application/json" -H "X-Setup-Token: <SETUP_TOKEN>" \
  -d '{"username":"admin","fullName":"School Administrator","password":"<strong password>"}'
```

It returns `201` once, `409` after an admin exists. Remove `SETUP_TOKEN` afterwards.

---

## 6. Deploy the API container

Run the same image on your container host:

| Setting      | Value                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------- |
| Image        | `bareeq-api:1.0.0` (push it to your registry first)                                      |
| Command      | default (`node dist/server.js`)                                                          |
| Port         | `4000` (or whatever `PORT` you set)                                                      |
| Health check | `GET /api/v1/health` → `200 {"status":"ok"}` (the image also has a Docker `HEALTHCHECK`) |
| Environment  | the API variables from §3 (without the `SEED_*` ones)                                    |
| Instances    | 1 is enough for one school; the API is stateless, so more instances also work            |

Notes:

- Terminate HTTPS at the platform/load balancer. The API trusts **one** proxy hop
  (`trust proxy = 1`) so rate limiting sees the real client IP.
- All instances must share the same `JWT_SECRET`, or users will be signed out at random.
- Logs are JSON (pino) on stdout; `Authorization` and cookie headers are redacted.
- Rate limits: 300 requests per minute per client IP by default (`RATE_LIMIT_PER_MINUTE`), and
  10 failed sign-ins per IP per 15 minutes. Behind a school's shared internet connection all
  staff appear as one IP — raise the general limit if users see "Too many requests".
- Quick check after deploying:
  ```bash
  curl https://api.school.om/api/v1/health
  curl https://api.school.om/api/v1/branding     # school name, colour, logo URL
  ```

---

## 7. Build and deploy the web app

From the web repository root:

```bash
pnpm install
VITE_API_URL=https://api.school.om/api/v1 pnpm build
```

(On Windows PowerShell set the variable with `$env:VITE_API_URL = '…'` first, or put it in
`.env.production`.) Upload **`dist/`** to the static host.

The app is a single-page application: every unknown path must serve `index.html`.

- **Netlify / Cloudflare Pages:** nothing to do — `dist/_redirects` (SPA fallback) and
  `dist/_headers` (long-term caching for `/assets/*`, no-cache for `index.html`, security
  headers) are included in the build.
- **Vercel:** add `vercel.json` to the deployed folder:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
- **nginx:**
  ```nginx
  location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
  location / {
    try_files $uri /index.html;
    add_header Cache-Control "no-cache";
  }
  ```
- **S3 + CloudFront / Azure Static Web Apps:** configure 403/404 → `/index.html` (200).

Because the variable is compiled in, **rebuild the web app** whenever the API URL changes.

---

## 8. Post-deployment checklist

1. `https://app.school.om/login` shows the school name and the username/password form.
2. Sign in as the seeded admin → dashboard loads (0 students).
3. **Settings → Organization:** set the real school name (English and Arabic) and default
   language. **Settings → Branding:** upload the logo, set the brand colour; the logo appears on
   the sign-in page and in the header.
4. **Settings → Academic years / Classes:** adjust the year and classes.
5. **Settings → Users → Create user:** create a staff member with a username and initial
   password, sign in as them in a private window, then use **Reset password** as the admin and
   confirm their old session is signed out.
6. Create a student, add a fee, record a payment; check **Reports → Outstanding** and
   **Export CSV**; open the CSV in Excel (Arabic must display correctly).
7. Switch to **العربية** — the layout turns right-to-left.
8. Confirm the API rejects requests without a token (expect `401`):
   ```bash
   curl -i https://api.school.om/api/v1/students
   ```

---

## 9. Backups and restore

| Layer                  | What                    | How                                                                                                                                   |
| ---------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Managed backups        | Whole database          | Most managed Postgres providers take daily backups; enable point-in-time recovery if the school needs finer-grained restores.         |
| Your own nightly dump  | Schema + data           | `pg_dump` with the direct URL (keep at least 30 days, store off-site, encrypted). Includes users, password hashes and the logo.      |
| Admin data export      | CSV per table (ZIP)     | **Settings → Data export** — a human-readable archive for the school (passwords are never included); not a database restore source.   |

Nightly dump (e.g. from a scheduled job with a PostgreSQL client matching your server version):

```bash
pg_dump "$DIRECT_DATABASE_URL" --schema=public --schema=drizzle \
  --no-owner --no-privileges --format=custom \
  --file "bareeq-$(date +%F).dump"
```

Everything the app needs — including user accounts and the logo — is in these two schemas.

**Restore drill (do it once before go-live):** create a scratch database, run the migrations
(§4), then
`pg_restore --data-only --no-owner --disable-triggers -d "$SCRATCH_DIRECT_URL" bareeq-<date>.dump`,
point a local API at it and sign in.

---

## 10. Upgrading to a new version

1. Build and push the new image (`bareeq-api:<new-version>`).
2. Run the migrations with the **new** image (§4). Migrations are additive and run before the
   new code.
3. Roll out the new API image.
4. Rebuild and upload the web app (§7).
5. Spot-check with §8 steps 1, 2 and 6.

To roll back the application, redeploy the previous image and web build; schema changes are not
rolled back automatically, so keep migrations backward-compatible with the previous release.

---

## 11. Security notes

- Secrets (`JWT_SECRET`, database URLs) exist only in the API environment. If `JWT_SECRET` is
  ever exposed, replace it and redeploy — every existing session is invalidated.
- There is no public sign-up: only admins create accounts. Usernames are case-insensitive.
- Passwords are bcrypt-hashed; wrong usernames and wrong passwords get the same error.
- Changing or resetting a password signs that user out on every other device.
- Deactivated users are rejected by the API on their next request, even with a valid token.
- The logo endpoint is public and serves images with a strict Content-Security-Policy, so an
  uploaded SVG cannot run scripts.
- Payments cannot be edited or deleted; voids are admin-only and recorded in `audit_log`.
