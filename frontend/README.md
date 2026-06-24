# AgriAgent — mobile frontend (React + Tailwind + Framer Motion)

Premium, mobile-first UI for AgriAgent. Talks to the FastAPI backend.

## Develop (hot reload)

Two terminals from the project root (`agriagent/`):

```bash
# 1) backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 2) frontend
cd frontend
npm install
npm run dev          # opens http://localhost:5173  (API is proxied to :8000)
```

Open the Vite URL on your phone too (same Wi-Fi): `http://<your-pc-ip>:5173`.

## Build for production (served by FastAPI)

```bash
cd frontend
npm install
npm run build        # outputs frontend/dist
```

Then just run the backend — it auto-serves `frontend/dist` at `/`:

```bash
cd ..
uvicorn app.main:app --host 0.0.0.0 --port 8000   # open http://localhost:8000
```

## Structure

```
src/
  App.jsx                 screen switch + bottom nav
  api.js                  backend calls
  lib/derive.js           turns raw signals into cards / alerts / hero
  components/
    Home.jsx              hero "Smart Farm" card, alerts, quick actions, market, recent
    Chat.jsx              chat + intelligent response cards + floating input (cam/voice/text)
    cards.jsx             shared atoms + the four response-card treatments
```

Design tokens (Tailwind): primary `#166534`, secondary `#22C55E`, accent `#84CC16`,
background `#F8FAF8`. Rounded 24px+, soft shadows, gradients, Framer Motion micro-interactions.
