"""Build ChromaDB collections from the knowledge files.
Run:  python -m rag.ingest    (requires chromadb + sentence-transformers)"""
import os
import chromadb
from chromadb.utils import embedding_functions
from config.settings import settings
from rag.retriever import load_chunks
from rag.chroma_client import _collection_name

KB = os.path.join(os.path.dirname(__file__), "..", "knowledge")
FILES = ["schemes.md", "agronomy.md"]


def main():
    client = chromadb.PersistentClient(path=settings.CHROMA_DIR)
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2")
    for fname in FILES:
        path = os.path.join(KB, fname)
        chunks = load_chunks(path)
        name = _collection_name(path)
        try:
            client.delete_collection(name)
        except Exception:
            pass
        col = client.create_collection(name, embedding_function=ef)
        col.add(documents=chunks, ids=[f"{name}-{i}" for i in range(len(chunks))])
        print(f"ingested {len(chunks)} chunks into {name}")


if __name__ == "__main__":
    main()
