# Master Prompt — Build "Bareeq Cloud Starter" (School Management Pilot)

> Paste this whole file into Claude Code as your first message (or save it as `docs/MASTER_PROMPT.md` and say: "Read docs/MASTER_PROMPT.md and start Phase 0").
> Put the PRD PDF in `docs/PRD.pdf` so Claude Code can refer to it.

---

## 0. Your role and how to work

You are a senior full-stack TypeScript engineer building a production-quality pilot from an empty folder. Work **phase by phase** (Section 10). For each phase:

1. Briefly state the plan for the phase (files you will create/change).
2. Implement it fully — no placeholders, no `// TODO: implement`, no mocked data in production code.
3. Run `pnpm lint`, `pnpm format:check`, `pnpm typecheck` and the relevant tests; fix every error.
4. Summarise what was done, list commands to verify it, and **stop and wait for my "continue"** before the next phase.

Rules:

- Never add features listed in **Out of scope** (Section 2.3). If something seems needed, ask me.
- If a requirement is ambiguous, pick the simplest option consistent with this prompt, write the assumption in `docs/DECISIONS.md`, and continue.
- Never commit secrets. Use `.env.example` files with placeholder values.
- Keep dependencies to the list in Section 3 unless you ask first.
- Prefer small, readable files. Follow the folder structure in Section 4 exactly.
- Create a `CLAUDE.md` at the repo root in Phase 0 summarising stack, commands and conventions, and keep it updated.

---

## 1. Product context

**Bareeq Cloud Starter** is a single-school web application that lets one school manage:

- Student records (with class association, guardian contacts, active/inactive status)
- Manual fee entry and manual payment recording, with paid / partial / unpaid / outstanding visibility
- Basic reports (student listing, fee collection, outstanding balances) with CSV export
- A basic staff directory (name, designation, contact)
- One organization, branding (school name + logo), a small set of fixed user roles, and full data export

Market: Oman. Currency **OMR with 3 decimal places** (baisa). UI must support **English and Arabic (RTL)**.

It is a pilot for one school but must be **SaaS-ready**: every business table carries `org_id` so it can later become multi-tenant without a schema redesign.

### 1.1 Personas

| Persona                                  | Role in app | Does                                                                          |
| ---------------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| School Administrator                     | `admin`     | Everything, incl. settings, users, staff edits, voiding payments, data export |
| Student Records Operator / Fees Operator | `staff`     | Create/edit students, classes, guardians, fee items, payments                 |
| School Management / Report Consumer      | `viewer`    | Read-only: lists, balances, reports, CSV                                      |

---

## 2. Functional requirements (user stories → acceptance criteria)

### 2.1 Students

- **US-STU-01 Create student**: admission no (unique per org), first name, last name, Arabic name (optional), DOB, gender, class, status, joined date. Saved record appears in the list.
- **US-STU-02 Edit student**: all fields editable; changes visible on reopen; Zod validation on client and server.
- **US-STU-03 Class association**: pick a class from a dropdown (classes belong to an academic year); shown on the student detail and list.
- **US-STU-04 Guardians**: one or more guardians per student (name, relation, phone, email, `is_primary`). Contact details only — no guardian login, no messaging.
- **US-STU-05 Active/inactive**: toggle status; list filters by status. Students are never hard-deleted.

### 2.2 Fees & payments

- **US-FEE-01 Fee item**: create a fee against a student: title, academic year, amount, discount, due date. Manual only.
- **US-FEE-02 Payment**: record a manual payment against a fee item: amount, date, method (cash / bank_transfer / card / cheque / other), reference, received_by (current user). Partial payments allowed; multiple payments per fee allowed.
- **US-FEE-03 Balances**: per fee item and per student show net due, paid, outstanding, status (`paid` / `partial` / `unpaid`). Balances are **computed by a SQL view**, never stored.
- Payments are **immutable**: no edit/delete. Admin can **void** a payment (sets `voided_at`, `void_reason`); voided payments are excluded from balances and shown struck-through.
- Overpayment: allowed, shown as negative outstanding with a warning badge (record assumption in DECISIONS.md).

### 2.3 Out of scope (do NOT build)

Payment gateway / online payments, automated or recurring billing, invoices/PDF receipts, parent or student portal, mobile app/PWA, SMS/WhatsApp/email automation, custom permission builder / custom roles, multi-school onboarding or subscriptions, accounting integrations, document uploads (other than the school logo), advanced analytics, data import/migration.

