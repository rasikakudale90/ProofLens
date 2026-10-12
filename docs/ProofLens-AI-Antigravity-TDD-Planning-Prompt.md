# ProofLens AI — Technical Design and Implementation Planning

## 1. Project Context

We are starting **ProofLens AI** from scratch in an empty project folder.

The existing project requirements are documented in:

`ProofLens-AI-Project-Kickoff-PRD-v0.1.md`

Read the entire PRD before making any decisions. Treat it as the baseline source of truth for the original project requirements.

Also apply the approved product decisions in this prompt. If an approved decision changes or extends the original PRD, document that distinction explicitly rather than silently rewriting the original requirements.

## 2. Current Objective

Prepare an implementation-ready Technical Design Document (TDD) and a phased implementation plan.

**This is a documentation-only stage. Do not start implementing the application.**

The project has a target of **2–3 days for the first working, deployed MVP**. The architecture, implementation sequence, dependencies, and acceptance criteria must reflect this constraint.

The product must be suitable for development in Google Antigravity and deployment using eligible free-tier services wherever feasible.

## 3. Product Vision

ProofLens AI is an evidence-first document intelligence platform that helps users investigate multiple PDF documents, obtain evidence-grounded answers, inspect supporting passages, evaluate individual claims, identify potential contradictions, and generate verifiable research briefs.

Its central principle is:

**Evidence before confidence. Answers must be traceable to source documents, and insufficient evidence must be communicated explicitly.**

The application must not claim that an AI-generated verification status proves objective truth.

## 4. Approved MVP Scope

The MVP has exactly six major product features.

### Feature 1 — Smart Document Library
- Upload and manage multiple supported PDF documents.
- Display document metadata and ingestion status.
- Validate uploads and handle processing failures.
- Preserve document identity and page-level provenance.
- Allow users to select documents for an investigation.
- Support deletion of documents and their associated stored data.

### Feature 2 — Evidence-First AI Assistant
- Answer questions across selected documents using Retrieval-Augmented Generation (RAG).
- Retrieve semantically relevant passages.
- Provide concise answers with valid document and page citations.
- Allow users to inspect supporting excerpts and navigate to cited PDF pages.
- Abstain when available evidence is insufficient.
- Clearly distinguish source evidence from AI-generated interpretation.

### Feature 3 — Claim Evidence Ledger
- Extract individual factual claims from an answer or investigation.
- Associate claims with the evidence used to assess them.
- Use these statuses: Supported, Partially Supported, Contradicted, and Insufficient Evidence.
- Validate that cited passages actually exist and are relevant to the claim.
- Present uncertainty and conflicting evidence transparently.
- Do not equate model confidence with verified truth.

### Feature 4 — Contradiction Radar
- Compare at least two selected documents on a user-specified topic.
- Identify potential disagreements between extracted claims.
- Present the relevant passages and citations from both sources.
- Account for differences in scope, dates, definitions, datasets, and methodologies where relevant.
- Distinguish potential contradictions from established contradictions.
- Avoid forcing a conclusion when evidence is incomparable or insufficient.

### Feature 5 — Research Brief Generator
- Generate a structured research brief using evidence already retrieved or analyzed.
- Include an executive summary, key findings, citations, conflicting findings, and limitations.
- Preserve source references throughout the report.
- Allow users to export the report as Markdown.
- Use browser print-to-PDF as an optional lightweight export approach.

### Feature 6 — Trust & Evaluation Dashboard
- Provide a compact evaluation interface or report.
- Measure retrieval hit rate on a curated test dataset.
- Measure citation validity.
- Evaluate correct abstention on unsupported questions.
- Record response latency and provider errors where available.
- Clearly distinguish measured metrics from model-judged assessments.
- Never display fabricated accuracy percentages or unmeasured results.

The six features must share a common document-ingestion, retrieval, evidence, and citation pipeline. Do not implement six unrelated subsystems.

## 5. Approved Technology Direction

Use the following stack as the preferred architecture.

| Layer | Technology |
|---|---|
| Development environment | Google Antigravity |
| Frontend | Next.js + TypeScript |
| Styling | Tailwind CSS |
| UI components | shadcn/ui where useful |
| Backend | Python + FastAPI |
| Request/response validation | Pydantic |
| PDF text extraction | PyMuPDF |
| AI generation | Google Gemini API |
| Embeddings | A currently supported, compatible Gemini embedding model |
| Database | Supabase PostgreSQL |
| Vector search | PostgreSQL with the pgvector extension |
| File storage | Supabase Storage |
| Frontend deployment | Vercel Hobby, subject to applicable restrictions |
| Backend deployment | Render Free Web Service, subject to current limitations |
| Backend testing | Pytest and HTTPX |
| Version control | Git and GitHub |

