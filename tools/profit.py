"""Profit calculator - pure, deterministic, fully testable."""

def estimate_profit(crop, modal_price, expected_yield_q=12, input_cost=25000):
    """modal_price: Rs/quintal, expected_yield_q: quintals/acre, input_cost: Rs/acre."""
    if not modal_price:
        return {"crop": crop, "note": "no price available"}
    revenue = modal_price * expected_yield_q
    margin = revenue - input_cost
    return {"crop": crop, "revenue": round(revenue), "input_cost": round(input_cost),
            "margin": round(margin),
            "margin_pct": round(100 * margin / revenue, 1) if revenue else None}
