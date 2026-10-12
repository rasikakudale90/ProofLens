# ProofLens AI

## Project Kickoff Brief & Initial Product Requirements Document (PRD)

**Document ID:** PLAI-PRD-001\
**Version:** 1.0 --- Approved MVP Scope & Architecture Baseline\
**Status:** Approved baseline; ready for implementation planning\
**Project type:** College-presentable AI application / portfolio project\
**Target MVP timeline:** 2–3 days for working, deployed MVP\
**Primary backend:** Python + FastAPI + PyMuPDF\
**Proposed frontend:** Next.js + TypeScript + Tailwind CSS + shadcn/ui\
**Proposed database & storage:** Supabase PostgreSQL + pgvector + Supabase Storage\
**AI provider & models:** Google Gemini API (`gemini-2.5-flash` for generation, `text-embedding-004` for 768-dim embeddings)\
**Deployment targets:** Render Free Web Service (Backend) + Vercel Hobby (Frontend)\
**Local dev constraint:** Strictly Native execution (Python virtualenv + npm) — **No Docker**\
**Working product name:** ProofLens AI --- From Documents to Verifiable Answers

------------------------------------------------------------------------

## 1. Purpose of This Document

This is the first project artifact. It establishes the product problem,
target users, scope, expected behaviour, acceptance criteria, technical
direction, and implementation guardrails before coding begins.

It is intentionally an initial PRD, not a claim that every architecture
decision has been finalized. Antigravity must inspect the repository and
existing project context before proposing changes. It must not silently
invent requirements or begin a large implementation based only on this
document.

## 2. Product Summary

ProofLens AI helps a user investigate a collection of documents by
asking questions, receiving answers grounded in retrieved passages,
opening the supporting source locations, and comparing claims across
documents.

Its distinguishing feature is **evidence-first interaction**: answers
should expose the passages that support them, distinguish supported
claims from uncertain or unsupported claims, and avoid presenting a
generated answer as verified truth.

The product is not merely a PDF chatbot. It combines document ingestion,
semantic retrieval, source-linked answers, claim-level evidence review,
and cross-document comparison in one focused workspace.

## 3. Problem Statement

Students, researchers, and project teams often work with multiple
reports, papers, specifications, and other documents. Relevant facts are
scattered across files, keyword search can miss semantically related
passages, and ordinary AI summaries may provide claims that are
difficult to verify.

Users need a practical way to: - search across a defined collection of
documents by meaning; - ask questions and inspect the evidence behind
the answer; - identify when available documents do not adequately
support an answer; - compare what two or more documents say about the
same topic; and - reproduce and evaluate the system's behaviour using a
test set.

## 4. Goals and Non-Goals

### 4.1 Goals

1.  Deliver a polished, demonstrable web application suitable for a
    college presentation and portfolio.
2.  Ingest a manageable set of PDF documents and preserve document/page
    provenance.
3.  Retrieve relevant passages using embeddings and vector search.
4.  Generate answers grounded in retrieved evidence and show source
    citations.
5.  Communicate insufficient evidence and uncertainty rather than
    fabricating a confident answer.
6.  Compare claims or findings across selected documents and show
    supporting passages.
7.  Include a small, repeatable evaluation suite for retrieval and
    answer quality.
8.  Keep the backend modular so later projects can introduce
    orchestration frameworks, tool calling, agents, and workflow
    automation without requiring a rewrite.

### 4.2 Non-Goals for the First Release

-   Autonomous agents that execute arbitrary actions.
-   Multi-agent orchestration.
-   Fine-tuning or training a foundation model.
-   Guaranteed truth detection or a claim that AI verification is
    infallible.
-   Real-time web research or unrestricted internet browsing.
-   OCR for every possible scanned document format in the first
    milestone.
-   Enterprise SSO, complex billing, or multi-tenant SaaS billing.
-   Supporting every document type and language.
-   Replacing human review for academic, legal, medical, financial, or
    other high-stakes decisions.

## 5. Target Users and Primary Use Cases

### Primary users

-   College students preparing project reports or presentations.
-   Researchers reviewing a small collection of papers or reports.
-   Developers and project teams comparing technical documents.

### Core use cases

1.  Create a workspace and upload multiple supported PDF files.
2.  See ingestion status and any files that could not be processed.
3.  Ask a question across the selected document collection.
4.  Read a concise answer with citations to specific documents and page
    numbers.
5.  Open a cited passage and inspect the source text.
6.  Ask a question whose answer is absent and receive a clear
    insufficient-evidence response.
