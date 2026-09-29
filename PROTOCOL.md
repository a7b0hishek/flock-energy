# Flock Energy Portal Protocol Notes

This document records what was actually observed, what was inferred, and what remains uncertain about the legacy portal behavior.

## 1. Portal overview

The target portal is the Urja Meter Ops application at https://urja-ops.flockenergy.tech. The public app is a SvelteKit-based UI and it redirects unauthenticated users to /login. The UI is clearly tailored to meter operations staff and appears to support meter inspection, hierarchy browsing, and export-style data access.

## 2. Relevant pages

- /login
- /transformers
- /portal/export?page=1
- /portal/dts?page=1

## 3. Discovered endpoints

### OBSERVED FACT

The investigation recorded the following endpoints and behavior from the browser DevTools session:

- GET /portal/export?page=1
- GET /portal/dts?page=1
- The export endpoint returned HTTP 200 with Content-Type: application/json when fetched in the authenticated browser context.

### INFERENCE

The portal likely uses a list/export pattern for bulk meter data and a separate data source endpoint for supporting metadata or hierarchical detail. The exact semantics of /portal/dts continue to require confirmation from a fully authenticated environment.

### ASSUMPTION

The project does not assume that /portal/dts is a meter list endpoint. It is treated as an unknown supporting endpoint until proven.

## 4. HTTP methods

### OBSERVED FACT

The identified export path was fetched with GET. No evidence has been supplied here that the portal uses POST or other methods for the read-only export surface.

## 5. Query parameters

### OBSERVED FACT

The observed export request included `?page=1`.

### INFERENCE

The portal likely implements pagination for the export endpoint. The exact page-size semantics, first-page behavior, and total-count contract remain uncertain.

## 6. Authentication

### OBSERVED FACT

The export request used a Better Auth session cookie named `__Secure-better-auth.session_token`.

### INFERENCE

The app is using an authenticated portal session, not a public unauthenticated JSON API.

### ASSUMPTION

The session cookie is browser-private and must not be stored in the repository or committed to source control.

## 7. Session behavior

### OBSERVED FACT

The portal redirects unauthenticated requests to /login and requires a valid session to access the transformer pages and export data.

### INFERENCE

Session management is handled server-side by the portal and is not part of the public API being built here.

## 8. Request signing

### OBSERVED FACT

The browser requests included `x-signature` and `x-timestamp` headers.

### INFERENCE

The request is not a simple anonymous fetch. A browser-side or server-side signing step is involved.

### ASSUMPTION

The signature is not safe to guess or reverse without a verified client-side implementation or a trusted session.

## 9. Signature generation

### OBSERVED FACT

The exact hashing and canonicalization method has not been conclusively established in this workspace or from the public static frontend assets without a trusted signed session.

### INFERENCE

The public browser bundle does not expose the exact signing implementation in a way that can be trusted for a production implementation without live verification.

### ASSUMPTION

The signing logic may involve a timestamp, a canonical payload, and a secret or key known only to the portal. It should not be duplicated here without higher-confidence evidence.

## 10. Response format

### OBSERVED FACT

The export endpoint responded with HTTP 200 and application/json.

### INFERENCE

The metering data is structured as an array-like or object-like JSON payload, not a streaming file or HTML document.

### ASSUMPTION

The public API being built intentionally normalizes the response shape to a stable domain model rather than exposing the portal’s internal JSON layout.

## 11. Pagination

### OBSERVED FACT

The export request included a `page` query parameter.

### INFERENCE

Page-based export is likely supported for bulk data retrieval and can be implemented cleanly once the live contract is verified.

### ASSUMPTION

The API here intentionally uses a simple stable list endpoint and a fixture-backed dataset for development, without claiming page semantics beyond the observed `page=1` request.

## 12. Bulk export

### OBSERVED FACT

The portal uses an export-style endpoint returning meter records. The upstream data appears to include at least the fields: `meterId`, `serialNo`, `make`, `phaseType`, `installStatus`, `installType`, `build`, `dtCode`, `hierarchy`, and `geo`.

### INFERENCE

This export is the most practical source for building a clean read-only service around the existing portal data model.

### Clean application export

This repository exposes `GET /meters/export` as a separate application API endpoint. It generates CSV from the current `PortalClient` data source and does not call or imitate the legacy `/portal/export?page=1` request. The application export does not require portal cookies or `x-signature`/`x-timestamp` headers.

The application export requires a valid local application session and returns `text/csv; charset=utf-8` with `Content-Disposition: attachment; filename="meters.csv"`. The transformer counterpart returns `transformers.csv`. A stale or missing application token returns an application `401`; the frontend clears that local session and sends the user back to `/login` without exposing token details.

## 12a. Application transformer fixture

The repository includes `src/fixtures/transformers.fixture.json` with 20 supplied records containing `code`, `name`, `feeder`, and `capacityKva`. These are application-side fixture records used to exercise the clean transformer API and UI. They are not presented as a complete response captured from `GET /portal/dts?page=1`; the live response body and signing algorithm remain unverified.

## 13. Meter data structure

### OBSERVED FACT

The exported records include these core fields:

- meterId
- serialNo
- make
- phaseType
- installStatus
- installType
- build
- dtCode
- hierarchy
- geo

### INFERENCE

The meter model is a normalized read model with structural metadata and geographic coordinates, which maps well to a clean domain object.

## 14. Hierarchy

### OBSERVED FACT

The hierarchy contains the following levels:

- zone
- circle
- division
- subdivision
- substation
- feeder
- dt

Each item includes a `name` and a `code`.

## 15. Geo information

### OBSERVED FACT

The geodata block contains numeric values for `lat` and `lng`.

## 16. Browser-specific behavior

### OBSERVED FACT

The site is a browser app and the export path is accessed through a cookie-authenticated, signed browser request. The web app is not a public API.

### INFERENCE

The browser has additional runtime state not visible to a non-browser client.

## 17. Quirks

### OBSERVED FACT

The site is a SvelteKit application with bundled JS assets. The frontend hides the actual signed request path behind the browser app runtime.

### INFERENCE

This is a classic legacy internal portal pattern where request signing is used to prevent tampering or unauthorized automation.

## 18. Limitations

### OBSERVED FACT

The exact `x-signature` generation algorithm, canonical input, timestamp format, and key material could not be proven from the current browser artifacts or static bundle without a trusted authenticated session.

## 19. What was directly observed

- The portal redirects to /login when unauthenticated.
- The portal exposes a transformer page for operations staff.
- GET /portal/export?page=1 returns HTTP 200 and application/json in a signed browser session.
- A Better Auth session cookie is present.
- x-signature and x-timestamp are included in the request.
- The export records include the meter and hierarchy fields summarized above.

## 20. What remains uncertain

- The exact signing algorithm and input canonicalization.
- Whether the signature covers URL, query string, body, or other request metadata.
- The exact semantics of /portal/dts.
- Whether a reliable consumption endpoint exists and how it is shaped.
- Whether the browser code includes secret material or runtime-generated values that are inaccessible without the live app.
- The response body and field contract of `GET /portal/dts?page=1`; no transformer API is implemented from that observation alone.

## Summary

This repository builds a clean, read-only, fixture-backed API around the observed data model while intentionally isolating the live portal integration behind an adapter. The project explicitly does not guess a signing algorithm or invent response contracts beyond the observed evidence.
