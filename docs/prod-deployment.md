# Production deployment: PostgreSQL + Render + Netlify

Database on any **PostgreSQL 14+** server (managed Postgres such as Render, Neon, RDS, or the
existing Supabase database used as plain Postgres), API on **Render** (Docker, `render.yaml`), web
app on **Netlify** (`netlify.toml`). Sign-in is username + password, handled entirely by the API;
no third-party auth service is needed.

> For the full guide (other hosts, backups, upgrades, security) see `DEPLOYMENT.md`.

## 1. PostgreSQL (database)

1. Create a database; keep it in the **same region as the API**.
2. Copy the connection string → `DATABASE_URL`. If you connect through a transaction pooler
   (PgBouncer), also set a direct/session connection as `DIRECT_DATABASE_URL` for migrations.
3. Run migrations once from your machine (works with every Render plan):
   ```bash
   pnpm install
   DATABASE_URL='<uri>' pnpm db:migrate
   ```

**Moving from Supabase:** keep the same `DATABASE_URL` and run `pnpm db:migrate`. Migration
`0003_local_auth` copies each user's password hash from Supabase Auth, so everyone signs in with
their **old e-mail address as username** and their **old password**. School logos lived in Supabase
Storage and are not copied — re-upload the logo in **Settings → Branding**.

## 2. Render (backend API)

1. Render → **New → Blueprint** → select the repo; `render.yaml` defines the `bareeq-api` Docker
   service (health check `/api/v1/health`).
2. Enter the `sync: false` values. Required: `DATABASE_URL`, `CORS_ORIGIN` (the Netlify URL) and
   `JWT_SECRET` (32+ random characters, e.g. `openssl rand -base64 48`; changing it signs
   everyone out). Optional: `SESSION_TTL_HOURS` (default 12).
3. Deploy. Paid plans run `node dist/db/migrate.js` automatically before each deploy
   (`preDeployCommand`); on the free plan run migrations as in step 1.3 for every release.
4. Check: `curl https://bareeq-api.onrender.com/api/v1/health` → `{"status":"ok"}`.
   Free instances sleep when idle — the first request can take ~1 minute.

## 3. Netlify (frontend)

1. Netlify → **Add new site → Import from Git** → the web repo. `netlify.toml` sets the build.
2. **Environment variable:** `VITE_API_URL=https://bareeq-api.onrender.com/api/v1`. Deploy
   (redeploy after changing it).
3. If you use a custom domain, update `CORS_ORIGIN` on Render.

## 4. Create the first admin

**Option A — over HTTP (no shell needed, free plan friendly):**
1. On Render set `SETUP_TOKEN` to a random 24+ character value and redeploy.
2. Call once:
   ```bash
   curl -X POST https://bareeq-api.onrender.com/api/v1/setup/admin \
     -H "Content-Type: application/json" -H "X-Setup-Token: <SETUP_TOKEN>" \
     -d '{"username":"admin","fullName":"School Administrator","password":"<strong password>"}'
   ```
   `201` = school + first admin created. It returns `409` once any admin exists, `403` for a wrong
   token and `404` when `SETUP_TOKEN` is unset.
3. **Remove `SETUP_TOKEN`** from Render and redeploy.

**Option B — seed script from your machine:** with `DATABASE_URL` plus
`SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD`, run `pnpm db:seed` (never `--demo` in production).

More admins/staff: **Settings → Users → Create user** (username + initial password), or
`POST /api/v1/users` as an admin. Forgotten passwords: an admin uses **Reset password** on the
Users page. Anyone can change their own password from the user menu → **Change password**.

## 5. Verify

Sign in on the Netlify URL → set school name/logo in Settings → create a class, student, fee and
payment → Outstanding report + Export CSV → switch to العربية.
