"""Scenario harness. Run: python -m eval.scenarios"""
from agent.runner import run_agent

SCENARIOS = [
    ("Should I sow cotton or paddy this week?", "Vijayawada"),
    ("groundnut or maize in my dry field?", "Anantapur"),
    ("is tomato a good choice now?", "Guntur"),
]


def main():
    for q, loc in SCENARIOS:
        out = run_agent(q, loc, "en")
        d = out["decision"]
        print(f"\nQ: {q}  ({loc})")
        print(f"  -> {d['text_en']}")
        print(f"  confidence={d['confidence']}  ranking={d['ranking']}")


if __name__ == "__main__":
    main()
