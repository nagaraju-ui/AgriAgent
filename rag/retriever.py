"""Retrieval. Prefers ChromaDB (semantic) if available + ingested,
else falls back to a dependency-free keyword retriever over the knowledge files."""
import os
import re


def load_chunks(path):
    if not os.path.exists(path):
        return []
    text = open(path, encoding="utf-8").read()
    return [c.strip() for c in re.split(r"\n#{1,3}\s", text) if c.strip()]


class KeywordRetriever:
    def __init__(self, chunks):
        self.chunks = chunks

    def search(self, query, k=3):
        q = set(re.findall(r"[a-zA-Z]+", (query or "").lower()))
        scored = []
        for ch in self.chunks:
            words = set(re.findall(r"[a-zA-Z]+", ch.lower()))
            scored.append((len(q & words), ch))
        scored.sort(key=lambda x: -x[0])
        top = [c for s, c in scored[:k] if s > 0]
        return top or [c for _, c in scored[:k]]


def get_retriever(knowledge_path):
    # Try Chroma if the collection has been ingested (see rag/ingest.py)
    try:
        from rag.chroma_client import ChromaRetriever
        r = ChromaRetriever(knowledge_path)
        if r.ready():
            return r
    except Exception:
        pass
    return KeywordRetriever(load_chunks(knowledge_path))
