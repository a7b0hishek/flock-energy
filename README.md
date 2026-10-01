# Flock Energy Engineering Take-Home

This project packages the observed Flock Energy meter export schema into a clean internal API that is easy to install, run, test, and review. It is deliberately read-only and intentionally avoids guesswork around the live portal’s request-signing implementation.

## Project overview

The original portal is a legacy internal operations UI for inspecting meter records and hierarchy metadata. This repository builds a clean backend service that exposes a stable, documented API over the same domain model without exposing the portal’s browser-specific internals.

The API routes in `src/app.ts` validate requests and call the `PortalClient` interface in `src/portal/`. The fixture adapter reads local JSON data; the live adapter remains an explicit placeholder until its authenticated request contract can be verified.

## Features

- Local application login, protected routes, and logout
- Meter dashboard and searchable/filterable inventory with detail views
- Transformer inventory, search and filters, capacity summaries, and detail views
- Authenticated CSV exports for all meter and transformer fixture records
- Persistent light/dark theme and responsive layouts
- Fixture-backed API with pagination, validation, and documented error responses

## Architecture

The application follows the following structure:

- Fastify routes, validation, and error handling in `src/app.ts`
- A `PortalClient` adapter boundary in `src/portal/`
- Fixture-backed meter and transformer data for deterministic local development
- A live adapter placeholder that does not guess portal authentication or signing

The core design constraint is that neither the route layer nor the public API knows anything about portal cookies, x-signature, x-timestamp, or browser session state.

## Project structure

```text
.
├── README.md
├── PROTOCOL.md
├── REFLECTION.md
├── TRACKING.md
├── openapi.json
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── api.ts
│       ├── meters.tsx
│       └── transformers.tsx
├── src/
│   ├── __tests__/
│   │   └── api.test.ts
│   ├── app.ts
│   ├── config.ts
│   ├── domain.ts
│   ├── fixtures/
│   │   ├── meters.fixture.json
│   │   └── transformers.fixture.json
│   ├── index.ts
│   └── portal/
│       ├── PortalClient.ts
│       ├── portal-factory.ts
│       └── adapters/
│           ├── fixture-portal-client.ts
│           └── live-portal-client.ts
```

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm
- A terminal capable of running local services

## Installation

```bash
npm install
```

## Environment configuration

Copy the example file and adjust values if needed:

```bash
cp .env.example .env
```

The relevant environment variables are:

- PORT: HTTP port for the API
- CORS_ORIGINS: comma-separated exact browser origins allowed to call the API; defaults to the deployed frontend and local Vite/preview origins
- DATA_SOURCE: `fixture` by default; `live` is reserved for future authenticated integration
- PORTAL_BASE_URL: the live portal base URL
- PORTAL_SESSION_COOKIE: optional live-session cookie for future portal use
- PORTAL_TIMEOUT_MS: HTTP timeout for live requests
- APP_DEMO_USERNAME: local application login username
- APP_DEMO_PASSWORD: local application login password

## Running locally

Start the API with:

```bash
npm run dev
```

Or run the compiled build:

```bash
npm run build
npm start
```

The API defaults to port 3001. You can override it with the `PORT` environment variable.

## Frontend dashboard

A Vite + React + TypeScript dashboard is included under `frontend/` and consumes the backend via a local proxy so the browser does not need direct CORS handling.

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

The UI runs at http://localhost:5173 and proxies `/api/*` requests to the backend on http://localhost:3001.

For a separately hosted production frontend, set the Vite build-time variable `VITE_API_BASE_URL` to the backend origin. In Render, configure the Static Site environment with `VITE_API_BASE_URL=https://flock-energy-gv74.onrender.com`; configure the backend Web Service with `CORS_ORIGINS=https://flock-energy-frontend.onrender.com`, `APP_DEMO_USERNAME=demo@flock.energy`, and `APP_DEMO_PASSWORD` set to the password you intend users to enter. These are deployment settings; do not commit credentials. Rebuild and redeploy the frontend after changing its variable. The Vite `/api` proxy is development-only.

