"""Crop photo analysis using a Groq vision model (OpenAI-compatible)."""
from config.settings import settings

DEFAULT_Q = ("You are AgriAgent helping an Indian farmer. Look at this crop photo. "
             "Identify the crop if you can, and describe any visible disease, pest, "
             "nutrient deficiency or stress. Then give simple, practical advice in 3-5 "
             "short sentences. If the image is unclear, say so.")


def analyze_image(b64, question="", lang="en", mime="image/jpeg"):
    if not settings.GROQ_API_KEY:
        return "Photo analysis needs a Groq API key in your .env (GROQ_API_KEY)."
    prompt = (question or "").strip() or DEFAULT_Q
    if lang == "te":
        prompt += " Reply in simple, clear Telugu."
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.GROQ_API_KEY,
                        base_url="https://api.groq.com/openai/v1")
        r = client.chat.completions.create(
            model=settings.GROQ_VISION_MODEL, temperature=0.2,
            messages=[{"role": "user", "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url",
                 "image_url": {"url": f"data:{mime};base64,{b64}"}}]}])
        return r.choices[0].message.content
    except Exception as e:
        return (f"Could not analyze the photo right now ({e}). "
                "Check GROQ_VISION_MODEL in your .env is a current Groq vision model.")
