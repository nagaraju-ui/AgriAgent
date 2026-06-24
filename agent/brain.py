"""LLM-driven controller for AgriAgent.

No hardcoded answers. The model:
  1. understands the farmer's message (greeting / crop question / smalltalk),
  2. extracts the crop(s) and location,
  3. for a crop question, gathers live signals from the tools,
  4. writes a grounded, conversational reply using ONLY that data.
"""
import json
import re

from config.settings import settings
from llm.router import get_llm
from tools.weather import get_weather
from tools.mandi import get_mandi_price
from tools.scheme_rag import scheme_lookup
from tools.agronomy_rag import agronomy_lookup
from tools.profit import estimate_profit

KNOWN_CROPS = ["cotton", "paddy", "rice", "chilli", "groundnut", "maize",
               "tomato", "sugarcane", "turmeric", "banana", "onion", "bengalgram"]

LANG_NAME = {
    "en": "English",
    "te": "Telugu, written in Telugu script (తెలుగు లిపి) only, never Hindi and never romanized Latin letters",
}


def _lang_rule(lang):
    return f"Write your entire reply strictly in {LANG_NAME.get(lang, LANG_NAME['en'])}. Never reply in Hindi."

SYSTEM = (
    "You are AgriAgent, a warm and practical farming assistant for Indian farmers. "
    "You speak simply and kindly, like a helpful agriculture officer. "
    "You give crop advice ONLY from the live data you are given; you never invent "
    "prices, rainfall, schemes or facts. If you are just chatting or greeting, be friendly and brief."
)


def _json(text):
    if not text:
        return None
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except Exception:
        return None


def understand(message, history_text, location, lang="en"):
    """Return {intent, crops, location, reply}. intent in greeting|crop_advice|smalltalk|other."""
    llm = get_llm()
    low = message.lower()
    if not llm:
        crops = [c for c in KNOWN_CROPS if c in low]
        advice = bool(crops) or any(w in low for w in
                                    ["sow", "crop", "plant", "grow", "mandi", "price", "rain", "season"])
        if advice:
            return {"intent": "crop_advice", "crops": crops, "location": "", "reply": ""}
        return {"intent": "greeting", "crops": [], "location": "",
                "reply": "Namaste! I am AgriAgent. Tell me your location and ask what to sow, "
                         "and I will check the weather and market for you."}
    prompt = (
        "Route the farmer's message. Return ONLY a JSON object, nothing else.\n"
        f"Recent conversation:\n{history_text or '(none)'}\n"
        f'Farmer now says: "{message}"\n\n'
        "Fields:\n"
        '  "intent": one of "greeting", "crop_advice", "smalltalk", "other"\n'
        '  "crops": array of crop names mentioned (lowercase); [] if none\n'
        '  "location": a place name if the farmer mentioned one, else ""\n'
        '  "reply": if intent is NOT crop_advice, a short friendly reply (1-2 sentences); else ""\n'
        "\nFor the \"reply\" text: " + _lang_rule(lang) + "\n"
    )
    info = _json(llm(prompt, system=SYSTEM)) or {}
    info.setdefault("intent", "crop_advice" if any(c in low for c in KNOWN_CROPS) else "greeting")
    info.setdefault("crops", [])
    info.setdefault("location", "")
    info.setdefault("reply", "")
    return info


def gather(crops, location):
    """Call the tools and collect live signals for the given crops + location."""
    crops = crops or ["cotton", "paddy", "groundnut", "maize"]
    weather = get_weather(location)
    prices = {c: get_mandi_price(c) for c in crops}
    schemes = scheme_lookup("crop insurance and subsidy for " + ", ".join(crops))
    agronomy = {c: agronomy_lookup(c) for c in crops}
    profit = {}
    for c in crops:
        mp = (prices.get(c) or {}).get("modal_price")
        profit[c] = estimate_profit(c, mp)
    return {"location": location, "crops": crops, "weather": weather,
            "prices": prices, "schemes": schemes, "agronomy": agronomy, "profit": profit}


def _fallback_advice(signals):
    prices = signals.get("prices", {})
    score = {"rising": 2, "steady": 0.5, "flat": 0, "falling": -2}
    best, bs = None, -99
    for c, p in prices.items():
        s = score.get((p or {}).get("trend"), 0)
        if s > bs:
            bs, best = s, c
    rain = (signals.get("weather") or {}).get("rain_7d_mm")
    txt = f"Based on current market prices, {best} looks like the stronger choice this week"
    if rain is not None:
        txt += f", with about {rain} mm of rain expected over the next 7 days"
    return txt + ". Watch the 14-day rainfall before you sow."


def advise(message, signals, lang):
    """LLM writes the recommendation grounded in the gathered data."""
    llm = get_llm()
    if not llm:
        return _fallback_advice(signals)
    data = json.dumps(signals, ensure_ascii=False, indent=2)
    prompt = (
        f'The farmer asked: "{message}"\n\n'
        "Here is the LIVE data you gathered with your tools. Use ONLY these numbers and facts; "
        "do not invent anything:\n"
        f"{data}\n\n"
        "Now advise the farmer: which crop to sow and the sowing window, why (refer to the rainfall, "
        "the price trend, the scheme and the agronomy in the data), and one risk to watch. "
        "Be warm and practical, 3 to 5 short sentences. " + _lang_rule(lang)
    )
    return llm(prompt, system=SYSTEM) or _fallback_advice(signals)


def respond(message, history, location, lang="en"):
    """Main entry. history is a list of (role, text) tuples."""
    history_text = "\n".join(f"{r}: {t}" for r, t in (history or [])[-6:])
    info = understand(message, history_text, location, lang)
    if info.get("intent") != "crop_advice":
        reply = info.get("reply") or "I can help you decide what to sow. What would you like to know?"
        return {"type": "chat", "reply": reply, "signals": None}
    loc = info.get("location") or location or settings.DEFAULT_LOCATION
    signals = gather(info.get("crops"), loc)
    reply = advise(message, signals, lang)
    return {"type": "advice", "reply": reply, "signals": signals}
