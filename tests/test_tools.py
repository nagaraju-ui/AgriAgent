from tools.profit import estimate_profit
from agent.nodes import _score, _crops_in_query


def test_profit():
    r = estimate_profit("cotton", 7200, 12, 25000)
    assert r["revenue"] == 86400 and r["margin"] == 61400


def test_profit_no_price():
    assert "note" in estimate_profit("cotton", None)


def test_crops_in_query():
    assert _crops_in_query("cotton vs paddy") == ["cotton", "paddy"]
    assert _crops_in_query("anything") == ["cotton", "paddy"]


def test_score_rising_beats_falling():
    sig = {"weather": {"rain_7d_mm": 85}, "prices": {"cotton": {"trend": "rising"},
           "tomato": {"trend": "falling"}}, "profit": {}}
    assert _score("cotton", sig)[0] > _score("tomato", sig)[0]
