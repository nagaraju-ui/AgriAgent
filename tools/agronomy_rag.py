"""Agronomy lookup tool - RAG over crop / soil / season knowledge."""
import os
from rag.retriever import get_retriever

_PATH = os.path.join(os.path.dirname(__file__), "..", "knowledge", "agronomy.md")
_R = None


def _ret():
    global _R
    if _R is None:
        _R = get_retriever(_PATH)
    return _R


def agronomy_lookup(crop):
    return {"crop": crop, "results": _ret().search(crop, k=2)}
