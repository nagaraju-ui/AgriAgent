"""Model router - one interface, swappable backend (OpenAI, Ollama, or none).
Returns a callable call(prompt, system="") -> str, or None if no LLM available."""
from config.settings import settings


def _openai_compatible(api_key, base_url, model):
    """Build a call() backed by any OpenAI-compatible endpoint (OpenAI, Groq)."""
    from openai import OpenAI
    client = OpenAI(api_key=api_key, base_url=base_url) if base_url else OpenAI(api_key=api_key)

    def call(prompt, system=""):
        try:
            r = client.chat.completions.create(
                model=model, temperature=0.2,
                messages=[{"role": "system", "content": system},
                          {"role": "user", "content": prompt}])
            return r.choices[0].message.content
        except Exception:
            return None
    return call


def get_llm():
    prov = settings.LLM_PROVIDER
    # Groq (fast, OpenAI-compatible). Preferred in "auto" when a key is present.
    if prov in ("auto", "groq") and settings.GROQ_API_KEY:
        try:
            return _openai_compatible(settings.GROQ_API_KEY,
                                      "https://api.groq.com/openai/v1",
                                      settings.GROQ_MODEL)
        except Exception:
            pass
    if prov in ("auto", "openai") and settings.OPENAI_API_KEY:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.OPENAI_API_KEY)

            def call(prompt, system=""):
                try:
                    r = client.chat.completions.create(
                        model=settings.OPENAI_MODEL, temperature=0.2,
                        messages=[{"role": "system", "content": system},
                                  {"role": "user", "content": prompt}])
                    return r.choices[0].message.content
                except Exception:
                    # quota / network / auth errors must not crash the agent;
                    # synthesis falls back to its grounded deterministic text.
                    return None
            return call
        except Exception:
            pass
    if prov in ("auto", "ollama"):
        import requests

        def call(prompt, system=""):
            try:
                r = requests.post(settings.OLLAMA_HOST + "/api/generate",
                                  json={"model": settings.OLLAMA_MODEL,
                                        "prompt": (system + "\n\n" + prompt).strip(),
                                        "stream": False}, timeout=120)
                return r.json().get("response")
            except Exception:
                return None
        return call
    return None
