# ROVERA — Mars Route Mission Control

ROVERA is a mission-control style interactive Mars planning experience. It answers one question:

> From a given starting point on Mars, what is the fastest safe route to a reachable water deposit — and how many sols will it take under terrain, daylight, and dust constraints?

## What it does

- **Interactive Mars globe** — a real-time procedural WebGL shader planet (day/night terminator, atmosphere rim, polar caps) you can drag, zoom, and click
- **Surface descent** — clicking the planet drops an origin beacon and dives the camera into the terrain, opening an embedded Sol-Window Planner surface view; "Return to Orbit" brings you back
- **Route planner** — from any origin (globe click or preset site), computes the nearest reachable water-ice deposit and prices the traverse in sols, factoring terrain roughness, dust opacity, daylight window, and battery reserve, with a plain-language risk rating
- **AI mission briefings** — a tactical narrator (Flight Director, Field Geologist, or Risk Officer persona) streams a spoken-style briefing of the computed route, with optional voice readout
- **Live telemetry HUD** — sol counter, dust opacity slider, daylight countdown, slope-risk meters
- **Manifesto & marquee** — numbered doctrine chapters and a slow editorial telemetry ticker

All figures are simulated by design (no live NASA dataset); distances use an areocentric great-circle model on a Mars radius of 3,389.5 km.

## Tech stack

- **Frontend**: React 19, Tailwind CSS, react-three-fiber/three.js (custom GLSL Mars shader), framer-motion, lenis smooth scroll, sonner toasts
- **Backend**: FastAPI (Python), Motor/MongoDB for route plans and briefing logs
- **AI**: OpenAI via the Emergent universal LLM key (`emergentintegrations`), streamed over SSE

## API endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/` | Health check / uplink status |
| GET | `/api/deposits` | Catalog of water-ice deposits |
| POST | `/api/plan-route` | Compute fastest safe route `{lat, lon, name?}` → sols, distance, risk |
| POST | `/api/briefing` | Stream an AI mission briefing (SSE) for a computed plan |

## Running locally

Backend and frontend are supervisor-managed (hot reload enabled):

```bash
sudo supervisorctl restart backend   # FastAPI on :8001
sudo supervisorctl restart frontend  # React dev server on :3000
```

Environment variables live in `backend/.env` (`MONGO_URL`, `DB_NAME`, `EMERGENT_LLM_KEY`) and `frontend/.env` (`REACT_APP_BACKEND_URL`).
