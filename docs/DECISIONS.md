# Decisions & assumptions

Each entry: what was decided, and why. Newest at the bottom.

## Phase 0

1. **Repo root = working folder.** The spec's `bareeq-cloud/` root maps to this project folder
   itself; the root `package.json` is named `bareeq-cloud`.
2. **Shared package consumed as source in dev.** `@bareeq/shared` declares a `source` export
   condition pointing at `src/index.ts`. Vite, Vitest, TypeScript (`customConditions`) and the API
   dev server (`node --conditions=source`) resolve it directly, so no watch-build is needed. The
   production API build (`tsc`) and `node dist/server.js` use the compiled `dist` output, which
   `pnpm build` produces first (pnpm builds workspaces in dependency order).
3. **API dev runner.** `node --import tsx --watch` (tsx is a dev-only dependency) with
   `--env-file-if-exists=.env`; no `dotenv` dependency needed.
4. **Rollup WASM override.** Windows Application Control blocked rollup's native `.node` binary on
   the development machine. `pnpm-workspace.yaml` overrides `rollup` with the official
   `@rollup/wasm-node` build, which is API-identical and works on every OS (slightly slower builds).
5. **Node version.** Spec targets Node 22 LTS; `engines` allows `>=22` and CI pins 22 (`.nvmrc`).
6. **Phase-0 env schema** only validates `NODE_ENV`, `PORT`, `CORS_ORIGIN`, `LOG_LEVEL`; database
   and Supabase variables are added (and required) in Phase 2 when they are first used.
   `CORS_ORIGIN` accepts a comma-separated list.
7. **Extra lint relaxations.** `import-x/no-named-as-default(-member)` are off: they misfire on
   packages with both default and named exports (e.g. `typescript-eslint`) and TS already checks
   imports.
8. **CI and Supabase.** The Supabase CLI start step is added to CI in Phase 1 together with
   `supabase/config.toml`, when DB-backed tests first exist.

## Phase 1

9. **Supabase CLI** is a root dev dependency (`pnpm exec supabase …`). Local config:
   `enable_signup = false` (users are invited or seeded only), `site_url` = the Vite dev URL,
   password reset redirect allowed for `/reset-password`, minimum password length 8. Realtime,
   edge runtime and analytics are disabled (unused). Supabase's own migrations/seed are disabled —
   **Drizzle owns the schema** (`apps/api/src/db/migrations`).
10. **Locally `DATABASE_URL` = `DIRECT_DATABASE_URL`** (direct port 54322); the pooler is only used
    in hosted environments. `prepare: false` is always set so both work.
11. **Migrations** are applied by `src/db/migrate.ts` (drizzle-orm migrator) rather than
    `drizzle-kit migrate`, so production can migrate without dev tooling.
    `drizzle-kit generate` produces table DDL; views, triggers, privileges and the storage bucket
    live in hand-written `--custom` migrations.
12. **Views use `security_invoker = true`** and `anon`/`authenticated` have all privileges revoked
    on public tables, views, sequences and functions (including default privileges for future
    objects). Combined with RLS-without-policies, the browser keys cannot read any app data.
13. **`audit_log`** has `at` instead of `created_at`/`updated_at`: rows are append-only.
14. **Gender** is `'male' | 'female'` (check constraint, `GENDERS` in shared).
15. **Payments ↔ fee items integrity:** composite FK `(fee_item_id, student_id)` → `fee_items(id,
student_id)` guarantees a payment's student matches its fee item's student.
16. **One primary guardian per student** (partial unique index); one current academic year per
    org (partial unique index, as specified).
17. **Balance status edge cases:** a fee whose net due is 0 (fully discounted) is `paid`.
    Overpayment keeps status `paid` with negative `outstanding` (UI shows a warning badge). A
    student with no fee items has zero balances and status `paid`.
18. **Academic year default** (seed): September 1 → June 30; the seed creates the year containing
    today (August onwards counts as the new year).
19. **Seed is idempotent**: reuses the first organization, the existing admin auth user and the
    current year; demo data is skipped if any students exist. Org defaults: "Bareeq School" /
    "مدرسة بريق" — editable later in Settings.
20. **Branding bucket** is created by migration (public, 1 MiB, PNG/JPEG/SVG), so it exists in
    every environment without manual setup.