For React Router deep links such as `/login`, add a Static Site rewrite in the Render dashboard: source `/*`, destination `/index.html`, action `Rewrite`. Without this rule, direct requests for `/login` return 404 even though `/` serves the SPA.

### Frontend pages

- Dashboard overview with operational metrics
- Meter inventory table with status and make filters
- Meter detail view with hierarchy and geolocation panels
- Responsive dark operations UI built with React Router + Tailwind CSS
- Light and dark themes persisted in local storage
- Transformer inventory, detail, capacity insights, filters, and CSV export

### Application login

The dashboard has a local application-level login gate. It is separate from the legacy Urja portal authentication and does not use Better Auth cookies, portal session tokens, or signed browser headers. Configure `APP_DEMO_USERNAME` and `APP_DEMO_PASSWORD` in `.env` for local use; the values in `.env.example` are placeholders for development only. The frontend stores the application session token in local storage and supports logout/revocation through the application API.

Application sessions are held in backend memory. Restarting the backend invalidates existing sessions; sign in again before using authenticated exports.

### Transformers

The application includes 20 supplied local transformer fixture records with `code`, `name`, `feeder`, and `capacityKva`. The UI exposes `/transformers` with search, feeder filtering, pagination, capacity distribution, and `/transformers/:code` detail pages. These records are application-side fixture data; they are not claimed as a complete live response from `GET /portal/dts?page=1`.

### Export

`GET /meters/export` is our clean API abstraction and generates a CSV from the current configured portal adapter. The browser's **Export All Meters** button downloads `meters.csv`. This must not be confused with the legacy `GET /portal/export?page=1`, which requires a Better Auth session and unverified request signing.

`GET /transformers/export` similarly generates `transformers.csv` from the local transformer adapter data and requires a local application session.

## Running tests

```bash
npm test
```

## Building for production

Build the backend from the repository root and the dashboard from its directory:

```bash
npm run build
cd frontend
npm run build
```

## API endpoints

### Health

- GET /health

### Meter listing

- GET /meters
- Supported filters: `status`, `make`, `phaseType`, `dtCode`

### Meter lookup

- GET /meters/:meterId

### Application sessions

- POST /auth/login
- POST /auth/logout

### Meter export

- GET /meters/export

### Transformer inventory

- GET /transformers
- GET /transformers/:code
- GET /transformers/export
- Supported list filters: `page`, `limit`, `search`, `feeder`, `capacityKva`

The project intentionally does not implement a consumption endpoint because the live portal contract and consumption data were not verified reliably enough to support a safe API contract.

## Sample requests

```bash
curl http://localhost:3001/health
curl "http://localhost:3001/meters?status=active&make=Secure"
curl http://localhost:3001/meters/MTR-0001
```

### Authenticated CSV exports

Log in using the local application credentials configured in `.env` (the example file uses `demo@flock.energy` and `change-me-for-local-use`). Copy the returned `token` into `TOKEN`, then request either export:

```bash
curl -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"demo@flock.energy","password":"change-me-for-local-use"}'

TOKEN='<token returned by login>'
curl -H "Authorization: Bearer $TOKEN" -OJ http://localhost:3001/meters/export
curl -H "Authorization: Bearer $TOKEN" -OJ http://localhost:3001/transformers/export
```

The API returns `meters.csv` with 403 fixture rows and `transformers.csv` with 20 fixture rows. Restarting the backend clears its in-memory sessions, so log in again to obtain a current token.

## Sample responses

### Health

```json
{
  "status": "ok",
  "service": "flock-energy-meter-api",
  "dataSource": "fixture",
  "timestamp": "2026-09-30T00:00:00.000Z"
}
```

### Meter list