7.  Compare a topic or claim across two or more selected documents.
8.  Review a basic evaluation report using a fixed set of test
    questions.

## 6. Product Principles

-   **Evidence before confidence:** A fluent answer is not enough;
    supporting evidence must be inspectable.
-   **Visible provenance:** Preserve the source document and page number
    throughout parsing, chunking, retrieval, and response generation.
-   **Explicit uncertainty:** If the retrieved evidence is inadequate or
    conflicting, state that clearly.
-   **No fake verification:** A model-generated verification label is an
    estimate, not proof of truth.
-   **Secure by default:** Treat uploaded files and their contents as
    untrusted data; never expose secrets or allow document text to
    override system instructions.
-   **Simple first release:** Build and validate a narrow end-to-end
    flow before adding optional sophistication.
-   **Testable behaviour:** Important outcomes must be covered by
    automated tests and a repeatable evaluation dataset.

## 7. MVP Functional Requirements

### FR-01: Workspace and document library (Smart Document Library)

-   The user can create or select a workspace.
-   The user can upload multiple PDF files within configured size and
    count limits.
-   The system records file name, size, upload time, processing status,
    and a stable document identifier.
-   Duplicate uploads and failed ingestion must be handled predictably.
-   The UI must show processing, success, and failure states.
-   Support deletion of documents and their associated stored data (files, extracted pages, chunks, embeddings).

### FR-02: Document extraction and provenance

-   Extract text from supported PDFs using PyMuPDF.
-   Preserve page-level source information (1-based human-readable page numbers).
-   Detect empty or unsupported files and report a useful error.
-   Keep original file identity associated with extracted text and
    chunks.
-   Scanned PDFs may be reported as unsupported in the MVP unless OCR is
    explicitly approved as a later scope item.

### FR-03: Chunking and embeddings

-   Split extracted text into configurable chunks with configurable overlap.
-   Preserve document ID, page number, chunk index, and useful metadata
    for every chunk.
-   Generate embeddings through Google Gemini API (`text-embedding-004`, 768 dimensions).
-   Store vectors and metadata in PostgreSQL with pgvector.
-   Make chunking and embedding settings configurable rather than
    scattering constants through the code.

### FR-04: Semantic retrieval

-   Embed the user's query and retrieve relevant chunks from the
    selected workspace/document scope.
-   Return source metadata with every retrieved chunk (document ID/name, page number, chunk ID, excerpt).
-   Support a configurable retrieval count (`top_k`) and similarity threshold.
-   Keep retrieval logic separate from answer-generation logic so it can
    be tested independently.

### FR-05: Evidence-grounded question answering (Evidence-First AI Assistant)

-   Generate answers only from the retrieved evidence for
    document-specific questions.
-   Include citations that map to real document IDs and page numbers.
-   Do not allow the model to invent citation IDs, filenames, or page
    numbers.
-   If evidence is missing or weak, return a clear insufficient-evidence
    response rather than guessing.
-   Keep the retrieved passages available for debugging and evaluation,
    subject to safe logging rules.

### FR-06: Evidence inspection & Claim Evidence Ledger

-   Display cited document name, page number, and supporting excerpt.
-   Let the user inspect the passage used to support a claim and navigate to cited PDF pages.
-   Extract individual factual claims from an answer or investigation.
-   Associate claims with the evidence used to assess them.
-   Use four explicit statuses: `Supported`, `Partially Supported`, `Contradicted`, and `Insufficient Evidence`.
-   Validate server-side that cited passages actually exist and are relevant to the claim.
-   Present uncertainty and conflicting evidence transparently; do not equate model confidence with verified truth.

### FR-07: Contradiction Radar (Cross-document comparison)

-   Let the user select at least two documents and provide a topic or
    question to compare.
-   Retrieve evidence independently per document to avoid scope leakage.
-   Present findings per document, with validated citations for each finding.
-   Identify potential disagreements between extracted claims.
-   Account for differences in scope, dates, definitions, datasets, and methodologies where relevant.
-   Distinguish potential contradictions from established contradictions.
-   If the sources discuss different scopes or use incomparable definitions, flag the limitation rather than forcing a conclusion.

### FR-08: Research Brief Generator

-   Generate a structured research brief using evidence already retrieved or analyzed.
-   Include an executive summary, key findings, citations, conflicting findings, and limitations.
-   Preserve source references throughout the report.
-   Allow users to export the report as Markdown.
-   Support browser print-to-PDF as an optional lightweight export approach.