## Phase 2

21. **JSON uses camelCase** (`fullName`, `isCurrent`, …) — DTO shapes live in `@bareeq/shared`;
    the DB stays snake_case. Dates are `YYYY-MM-DD` strings, timestamps ISO-8601.
22. **Validation messages are i18n keys** (`validation.required`, …) defined once in shared
    schemas. `VALIDATION_ERROR.details` is `{ "field.path": "message key" }`, which the web app
    maps to field errors with `setError` + `t()`.
23. **Typed controllers.** `validate()` stores parsed input in `res.locals.validated` (Express 5's
    `req.query` is read-only); `lib/http.ts#handle()` composes `validate()` with a controller that
    receives typed `{ body, query, params, user }` and returns the JSON payload.
24. **DB errors → API codes:** unique violation → 409 `CONFLICT`, FK violation → 409, check
    violation → 400, malformed uuid → 400. Rate-limited requests return 429 with code
    `FORBIDDEN` (the fixed code list has no rate-limit code).
25. **Auth:** JWT verified against the JWKS with issuer and `aud = authenticated`. A valid token
    whose user has no profile, or an inactive profile, is 403. Deactivation is enforced by the
    API on every request (the Supabase account itself is left intact so it can be reactivated).
26. **Self-protection:** an admin cannot demote or deactivate themselves (409), so an org always
    keeps at least one active admin.
27. **Invites** use `inviteUserByEmail` with `redirectTo = <first CORS_ORIGIN>/reset-password`
    (the invitee sets a password there). If the profile insert fails, the invited auth user is
    deleted. Existing e-mail → 409. Locally, invite e-mails land in Mailpit
    (http://127.0.0.1:54324).
28. **Logo upload** is parsed with Node's built-in WHATWG `Request#formData()` — no multipart
    dependency. Body capped at 1 MiB + 64 KiB; the file must be PNG/JPEG/SVG ≤ 1 MiB and its
    leading bytes must match the declared type. Stored at `branding/<orgId>/logo-<ts>.<ext>`;
    the previous logo is removed.
29. **Audit rows** are also written for organization changes and user role/status changes
    (security-relevant), in addition to the payment/void/student/fee events required later.
30. **Academic years** list is paginated like every list (default sort: newest start date).
    Setting `isCurrent` clears it on the org's other years in the same transaction.
31. **API tests** use real Supabase users and access tokens (created with the Admin API, signed in
    through GoTrue), each test file in its own throw-away organization(s), cleaned up afterwards
    (rows, auth users, storage objects).

## Phase 3

32. **Overpayment** is allowed: status stays `paid`, `outstanding` goes negative (the UI shows a
    warning badge). The dashboard's "total outstanding" sums only positive balances so one
    family's overpayment does not hide another's debt; the outstanding report lists only fees
    with `outstanding > 0`.
33. **Fee edits** are allowed only while the fee has no non-voided payments (409 otherwise); the
    fee row is locked (`SELECT … FOR UPDATE`) during payment creation and edits so the two can't
    race. Payment and fee responses expose `locked` so the UI can hide the edit action.
34. **Payment `studentId`** is taken from the fee item, never from the client.
35. **Guardians:** the first guardian of a student is automatically primary; marking another as
    primary moves the flag; un-marking the only primary is rejected (409); deleting the primary
    promotes the oldest remaining guardian. `DELETE /guardians/:id` is a hard delete (guardians
    are contact details, not financial records).
36. **Audit rows** written in Phase 3: student create + status change, fee create + update,
    payment create + void — each in the same transaction as the change.
37. **Cross-org references in a body** (e.g. a `classId` or `studentId` from another org) are
    400 `VALIDATION_ERROR` with a field detail; cross-org ids in the **URL** are 404.
38. **Reports:** JSON responses are paginated (`page`, `pageSize` ≤ 100) and carry `totals`
    computed over the whole filtered set; CSV always contains every matching row plus a `TOTAL`
    row (collection and outstanding). "Due before" is inclusive (`due_date <= dueBefore`). Fee
    collection filters by the student's current class. CSV headers are English; data keeps
    Arabic. CSV uses CRLF line endings, a UTF-8 BOM, and prefixes cells starting with
    `= + - @` (except plain numbers) with `'` to prevent spreadsheet formula injection.
39. **Dates in Oman time:** "this month" on the dashboard and CSV/ZIP file dates use
    `Asia/Muscat`.
40. **Data export** streams a ZIP (`archiver` v8 `ZipArchive`) with one CSV per table
    (`organizations`, `profiles`, `academic_years`, `classes`, `students`, `guardians`, `staff`,
    `fee_items`, `payments`, `audit_log`), SQL column names as headers, org-scoped.
41. **Correlated subqueries** (class student count, fee `locked` flag) qualify columns
    explicitly: Drizzle renders columns unqualified in single-table queries, which silently
    binds both sides of the comparison to the inner table.

## Phase 4

42. **Public `GET /api/v1/branding`** (name, Arabic name, default locale, brand colour, logo URL —
    no ids) was added because US-CFG-02 requires the school name/logo on the login page, before
    any session exists, while `GET /org` requires authentication. In this single-school pilot it
    returns the oldest organization; multi-tenant hosting would resolve the org from the domain.
43. **Profile vs server state:** `auth.store` keeps the session and the caller's profile (needed
    synchronously by route guards), as the spec requires. The organization is _not_ copied into
    Zustand — `/me`'s org seeds the TanStack Query cache (`['org']`).
