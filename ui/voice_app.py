"""Voice UI for AgriAgent.

The farmer speaks a question (speech -> text), the agent reasons over live
signals, and the recommendation is spoken back (text -> speech).

Run:  streamlit run ui/voice_app.py
Needs:  pip install streamlit-mic-recorder gTTS
"""
import io
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import streamlit as st
from agent.runner import run_agent

st.set_page_config(page_title="AgriAgent Voice", page_icon="🎙️")
st.title("🎙️ AgriAgent")
st.caption("Ask by voice. Get a spoken crop recommendation.")

col1, col2 = st.columns(2)
with col1:
    lang_label = st.selectbox("Language", ["English", "Telugu"])
with col2:
    location = st.text_input("Location (district / town)", "Vijayawada")
lang = "te" if lang_label == "Telugu" else "en"
stt_lang = "te-IN" if lang == "te" else "en-IN"

# ---------- 1. Voice input (speech -> text) ----------
query = None
st.markdown("**Tap the mic and ask your question:**")
try:
    from streamlit_mic_recorder import speech_to_text
    query = speech_to_text(
        language=stt_lang,
        start_prompt="🎤  Speak",
        stop_prompt="⏹  Stop",
        just_once=True,
        use_container_width=True,
        key="stt",
    )
except Exception:
    st.warning("Voice input needs:  pip install streamlit-mic-recorder")

# Typed fallback so it works even without a mic
typed = st.text_input("…or type your question instead", "")
query = query or (typed.strip() or None)

# ---------- 2. Run the agent ----------
if query:
    st.markdown(f"🗣️ **You asked:** {query}")
    with st.spinner("Gathering live signals and reasoning…"):
        out = run_agent(query, location, lang)
    d = out["decision"]

    # Pick the answer + matching TTS language. If Telugu was requested but no
    # LLM produced a Telugu translation, fall back to English so the voice
    # pronunciation stays correct.
    if lang == "te" and d.get("text_te"):
        answer, tts_lang = d["text_te"], "te"
    else:
        answer, tts_lang = d["text_en"], "en"
        if lang == "te" and not d.get("text_te"):
            st.info("Telugu voice needs an LLM enabled (set LLM_PROVIDER=ollama). "
                    "Speaking the English answer for now.")

    st.success(f"✅ {answer}")
    st.metric("Confidence", d["confidence"])

    # ---------- 3. Voice output (text -> speech) ----------
    try:
        from gtts import gTTS
        buf = io.BytesIO()
        gTTS(answer, lang=tts_lang).write_to_fp(buf)
        buf.seek(0)
        st.audio(buf.read(), format="audio/mp3", autoplay=True)
    except Exception as e:
        st.warning(f"Voice output needs:  pip install gTTS  ({e})")

    with st.expander("Crop ranking"):
        st.json(d["ranking"])
    with st.expander("Signals gathered (grounding)"):
        st.json(out["signals"])