### FR-09: Trust & Evaluation Dashboard

-   Provide a compact evaluation interface or report.
-   Include a small, version-controlled test dataset of questions, expected source documents/pages or evidence, and expected answer characteristics.
-   Measure retrieval hit rate on the curated set.
-   Measure citation validity (proportion of citations resolving to real stored source locations).
-   Evaluate correct abstention on unsupported questions.
-   Record response latency and provider errors where available.
-   Clearly distinguish measured metrics from model-judged assessments; never display fabricated accuracy percentages or unmeasured results.
-   Make the evaluation repeatable from a documented command (CLI or protected API).

### FR-10: Operational behaviour

-   Validate request inputs and uploaded file types/sizes.
-   Provide useful API errors without leaking stack traces or secrets.
-   Apply request timeouts and bounded retries to external AI-provider
    calls.
-   Track latency and token/usage information where the provider makes
    it available.
-   Keep API keys in environment variables or a secret manager; never
    expose them to the browser or commit them.

## 8. Proposed User Journey

1.  User opens ProofLens AI and creates a workspace.
2.  User uploads two or more PDF reports.
3.  System validates the files and displays ingestion status.
4.  User asks a question about the collection.
5.  System retrieves candidate passages and generates an
    evidence-grounded response.
6.  UI displays the answer, citations, and supporting excerpts.
7.  User opens a citation to inspect its source.
8.  User compares the same topic across selected documents.
9.  User can run or view the curated evaluation results during a project
    demonstration.

## 9. Initial Architecture Direction

This section reflects the approved technology baseline for the 2–3 day MVP.
 
### Approved Technology Stack
 
| Layer | Approved Technology | Deployment / Environment |
|---|---|---|
| Development environment | Google Antigravity | Local Windows (Native execution, **No Docker**) |
| Frontend | Next.js + TypeScript | Vercel Hobby |
| Styling & UI | Tailwind CSS + shadcn/ui | Embedded in Next.js |
| Backend | Python + FastAPI + Pydantic | Render Free Web Service |
| PDF Extraction | PyMuPDF (`fitz`) | Embedded in FastAPI backend |
| AI Generation | Google Gemini API (`gemini-2.5-flash`) | Server-side direct SDK calls |
| Embeddings | Google Gemini API (`text-embedding-004`, 768 dims) | Server-side direct SDK calls |
| Database | Supabase PostgreSQL + `pgvector` | Cloud hosted (Supabase Free Tier) |
| File Storage | Supabase Storage (`prooflens-documents` bucket) | Cloud hosted (with local file adapter for offline tests) |
| Backend Testing | Pytest + HTTPX | Local native `pytest` |
 
### Local Development Architecture (Strictly No Docker)
 
-   **Native Local Execution:** The developer environment runs backend Python in a native virtual environment (`py -3.13 -m venv venv`) and frontend in Node.js (`npm run dev`).
-   **No Local Containers:** Database (`PostgreSQL + pgvector`) and file storage connect directly over TLS to the remote Supabase project, completely eliminating the need for local Docker containers or MinIO.
 
### AI pipeline
 
1.  Parse supported PDF with PyMuPDF.
2.  Extract page-aware text preserving 1-based page numbers.
3.  Chunk text into configurable windows (e.g. 500 tokens, 50-token overlap) and preserve provenance.
4.  Generate 768-dimensional embeddings using `text-embedding-004`.
5.  Retrieve relevant chunks for a query using pgvector cosine distance within workspace/document scope.
6.  Generate a structured Pydantic answer grounded in those chunks using `gemini-2.5-flash`.
7.  Validate citation references server-side against actual retrieved sources.
8.  Apply an evidence sufficiency/abstention policy (`status: "insufficient_evidence"`).
9.  Return answer, citations, supporting excerpts, and uncertainty/status metadata.
 
### Framework decision
 
-   The implementation uses direct Google GenAI SDK calls for clarity, speed, and reliability.
-   Do not introduce LangChain, LangGraph, agents, or MCP for the MVP.
-   No autonomous AI agent is required for the MVP.

## 10. Initial Data Model Candidates

Validate and refine these during architecture design: - `Workspace` -
`Document` - `DocumentPage` or equivalent page-aware extracted content -
`DocumentChunk` - `QueryRun` - `RetrievedEvidence` - `Answer` -
`Citation` - `ComparisonRun` - `EvaluationCase` - `EvaluationRun`