44. **Language:** persisted per browser. Until the user picks one, the school's `default_locale`
    applies. Switching sets `<html lang dir>`; Arabic uses an Arabic-capable system font stack
    (no web-font dependency). Numbers/currency use `Intl` with `ar-OM` / `en-OM`; English shows
    `OMR 125.500`, Arabic `١٢٥٫٥٠٠ ر.ع.`.
45. **Brand colour** is applied at runtime to `--brand`; the foreground (white or near-black) is
    chosen by WCAG contrast so primary buttons stay readable with any brand colour.
46. **Invite & reset links** both land on `/reset-password` (Supabase `redirectTo`); supabase-js
    turns the link into a session and the user sets a password there. Sign-up is disabled.
47. **UI components** follow shadcn/ui (new-york style, written into `components/ui`) on the
    unified `radix-ui` package, with `sonner` for toasts and `lucide-react` icons.
    `prettier-plugin-tailwindcss` needs `tailwindStylesheet` for Tailwind v4 (added to
    `.prettierrc.json`).
48. **Library majors:** React Router 8, `@hookform/resolvers` 7, i18next 27 / react-i18next 18,
    Tailwind 4 (current at build time). React Router is used in data-router mode
    (`createBrowserRouter`).
49. **Claude preview config** (`.claude/launch.json`) starts API and web separately because the
    preview tool injects `PORT`; `pnpm dev` from a terminal is unaffected.

## Phase 5

50. **List filters live in the URL** (`?search=&classId=&status=&page=`) rather than in Zustand:
    shareable, survive reload and back/forward. Zustand keeps only client UI state (locale, dir,
    sidebar). Changing a filter resets to page 1; search is debounced (300 ms).
51. **Forms use native `<select>`, `<input type="date">` and checkboxes** (styled to match
    shadcn/ui) for accessibility, keyboard and mobile pickers, and direct `register()` support.
    An empty select (`''`) means "none" for optional references (`optionalUuid` in shared).
52. **Student form is one full-object schema** (`createStudentSchema`) for both create and edit;
    the API's PATCH accepts it. Students are never deleted — only marked inactive (with confirm).
53. **Guardians UI:** the primary flag can only be moved ("Make primary"), not cleared, matching
    the API rule. Deleting asks for confirmation.
54. **Fees tab:** fee items show amount/discount/net/paid/outstanding from the API (view), a
    status badge plus an _Overpaid_ warning badge for negative outstanding, the full payment
    history (voided payments struck through with who/why), "Record payment" (amount defaults to
    the outstanding balance), "Edit fee" only while unlocked, and "Void" for admins only.
55. **Reports:** JSON pages of 50 rows with server totals in the table footer; "Export CSV"
    downloads `/reports/<name>.csv` with the same filters (minus pagination) via an authenticated
    fetch → Blob → download, since a plain link cannot carry the bearer token.
56. **Users:** role is changed inline; activate/deactivate asks for confirmation; the signed-in
    admin's own row is read-only (mirrors the API's self-protection).
