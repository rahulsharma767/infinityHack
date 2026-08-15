# KAVACH — Predictive Wildlife Conflict & Conservation Intelligence

Standalone React/Vite prototype extracted from the KAVACH JSX artifact.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to Vercel

Import this folder/repository into Vercel. Vercel will detect Vite automatically.

Build command: `npm run build`
Output directory: `dist`

The app is a frontend prototype with demo data and client-side interactions.

## GIS layer (PostGIS + FastAPI + React-Leaflet)

The "GIS Map" tab is backed by a real spatial stack — real Maharashtra
protected-area boundaries, PostGIS spatial queries, and live risk
hotspots generated from the existing YOLO + ML risk pipeline. See
[`backend/GIS_README.md`](backend/GIS_README.md) for setup
(`docker compose up`, seed script, then run the backend as usual).
If PostGIS isn't running, the map still renders with the previous
demo zone layout overlaid on the real basemap — nothing else in the
app is affected.
