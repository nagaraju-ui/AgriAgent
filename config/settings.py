import os
try:
    from dotenv import load_dotenv; load_dotenv()
except Exception:
    pass

class Settings:
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "auto")  # auto | groq | openai | ollama | none
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    GROQ_VISION_MODEL = os.getenv("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")
    AGMARKNET_API_KEY = os.getenv("AGMARKNET_API_KEY")          # data.gov.in key (optional)
    CHROMA_DIR = os.getenv("CHROMA_DIR", ".chroma")
    MAX_STEPS = int(os.getenv("MAX_STEPS", "8"))
    OUTPUT_LANG = os.getenv("OUTPUT_LANG", "en")                # en | te
    DEFAULT_LOCATION = os.getenv("DEFAULT_LOCATION", "Vijayawada")

settings = Settings()
