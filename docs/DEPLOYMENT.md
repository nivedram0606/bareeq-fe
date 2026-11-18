# Deploying Bareeq Cloud Starter

This guide takes a fresh checkout to a running production pilot. Read it top to bottom once;
each step lists the exact commands.

```
 Browser ──► Static host (apps/web/dist)          Supabase project
    │                                              ├─ Auth (sign-in, invites, password reset)
    ├──── sign-in / session ─────────────────────► ├─ Storage bucket "branding" (public logo)
    │                                              └─ Postgres (RLS on, no policies)
    └──── /api/v1 + Bearer token ──► API container ──► Postgres via Supavisor pooler
                                     (Docker image)   Auth Admin + Storage via service key
```

- The **browser** only talks to Supabase **Auth**; all data goes through the **API**.
- The **API** is the only component holding database credentials and the service-role key.
- Row Level Security is enabled on every table with no policies, so the public (anon) key cannot
  read data through Supabase's auto-generated REST API.

---

## 1. What you need

| Item                          | Notes                                                                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A Supabase project            | Free or paid plan; paid plans include daily backups (see §9).                                                                                                   |
| A container host for the API  | Anything that runs a Docker image and provides HTTPS: Render, Fly.io, Railway, Azure Container Apps, AWS ECS/App Runner, or a VM with Docker + a reverse proxy. |
| A static host for the web app | Netlify, Cloudflare Pages, Vercel, Azure Static Web Apps, S3 + CloudFront, or nginx.                                                                            |
| Two HTTPS URLs                | e.g. `https://app.school.om` (web) and `https://api.school.om` (API).                                                                                           |
| An SMTP provider              | For invite and password-reset e-mails (Supabase's built-in mailer is rate-limited and meant for testing).                                                       |
| Locally                       | Node 22+, pnpm 10 (`npm i -g pnpm`), Docker.                                                                                                                    |

---

## 2. Create and configure the Supabase project

1. **Create the project** in the Supabase dashboard. Pick the region closest to Oman that is
   available to you, and store the database password in your password manager.

2. **Authentication → Sign In / Providers**
   - Keep **Email** enabled; **disable "Allow new users to sign up"** (users are only invited by
     an admin or created by the seed script).
   - Set the minimum password length to **8** or more.

3. **Authentication → URL Configuration**
   - **Site URL:** your web URL, e.g. `https://app.school.om`
   - **Redirect URLs:** add `https://app.school.om/reset-password`
     (invite and password-reset e-mails send users there to choose a password).

4. **Authentication → Emails → SMTP Settings:** configure your SMTP provider and sender
   address. Optionally adjust the _Invite user_ and _Reset password_ templates (school name,
   Arabic text).

5. **JWT signing keys (required).** The API verifies access tokens with the project's public
   JWKS (`/auth/v1/.well-known/jwks.json`), which needs an **asymmetric** signing key.
   New projects use one by default. For older projects: _Project Settings → JWT Keys_ →
   create/rotate to an asymmetric (ECC/RSA) key. Check it:

   ```bash
   curl https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
   # must print {"keys":[{ ... "alg":"ES256" ... }]} — an empty "keys" list will reject every login
   ```

6. **Collect the connection details** (_Project Settings → API Keys_ and the **Connect** dialog):

   | Value                                            | Where it goes                                                       |
   | ------------------------------------------------ | ------------------------------------------------------------------- |
   | Project URL `https://<ref>.supabase.co`          | `SUPABASE_URL` (API), `VITE_SUPABASE_URL` (web)                     |
   | Publishable / `anon` key                         | `VITE_SUPABASE_ANON_KEY` (web) — public by design                   |
   | Secret / `service_role` key                      | `SUPABASE_SERVICE_ROLE_KEY` (API only — **never** in the web build) |
   | **Transaction pooler** URI (port **6543**)       | `DATABASE_URL` (API runtime)                                        |
   | **Session pooler** or direct URI (port **5432**) | `DIRECT_DATABASE_URL` (migrations)                                  |

   The direct connection host is IPv6-only on Supabase; if your network/host lacks IPv6, use the
   session pooler URI for `DIRECT_DATABASE_URL`. URL-encode special characters in the password.

The storage bucket `branding` (public, 1 MB, PNG/JPEG/SVG) is created by the migrations — no
manual setup.

---

## 3. Environment variables

### API (`apps/api/.env.example`)

| Variable                    | Example                                                                             | Notes                                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                  | `production`                                                                        |                                                                                                                        |
| `PORT`                      | `4000`                                                                              | The container listens here.                                                                                            |
| `CORS_ORIGIN`               | `https://app.school.om`                                                             | Web origin(s), comma-separated. The first one is also used for invite links (`/reset-password`).                       |
| `DATABASE_URL`              | `postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:6543/postgres` | Transaction pooler; the API disables prepared statements for it.                                                       |
| `DIRECT_DATABASE_URL`       | `postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres` | Session pooler / direct; used by migrations only.                                                                      |
| `SUPABASE_URL`              | `https://<ref>.supabase.co`                                                         |                                                                                                                        |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_…` or legacy `eyJ…`                                                      | Secret. Used for invites and logo uploads.                                                                             |
| `SUPABASE_JWKS_URL`         | `https://<ref>.supabase.co/auth/v1/.well-known/jwks.json`                           |                                                                                                                        |
| `SUPABASE_JWT_ISSUER`       | `https://<ref>.supabase.co/auth/v1`                                                 | Must match the `iss` claim exactly.                                                                                    |
| `SEED_ADMIN_EMAIL`          | `it@school.om`                                                                      | Only needed when running the seed (§5).                                                                                |
| `SEED_ADMIN_PASSWORD`       | (strong, ≥ 8 chars)                                                                 | Only for the seed; remove afterwards.                                                                                  |
| `LOG_LEVEL`                 | `info`                                                                              | Optional (`debug`, `warn`, …).                                                                                         |
| `RATE_LIMIT_PER_MINUTE`     | `300`                                                                               | Optional. Requests per minute per client IP; raise it (e.g. `1200`) if all staff share one school internet connection. |

The API validates these at startup and exits with a list of what is missing or malformed.

### Web (`apps/web/.env.example`) — baked in at **build** time

| Variable                 | Example                        |
| ------------------------ | ------------------------------ |
| `VITE_SUPABASE_URL`      | `https://<ref>.supabase.co`    |
| `VITE_SUPABASE_ANON_KEY` | publishable / `anon` key       |
| `VITE_API_URL`           | `https://api.school.om/api/v1` |

Only these three public values may be prefixed `VITE_`. Never put the service key or database
URLs in the web build.

---

## 4. Build the API image and run the migrations

From the repository root:

```bash
docker build -f apps/api/Dockerfile -t bareeq-api:1.0.0 .
```

Put the API variables from §3 in a file that is **not** committed (e.g. `api.prod.env`), then
apply the database migrations (tables, enums, balance views, triggers, RLS, privileges, storage
bucket):

```bash
docker run --rm --env-file api.prod.env bareeq-api:1.0.0 node dist/db/migrate.js
```

Expected log line: `"msg":"Migrations applied"`. Migrations are tracked in the
`drizzle.__drizzle_migrations` table, so re-running is safe (only new ones are applied).

_Without Docker:_ `pnpm install && pnpm --filter "@bareeq/api..." build`, put the variables in
`apps/api/.env`, then `pnpm --filter @bareeq/api start:migrate`.

---

## 5. Create the school and the first admin

The seed creates the organization ("Bareeq School" — rename it in the app), the current
academic year (September → June), three starter classes, and the first **admin** account
(through the Supabase Auth Admin API, e-mail pre-confirmed):

```bash
docker run --rm --env-file api.prod.env \
  -e SEED_ADMIN_EMAIL=it@school.om -e SEED_ADMIN_PASSWORD='<strong password>' \
  bareeq-api:1.0.0 node dist/db/seed.js
```

- It is idempotent: running it again changes nothing (an existing admin keeps its password).
- Do **not** pass `--demo` in production (that adds sample students and payments).
- Afterwards remove `SEED_ADMIN_PASSWORD` from any stored env file. The admin can change the
  password at any time with **Forgot password?** on the sign-in page.

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
- Logs are JSON (pino) on stdout; `Authorization` and cookie headers are redacted.
- Rate limit: 300 requests per minute per client IP by default (`RATE_LIMIT_PER_MINUTE`).
  Behind a school's shared internet connection all staff appear as one IP — raise it if users
  see "Too many requests".
- Quick check after deploying:
  ```bash
  curl https://api.school.om/api/v1/health
  curl https://api.school.om/api/v1/branding     # school name, colour, logo URL
  ```

---

## 7. Build and deploy the web app

```bash
pnpm install
VITE_SUPABASE_URL=https://<ref>.supabase.co \
VITE_SUPABASE_ANON_KEY=<publishable-or-anon-key> \
VITE_API_URL=https://api.school.om/api/v1 \
pnpm --filter @bareeq/web build
```

(On Windows PowerShell set the variables with `$env:VITE_API_URL = '…'` first, or put them in
`apps/web/.env.production`.) Upload **`apps/web/dist/`** to the static host.

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

Because the variables are compiled in, **rebuild the web app** whenever the API URL or Supabase
project changes.

---

## 8. Post-deployment checklist

1. `https://app.school.om/login` shows the school name and sign-in form.
2. Sign in as the seeded admin → dashboard loads (0 students).
3. **Settings → Organization:** set the real school name (English and Arabic) and default
   language. **Settings → Branding:** upload the logo, set the brand colour.
4. **Settings → Academic years / Classes:** adjust the year and classes.
5. **Settings → Users → Invite user:** invite a staff member — the e-mail arrives (SMTP works)
   and its link opens `/reset-password` on your domain (redirect URL configured).
6. Create a student, add a fee, record a payment; check **Reports → Outstanding** and
   **Export CSV**; open the CSV in Excel (Arabic must display correctly).
7. Switch to **العربية** — the layout turns right-to-left.
8. Confirm the browser cannot read data directly (expect `permission denied` / 401):
   ```bash
   curl "https://<ref>.supabase.co/rest/v1/students?select=id" \
     -H "apikey: <anon-key>" -H "Authorization: Bearer <anon-key>"
   ```

---

## 9. Backups and restore

| Layer                    | What                | How                                                                                                                                                                                                                      |
| ------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Supabase managed backups | Whole database      | Paid plans take daily backups (restorable from _Database → Backups_); enable **Point-in-Time Recovery** for finer-grained restores if the school needs it. Free projects have **no** managed backups — use the next row. |
| Your own nightly dump    | Schema + data       | `pg_dump` with the session/direct URL (keep at least 30 days, store off-site, encrypted):                                                                                                                                |
| Logo                     | `branding` bucket   | One small file; re-upload from the school's original if lost, or download it from the bucket.                                                                                                                            |
| Admin data export        | CSV per table (ZIP) | **Settings → Data export** — a human-readable archive for the school; useful for audits and hand-over, not a database restore source.                                                                                    |

Nightly dump (e.g. from a scheduled job with the PostgreSQL 15+ client):

```bash
pg_dump "$DIRECT_DATABASE_URL" --schema=public --schema=drizzle \
  --no-owner --no-privileges --format=custom \
  --file "bareeq-$(date +%F).dump"
```

Auth users live in Supabase's `auth` schema and are covered by Supabase's managed backups; if
you rely only on your own dumps, also export them regularly with the Supabase CLI
(`supabase db dump --db-url "$DIRECT_DATABASE_URL" --schema auth --data-only -f auth-$(date +%F).sql`)
so accounts can be recreated.

**Restore drill (do it once before go-live):** create a scratch Supabase project, run the
migrations (§4), then
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

- Secrets (`SUPABASE_SERVICE_ROLE_KEY`, database URLs) exist only in the API environment. Rotate
  the service key in Supabase if it is ever exposed, then update the API environment.
- Keep sign-ups disabled; access is only by admin invitation.
- RLS is on for every table with no policies, and the `anon`/`authenticated` roles have no
  privileges on application tables, views or functions (including future ones).
- Deactivated users are rejected by the API on their next request, even while their Supabase
  session is still valid.
- Payments cannot be edited or deleted; voids are admin-only and recorded in `audit_log`.