57. **Branding:** client-side checks (type, ≤ 1 MB) before upload, server re-validates; the brand
    colour previews live and reverts if not saved.
58. **Code splitting:** every page except login/reset/dashboard is lazy-loaded via React Router
    `lazy` routes. Role-restricted route groups are wrapped in `ProtectedRoute roles=…`.
59. **TanStack Table v8** (stable) is used; v9 changed the API.
60. **Translation completeness** is enforced by tests: en/ar key parity, no empty strings, and
    every literal `t('…')` key used in the source exists in both files.

## Phase 6

61. **E2E (Playwright, Chromium)** — `e2e/handover.spec.ts` is the handover checklist from the
    spec; `roles.spec.ts` invites a viewer through Settings → Users (the password the invitee
    would set from the e-mail link is set through the Auth Admin API) and checks the read-only
    UI; `i18n.spec.ts` checks Arabic RTL and translated validation; `a11y.spec.ts` runs
    dependency-free accessibility checks on every page (labelled controls, named buttons/links,
    image alt, one `<h1>`, `lang`/`dir`) and verifies dialog focus trap, Escape and focus return.
    Tests use unique suffixes so they can run repeatedly against the same database.
62. **No axe-core:** not on the approved dependency list, so the a11y checks above are
    hand-written. Colour contrast was reviewed against the tokens (body text 15.9:1, muted
    7.5:1, white on default brand teal 5.5:1, badge text ≥ 4.5:1); custom brand colours get an
    automatically chosen readable foreground.
63. **Focus return for state-driven dialogs:** Radix only restores focus to a `Trigger`; our
    dialogs/sheet remember the previously focused element and restore it on close
    (`components/ui/useReturnFocus.ts`). Found by the a11y E2E test.
64. **Route error boundary** (`RouteErrorPage`) on every route level: a render error or failed
    lazy chunk (e.g. after a deploy) shows a translated message with "Reload page" instead of a
    blank screen; inside the app the sidebar/header stay visible.
65. **Resilient session bootstrap:** `/me` is retried on transient failures (network, 429, 5xx)
    before the user is signed out; only 401/403 sign out immediately with a specific message.
66. **API dev watcher** is limited to `apps/api/src` and `packages/shared/src`
    (`--watch-path`): on Windows, unscoped `node --watch` restarted the API whenever tooling
    read files in `node_modules`, which made E2E flaky. Playwright starts the API with the
    non-watching `serve` script.
67. **Typecheck covers the root** (`e2e/`, `playwright.config.ts`) as well as every package.
68. **CI** seeds the database (with a random CI-only admin password) and runs the E2E suite after
    the build, uploading the Playwright report on failure.

## Phase 7

69. **API image:** multi-stage `apps/api/Dockerfile` (Node 22 Alpine) built from the repo root;
    `pnpm deploy --legacy --prod` produces a self-contained folder with production dependencies
    and the compiled `@bareeq/shared`; runs as the non-root `node` user with a Docker
    `HEALTHCHECK` on `/api/v1/health`. `files` in the API/shared `package.json` define what is
    shipped (`dist`, `src/db/migrations`). Verified locally: migrate, seed, health, JWT-protected
    endpoints and the ZIP export all work from the container.
70. **Migrations and seed in production** run from the same image
    (`node dist/db/migrate.js`, `node dist/db/seed.js`) — no dev tooling needed.
71. **Web hosting:** host-agnostic static build. `public/_redirects` (SPA fallback) and
    `public/_headers` (immutable `/assets/*`, no-cache `index.html`, basic security headers)
    work on Netlify/Cloudflare Pages; the guide gives Vercel, nginx and S3/CloudFront
    equivalents.
72. **`RATE_LIMIT_PER_MINUTE`** (default 300 per client IP) is configurable because a school's
    staff usually share one public IP; the web app shows a specific "Too many requests" message
    for 429 responses.
73. **Backups:** Supabase managed backups (paid plans) / PITR, plus a documented nightly
    `pg_dump` of the `public` and `drizzle` schemas and an `auth` export via the Supabase CLI;
    the in-app ZIP export is an archive for the school, not a restore source.
74. **CI** also builds the API Docker image so the Dockerfile cannot silently break.
