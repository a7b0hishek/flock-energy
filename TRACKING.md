# Flock Energy Engineering Take-Home Tracking

## Checklist

- [x] Workspace inspected; no existing project files were present.
- [x] Portal investigation facts were reviewed and preserved without guessing the signing algorithm.
- [x] Node.js + TypeScript project scaffold created.
- [x] Fixture-backed meter schema and parser implemented.
- [x] /health, /meters, and /meters/:meterId routes implemented.
- [x] Validation, error handling, and 404 paths implemented.
- [x] Meaningful tests added and passing.
- [x] PROTOCOL.md written to record observed facts and uncertainties.
- [x] README.md written for install, run, and architecture guidance.
- [x] OpenAPI contract written.
- [x] Reflection document written.
- [x] Build verification completed.
- [x] Modern React dashboard implemented and wired to the existing API.
- [x] Frontend proxy, routing, filters, and detail views verified locally.
- [x] Login UI
- [x] Application authentication
- [x] Protected routes
- [x] Logout
- [x] Transformer fixture dataset added
- [x] Transformers API
- [x] Transformers inventory UI
- [x] Transformer search/filter
- [x] Transformer summary cards
- [x] Transformer capacity visualization
- [x] Transformer detail page
- [x] Transformer CSV export
- [x] Meter export backend endpoint
- [x] Meter export browser download
- [x] Export loading/error states
- [x] Light mode
- [x] Dark mode
- [x] Theme persistence
- [x] Removed OK button
- [x] Navigation updated
- [x] Responsive verification
- [x] Frontend/backend integration
- [x] Final security review
- [x] Meter CSV export verified
- [x] Icon-based theme toggle
- [x] Icon-based logout
- [x] Removed persistent API Connected indicator
- [x] Consistent icon system
- [x] Header cleanup
- [x] Responsive transformer UI
- [x] Accessibility pass
- [x] Loading/error/empty states
- [x] OpenAPI updated
- [x] README updated
- [x] PROTOCOL updated
- [x] Transformer search/filter toolbar alignment
- [x] Meter search/filter toolbar alignment
- [x] Deterministic non-sequential meter status distribution
- [x] Flock Energy local logo/brand treatment
- [x] Header branding refinement
- [x] Consistent icon system
- [x] Hover transitions
- [x] Card hover states
- [x] Table hover states
- [x] Button hover states
- [x] Search focus states
- [x] Export interaction feedback
- [x] Reduced-motion support
- [x] Mobile visual verification
- [x] Transformer export backend endpoint
- [x] Transformer export browser download
- [x] CSV content validation
- [x] Export error handling
- [x] Export regression tests
- [x] Final integration verification

## Change Log

### 2026-09-30
- Created the repository from scratch in the workspace because no existing code was present.
- Confirmed the live portal redirected to /login and that the public app bundles were accessible without credentials.
- Recorded the investigation constraints: the portal uses authenticated signed requests, but the exact signing algorithm remains unverified without a trusted authenticated browser session and source bundle.
- Created the TypeScript service, fixture-backed portal adapter, and the initial API contract.
- Added tests covering health, listing, lookup, validation, and missing-resource behavior.
- Generated a realistic fixture with 403 meter records matching the observed schema.
- Wrote project documentation and the OpenAPI document.
- Added a Vite + React + Tailwind dashboard under `frontend/` with a dashboard shell, meter inventory, and meter detail pages connected to the public API.

### 2026-09-29
- Finished the UI implementation and verified the frontend loads from localhost:5173 via a Vite proxy pointing at the backend on port 3001.
- Confirmed the app renders real meter records from the backend and navigates between the dashboard, list view, and detail route.

### 2026-09-30
- Added environment-configured application-level login/logout and protected frontend routes without claiming legacy portal authentication.
- Added server-generated CSV meter export and browser download states using the current adapter dataset.
- Added light/dark theme persistence, responsive navigation, meter pagination/filter controls, and API-connected/offline health text.
- Added a Transformers section that documents the verified limitation: `/portal/dts?page=1` was observed but no response data was captured, so no transformer records are invented.
- Updated OpenAPI, README, and PROTOCOL.md with the clean application endpoints and portal boundary.

### 2026-09-30
- Added the supplied 20-record transformer fixture as application-side data, explicitly separate from the incompletely captured live `/portal/dts?page=1` response.
- Added adapter-backed transformer list, search, feeder filter, pagination, detail, and authenticated CSV export APIs.
- Replaced the transformer limitation page with inventory, summary metrics, capacity distribution, detail view, and export UX.
- Added consistent inline SVG icons, icon-only theme/logout controls, dashboard transformer metrics, and removed the persistent API status indicator.

### 2026-09-30
- Refined meter and transformer filter toolbars with aligned control heights, responsive grids, consistent search icons, focus states, and clear-filter behavior.
- Replaced the artificial sequential meter status cycle with a deterministic irregular distribution while preserving all other fixture fields; dashboard counts remain derived from API data.
- Added a local currentColor Flock Energy brand mark to the header and refined navigation balance.
- Added restrained card, table, link, button, export-toast, and icon hover transitions with `prefers-reduced-motion` support.
- Verified desktop and 390px mobile layouts, theme switching, branded header, non-sequential meter statuses, and no horizontal page overflow.

