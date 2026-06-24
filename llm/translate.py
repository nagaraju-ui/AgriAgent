"""Telugu output layer. Uses the LLM if available; otherwise returns English."""
from llm.router import get_llm


def to_telugu(text):
    llm = get_llm()
    if not llm:
        return text
    out = llm("Translate this crop advice into simple, clear Telugu. "
              "Keep all numbers, crop names and timing accurate.\n\n" + text,
              system="You are an agricultural translator.")
    return out or text
