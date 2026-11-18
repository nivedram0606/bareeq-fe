# Production deployment: Supabase Cloud + Render + Netlify

Database/Auth/Storage on **Supabase Cloud**, API on **Render** (Docker, `render.yaml`), web app on
**Netlify** (`netlify.toml`). General background (backups, upgrades, security): `DEPLOYMENT.md`.

## 1. Supabase Cloud (database)

1. Create a project; pick a region and use the **same region family on Render** (e.g. Frankfurt).
2. **Authentication → Sign In / Providers:** disable *Allow new users to sign up*.
3. **Authentication → URL Configuration:** Site URL `https://<site>.netlify.app`; add Redirect URL
   `https://<site>.netlify.app/reset-password`.
4. **Authentication → Emails → SMTP:** configure an SMTP provider (needed for invites/resets).
5. Check signing keys: `curl https://<ref>.supabase.co/auth/v1/.well-known/jwks.json` must list a key.
6. Copy: project URL, publishable/anon key, secret/service-role key, **transaction pooler** URI
   (6543 → `DATABASE_URL`), **session pooler** URI (5432 → `DIRECT_DATABASE_URL`).
7. Run migrations once from your machine (works with every Render plan):
   ```bash
   pnpm install
   # PowerShell: $env:DATABASE_URL='...'; etc. — or put them in apps/api/.env
   DATABASE_URL='<session-pooler-uri>' DIRECT_DATABASE_URL='<session-pooler-uri>' \
   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_JWKS_URL=... SUPABASE_JWT_ISSUER=... \
   pnpm db:migrate
   ```

## 2. Render (backend API)

1. Push the repo to GitHub. Render → **New → Blueprint** → select the repo; `render.yaml` defines
   the `bareeq-api` Docker service (Dockerfile `apps/api/Dockerfile`, context = repo root,
   health check `/api/v1/health`).
2. Enter the `sync: false` values (table in `DEPLOYMENT.md` §3). Set `CORS_ORIGIN` to the Netlify URL.
3. Deploy. Paid plans run `node dist/db/migrate.js` automatically before each deploy
   (`preDeployCommand`); on the free plan run migrations as in step 1.7 for every release.
4. Check: `curl https://bareeq-api.onrender.com/api/v1/health` → `{"status":"ok"}`.
   Free instances sleep when idle — the first request can take ~1 minute.

## 3. Netlify (frontend)

1. Netlify → **Add new site → Import from Git** → same repo. `netlify.toml` sets the build
   (`pnpm --filter @bareeq/web build`, publish `apps/web/dist`, Node 22).
2. **Environment variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `VITE_API_URL=https://bareeq-api.onrender.com/api/v1`. Deploy (redeploy after changing them).
3. SPA routing and cache headers come from `apps/web/public/_redirects` and `_headers`.
4. If you use a custom domain, update `CORS_ORIGIN` (Render) and the Supabase Site/Redirect URLs.

## 4. Create the first admin

**Option A — over HTTP (no shell needed, free plan friendly):**
1. On Render set `SETUP_TOKEN` to a random 24+ character value and redeploy.
2. Call once:
   ```bash
   curl -X POST https://bareeq-api.onrender.com/api/v1/setup/admin \
     -H "Content-Type: application/json" -H "X-Setup-Token: <SETUP_TOKEN>" \
     -d '{"email":"it@school.om","fullName":"School Administrator","password":"<strong password>"}'
   ```
   `201` = school + first admin created. It returns `409` once any admin exists, `403` for a wrong
   token and `404` when `SETUP_TOKEN` is unset.
3. **Remove `SETUP_TOKEN`** from Render and redeploy.

**Option B — seed script from your machine:** with the env from step 1.7 plus
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, run `pnpm db:seed` (never `--demo` in production).

More admins/staff: **Settings → Users → Create user** (with a password, no e-mail needed) or
**Invite user** (e-mail link), or `POST /api/v1/users` as an admin.

## 5. Verify

Sign in on the Netlify URL → set school name/logo in Settings → create a class, student, fee and
payment → Outstanding report + Export CSV → switch to العربية. Full checklist: `DEPLOYMENT.md` §8.
