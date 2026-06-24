"""Mandi price tool - data.gov.in (Agmarknet) if a key is set, else sample data."""
import requests
from config.settings import settings

RESOURCE = "9ef84268-d588-465a-a308-a864a43d0070"  # Agmarknet daily mandi prices
API = "https://api.data.gov.in/resource/" + RESOURCE

# Fallback so the system runs without a key. Replace with live data in production.
_SAMPLE = {
    "cotton":    {"trend": "rising",  "modal_price": 7200},
    "paddy":     {"trend": "flat",    "modal_price": 2100},
    "chilli":    {"trend": "rising",  "modal_price": 18500},
    "groundnut": {"trend": "steady",  "modal_price": 6300},
    "maize":     {"trend": "rising",  "modal_price": 2250},
    "tomato":    {"trend": "falling", "modal_price": 900},
}


def get_mandi_price(commodity, state_name=None, market=None):
    c = commodity.lower().strip()
    if settings.AGMARKNET_API_KEY:
        try:
            p = {"api-key": settings.AGMARKNET_API_KEY, "format": "json", "limit": 30,
                 "filters[commodity]": commodity.title()}
            if state_name:
                p["filters[state]"] = state_name
            recs = requests.get(API, params=p, timeout=12).json().get("records", [])
            if recs:
                modal = int(float(recs[0].get("modal_price", 0)))
                return {"commodity": c, "modal_price": modal, "records": len(recs),
                        "source": "agmarknet", "trend": "n/a"}
        except Exception:
            pass
    s = _SAMPLE.get(c, {"trend": "unknown", "modal_price": None})
    return {"commodity": c, "source": "sample", **s}
