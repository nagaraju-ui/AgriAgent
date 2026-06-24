"""AgriAgent - clean chat UI for farmers.

Understands greetings and crop questions, reasons over live signals, and replies
conversationally (text + optional voice) in English or Telugu.

Run:  streamlit run ui/chat_app.py
Voice needs:  pip install streamlit-mic-recorder gTTS
"""
import io
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import streamlit as st
from agent.runner import chat

st.set_page_config(page_title="AgriAgent", page_icon="🌾", layout="centered")

st.markdown("""
<style>
.block-container {max-width: 760px; padding-top: 1.5rem;}
[data-testid="stChatMessage"] {border-radius: 14px;}
h1, h2, h3 {color:#15602f;}
.ag-tag {color:#5b7a64; font-size:0.95rem;}
</style>
""", unsafe_allow_html=True)

st.markdown("## 🌾 AgriAgent")
st.markdown('<div class="ag-tag">Your farming assistant — ask what to sow, in your language.</div>',
            unsafe_allow_html=True)
st.write("")

with st.sidebar:
    st.header("Settings")
    lang_label = st.radio("Language", ["English", "తెలుగు (Telugu)"], index=0)
    location = st.text_input("Your location (district / town)", "Vijayawada")
    speak = st.toggle("Speak replies aloud", value=False)
    if st.button("Clear chat"):
        st.session_state.pop("messages", None)
        st.rerun()
lang = "te" if "Telugu" in lang_label else "en"

if "messages" not in st.session_state:
    greet = ("నమస్తే 🙏 నేను AgriAgent. మీ ఊరు చెప్పి, ఈ సీజన్‌లో ఏ పంట వేయాలో అడగండి."
             if lang == "te" else
             "Namaste 🙏 I'm AgriAgent. Tell me your location and ask what to sow this season.")
    st.session_state.messages = [("assistant", greet)]

# render conversation
for role, text in st.session_state.messages:
    with st.chat_message(role, avatar="🧑‍🌾" if role == "user" else "🌾"):
        st.write(text)

# voice input (optional)
voice_text = None
try:
    from streamlit_mic_recorder import speech_to_text
    with st.sidebar:
        st.caption("Or ask by voice:")
        voice_text = speech_to_text(language="te-IN" if lang == "te" else "en-IN",
                                    start_prompt="🎤 Speak", stop_prompt="⏹ Stop",
                                    just_once=True, use_container_width=True, key="mic")
except Exception:
    pass

typed = st.chat_input("Type your message…")
user_msg = (typed or voice_text or "").strip()

if user_msg:
    history = list(st.session_state.messages)          # prior turns
    st.session_state.messages.append(("user", user_msg))
    with st.chat_message("user", avatar="🧑‍🌾"):
        st.write(user_msg)
    with st.chat_message("assistant", avatar="🌾"):
        with st.spinner("Thinking…"):
            res = chat(user_msg, history, location, lang)
        reply = res["reply"]
        st.write(reply)
        if res.get("signals"):
            with st.expander("Live signals I used"):
                st.json(res["signals"])
        if speak:
            try:
                from gtts import gTTS
                buf = io.BytesIO()
                gTTS(reply, lang="te" if lang == "te" else "en").write_to_fp(buf)
                buf.seek(0)
                st.audio(buf.read(), format="audio/mp3", autoplay=True)
            except Exception:
                pass
    st.session_state.messages.append(("assistant", reply))