```json
{
  "meta": {
    "total": 403,
    "filters": {
      "status": "active"
    }
  },
  "items": [
    {
      "meterId": "MTR-0001",
      "serialNo": "SN-000001",
      "make": "Secure",
      "phaseType": "single-phase",
      "installStatus": "active",
      "installType": "pole-mounted",
      "build": "A",
      "dtCode": "DT-001",
      "hierarchy": {
        "zone": { "name": "Zone North", "code": "ZONE-01" },
        "circle": { "name": "Circle East", "code": "CIRCLE-01" },
        "division": { "name": "Division 01", "code": "DIV-01" },
        "subdivision": { "name": "Subdivision 01", "code": "SUBDIV-01" },
        "substation": { "name": "Substation 01", "code": "SUBST-01" },
        "feeder": { "name": "Feeder 01", "code": "FEED-01" },
        "dt": { "name": "DT 01", "code": "DT-01" }
      },
      "geo": {
        "lat": 22.5000,
        "lng": 78.0000
      }
    }
  ]
}
```

## Data source

The project uses a fixture-backed repository by default so that local testing is deterministic and does not depend on a live authenticated browser session. This is selected via `DATA_SOURCE=fixture` in the environment and is intentionally documented as a development aid rather than the live portal itself.

The meter fixture retains both the top-level `dtCode` and `hierarchy.dt.code` fields. Their relationship was not verified, so the implementation preserves them independently rather than inferring a mapping. The supplied transformer fixture contains the 20 assignment records and is not presented as a live portal response.

## Portal integration

The live portal is treated as the source of truth for the domain model, but the exact request-signing algorithm remains unverified here. To preserve correctness, the live portal integration is isolated behind a `PortalClient` abstraction and a `LivePortalClient` placeholder. The application never exposes browser headers or cookies to API consumers.

## Assumptions

- The upstream portal is a read-only data source for meter metadata.
- The export data schema described in the investigation is representative of the runtime domain model.
- The public API can be built around normalized meter records without absorbing internal browser plumbing.
- Meter consumption data is out of scope unless it is discovered with reliable telemetry.

## Design decisions

- Use Fastify with TypeScript to keep the service small and fast.
- Validate all user input with Zod.
- Keep the adapter boundary explicit so the portal-specific logic does not leak into route handlers.
- Prefer a fixture dataset for tests and local development.

## Trade-offs

- The project does not implement a live signed client because the signature algorithm could not be confirmed without a trusted authenticated browser flow.
- The data is normalized rather than directly mirrored from the portal response to keep the public API stable and understandable.
- The project intentionally avoids overbuilding a caching or ingestion layer because the assignment values correctness and sensible scope.

## What was intentionally skipped

- Live portal sign-in automation
- Signed request recreation from unverified headers
- Consumption endpoint implementation without a proven contract
- Browser automation or session replay
- Any attempt to fake authenticated access

## What would be improved with more time

- Verified live portal integration once the signing algorithm is established from frontend source or trusted browser evidence.
- A fuller data model for consumption and hierarchy traversal.
- Better dataset tooling and a migration path to real portal ingestion.
- Additional tests around malformed portal payloads and live adapter error handling.

## PROTOCOL.md location

See [PROTOCOL.md](PROTOCOL.md).

## openapi.json location

See [openapi.json](openapi.json).

## Reflection

See [REFLECTION.md](REFLECTION.md).

## Notes on the portal investigation

The project follows the assignment guidance strictly: it avoids inventing the request-signing algorithm and isolates the unknown part behind a dedicated adapter. The API contract is documented and the repository remains reviewable without requiring prior knowledge of the portal internals.

## Evaluation notes

From a clean clone, install and start the API in one terminal:

```bash
npm install
cp .env.example .env
npm run dev
```

In a second terminal, install and start the dashboard:

```bash
cd frontend
npm install
npm run dev
```

## 🚀 Quick Start & Login

| Step | Details |
|---|---|
| 🌐 **Open Application** | **http://localhost:5173** |
| 👤 **Username** | `demo@flock.energy` |
| 🔑 **Password** | `demo-password` |
| 🔒 **Environment File** | Keep `.env` **local**. It is ignored by Git and must **not** be committed. |
| 🧪 **Run Backend Tests** | `npm test` |
| 🏗️ **Build Backend** | `npm run build` |
| 🎨 **Build Frontend** | `cd frontend` → `npm run build` |
| ✅ **Verification** | Run the tests and both builds before submission/review. |