### Technology guardrails

- Use a custom Python RAG pipeline with direct provider API calls.
- Do not introduce LangChain, LangGraph, MCP, autonomous agents, or multi-agent orchestration.
- Do not add Redis, a separate vector database, a dedicated message broker, or a distributed processing system without a demonstrated need.
- Do not introduce paid services as mandatory dependencies for the MVP.
- Prefer simple, typed interfaces and modular backend components.
- Keep provider-specific logic behind small interfaces where this materially improves maintainability.
- Verify that the selected Gemini generation and embedding models are currently available and suitable for the chosen API.
- Confirm Supabase pgvector compatibility and the actual storage requirements before finalizing the schema.
- Verify current official free-tier quotas, deployment restrictions, data-use terms, and persistence behavior before committing to hosting assumptions.
- If a proposed service or feature cannot reasonably operate within the free-tier constraints, document the limitation and recommend a practical alternative.

Do not claim that a service is free, compatible, or available without sufficient verification. Separate confirmed facts from assumptions.

## 6. MVP Constraints and Defaults

Use these defaults unless the PRD or repository provides a compelling reason to change them.

- Support text-based PDFs first.
- Defer OCR for scanned PDFs.
- Use one configured LLM provider and one compatible embedding model initially.
- Use configurable limits for upload size, document count, chunk size, retrieval count, and AI output length.
- Preserve page numbers and stable source identifiers throughout the pipeline.
- Use Supabase Storage for persistent PDF storage rather than relying on ephemeral backend disk storage.
- Use PostgreSQL and pgvector for application records, chunks, embeddings, and retrieval.
- Prefer a private, single-user demonstration workspace unless authentication is required by the existing project context.
- Do not implement Google OAuth, multi-tenant collaboration, or complex role-based access unless explicitly justified.
- Make API keys and secrets server-side only.
- Keep the first deployment small, testable, and demonstrable.

Do not invent exact production performance targets without a defined environment and workload.

## 7. Required Deliverable A — Technical Design Document

Create:

`docs/TECHNICAL-DESIGN.md`

The document must contain the following sections.

### 7.1 Executive Summary
Explain the product, architecture, core differentiator, MVP boundaries, and major design decisions.

### 7.2 Requirements and Scope
- Map the original PRD requirements to the six approved MVP features.
- Separate original requirements, approved scope additions, assumptions, and deferred enhancements.
- Identify unresolved decisions and recommend practical defaults.

### 7.3 System Architecture
Describe the frontend, FastAPI backend, Supabase PostgreSQL, pgvector, file storage, and Gemini API.

Include a Mermaid component diagram and a Mermaid end-to-end data-flow diagram.

Explain each component's responsibilities and interactions.

### 7.4 Backend Structure
Propose a concrete Python package and folder structure, including modules for:
- API routes
- Configuration
- Request and response schemas
- Database access and migrations
- Document ingestion and PDF extraction
- Chunking and embeddings
- Retrieval and ranking
- RAG answer generation
- Citation validation
- Evidence sufficiency and abstention
- Claim analysis
- Cross-document comparison
- Research brief generation
- Evaluation
- Logging and error handling
- Unit and integration tests

Define module boundaries and responsibilities. Avoid unnecessary abstraction.

### 7.5 Frontend Structure
Propose a concrete Next.js App Router structure with responsibilities for:
- Main workspace and document library
- PDF upload and ingestion status
- Question-and-answer workspace
- PDF viewer and citation navigation
- Claim Evidence Ledger
- Contradiction Radar
- Research Brief Generator
- Evaluation Dashboard
- Shared UI components
- API client and typed response models
- Loading, empty, error, and insufficient-evidence states

Ensure the interface is responsive and practical to implement within the deadline.

### 7.6 Database Design
Define the minimum viable relational schema, including appropriate fields, primary keys, foreign keys, indexes, and relationships.

Evaluate the need for these entities:
- Workspace
- Document
- DocumentPage or equivalent page-aware content representation
- DocumentChunk
- QueryRun
- RetrievedEvidence
- Answer
- Citation
- Claim
- ComparisonRun
- ResearchBrief
- EvaluationCase
- EvaluationRun

Do not create every entity automatically. Choose the smallest schema that supports the approved features.

Specify:
- Which fields contain source provenance.
- How vector embeddings are stored using pgvector.
- The selected embedding dimensions and compatibility assumptions.
- Vector and metadata indexes.
- Unique constraints and idempotent ingestion behavior.
- Document deletion and associated data cleanup.
- Supabase Storage references.
- Required database migrations and extension setup.

Keep uploaded PDF bytes in file storage rather than PostgreSQL unless there is a specific reason otherwise.