### 2.4 Reports

- **US-REP-01 Student listing**: filters class, status, search; columns admission no, name, class, status, primary guardian, phone.
- **US-REP-02 Fee collection**: filters date range, class, method; columns date, student, class, fee, amount, method, reference, received by; total collected.
- **US-REP-03 Outstanding balances**: filters class, due before; columns student, class, fee, net due, paid, outstanding, due date; total outstanding.
- **US-REP-04 CSV export**: each report downloadable as CSV using the same query; UTF-8 **with BOM** so Excel shows Arabic correctly.

### 2.5 Staff

- **US-STA-01 Staff directory**: full name, designation, phone, email, status. Admin edits; viewer+ reads. No HR/payroll/attendance.
- **US-STA-02 Roles**: exactly three fixed roles: `admin`, `staff`, `viewer`. No permission engine.

### 2.6 Configuration, branding, handover

- **US-CFG-01 Organization**: one org record (name, name_ar, currency `OMR`, default locale, brand colour, logo).
- **US-CFG-02 Branding**: logo upload (Supabase Storage, PNG/JPG/SVG ≤ 1 MB) + name shown in header and login page; brand colour applied via CSS variable.
- **US-CFG-03 Smoke tests**: Playwright E2E covering the main journey (Section 9).
- **US-CFG-04 Data export**: admin downloads a ZIP containing one CSV per table.
- Users: admin can invite users by email (Supabase Admin API `inviteUserByEmail`), set role, deactivate. The first admin is created by a seed script.

---

## 3. Tech stack (fixed)

**Monorepo**: pnpm workspaces, Node.js 22 LTS, TypeScript `strict: true` everywhere.

**Frontend — `apps/web`**

- Vite 6 + React 19 + TypeScript
- React Router (data router, protected routes by role)
- **TanStack Query** — all server state
- **Zustand** — client-only state (auth session/profile, UI: locale, dir, sidebar, filters). Never copy server data into Zustand.
- **React Hook Form** + **Zod** via `@hookform/resolvers/zod`
- TanStack Table for lists
- Tailwind CSS + shadcn/ui (Radix)
- i18next + react-i18next (`en`, `ar`), RTL via `<html dir>`; use Tailwind logical utilities (`ms-*`, `pe-*`, `text-start`)
- `@supabase/supabase-js` — **auth only** (sign in, reset password, session)
- Money/date formatting via `Intl.NumberFormat` (`OMR`, 3 decimals) and `Intl.DateTimeFormat`

**Backend — `apps/api`**

- Node.js + TypeScript + Express 5
- Drizzle ORM + `postgres` driver (with `prepare: false` for the Supavisor transaction pooler)
- `drizzle-kit` for SQL migrations
- `jose` to verify Supabase JWTs via JWKS
- `helmet`, `cors`, `express-rate-limit`, `pino` + `pino-http`
- `csv-stringify` for CSV, `archiver` for ZIP export
- Zod for env + request validation (schemas imported from `packages/shared`)

**Shared — `packages/shared`**: Zod schemas, inferred DTO types, enums (`ROLES`, `STUDENT_STATUS`, `PAY_METHODS`), role helpers.

**Database / platform**: Supabase (PostgreSQL 15+, Auth, Storage). Local dev uses the Supabase CLI (`supabase start`).

**Quality**: ESLint 9 flat config + typescript-eslint (type-aware) + react-hooks + react-refresh + jsx-a11y + @tanstack/eslint-plugin-query + import-x + eslint-config-prettier; Prettier 3 + prettier-plugin-tailwindcss; Husky + lint-staged; `.editorconfig`.

**Testing**: Vitest (unit), Vitest + Supertest (API integration against local Supabase DB), Playwright (E2E smoke).

**CI**: GitHub Actions — install → lint → format:check → typecheck → test → build.

---

## 4. Repository structure (create exactly this)

