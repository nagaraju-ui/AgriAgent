"""FastAPI backend + mobile PWA server for AgriAgent.

Serves the installable mobile web app (web/) and the JSON APIs it uses:
  GET  /             -> mobile app
  GET  /api/home     -> weather card + market prices
  POST /api/chat     -> conversational, LLM-driven reply (grounded)
  POST /api/analyze  -> analyze an uploaded / camera crop photo (Groq vision)
  POST /recommend    -> structured pipeline (kept for the original API)

Run:  uvicorn app.main:app --host 0.0.0.0 --port 8000
"""
import base64
import io
import os
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from agent.runner import chat, run_agent
from tools.weather import get_weather
from tools.mandi import get_mandi_price
from llm.vision import analyze_image

WEB = os.path.join(os.path.dirname(__file__), "..", "web")
DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

app = FastAPI(title="AgriAgent", version="0.2.0")
app.mount("/static", StaticFiles(directory=WEB), name="static")


@app.get("/assets/{file_path:path}")
def assets(file_path: str):
    f = os.path.join(DIST, "assets", file_path)
    return FileResponse(f) if os.path.isfile(f) else Response(status_code=404)

HOME_CROPS = ["paddy", "maize", "cotton"]


@app.get("/")
def index():
    di = os.path.join(DIST, "index.html")  # serve the React build if present
    return FileResponse(di) if os.path.isfile(di) else FileResponse(os.path.join(WEB, "index.html"))


@app.get("/manifest.webmanifest")
def manifest():
    return FileResponse(os.path.join(WEB, "manifest.webmanifest"),
                        media_type="application/manifest+json")


@app.get("/sw.js")
def sw():
    return FileResponse(os.path.join(WEB, "sw.js"), media_type="application/javascript")


@app.get("/icon.svg")
def icon():
    return FileResponse(os.path.join(WEB, "icon.svg"), media_type="image/svg+xml")


@app.get("/api/home")
def home(location: str = "Vijayawada"):
    return {"location": location,
            "weather": get_weather(location),
            "prices": {c: get_mandi_price(c) for c in HOME_CROPS}}


@app.post("/api/chat")
async def api_chat(payload: dict):
    msg = (payload.get("message") or "").strip()
    if not msg:
        return JSONResponse({"reply": "Please type or say something.", "type": "chat"})
    return chat(msg, payload.get("history", []),
                payload.get("location", "Vijayawada"), payload.get("lang", "en"))


@app.post("/api/analyze")
async def api_analyze(image: UploadFile = File(...),
                      question: str = Form(""),
                      lang: str = Form("en")):
    data = await image.read()
    b64 = base64.b64encode(data).decode()
    return {"reply": analyze_image(b64, question, lang,
                                   mime=image.content_type or "image/jpeg"),
            "type": "vision"}


@app.post("/api/tts")
async def tts(payload: dict):
    """Text-to-speech (Telugu or English) via gTTS. Returns an MP3."""
    text = (payload.get("text") or "").strip()
    lang = "te" if payload.get("lang") == "te" else "en"
    if not text:
        return Response(status_code=204)
    try:
        from gtts import gTTS
        buf = io.BytesIO()
        gTTS(text=text, lang=lang).write_to_fp(buf)
        return Response(content=buf.getvalue(), media_type="audio/mpeg")
    except Exception:
        return Response(status_code=503)  # gTTS missing or offline -> client falls back


class Query(BaseModel):
    query: str
    location: Optional[str] = None
    state_name: Optional[str] = None
    lang: str = "en"


@app.post("/recommend")
def recommend(q: Query):
    out = run_agent(q.query, q.location, q.lang, q.state_name)
    return {"decision": out["decision"], "signals": out.get("signals", {})}


@app.get("/health")
def health():
    return {"ok": True}
