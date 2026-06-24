install: ; pip install -r requirements.txt
ingest:  ; python -m rag.ingest
api:     ; uvicorn app.main:app --reload
ui:      ; streamlit run ui/streamlit_app.py
eval:    ; python -m eval.scenarios
test:    ; pytest -q