Do not implement every entity automatically. Choose the smallest data
model that supports the approved requirements and reliable provenance.

## 11. Non-Functional Requirements

### Security and privacy

-   Keep provider keys on the server only.
-   Validate file types, sizes, and request payloads.
-   Use parameterized database access.
-   Treat document text as untrusted input; defend against prompt
    injection contained in uploaded documents.
-   Do not execute instructions found inside source documents.
-   Avoid logging full document content or sensitive user data by
    default.
-   Define document deletion behaviour, including associated chunks and
    embeddings.
-   If authentication is included, enforce authorization server-side for
    every workspace/document operation.

### Reliability

-   Use bounded retries and timeouts for provider calls.
-   Handle partial ingestion failures and make processing state visible.
-   Avoid duplicate chunks/embeddings when ingestion is retried.
-   Keep long-running document processing from blocking ordinary API
    requests; start simply and introduce a background queue only if the
    approved file limits or measured processing time justify it.

### Maintainability

-   Clear module boundaries and typed schemas.
-   Centralized configuration.
-   Database migrations.
-   Unit tests for chunking, provenance, citation validation, and
    abstention logic.
-   Integration tests for ingestion, retrieval, and question answering.
-   A documented local setup and reproducible demo dataset.

### Performance

-   Set explicit limits for file size, number of files, chunk count, and
    retrieval count.
-   Measure latency before optimizing.
-   Do not claim a performance target until the expected environment and
    document sizes are specified.

### Accessibility and usability

-   Clear loading, empty, success, and error states.
-   Readable citation labels and keyboard-accessible controls.
-   Distinguish unsupported/uncertain answers from successful grounded
    answers visually and textually.

## 12. Acceptance Criteria for the MVP

The MVP is acceptable when all of the following are demonstrated:

1.  A user can upload multiple supported PDFs and see accurate
    processing status.
2.  Extracted chunks retain valid document and page provenance.
3.  A semantic query retrieves relevant passages from the correct
    workspace/document scope.
4.  A document-grounded answer cites only source locations that actually
    exist in the retrieved evidence.
5.  An unsupported test question produces an explicit
    insufficient-evidence response instead of an invented factual
    answer.
6.  A user can open a citation and inspect the supporting excerpt.
7.  A comparison between two documents presents per-document evidence
    and does not invent a contradiction.
8.  Automated tests cover the core ingestion, retrieval, citation, and
    abstention paths.
9.  The curated evaluation command runs reproducibly and reports its
    limitations.
10. Setup instructions allow another developer to run the project
    without undocumented manual steps.
11. Secrets are not committed to source control or returned to the
    frontend.
12. The application can be demonstrated end-to-end with a prepared
    sample document set.

## 13. Risks and Mitigations

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Incorrect or invented citations     Validate citation IDs against
                                      retrieved chunks; derive
                                      document/page metadata server-side.

  Relevant evidence is not retrieved  Curate retrieval tests; tune
                                      chunking, top-k, metadata filters,
                                      and reranking only when justified.

  Model claims are unsupported        Use an explicit abstention policy
                                      and evidence-based tests; present
                                      verification as fallible.

  Prompt injection in documents       Treat retrieved text as untrusted
                                      data, isolate instructions,
                                      restrict tools, and test
                                      adversarial samples.

  Large PDFs cause slow requests      Limit inputs, expose status, and
                                      add background processing only when
                                      needed.

  Provider API limits or outages      Timeouts, bounded retries, clear
                                      errors, and configurable provider
                                      settings.

  Scope becomes too large             Keep agents, OCR, web search,
                                      multi-agent systems, and enterprise
                                      features out of the MVP.
  -----------------------------------------------------------------------

## 14. Suggested Delivery Milestones

### Milestone 0 --- Repository and architecture discovery

-   Inspect repository, existing files, Git status, runtime versions,
    and any existing implementation.
-   Identify the current stack and conflicts with this brief.
-   Return a concise findings report and proposed file/module plan.
-   No code edits until findings and plan are reviewed.

### Milestone 1 --- Project skeleton and health checks

-   FastAPI app, configuration, health endpoint, lint/type/test setup,
    and documented environment variables.
-   Verify a clean local start.

### Milestone 2 --- Document ingestion and provenance

-   Upload validation, PDF parsing, page-aware extraction, storage
    metadata, and ingestion tests.

### Milestone 3 --- Embeddings and retrieval

-   Chunking, embedding integration, pgvector persistence, semantic
    search endpoint, and retrieval evaluation.