### 7.7 API Contracts
Define the MVP endpoints, HTTP methods, request schemas, response schemas, validation rules, and expected error responses.

Cover:
- Workspace and document operations
- Upload and ingestion status
- Document selection
- Question answering
- Evidence inspection
- Claim analysis
- Cross-document comparison
- Research brief creation and export
- Evaluation results
- Health and readiness checks

Provide representative JSON examples for the most important endpoints.

Explain how citation references are validated and how errors are represented. Avoid vague endpoints that have no defined request or response contract.

### 7.8 Document Processing and RAG Pipeline
Specify the end-to-end sequence:

1. Validate uploaded PDFs.
2. Store the original file persistently.
3. Extract text with page-level provenance.
4. Detect empty, unsupported, or unreadable documents.
5. Chunk extracted text with configurable parameters.
6. Generate embeddings.
7. Store chunks, metadata, and vectors.
8. Embed user questions using the compatible embedding model.
9. Retrieve evidence within the authorized workspace and selected-document scope.
10. Generate a structured answer grounded in the retrieved evidence.
11. Validate citations against real retrieved evidence and source metadata.
12. Evaluate evidence sufficiency and abstain when necessary.
13. Return the answer, citations, excerpts, and status metadata.

Discuss retrieval configuration, metadata filtering, chunk overlap, ranking, and optional reranking. Keep reranking optional unless justified by measured retrieval quality.

Define how Claim Evidence Ledger and Contradiction Radar reuse this pipeline.

### 7.9 AI and Evidence Reliability
Define:
- Structured model output and schema validation.
- Citation integrity checks.
- Evidence-to-claim association.
- Treatment of partial support and conflicting sources.
- Insufficient-evidence behavior.
- Handling of prompt injection within document text.
- Separation of untrusted source content from system instructions.
- Safe fallback behavior when the AI provider fails or exceeds its quota.

Do not treat an LLM-generated verification label as ground truth.

### 7.10 Configuration and Secrets
Specify required environment variables for the frontend, backend, database, storage, and AI provider.

Provide `.env.example` variable names only, not real credentials.

Explain server-side secret handling, configuration validation, CORS, timeouts, bounded retries, and safe logging.

### 7.11 Security and Privacy
Cover:
- File type and size validation.
- Authorization for document and workspace operations.
- Safe handling of untrusted PDF content.
- Parameterized database access.
- API key protection.
- Data deletion.
- Avoidance of unnecessary document-content logging.
- Error responses that do not expose secrets or stack traces.

### 7.12 Error Handling and Observability
Define consistent API errors, ingestion failures, provider timeouts, quota exhaustion, request IDs, latency tracking, and safe diagnostic logging.

Avoid a complex observability stack.

### 7.13 Testing Strategy
Define unit, integration, API, and browser testing responsibilities.

Include tests for:
- Page provenance
- Chunking and embedding compatibility
- Retrieval scope
- Citation validation
- Unsupported questions
- Prompt injection
- Claim classification
- Contradiction handling
- Deletion and cleanup
- Provider errors
- Research brief citations
- Deployment readiness

Describe the repeatable AI evaluation dataset and its expected evidence, questions, and outcomes.

### 7.14 Local Development and Docker
Specify a reproducible local setup.

Recommend a minimal Docker strategy where useful, such as a backend Dockerfile and an optional local PostgreSQL/pgvector setup.

Do not require Docker for every development task if it adds unnecessary setup time.

Explain how local development connects to Supabase and how migrations are applied.

Do not create Docker files during this documentation stage.

### 7.15 Deployment Architecture
Document the proposed Vercel frontend, Render backend, Supabase database/storage, and Gemini API integration.

Identify:
- Required environment variables
- Database migration sequence
- Persistent storage requirements
- Cold-start implications
- CORS and origin configuration
- Health checks
- Provider quota risks
- Free-tier limitations
- Live deployment smoke tests

Keep free-tier eligibility and service limits explicitly marked as items to verify before deployment.

### 7.16 Architecture Decisions and Deferred Features
Record the major decisions and their rationale.

Separate essential MVP features from future enhancements such as:
- Evidence Graph Explorer
- OCR for scanned PDFs
- Web research
- Document version intelligence
- Advanced table and numerical analysis
- Collaboration and multi-user authentication
- Automatic claim re-verification
- Multilingual analysis
- Autonomous or multi-agent workflows

These enhancements must not expand the initial implementation scope.

## 8. Required Deliverable B — Implementation Plan

Create:

`docs/IMPLEMENTATION-PLAN.md`

The plan must be realistic for a 2–3 day MVP build and deployment.

### 8.1 Delivery Strategy
Explain the dependency-first approach and how to avoid building features before the shared evidence pipeline works.

### 8.2 Phased Implementation
Use these phases:

**Phase 0 — Repository and Environment Readiness**
- Confirm the project root and existing instructions.
- Validate the selected stack and service availability.
- Record assumptions and required environment variables.
- Confirm that no existing work will be overwritten.

**Phase 1 — Application Foundation**
- Establish frontend and backend structure.
- Configure application settings, database access, migrations, and health checks.
- Establish typed API contracts and basic tests.

**Phase 2 — Document Ingestion and Retrieval**
- Implement PDF upload and persistent storage.
- Extract page-aware text and create chunks.
- Generate and store embeddings.
- Implement semantic retrieval and retrieval tests.

**Phase 3 — Evidence-First Q&A**
- Generate structured, grounded answers.
- Validate citations and source references.
- Implement evidence insufficiency handling.
- Build the core question-and-answer interface and source inspection.

**Phase 4 — Signature Features**
- Implement Claim Evidence Ledger.
- Implement Contradiction Radar.
- Reuse existing retrieval and citation logic.
- Test claim support, conflicts, and uncertainty handling.

**Phase 5 — Research Output and Evaluation**
- Implement the Research Brief Generator and Markdown export.
- Create the curated evaluation dataset and repeatable evaluation command.
- Present actual results in the evaluation interface.

**Phase 6 — Deployment and Hardening**
- Deploy frontend and backend.
- Configure Supabase, storage, and environment variables.
- Run end-to-end smoke tests.
- Verify persistence, security, provider failures, and deployment limitations.
- Document the working demo and known issues.

### 8.3 Phase Dependencies
Include a Mermaid dependency diagram that shows which phases must finish before later phases can begin.

### 8.4 Acceptance Criteria
Provide objective, testable acceptance criteria for each phase.

A phase must not be considered complete merely because files were generated. Completion requires working behavior and appropriate validation.

### 8.5 Day-by-Day Schedule
Provide a practical schedule for:
- Day 1: Foundation, ingestion, retrieval, and basic grounded Q&A.
- Day 2: Claim Evidence Ledger, Contradiction Radar, UI polish, and tests.
- Day 3: Research export, evaluation, deployment, and hardening.

Explain how to prioritize if time is running short. Working RAG, the two signature features, and a functioning deployment take precedence over optional polish.

### 8.6 Risks and Mitigations
Address:
- Gemini API quotas or model unavailability.
- Free-tier service limitations.
- Backend cold starts.
- Database and storage capacity.
- Incorrect or invented citations.
- Weak retrieval.
- Prompt injection.
- Time overruns.
- Deployment failures.

### 8.7 Final Definition of Done
Define the minimum conditions required to call the MVP deployed and demonstrable.

Do not claim completion until the relevant functionality and tests have actually been verified.

## 9. Documentation Quality Requirements

Both documents must:
- Be written in clear, professional English.
- Be consistent with each other and the original PRD.
- Use concrete folder trees, table schemas, endpoint definitions, and testable acceptance criteria.
- Distinguish decisions, assumptions, recommendations, and unresolved questions.
- Avoid unnecessary infrastructure, speculative complexity, and vague implementation instructions.
- Explain why each significant technology or architectural choice is appropriate for the deadline and free-tier constraints.
- Be detailed enough for a coding agent to implement the approved plan without inventing missing requirements.

If a decision is genuinely unresolved, recommend a conservative default and explain the trade-off.

## 10. Strict Execution Rules

This stage is documentation-only.

1. Read the complete `ProofLens-AI-Project-Kickoff-PRD-v0.1.md` before writing the documents.
2. Inspect the empty project folder and identify any existing files or instructions.
3. Create only these two files:
   - `docs/TECHNICAL-DESIGN.md`
   - `docs/IMPLEMENTATION-PLAN.md`
4. Creating the `docs` directory is permitted.
5. Do not create application source code, package manifests, configuration files, migrations, tests, Docker files, or deployment files.
6. Do not install dependencies.
7. Do not initialize Git or change repository state.
8. Do not deploy the application or modify external services.
9. Do not create additional documentation files.
10. Do not overwrite unrelated existing files. If either target file already exists, inspect it and report the situation before replacing it.
11. Do not invent credentials, test results, verified service limits, or implementation outcomes.
12. Do not begin implementation after creating the documents.

## 11. Required Final Response

After both documents have been created successfully:

1. Summarize the architecture and key technology decisions.
2. List the six included MVP features.
3. Summarize the phased implementation plan and 2–3 day schedule.
4. Highlight unresolved decisions and free-tier risks.
5. Confirm exactly which two documentation files were created.
6. State explicitly that no application code, dependencies, Git initialization, or deployment actions were performed.

**STOP after presenting the summary and wait for the project owner's review and approval before any implementation begins.**
