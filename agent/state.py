from typing import TypedDict

class AgentState(TypedDict, total=False):
    query: str          # farmer question
    lang: str           # en | te
    location: str       # district / town
    state_name: str     # Indian state (for mandi filter)
    lat: float
    lon: float
    signals: dict       # weather, prices, schemes, agronomy, profit
    candidates: list     # candidate crops
    decision: dict      # final recommendation
    step_count: int
    next_action: str    # weather|prices|schemes|agronomy|profit|synthesize
