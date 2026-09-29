# Flock Energy Dashboard

The React dashboard runs independently from the API during local development:

```bash
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173` and proxies `/api/*` to the API at `http://localhost:3001`. Start the backend from the repository root with `npm run dev`.

Run `npm run build` to type-check and create a production bundle. Run `npm run lint` for the configured Oxlint checks. No separate frontend test script is configured.
