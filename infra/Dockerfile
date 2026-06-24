# ---------- stage 1: build the React UI ----------
FROM node:20-slim AS web
WORKDIR /web
COPY frontend/package*.json ./
RUN npm ci || npm install
COPY frontend/ ./
RUN npm run build

# ---------- stage 2: python runtime ----------
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# bring in the compiled UI so the server serves it at /
COPY --from=web /web/dist ./frontend/dist
EXPOSE 8000
# Render (and most hosts) inject $PORT; fall back to 8000 locally.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
