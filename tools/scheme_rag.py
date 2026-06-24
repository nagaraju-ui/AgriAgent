"""Scheme lookup tool - RAG over government scheme / insurance knowledge."""
import os
from rag.retriever import get_retriever

_PATH = os.path.join(os.path.dirname(__file__), "..", "knowledge", "schemes.md")
_R = None


def _ret():
    global _R
    if _R is None:
        _R = get_retriever(_PATH)
    return _R


def scheme_lookup(query):
    return {"query": query, "results": _ret().search(query, k=3)}