### 2026-09-30
- Diagnosed export failures as stale local application tokens after the in-memory backend session store was restarted; valid authenticated requests already returned CSV successfully.
- Centralized frontend Blob download handling, exact `meters.csv`/`transformers.csv` filenames, and automatic expired-session cleanup/redirect to login on 401 responses.
- Added backend regression coverage for both export success paths, exact CSV headers/disposition, row counts, and unauthenticated failures.
- Verified live authenticated meter and transformer exports, including 403 and 20 CSV rows respectively, plus browser success toasts for both export buttons.

## Important Discoveries

- The portal is a SvelteKit app that redirects unauthenticated traffic to /login.
- The observed authenticated export path is /portal/export?page=1 and it returns application/json with HTTP 200 for a signed browser session.
- The session cookie is a Better Auth cookie, and the request carries x-signature and x-timestamp.
- The exact signing method could not be conclusively proved from the public frontend bundle alone, so the implementation isolates the live signing path behind a dedicated adapter.

## Unresolved Issues

- The live portal request-signing algorithm remains unverified without a trusted browser session and more complete JS analysis.
- Consumption data was not observed with enough fidelity to implement safely, so it is intentionally excluded.
- Live transformer data remains unverified; the UI intentionally labels the supplied records as application fixture data.

## Final QA Notes

- Backend tests: 22 passing; backend TypeScript build passing.
- Frontend Vite production build and Oxlint passing; no frontend test script is configured.
- OpenAPI parses successfully and includes transformer list/detail/export plus `capacityKva` filtering.
- Browser verification covered login, protected routes, dashboard meter and transformer metrics, transformer search, feeder/capacity filters, pagination, detail navigation, transformer export success, icon-only theme/logout controls, and mobile no-overflow at 390px.
- Authenticated transformer export produced `transformers.csv` with 20 fixture rows; unauthenticated export returned 401.
- Authenticated meter export produced `meters.csv` with 403 fixture rows; unauthenticated export returned 401.
- The browser’s integrated download event is not exposed by the programmatic Blob-anchor flow, but both browser buttons reached their success states and the corresponding downloaded response bodies were independently validated from the live API.
- Security scan found only the documented observed portal cookie name in PROTOCOL.md; no cookie value, credentials, request signatures, or live operator identity were committed.

### Final Repository Audit

- [x] Full source tree, configuration, fixtures, and documentation reviewed
- [x] Dead code and unused imports/exports reviewed
- [x] Debug markers reviewed; useful server error logging retained
- [x] Duplicate logic reviewed; no risky restructuring was needed
- [x] Security and credential scan completed; no live secrets found
- [x] Environment configuration and ignore rules reviewed
- [x] Dependency usage reviewed; unused frontend test packages removed
- [x] Frontend components and backend routes/adapters reviewed
- [x] Export response headers and CSV contents verified by backend tests; browser download code reviewed
- [x] Documentation and OpenAPI port/configuration checked for consistency
- [x] Accessibility labels and responsive layout rules reviewed in source
- [x] Backend tests passing after cleanup (22 tests)
- [x] Backend and frontend production builds passing
- [ ] Interactive browser regression pass (browser automation was unavailable in this session)

The final interactive check remains unverified. Source review and automated API/build checks do not establish browser-level visual, responsive, theme-persistence, or download behavior.

### 2026-09-30 — Final cleanup

- Removed unused duplicate inventory/detail pages, an unused health client helper, an unused consumption stub, and unused frontend icon/type/storage code.
- Removed unused frontend testing-library and Vitest packages; no frontend test files or test script are configured.
- Aligned the API default port, environment example, README, OpenAPI server, and Vite proxy on port 3001; updated the Node.js prerequisite for Vite 8.
- Updated the frontend README and document title, and ignored environment-file variants while keeping `.env.example` available.

### 2026-09-30 — Submission readiness review

- Traced the prior export errors to stale local application tokens after a backend restart. Sessions are held in memory, so a restart invalidates them; the frontend handles the resulting 401 by clearing the token and returning to login.
- No CSV route or Vite proxy failure reproduced. After a fresh login, requests through the running Vite `/api` proxy returned `meters.csv` (403 rows) and `transformers.csv` (20 rows) with the expected content types, disposition headers, and CSV columns. Logout and export with the revoked token returned 204 and 401 respectively.
- Strengthened tests to compare complete CSV rows against fixture data, verify the supplied transformer dataset, reject invalid meter/transformer identifiers, revoked sessions and pre-restart tokens, and exercise malformed meter parsing.
- Confirmed empty list parsing and header-only CSV behavior, and added coverage for CSV quoting of commas, quotes, and line breaks.
- Aligned OpenAPI auth and invalid-path responses with the implemented routes and expanded clean-clone/evaluation instructions in README.md.
- Confirmed the transformer fixture exactly matches the supplied 20 records. Meter IDs and serials are unique and schema-valid; top-level and hierarchy DT code fields remain separate because their mapping is unverified.

The HTTP and proxy export flow was exercised directly. A fresh visual browser session and actual download click could not be performed with the tools available in this session.

## Architecture Decisions

- The public API is intentionally independent of portal-specific cookies and signature headers.
- The portal adapter boundary keeps browser-specific behavior and unknown signing logic out of route handlers.
- The fixture-backed source is the default development mode to keep local runs deterministic and offline-safe.
