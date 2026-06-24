"""Streamlit UI.  Run:  streamlit run ui/streamlit_app.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import streamlit as st
from agent.runner import run_agent

st.set_page_config(page_title="AgriAgent", page_icon="🌱")
st.title("🌱 AgriAgent")
st.caption("An intelligent crop recommendation system using real-time signals")

q = st.text_input("Your question", "Should I sow cotton or paddy this week?")
loc = st.text_input("Location (district / town)", "Vijayawada")
lang = st.selectbox("Answer language", ["en", "te"])

if st.button("Get recommendation"):
    with st.spinner("Gathering live signals and reasoning..."):
        out = run_agent(q, loc, lang)
    d = out["decision"]
    st.success(f"Recommended: sow {d['crop']}  ·  {d['window']}")
    st.write(d.get("text_te") or d["text_en"])
    st.metric("Confidence", d["confidence"])
    c1, c2 = st.columns(2)
    with c1.expander("Crop ranking"):
        st.json(d["ranking"])
    with c2.expander("Signals gathered (grounding)"):
        st.json(out["signals"])
