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

### Deployment
This frontend can be deployed directly to Netlify, Vercel, Cloudflare Pages, or any static hosting service.
- **Build command**: `pnpm build` (or `npm run build`)
- **Publish directory**: `dist`
- Configured with SPA fallback via `netlify.toml` and `public/_redirects`.
