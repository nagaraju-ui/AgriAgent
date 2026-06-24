"""LangGraph nodes: planner (ReAct controller), tool_executor, synthesis."""
from config.settings import settings
from tools.weather import get_weather
from tools.mandi import get_mandi_price
from tools.scheme_rag import scheme_lookup
from tools.agronomy_rag import agronomy_lookup
from tools.profit import estimate_profit
from llm.router import get_llm
from llm.translate import to_telugu

CANDIDATE_HINTS = ["cotton", "paddy", "chilli", "groundnut", "maize", "tomato"]


def _crops_in_query(q: str):
    found = [c for c in CANDIDATE_HINTS if c in (q or "").lower()]
    return found or ["cotton", "paddy"]


def planner(state):
    """Decide the next action. Deterministic ReAct controller: gather each
    signal once, then synthesize. Swap in an LLM here for free-form planning."""
    state["step_count"] = state.get("step_count", 0) + 1
    sig = state.get("signals", {})
    nxt = "synthesize"
    for key, act in [("weather", "weather"), ("prices", "prices"),
                     ("schemes", "schemes"), ("agronomy", "agronomy"),
                     ("profit", "profit")]:
        if key not in sig:
            nxt = act
            break
    if state["step_count"] > settings.MAX_STEPS:
        nxt = "synthesize"
    state["next_action"] = nxt
    return state


def tool_executor(state):
    act = state.get("next_action")
    sig = state.setdefault("signals", {})
    crops = state.setdefault("candidates", _crops_in_query(state.get("query", "")))
    loc = state.get("location") or settings.DEFAULT_LOCATION
    if act == "weather":
        sig["weather"] = get_weather(loc, state.get("lat"), state.get("lon"))
    elif act == "prices":
        sig["prices"] = {c: get_mandi_price(c, state.get("state_name")) for c in crops}
    elif act == "schemes":
        sig["schemes"] = scheme_lookup(state.get("query", "crop insurance subsidy"))
    elif act == "agronomy":
        sig["agronomy"] = {c: agronomy_lookup(c) for c in crops}
    elif act == "profit":
        prices = sig.get("prices", {})
        sig["profit"] = {}
        for c in crops:
            mp = (prices.get(c) or {}).get("modal_price")
            sig["profit"][c] = estimate_profit(c, mp, expected_yield_q=12, input_cost=25000)
    return state


def _score(crop, sig):
    s, reasons = 0.0, []
    rain = sig.get("weather", {}).get("rain_7d_mm")
    trend = (sig.get("prices", {}).get(crop) or {}).get("trend")
    if trend == "rising":
        s += 2; reasons.append(f"{crop} price is rising")
    elif trend == "falling":
        s -= 2; reasons.append(f"{crop} price is falling")
    if rain is not None:
        if rain >= 60:
            s += 1; reasons.append(f"adequate rain ({rain} mm over 7 days)")
        elif rain < 30:
            s -= 1; reasons.append(f"low rain ({rain} mm over 7 days)")
    margin = (sig.get("profit", {}).get(crop) or {}).get("margin")
    if margin:
        s += margin / 50000.0
    return s, reasons


def synthesis(state):
    """Weigh signals, resolve conflicts, rank crops, explain. Grounded in tools."""
    sig = state.get("signals", {})
    crops = state.get("candidates", ["cotton", "paddy"])
    ranked = sorted(((c, *_score(c, sig)) for c in crops), key=lambda x: -x[1])
    crop, score, reasons = ranked[0]
    favorable = score > 0
    runner_up = ranked[1][0] if len(ranked) > 1 else None
    reason_txt = "; ".join(reasons) or "best overall fit across the live signals"

    if favorable:
        headline = f"Sow {crop} in the next 5-7 days."
        risk = "If 14-day rainfall falls below 40 mm, delay a week" + (
            f" or switch to {runner_up}." if runner_up else ".")
    else:
        headline = f"Hold off on {crop} this window."
        risk = ("The live signals do not favour it right now"
                + (f"; consider {runner_up} or wait for prices to recover."
                   if runner_up else "; wait for prices or weather to improve."))

    decision = {
        "crop": crop,
        "recommended": favorable,
        "window": "next 5-7 days" if favorable else "wait",
        "reason": reason_txt,
        "risk": risk,
        "confidence": round(min(0.95, 0.55 + 0.08 * abs(score)), 2),
        "ranking": [{"crop": c, "score": round(sc, 2)} for c, sc, _ in ranked],
    }
    text = f"{headline} Why: {reason_txt}. {risk}"
    llm = get_llm()
    if llm:
        nicer = llm(
            "Rewrite this crop recommendation for a farmer in three short, plain "
            "sentences. Keep the decision, the reason, and the risk exactly.\n\n" + text,
            system="You are AgriAgent, a grounded crop advisor. Never add facts.")
        if nicer:
            text = nicer.strip()
    decision["text_en"] = text
    if state.get("lang") == "te" or settings.OUTPUT_LANG == "te":
        decision["text_te"] = to_telugu(text)
    state["decision"] = decision
    return state