```
bareeq-cloud/
├─ apps/
│  ├─ web/
│  │  ├─ src/
│  │  │  ├─ app/            # router.tsx, providers.tsx, AppLayout.tsx, ProtectedRoute.tsx
│  │  │  ├─ features/
│  │  │  │  ├─ auth/        # LoginPage, ResetPasswordPage
│  │  │  │  ├─ dashboard/
│  │  │  │  ├─ students/    # api.ts (query hooks), StudentsListPage, StudentDetailPage, StudentForm, GuardiansTab, FeesTab
│  │  │  │  ├─ classes/
│  │  │  │  ├─ fees/        # FeeItemForm, PaymentForm, BalanceBadge
│  │  │  │  ├─ reports/
│  │  │  │  ├─ staff/
│  │  │  │  └─ settings/    # OrgSettings, Branding, Users, DataExport
│  │  │  ├─ components/ui/  # shadcn components
│  │  │  ├─ components/     # DataTable, PageHeader, ConfirmDialog, MoneyText, RoleGate
│  │  │  ├─ stores/         # auth.store.ts, ui.store.ts (Zustand)
│  │  │  ├─ lib/            # api.ts (typed fetch), supabase.ts, queryClient.ts, format.ts, cn.ts
│  │  │  ├─ i18n/           # index.ts, en.json, ar.json
│  │  │  └─ main.tsx
│  │  ├─ index.html
│  │  ├─ vite.config.ts
│  │  └─ .env.example
│  └─ api/
│     ├─ src/
│     │  ├─ server.ts
│     │  ├─ app.ts
│     │  ├─ config/env.ts
│     │  ├─ db/             # schema.ts, client.ts, migrations/, seed.ts
│     │  ├─ middleware/     # auth.ts, requireRole.ts, validate.ts, errorHandler.ts, notFound.ts
│     │  ├─ modules/
│     │  │  ├─ org/ users/ classes/ students/ guardians/ fees/ payments/ reports/ staff/ export/
│     │  │  │  # each: *.routes.ts, *.controller.ts, *.service.ts, *.repo.ts
│     │  ├─ lib/            # logger.ts, errors.ts (AppError), csv.ts, audit.ts, pagination.ts
│     ├─ tests/
│     └─ .env.example
├─ packages/shared/src/     # schemas/*.ts, enums.ts, index.ts
├─ e2e/                     # Playwright specs
├─ supabase/                # supabase CLI config (config.toml)
├─ docs/                    # PRD.pdf, MASTER_PROMPT.md, DECISIONS.md
├─ .github/workflows/ci.yml
├─ .husky/pre-commit
├─ eslint.config.js
├─ .prettierrc.json
├─ .prettierignore
├─ .editorconfig
├─ tsconfig.base.json
├─ CLAUDE.md
├─ README.md
└─ pnpm-workspace.yaml
```

Layering in the API: **routes → controller (HTTP only) → service (business rules, transactions) → repo (Drizzle queries)**. Controllers never touch the DB directly.

---

## 5. Database (Supabase PostgreSQL)

All tables: `id uuid pk default gen_random_uuid()`, `org_id uuid not null references organizations(id)` (except `organizations`), `created_at`, `updated_at timestamptz default now()`. Money = `numeric(12,3)`. Add an `updated_at` trigger.

Enums: `user_role ('admin','staff','viewer')`, `record_status ('active','inactive')`, `pay_method ('cash','bank_transfer','card','cheque','other')`.

| Table            | Columns                                                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `organizations`  | name, name_ar, currency default 'OMR', default_locale default 'en', brand_color, logo_path                                                                     |
| `profiles`       | id = `auth.users.id` (pk, fk), org_id, full_name, email, role `user_role`, is_active bool default true                                                         |
| `academic_years` | name, start_date, end_date, is_current bool (only one current per org — partial unique index)                                                                  |
| `classes`        | name, grade, section, academic_year_id fk; unique (org_id, academic_year_id, name)                                                                             |
| `students`       | admission_no, first_name, last_name, name_ar, dob, gender, class_id fk null, status `record_status` default 'active', joined_on; unique (org_id, admission_no) |
| `guardians`      | student_id fk, name, relation, phone, email, is_primary bool                                                                                                   |
| `staff`          | full_name, designation, phone, email, status `record_status`                                                                                                   |
| `fee_items`      | student_id fk, academic_year_id fk null, title, amount ≥ 0, discount ≥ 0 default 0, due_date; check discount ≤ amount                                          |
| `payments`       | fee_item_id fk, student_id fk, amount > 0, paid_on date, method `pay_method`, reference, received_by fk profiles, voided_at, voided_by, void_reason            |
| `audit_log`      | actor_id, entity, entity_id, action ('create','update','void','status_change'), diff jsonb, at                                                                 |

