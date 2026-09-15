# ROVERA — PRD

## Original Problem Statement
Build a webpage similar to https://jsulpis.github.io/realtime-planet-shader/mars/animation for the project ROVERA (page title). ROVERA is a mission-control style interactive Mars planning app answering: "From a given starting point on Mars, what is the fastest safe route to a reachable water deposit, and how many sols will it take under terrain, daylight, and dust constraints?"

## User Choices
- Dark mission-control HUD style (glowing planet, telemetry panels, terminal readouts)
- Fully interactive 3D globe (drag rotate / zoom / click to set start point)
- AI mission-briefing narrator (Emergent LLM key, OpenAI)
- No real dataset — simulated planner; landing page scope
- Awwwards-level craft: masked kinetic hero, numbered manifesto chapters, slow editorial marquee, framer-motion reveals, lenis smooth scroll

## Architecture
- Frontend: React 19 + Tailwind + react-three-fiber/three (procedural GLSL Mars shader: fbm terrain, day/night terminator, fresnel atmosphere, polar caps) + framer-motion + lenis + sonner
- Backend: FastAPI; POST /api/plan-route (great-circle distance on Mars R=3389.5km, terrain roughness, dust index, daylight window -> sols + risk); POST /api/briefing (SSE-streamed OpenAI gpt-5.4-mini via emergentintegrations, 3 personas); GET /api/deposits; GET /api/ health
- DB: MongoDB (route_plans, briefings collections, uuid string ids)

## User Personas
- Mission planner exploring candidate Mars traverses
- Space-enthusiast visitor wanting a cinematic mission-control experience

## Implemented (2026-09-15)
- Kinetic hero with letter-by-letter masked ROVERA reveal, interactive shader Mars globe (drag/zoom/click-to-set-origin, live lat/lon cursor readout, origin marker, dashed route arc to target deposit, auto-rotate with idle resume)
- Live telemetry HUD (sol counter, dust tau slider, daylight countdown, slope-risk bars, pressure strip)
- Route planner console: globe origin or preset sites, sols/distance/speed/battery/waypoints, risk badge
- AI mission briefing card: 3 personas, SSE token streaming, browser speech readout toggle
- Editorial marquee strip, 4 numbered manifesto chapters with imagery, mission footer with briefing signup (toast)
- Page title set to "ROVERA — Mars Route Mission Control"

## Backlog
- P0: none blocking
- P1: Persist & replay saved traverses (history panel); compare two candidate routes side-by-side
- P2: Real Mars topography dataset (MOLA) terrain sampling; OpenAI TTS voice for the narrator instead of browser speech; shareable route permalink
