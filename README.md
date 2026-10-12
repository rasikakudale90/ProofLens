# ProofLens AI — From Documents to Verifiable Answers

ProofLens AI is an evidence-first document intelligence platform that helps users investigate multiple PDF documents, obtain evidence-grounded answers, inspect supporting passages, evaluate individual claims, identify potential contradictions, and generate verifiable research briefs.

## Core Principle: Evidence Before Confidence
- **Strict Grounding:** Answers are generated exclusively from retrieved passages.
- **Server-Derived Provenance:** Citations map to real document IDs and page numbers validated server-side.
- **Explicit Uncertainty & Abstention:** If evidence is weak or absent, the system returns `insufficient_evidence` instead of hallucinating.
- **Claim Evidence Ledger:** 4-status evaluation (`Supported`, `Partially Supported`, `Contradicted`, `Insufficient Evidence`).
- **Contradiction Radar:** Independent scoped retrieval per document to detect true contradictions vs. scoping/methodology differences.
- **Repeatable Evaluation:** Benchmark measuring retrieval hit rate, citation validity, and abstention rate.

---

## 6 Signature MVP Features
1. **Smart Document Library**: Multi-PDF upload, PyMuPDF page-aware extraction, metadata, and cascading deletion.
2. **Evidence-First AI Assistant**: Semantic pgvector retrieval, grounded Q&A, citation navigation, and explicit abstention.
3. **Claim Evidence Ledger**: Claim extraction and four-status classification with supporting excerpts.
4. **Contradiction Radar**: Multi-document comparison on a topic with mismatch disclosure.
5. **Research Brief Generator**: Structured report with executive summary, citations, and Markdown export.
6. **Trust & Evaluation Dashboard**: Curated evaluation dataset with deterministic metrics and CLI runner.

---

## Technology Stack
- **Backend:** Python + FastAPI + PyMuPDF + Pydantic (deployed to Render)
- **Frontend:** Next.js + TypeScript + Tailwind CSS + shadcn/ui (deployed to Vercel)
- **Database & Vectors:** Supabase PostgreSQL + `pgvector`
- **File Storage:** Supabase Storage (`prooflens-documents` bucket) with local filesystem adapter
- **AI Models:** Google Gemini API (`gemini-2.5-flash` generation, `text-embedding-004` embeddings)
- **Local Dev:** Strictly Native execution (Python virtualenv + Node/npm) — **No Docker**

---

## Local Development (No Docker Required)

### 1. Prerequisites
- Python 3.11+ (Python 3.13 supported)
- Node.js 18+ (for frontend)

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase and Gemini credentials
```

### 3. Run the Backend Server
```bash
uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Interactive ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 4. Run Tests
```bash
pytest tests
```

### 5. Run the Evaluation Benchmark
```bash
python evals/run_eval.py
```

---

## API Endpoints Reference

All application endpoints are versioned under `/api/v1`.

| Module | Method | Endpoint | Description |
|---|---|---|---|
| **Health** | `GET` | `/health` | Liveness / basic API health |
| **Health** | `GET` | `/ready` | Readiness check (database & storage) |
| **Workspaces** | `POST` | `/api/v1/workspaces` | Create a workspace |
| **Workspaces** | `GET` | `/api/v1/workspaces` | List all workspaces |
| **Workspaces** | `GET` | `/api/v1/workspaces/{id}` | Get workspace metadata |
| **Documents** | `POST` | `/api/v1/workspaces/{id}/documents` | Upload PDF (`multipart/form-data`) |
| **Documents** | `GET` | `/api/v1/workspaces/{id}/documents` | List documents and processing status |
| **Documents** | `GET` | `/api/v1/workspaces/{id}/documents/{doc_id}` | Get document status and chunk count |
| **Documents** | `GET` | `/api/v1/workspaces/{id}/documents/{doc_id}/pages/{page}` | Get extracted page text |
| **Documents** | `DELETE`| `/api/v1/workspaces/{id}/documents/{doc_id}` | Delete document, chunks & files |
| **Retrieval** | `POST` | `/api/v1/workspaces/{id}/retrieve` | Semantic passage retrieval |
| **Q&A** | `POST` | `/api/v1/workspaces/{id}/ask` | Grounded Q&A with validated citations |
| **Claims** | `POST` | `/api/v1/workspaces/{id}/claims/assess` | Claim Evidence Ledger assessment |
| **Comparison**| `POST` | `/api/v1/workspaces/{id}/compare` | Contradiction Radar (2+ documents) |
| **Briefs** | `POST` | `/api/v1/workspaces/{id}/briefs` | Generate structured research brief |
| **Briefs** | `GET` | `/api/v1/workspaces/{id}/briefs/{brief_id}/markdown` | Export research brief as Markdown |
| **Evaluation**| `POST` | `/api/v1/evaluation/run` | Trigger evaluation benchmark run |
| **Evaluation**| `GET` | `/api/v1/evaluation/summary` | Get latest benchmark metrics |

---

## Documentation
- [Project Kickoff PRD v1.0](docs/ProofLens-AI-Project-Kickoff-PRD-v0.1.md)
- [Backend Software Requirements Specification (SRS v1.0)](docs/ProofLens-AI-Backend-SRS-v1.0.md)
- [Technical Design & Planning Prompt](docs/ProofLens-AI-Antigravity-TDD-Planning-Prompt.md)
