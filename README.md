# 🌾 AgriAgent

**An AI farming assistant for Indian farmers — a personal agronomist in your pocket.**

AgriAgent is not a chatbot for farmers. It is a tool-using AI **agent** that gathers
live signals (weather, mandi prices, government schemes, agronomy), reasons across
them, and tells a farmer **what to grow and what to do today** — with a clear reason,
in their own language, by text, voice, or a photo of a sick crop.

---

## ✨ Features

- **Agentic AI (not single-shot):** a ReAct loop that plans, calls tools, observes, and decides.
- **Grounded answers:** every fact comes from a live tool — nothing invented.
- **Live signals:** weather (Open-Meteo), mandi prices (Agmarknet), scheme & agronomy knowledge (RAG).
- **Crop photo diagnosis:** snap a leaf, get disease/pest analysis (vision model).
- **Voice in + voice out**, and **English / Telugu** support.
- **Premium mobile UI:** gradient Smart-Farm hero, farm alerts, quick actions, market insights,
  and chat answers rendered as **smart cards** (crop · weather · market · action plan).
- **Installable PWA** (add to phone home screen).

---

## 🧭 Architecture

```
        React PWA  (or Flutter app)
                 │  /api/*
        ┌────────▼─────────┐
        │  FastAPI gateway │
        └────────┬─────────┘
        ┌────────▼───────────────── LangGraph agent ─────────────┐
        │  planner (ReAct) ⇄ tools ⇄ (loop) → synthesis → reply  │
        └────────┬───────────────────────────────────────────────┘
   tools: weather · mandi price · scheme RAG · agronomy RAG · profit
   data:  ChromaDB (vectors) · external APIs · knowledge files
   LLM:   Groq (llama-3.x) via an OpenAI-compatible router  +  vision
```

Every fact in a recommendation is produced by a tool; the model only reasons over them.

---

## 🛠 Tech stack

**Backend:** Python, FastAPI, LangGraph, ChromaDB, Groq (OpenAI-compatible), gTTS
**Frontend:** React + Vite, Tailwind CSS, Framer Motion, Lucide (PWA)
**Mobile:** Flutter (separate project — see `agriagent_flutter/` if included)

---

## 📁 Project structure

```
app/         FastAPI backend (serves the API + the built web app)
agent/       LangGraph agent — brain (intent + reasoning), graph, nodes, runner
tools/       weather · mandi · scheme_rag · agronomy_rag · profit
rag/         retriever (keyword + Chroma) and ingestion
llm/         model router (Groq/OpenAI/Ollama), Telugu translate, vision
knowledge/   scheme + agronomy source text for RAG
web/         lightweight built-in PWA (fallback UI)
frontend/    premium React app (Home + Chat + bottom nav)
eval/  tests/ infra/   scenarios, unit tests, Docker
start.bat    one-click: build the UI and run the server
```

---

## 🚀 Getting started

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** (for the React UI)
- A free **Groq API key** → https://console.groq.com

### 2. Configure
```bash
cp .env.example .env
```
Open `.env` and set your key:
```
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

### 3. Install
```bash
pip install -r requirements.txt
cd frontend && npm install && cd ..
```

### 4. Run (one command on Windows)
```bash
start.bat
```
This builds the React UI and starts the server. Open **http://localhost:8000**.

<details>
<summary>Run manually (any OS)</summary>

```bash
# build the UI once
cd frontend && npm run build && cd ..
# run the server (serves UI + API)
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
For UI hot-reload during development, run the backend on :8000 and `npm run dev` in `frontend/` (proxied to the API).
</details>

### Use it on your phone
- **Same Wi-Fi:** open `http://<your-pc-ip>:8000` (chat + camera + voice output).
- **Installable + microphone:** expose an HTTPS link, e.g. a free Cloudflare quick tunnel:
  ```bash
  cloudflared tunnel --url http://localhost:8000
  ```
  Open the printed `https://…trycloudflare.com` on your phone → **Add to Home Screen**.

---

## 🔌 API

| Method | Endpoint        | Purpose                                   |
|--------|-----------------|-------------------------------------------|
| GET    | `/api/home`     | Weather card + market prices              |
| POST   | `/api/chat`     | Conversational, grounded reply (+signals) |
| POST   | `/api/analyze`  | Analyze a crop photo (vision)             |
| POST   | `/api/tts`      | Text → speech (English / Telugu)          |
| GET    | `/health`       | Health check                              |

---

## ⚙️ Environment variables

| Variable            | Default                        | Notes                                   |
|---------------------|--------------------------------|-----------------------------------------|
| `LLM_PROVIDER`      | `auto`                         | `groq` \| `openai` \| `ollama` \| `none`|
| `GROQ_API_KEY`      | —                              | required for Groq                       |
| `GROQ_MODEL`        | `llama-3.1-8b-instant`         | use `llama-3.3-70b-versatile` for Telugu|
| `GROQ_VISION_MODEL` | `meta-llama/llama-4-scout-17b-16e-instruct` | crop photo analysis        |
| `AGMARKNET_API_KEY` | —                              | optional, live mandi prices (data.gov.in) |
| `OUTPUT_LANG`       | `en`                           | `en` \| `te`                            |

---

## 📱 Flutter app

A native Flutter implementation of the same design lives in `agriagent_flutter/`
(if included). See its own `README.md` for setup; it talks to the same backend APIs.

---

## ⚠️ Note

Recommendations are illustrative of the system's intended behaviour and depend on the
configured data sources; mandi prices fall back to sample data unless an Agmarknet key
is set. Not a substitute for professional agronomic advice.

## 📄 License

MIT
