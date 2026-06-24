"""Weather tool - live forecast via Open-Meteo (free, no API key)."""
import requests

GEO = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST = "https://api.open-meteo.com/v1/forecast"


def geocode(place):
    try:
        r = requests.get(GEO, params={"name": place, "count": 1}, timeout=10).json()
        res = r.get("results")
        if res:
            return res[0]["latitude"], res[0]["longitude"]
    except Exception:
        pass
    return None


def get_weather(location, lat=None, lon=None):
    if lat is None or lon is None:
        g = geocode(location)
        if not g:
            return {"error": f"location not found: {location}"}
        lat, lon = g
    try:
        p = {"latitude": lat, "longitude": lon,
             "daily": "precipitation_sum,temperature_2m_max",
             "forecast_days": 16, "timezone": "auto"}
        d = requests.get(FORECAST, params=p, timeout=10).json().get("daily", {})
    except Exception as e:
        return {"error": f"weather api: {e}"}
    prec = d.get("precipitation_sum") or []
    tmax = d.get("temperature_2m_max") or []
    rain7, rain14 = round(sum(prec[:7]), 1), round(sum(prec[:14]), 1)
    return {"lat": lat, "lon": lon, "rain_7d_mm": rain7, "rain_14d_mm": rain14,
            "tmax_c": max(tmax) if tmax else None,
            "summary": f"{rain7} mm over 7 days, {rain14} mm over 14 days"}