### Milestone 4 --- Grounded Q&A and citations

-   Answer schema, evidence assembly, citation validation, abstention
    behaviour, and tests.

### Milestone 5 --- Comparison and UI

-   Cross-document comparison, source inspection, loading/error states,
    and the Next.js interface.

### Milestone 6 --- Evaluation, security, and demo readiness

-   Curated evaluation set, prompt-injection tests, deletion checks,
    documentation, Docker, and deployment readiness.

Milestones may be adjusted after repository discovery. Do not create all
milestones' code in one large generation step.

## 15. Antigravity Operating Instructions

Antigravity must follow these rules:

1.  **Inspect before editing.** Read repository instructions such as
    `AGENTS.md`, README, existing project-status/handoff documents,
    package manifests, configuration, and Git status.
2.  Identify the actual repository root and active branch. Do not assume
    a path or branch.
3.  Preserve unrelated user changes. Do not reset, clean, overwrite, or
    discard work.
4.  If an implementation already exists, audit it before proposing
    duplicate components or replacing architecture.
5.  Compare the existing state with this PRD and report conflicts, gaps,
    and unknowns.
6.  Begin in read-only discovery mode. Do not edit code during Milestone
    0.
7.  Produce a concise discovery report containing:
    -   repository and branch state;
    -   existing implementation and reusable components;
    -   confirmed runtime/dependency versions;
    -   architecture proposal and key decisions;
    -   gaps or ambiguities requiring a decision;
    -   a focused implementation plan with files expected to change;
    -   validation commands for the first milestone.
8.  Do not add a new framework or infrastructure dependency without
    explaining its concrete need.
9.  Do not implement agents, LangGraph, MCP, OCR, web browsing, or
    multi-agent orchestration in the MVP unless the owner explicitly
    approves a scope change.
10. Do not claim a test passed unless the command was actually run and
    its result inspected.
11. Do not commit, push, deploy, delete data, or change external
    services without explicit authorization.
12. After the discovery report, stop and request approval before
    starting Milestone 1.

## 16. Confirmed Project Decisions & Deferred Features

### 16.1 Confirmed Decisions
-   **AI Models:** Google Gemini API — `gemini-2.5-flash` for generation/structured outputs and `text-embedding-004` (768 dimensions) for embeddings.
-   **Database & Vector Engine:** Supabase PostgreSQL with `pgvector` extension enabled on the free tier.
-   **Storage Backend:** Supabase Storage (`prooflens-documents` bucket) for hosted PDF persistence, with a local filesystem storage adapter for offline testing.
-   **Local Development Environment:** Strictly Native execution via Python venv and npm. **No Docker** required locally.
-   **Hosting & Deployment:** Render Free Web Service for FastAPI backend; Vercel Hobby for Next.js frontend.
-   **User Workspace Model:** Single-user demo workspace (OAuth/SSO/multi-tenant auth excluded from MVP).
-   **PDF Ingestion:** Text-based PDFs supported via PyMuPDF. Scanned PDFs/OCR deferred.
-   **Architecture Paradigm:** Direct provider SDK RAG pipeline; strictly no LangChain, LangGraph, agents, or MCP.

### 16.2 Explicitly Deferred Enhancements (Post-MVP)
The following features are approved as non-goals for the initial MVP to guarantee delivery within the 2–3 day window:
-   Evidence Graph Explorer (visual graph navigation of citations).
-   OCR for scanned/image-only PDFs (reject with clear error in MVP).
-   Web research / real-time internet search.
-   Document version intelligence (diffing multiple revisions of the same report).
-   Advanced table and numerical extraction/analysis.
-   Multi-user accounts, collaboration, and role-based access control.
-   Automatic claim re-verification upon new document addition.
-   Multilingual document analysis.
-   Autonomous or multi-agent workflows.

## 17. Definition of Done for the First Step

The first step is complete when Antigravity has: - inspected the
repository and its governing instructions without editing; - reported
the existing state accurately; - mapped the approved PRD to the current
repository; - listed unresolved decisions and proposed defaults; -
provided a small, testable first implementation plan.

**Do not start coding until this discovery report is reviewed and
approved.**

------------------------------------------------------------------------

## Short Project Pitch

ProofLens AI is an evidence-first document intelligence platform that
lets users ask questions across multiple documents, inspect page-level
supporting evidence, compare claims between sources, and see when the
available material is insufficient to support an answer. Its focus is
not merely generating fluent text, but making AI-generated answers more
traceable, testable, and transparent.
