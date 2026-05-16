# Food Delivery Order Management

A full-stack TypeScript workspace for a food delivery order flow. It includes a React + Vite frontend, an Express API, in-memory order storage, simulated real-time status updates with Server-Sent Events, and tests for both the UI and the API.

## Features

- Menu display with item images, descriptions, and prices
- Cart management with quantity controls
- Checkout form with delivery details validation
- Order creation, retrieval, manual status updates, and deletion
- Simulated status progression: Order Received -> Preparing -> Out for Delivery -> Delivered
- Real-time order updates in the frontend via SSE
- API and UI tests with Vitest

## Workspace

- `apps/api`: Express REST API
- `apps/web`: React + Vite application

## Scripts

From the workspace root:

- `npm install`: install all dependencies
- `npm run dev`: start the API and frontend together
- `npm run build`: build all packages
- `npm run test`: run API and frontend tests
- `npm run lint`: run type-check based validation

## API

The API runs on `http://localhost:4000` by default.

Core endpoints:

- `GET /api/menu`
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders`
- `PATCH /api/orders/:id/status`
- `DELETE /api/orders/:id`
- `GET /api/orders/:id/stream`

## Deployment Notes

This workspace is ready to deploy, but deployment itself is not performed here.

- Frontend: Vercel or Netlify
- Backend: Render, Railway, Fly.io, or any Node host
- Set `VITE_API_BASE_URL` in the frontend environment to the deployed API URL

## Publish To GitHub

From the project root:

```powershell
git init
git add .
git commit -m "Initial order management feature"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

If GitHub authentication is required, complete it in the browser or terminal prompt and re-run the push.

## Deploy API

Recommended target: Render Web Service

- Root directory: `apps/api`
- Build command: `npm install ; npm run build`
- Start command: `npm run start`
- Port: `4000`

The repository includes `render.yaml` with these defaults.

## Deploy Frontend

Recommended target: Netlify or Vercel

For Netlify:

- Base directory: `apps/web`
- Build command: `npm install ; npm run build`
- Publish directory: `apps/web/dist`
- Environment variable: `VITE_API_BASE_URL=https://YOUR-API-DOMAIN`

The repository includes `netlify.toml` with the base build settings.

For Vercel:

- Root directory: `apps/web`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://YOUR-API-DOMAIN`

Deploy the API first, then redeploy the frontend after setting the environment variable.

## Known Limitation

Orders and menu data are stored in memory. Any API restart clears active order data. For a production version, replace the in-memory store with SQLite or Postgres.

## Loom Video Checklist

For the requested demo video, cover:

1. Requirements breakdown and architecture
2. Backend routes, validation, and in-memory storage
3. Frontend cart, checkout, and live order status flow
4. Test strategy and TDD coverage
5. How AI tools were used during implementation and debugging
