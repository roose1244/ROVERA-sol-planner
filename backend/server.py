from fastapi import FastAPI, APIRouter
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import math
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

MARS_RADIUS_KM = 3389.5

WATER_DEPOSITS = [
    {"name": "Korolev Crater Ice Sheet", "lat": 73.0, "lon": 165.0, "type": "Surface water ice", "confidence": 98},
    {"name": "Utopia Planitia Glacier Field", "lat": 46.7, "lon": 110.0, "type": "Buried glacier", "confidence": 91},
    {"name": "Arcadia Planitia Subsurface Ice", "lat": 38.1, "lon": -175.0, "type": "Shallow subsurface ice", "confidence": 87},
    {"name": "Milankovic Crater Ice Exposure", "lat": 54.7, "lon": -147.0, "type": "Exposed ice scarp", "confidence": 84},
    {"name": "Hellas Basin Subsurface Water", "lat": -42.0, "lon": 70.0, "type": "Deep subsurface reservoir", "confidence": 76},
    {"name": "South Polar Layered Deposits", "lat": -85.0, "lon": 0.0, "type": "Layered ice deposit", "confidence": 95},
]

CURRENT_SOL = 842


def haversine_km(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * MARS_RADIUS_KM * math.asin(math.sqrt(a))


def terrain_roughness(lat, lon):
    v = math.sin(math.radians(lat * 3.1 + lon * 1.7)) * math.cos(math.radians(lon * 2.3 - lat * 1.1))
    v += 0.5 * math.sin(math.radians(lat * 7.7 - lon * 4.9))
    return round(min(1.0, max(0.0, 0.5 + 0.5 * v / 1.5)), 3)


def daylight_hours(lat, sol):
    seasonal = math.sin(2 * math.pi * (sol - 152) / 668.0)
    return round(min(24.0, max(0.0, 12.3 + 5.5 * seasonal * math.sin(math.radians(lat)))), 2)


def dust_index(lat, sol):
    base = 0.35 + 0.25 * math.sin(2 * math.pi * (sol - 490) / 668.0)
    regional = 0.12 * math.sin(math.radians(lat * 2.4))
    return round(min(0.95, max(0.1, base + regional)), 3)


class RouteRequest(BaseModel):
    lat: float
    lon: float
    name: Optional[str] = None


class BriefingRequest(BaseModel):
    persona: str = "FLIGHT DIRECTOR"
    origin: dict
    plan: dict


@api_router.get("/")
async def root():
    return {"message": "ROVERA mission control uplink active", "sol": CURRENT_SOL}


@api_router.get("/deposits")
async def get_deposits():
    return {"deposits": WATER_DEPOSITS}


@api_router.post("/plan-route")
async def plan_route(req: RouteRequest):
    lat = max(-89.9, min(89.9, req.lat))
    lon = req.lon
    ranked = sorted(
        WATER_DEPOSITS,
        key=lambda d: haversine_km(lat, lon, d["lat"], d["lon"]) / (d["confidence"] / 100.0),
    )
    target = ranked[0]
    distance = haversine_km(lat, lon, target["lat"], target["lon"])

    rough_mid = (terrain_roughness(lat, lon) + terrain_roughness(target["lat"], target["lon"])) / 2
    dust = dust_index(lat, CURRENT_SOL)
    daylight = daylight_hours(lat, CURRENT_SOL)

    base_speed = 3.1
    speed = base_speed * (1 - 0.5 * rough_mid) * (1 - 0.35 * dust)
    drive_window = max(1.5, daylight * 0.6 * (1 - 0.4 * dust))
    km_per_sol = speed * drive_window
    sols = max(1, math.ceil(distance / km_per_sol))

    battery = round(max(8.0, 100 - (sols * 0.12) - (dust * 18)), 1)
    risk_score = 0.45 * rough_mid + 0.35 * dust + 0.2 * min(1.0, sols / 400)
    risk_level = "LOW" if risk_score < 0.35 else ("MODERATE" if risk_score < 0.55 else "SEVERE")
    waypoints = max(2, math.ceil(distance / 120))

    plan = {
        "id": str(uuid.uuid4()),
        "origin": {"lat": round(lat, 3), "lon": round(lon, 3), "name": req.name or "Custom surface point"},
        "target": target,
        "distance_km": round(distance, 1),
        "sols": sols,
        "avg_speed_kmh": round(speed, 3),
        "drive_hours_per_sol": round(drive_window, 2),
        "daylight_hours": daylight,
        "dust_index": dust,
        "terrain_roughness": rough_mid,
        "battery_reserve_pct": battery,
        "risk_level": risk_level,
        "risk_score": round(risk_score, 3),
        "waypoints": waypoints,
        "sol_of_departure": CURRENT_SOL,
        "computed_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.route_plans.insert_one(dict(plan))
    return plan


PERSONAS = {
    "FLIGHT DIRECTOR": "You are the ROVERA flight director at Mars mission control. Calm, precise, procedural. Address the crew, reference the numbers given, end with a go/no-go style verdict. 90-120 words, plain text, no markdown, no emojis.",
    "FIELD GEOLOGIST": "You are the ROVERA field geologist advising a Mars traverse. Enthusiastic but rigorous, focused on regolith, ice science and terrain composition. Reference the numbers given. 90-120 words, plain text, no markdown, no emojis.",
    "RISK OFFICER": "You are the ROVERA risk officer reviewing a Mars traverse plan. Cautious, blunt, enumerate the top hazards and mitigations from the numbers given, end with a clear recommendation. 90-120 words, plain text, no markdown, no emojis.",
}


@api_router.post("/briefing")
async def mission_briefing(req: BriefingRequest):
    persona = req.persona.upper() if req.persona.upper() in PERSONAS else "FLIGHT DIRECTOR"
    p = req.plan
    prompt = (
        f"Mission data: origin {req.origin.get('lat')} lat, {req.origin.get('lon')} lon on Mars. "
        f"Target water deposit: {p.get('target', {}).get('name')} ({p.get('target', {}).get('type')}, "
        f"confidence {p.get('target', {}).get('confidence')} percent). "
        f"Distance {p.get('distance_km')} km, estimated {p.get('sols')} sols, "
        f"terrain roughness {p.get('terrain_roughness')}, dust opacity index {p.get('dust_index')}, "
        f"daylight window {p.get('daylight_hours')} hours, drive window {p.get('drive_hours_per_sol')} hours per sol, "
        f"battery reserve on arrival {p.get('battery_reserve_pct')} percent, risk level {p.get('risk_level')}, "
        f"{p.get('waypoints')} waypoints. Deliver the tactical mission briefing."
    )
    fallback = (
        f"Uplink degraded. Cached advisory: traverse of {p.get('distance_km')} km to "
        f"{p.get('target', {}).get('name')} is estimated at {p.get('sols')} sols at "
        f"{p.get('risk_level')} risk. Hold departure until dust index drops below 0.6."
    )

    async def event_stream():
        full_text = ""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
            chat = LlmChat(
                api_key=os.environ["EMERGENT_LLM_KEY"],
                session_id=f"rovera-{uuid.uuid4()}",
                system_message=PERSONAS[persona],
            ).with_model("openai", "gpt-5.4-mini")
            async for ev in chat.stream_message(UserMessage(text=prompt)):
                if isinstance(ev, TextDelta):
                    full_text += ev.content
                    yield f"data: {json.dumps(ev.content)}\n\n"
                elif isinstance(ev, StreamDone):
                    break
        except Exception as e:
            logging.getLogger(__name__).error(f"briefing stream failed: {e}")
            full_text = fallback
            yield f"data: {json.dumps(fallback)}\n\n"
        yield "data: [DONE]\n\n"
        await db.briefings.insert_one({
            "id": str(uuid.uuid4()),
            "persona": persona,
            "origin": req.origin,
            "text": full_text,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
