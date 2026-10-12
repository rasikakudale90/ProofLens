# ProofLens AI — From Documents to Verifiable Answers

ProofLens AI is an evidence-first document intelligence platform that helps users investigate multiple PDF documents, obtain evidence-grounded answers, inspect supporting passages, evaluate individual claims, identify potential contradictions, and generate verifiable research briefs.

## Core Principle: Evidence Before Confidence
- Answers are strictly grounded in retrieved evidence.
- Citations map to real document IDs and page numbers validated server-side.
- Explicit abstention when evidence is insufficient or contradictory.
- Claim-level evidence ledger with 4 statuses (`Supported`, `Partially Supported`, `Contradicted`, `Insufficient Evidence`).
- Contradiction radar across multiple documents.
- Repeatable evaluation suite measuring retrieval hit rate, citation validity, and abstention rate.

## 6 Signature MVP Features
1. **Smart Document Library**: Multi-PDF upload, text extraction, page-level provenance, metadata, and deletion.
2. **Evidence-First AI Assistant**: Semantic search, grounded Q&A, citation navigation, and explicit abstention.
3. **Claim Evidence Ledger**: Claim extraction and four-status classification with supporting excerpts.
4. **Contradiction Radar**: Multi-document comparison on a topic with mismatch disclosure.
5. **Research Brief Generator**: Structured report with executive summary, citations, and Markdown export.
6. **Trust & Evaluation Dashboard**: Curated evaluation dataset with deterministic metrics.

## Technology Stack
- **Backend:** Python + FastAPI + PyMuPDF + Pydantic (deployed to Render)
- **Frontend:** Next.js + TypeScript + Tailwind CSS + shadcn/ui (deployed to Vercel)
- **Database & Vectors:** Supabase PostgreSQL + `pgvector`
- **File Storage:** Supabase Storage (with local file fallback adapter for tests)
- **AI Models:** Google Gemini API (`gemini-2.5-flash` generation, `text-embedding-004` embeddings)
- **Local Dev:** Strictly Native execution (Python virtualenv + Node/npm) — **No Docker**

## Documentation
- [Project Kickoff PRD v1.0](docs/ProofLens-AI-Project-Kickoff-PRD-v0.1.md)
- [Backend Software Requirements Specification (SRS v1.0)](docs/ProofLens-AI-Backend-SRS-v1.0.md)
- [Technical Design & Planning Prompt](docs/ProofLens-AI-Antigravity-TDD-Planning-Prompt.md)
