# Bareeq Cloud — Frontend

Web application for the Bareeq School Management platform. Built with React 19, Vite, Tailwind CSS, TanStack Query, React Hook Form, and i18next (English & Arabic with RTL).

## Getting Started

### Prerequisites
- Node.js >= 22
- pnpm (or npm / yarn)

### Installation
```bash
pnpm install
```

### Environment Variables
Copy `.env.example` to `.env` and fill in the required values:
```bash
cp .env.example .env
```

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of the Bareeq API backend | `http://localhost:4000/api/v1` |

Sign-in is username + password against the API (`POST /auth/login`); the session token is kept in
`localStorage` and sent as a bearer token. There is no other auth service to configure.

### Development
```bash
pnpm dev
```
Starts the local development server at `http://localhost:5173`.

### Type Checking & Testing
```bash
pnpm typecheck
pnpm test
```

### Production Build
```bash
pnpm build
```
Generates production-ready static assets in `dist/`.

### Installable app (PWA)
The app can be installed on phones, tablets and desktops ("Add to Home Screen" / the install icon
in the address bar). A service worker caches the app's own files so it opens quickly and survives
brief network drops; API data is never cached. When a new version is deployed, open apps show a
**Reload** prompt (they check hourly). Configuration lives in `vite.config.ts` (`VitePWA`).
Icons are generated from `public/pwa-icon.svg`:
```bash
pnpm pwa:icons
```

### Test automation

Every interactive element has a stable `data-testid` for QA automation. See [docs/TEST_IDS.md](docs/TEST_IDS.md) for the naming scheme.

### Deployment
This frontend can be deployed directly to Netlify, Vercel, Cloudflare Pages, or any static hosting service.
- **Build command**: `pnpm build` (or `npm run build`)
- **Publish directory**: `dist`
- Configured with SPA fallback via `netlify.toml` and `public/_redirects`.

#### Vercel

[`vercel.json`](vercel.json) holds the Vercel setup: pnpm install and build, `dist` output, the SPA fallback to `index.html` (except `/assets/*`, so a missing chunk is a 404) and the same security and cache headers as `public/_headers`.

1. In Vercel, **Add New → Project** and import this repository. The settings come from `vercel.json`, so leave the build settings on their defaults.
2. Under **Settings → Environment Variables**, set `VITE_API_URL` to the API base, e.g. `https://bareeq-be.onrender.com/api/v1`. It is baked in at build time, so redeploy after changing it.
3. Set **Settings → Build and Deployment → Node.js Version** to 22.x (as Netlify uses).
4. On the backend, add the Vercel domain to `CORS_ORIGIN` (comma-separated, e.g. `https://bareeq-crm.netlify.app,https://<project>.vercel.app`), or the browser blocks API calls.