View `v_fee_balances` (per fee item): `net_due = amount - discount`, `paid = sum(non-voided payments)`, `outstanding = net_due - paid`, `status` = `paid` if paid ≥ net_due, `partial` if paid > 0, else `unpaid`. Also `v_student_balances` aggregating per student.

Indexes: `students(org_id, class_id, status)`, `students(org_id, lower(last_name))`, `fee_items(org_id, student_id)`, `payments(org_id, paid_on)`, `payments(fee_item_id)`, `guardians(student_id)`.

**Security**: enable RLS on **every** table with **no policies** so the anon/authenticated keys cannot read data through Supabase's auto REST API. Only the Node API (DB owner connection) accesses data. Storage bucket `branding` is public-read; uploads go through the API with the service-role key.

Seed (`pnpm db:seed`): one organization, current academic year, 3 classes, the first admin (email/password from env `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, created via Supabase Admin API), and optional demo data behind `--demo`.

---

## 6. Authentication & authorization

1. Web signs in with `supabase.auth.signInWithPassword()`; `useAuthStore` listens to `onAuthStateChange`.
2. Every API call sends `Authorization: Bearer <access_token>`.
3. API `auth` middleware verifies the JWT with `jose.createRemoteJWKSet(SUPABASE_JWKS_URL)`, checks issuer/audience, loads `profiles` row, rejects inactive users (403), sets `req.user = { id, orgId, role }`.
4. `requireRole(...roles)` guards routes. Every repo query filters by `req.user.orgId`.

Permission matrix:

| Capability                                 | admin | staff | viewer |
| ------------------------------------------ | ----- | ----- | ------ |
| Org settings, branding, users, data export | ✔     | ✖     | ✖      |
| Classes, students, guardians: create/edit  | ✔     | ✔     | ✖      |
| Fee items, payments: create                | ✔     | ✔     | ✖      |
| Void payment                               | ✔     | ✖     | ✖      |
| Staff directory edit                       | ✔     | ✖     | ✖      |
| Read lists, balances, reports, CSV         | ✔     | ✔     | ✔      |

Frontend mirrors this with `<RoleGate roles={[...]}>` and `ProtectedRoute` — UI hiding is convenience only; the API is the source of truth.

---

## 7. API contract (`/api/v1`)

Conventions: JSON; Zod-validated `body`, `query`, `params` via a `validate()` middleware; lists accept `page`, `pageSize` (max 100), `search`, `sort` and return `{ data, page, pageSize, total }`; errors return `{ error: { code, message, details? } }` with codes `VALIDATION_ERROR` 400, `UNAUTHENTICATED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409, `INTERNAL` 500. Money is sent as **string** with 3 decimals (e.g. `"125.500"`) to avoid float errors.

| Method & path                                                                                                       | Roles                      |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `GET /health`                                                                                                       | public                     |
| `GET /me`                                                                                                           | any                        |
| `GET /org`, `PATCH /org`, `POST /org/logo` (multipart)                                                              | read any; write admin      |
| `GET /users`, `POST /users/invite`, `PATCH /users/:id` (role, is_active)                                            | admin                      |
| `GET /academic-years`, `POST`, `PATCH /:id`                                                                         | read any; write admin      |
| `GET /classes`, `POST /classes`, `PATCH /classes/:id`                                                               | read any; write staff+     |
| `GET /students?classId&status&search`, `POST /students`, `GET /students/:id`, `PATCH /students/:id`                 | read viewer+; write staff+ |
| `GET /students/:id/guardians`, `POST /students/:id/guardians`, `PATCH /guardians/:id`, `DELETE /guardians/:id`      | read viewer+; write staff+ |
| `GET /students/:id/fees` (fee items + balances + payments)                                                          | viewer+                    |
| `POST /fees`, `PATCH /fees/:id` (only if no non-voided payments)                                                    | staff+                     |
| `POST /payments`                                                                                                    | staff+                     |
| `POST /payments/:id/void` `{ reason }`                                                                              | admin                      |
| `GET /staff`, `POST /staff`, `PATCH /staff/:id`                                                                     | read viewer+; write admin  |
| `GET /reports/students`, `/reports/fee-collection?from&to&classId&method`, `/reports/outstanding?classId&dueBefore` | viewer+                    |
| `GET /reports/:name.csv` (same filters)                                                                             | viewer+                    |
| `GET /dashboard` (student count, collected this month, total outstanding)                                           | viewer+                    |
| `GET /export` → ZIP of CSVs                                                                                         | admin                      |

Payments and voids run inside a DB transaction and write an `audit_log` row in the same transaction. Student status changes and fee edits also write audit rows.

Middleware order: `helmet` → `cors({ origin: CORS_ORIGIN })` → `express.json({ limit: '100kb' })` → `pino-http` → rate limit → routes → `notFound` → `errorHandler`.

---

## 8. Frontend specification

Routes:

| Path                                                                                                              | Screen                                                                                                                 | Min role |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------- |
| `/login`, `/reset-password`                                                                                       | Auth                                                                                                                   | public   |
| `/`                                                                                                               | Dashboard: 3 KPI cards + recent payments                                                                               | viewer   |
| `/students`                                                                                                       | DataTable with class/status filters, search, pagination                                                                | viewer   |
| `/students/new`, `/students/:id/edit`                                                                             | StudentForm                                                                                                            | staff    |
| `/students/:id`                                                                                                   | Tabs: Profile · Guardians · Fees (fee items, balance badges, "Record payment" dialog, payment history, void for admin) | viewer   |
| `/classes`                                                                                                        | List + dialog form                                                                                                     | staff    |
| `/reports/students`, `/reports/fee-collection`, `/reports/outstanding`                                            | Filters + table + totals + "Export CSV"                                                                                | viewer   |
| `/staff`                                                                                                          | Directory (edit for admin)                                                                                             | viewer   |
| `/settings/organization`, `/settings/branding`, `/settings/users`, `/settings/academic-years`, `/settings/export` | Admin settings                                                                                                         | admin    |

Rules:

- One `features/<x>/api.ts` per feature exporting query-key factories and TanStack Query hooks (`useStudents`, `useCreateStudent`, …). Mutations invalidate the related keys and show a toast.
- `lib/api.ts`: typed `apiFetch<T>(path, { schema })` that attaches the token from `useAuthStore`, parses responses with Zod, throws a typed `ApiError`, and on 401 signs out and redirects to `/login`.
- Forms: React Hook Form + `zodResolver(sharedSchema)`; server `VALIDATION_ERROR.details` mapped back to field errors with `setError`.
- Zustand stores: `auth.store.ts` (`session`, `profile`, `status`, `signIn`, `signOut`, `init`), `ui.store.ts` (`locale`, `dir`, `sidebarOpen`, `setLocale`) with `persist` for locale only.
- i18n: every user-visible string goes through `t()`; provide complete `en.json` and `ar.json`; language switcher in the header; switching sets `document.documentElement.lang/dir`. Zod error messages map to i18n keys.
- Layout: responsive sidebar shell, header with school logo/name, language switch, user menu. Works on tablet width (≥ 768 px) and desktop.
- Accessibility: labelled inputs, keyboard navigable dialogs (Radix), visible focus, colour contrast AA.
- Money display via `<MoneyText value="125.500" />` → `OMR 125.500` / `١٢٥٫٥٠٠ ر.ع.`.
- Empty, loading (skeleton) and error states for every list and detail page.

---

## 9. Code quality, testing & CI

**ESLint** (`eslint.config.js`, flat): ignores `dist`, `node_modules`, `coverage`, `migrations`; `tseslint.configs.recommendedTypeChecked` with `projectService: true`; rules: `no-unused-vars` (ignore `^_`), `consistent-type-imports`, `no-floating-promises`, `no-misused-promises` (`checksVoidReturn.attributes: false`), `import-x/no-duplicates`, `import-x/order` (alphabetised, newlines between groups), `eqeqeq`, `no-console` (warn; **error** in `apps/api` — use pino). Web block adds react-hooks, react-refresh, jsx-a11y, @tanstack/query recommended rules with browser globals; API block uses node globals. `disableTypeChecked` for plain JS files. `eslint-config-prettier` last.

**Prettier** (`.prettierrc.json`): `semi: true, singleQuote: true, trailingComma: "all", printWidth: 100, tabWidth: 2, arrowParens: "always", endOfLine: "lf", plugins: ["prettier-plugin-tailwindcss"], tailwindFunctions: ["cn","cva"]`. `.prettierignore`: dist, coverage, pnpm-lock.yaml, migrations.

**Root scripts**: `dev` (web + api in parallel), `build`, `lint` (`eslint . --max-warnings=0`), `lint:fix`, `format`, `format:check`, `typecheck` (`pnpm -r exec tsc --noEmit`), `test`, `test:e2e`, `db:generate`, `db:migrate`, `db:seed`, `prepare: husky`. **lint-staged**: `*.{ts,tsx,js}` → eslint --fix + prettier --write; `*.{json,md,css,yml}` → prettier --write. `.husky/pre-commit`: `pnpm lint-staged`.

**Tests (must exist and pass)**:

- Unit: balance status logic, money formatting, shared Zod schemas, CSV BOM/escaping.
- API integration: auth (missing/invalid token 401, inactive 403), role guards (viewer 403 on every write), student CRUD + unique admission no 409, payment → balance updates, void excludes from balance, org isolation (a record with another `org_id` returns 404), CSV endpoints.
- E2E smoke (Playwright) = the handover checklist: login as admin → create class → create student with guardian → add fee 100.000 → record payment 40.000 → see `partial` & outstanding 60.000 → outstanding report shows it → export CSV downloads → edit a staff record → switch to Arabic and verify `dir="rtl"`.

**CI** (`.github/workflows/ci.yml`): pnpm cache, Node 22, `pnpm install --frozen-lockfile`, lint, format:check, typecheck, unit + API tests (start Supabase CLI in CI), build.

---

## 10. Build phases (stop after each)

| Phase                 | Deliverable                                                                                                                                                                                                             | Exit check                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **0. Scaffold**       | pnpm monorepo, tsconfig base, apps/web (Vite React TS), apps/api (Express TS), packages/shared, ESLint, Prettier, Husky, lint-staged, .editorconfig, CLAUDE.md, README, DECISIONS.md, `.env.example` files, CI workflow | `pnpm lint && pnpm format:check && pnpm typecheck` pass; `pnpm dev` serves both; `GET /health` 200 |
| **1. Database**       | Supabase CLI config, Drizzle schema, migrations (tables, enums, views, indexes, triggers, RLS enabled), seed script                                                                                                     | `supabase start`, `pnpm db:migrate`, `pnpm db:seed` succeed; views return correct balances         |
| **2. API core**       | env validation, logger, errors, validate middleware, JWT auth, requireRole, org/me/users/academic-years endpoints, audit helper, tests                                                                                  | auth + role tests pass                                                                             |
| **3. API domain**     | classes, students, guardians, staff, fees, payments (+void), dashboard, reports, CSV, ZIP export, tests                                                                                                                 | all API integration tests pass                                                                     |
| **4. Web foundation** | Tailwind + shadcn, router, providers, Zustand stores, Supabase auth, api client, i18n (en/ar + RTL), layout shell, RoleGate, login/reset pages                                                                          | can log in as seeded admin, see branded shell, toggle Arabic RTL                                   |
| **5. Web features**   | students (list/detail/form/guardians/fees/payment dialog), classes, staff, reports + CSV, dashboard, settings (org, branding/logo upload, users invite, academic years, export)                                         | every story in Section 2 works manually                                                            |
| **6. Quality & E2E**  | Playwright smoke suite, empty/loading/error states, a11y pass, Arabic translation completeness check                                                                                                                    | `pnpm test:e2e` green; no lint warnings                                                            |
| **7. Deploy docs**    | `docs/DEPLOYMENT.md`: Supabase project setup, env vars, building web for a static host, Dockerfile for API, running migrations in prod, creating the first admin, backups                                               | a new developer can deploy from the README alone                                                   |

---

## 11. Environment variables

`apps/web/.env.example`

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:4000/api/v1
```

`apps/api/.env.example`

```
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=            # Supavisor pooler, transaction mode (port 6543)
DIRECT_DATABASE_URL=     # direct connection (port 5432) for migrations
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWKS_URL=       # ${SUPABASE_URL}/auth/v1/.well-known/jwks.json
SUPABASE_JWT_ISSUER=     # ${SUPABASE_URL}/auth/v1
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
```

The service-role key and database URLs must never appear in the web bundle.

---

## 12. Definition of done

- All user stories in Section 2 work for the right roles, in English and Arabic.
- Balances are always derived from `v_fee_balances`; payments are immutable and voidable only by admin with an audit row.
- RLS is enabled on every table; the browser has no direct data access.
- `pnpm lint` (0 warnings), `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` all pass; CI is green.
- README, CLAUDE.md, DECISIONS.md and DEPLOYMENT.md are complete.
- No out-of-scope features (Section 2.3) were added.

**Start now with Phase 0.**
