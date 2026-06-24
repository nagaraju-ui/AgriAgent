"""Optional ChromaDB-backed retriever. Activated once rag/ingest.py has run."""
import os
from config.settings import settings


def _collection_name(path):
    return "kb_" + os.path.splitext(os.path.basename(path))[0]


class ChromaRetriever:
    def __init__(self, knowledge_path):
        import chromadb
        self.client = chromadb.PersistentClient(path=settings.CHROMA_DIR)
        self.name = _collection_name(knowledge_path)
        self.col = None
        try:
            self.col = self.client.get_collection(self.name)
        except Exception:
            self.col = None

    def ready(self):
        return self.col is not None and self.col.count() > 0

    def search(self, query, k=3):
        res = self.col.query(query_texts=[query], n_results=k)
        return res.get("documents", [[]])[0]
