# ProofLens AI — Project Progress & Memory Log

**Last Updated:** October 14, 2026  
**Primary Auditor & Owner:** Rasika Babe (Rasika Kudale)  
**Repository:** `rasikakudale90/ProofLens`  
**Branch:** `main`

---

## 1. System Architecture & Environment Constraints

- **Native Local Execution (No Docker)**: PostgreSQL and Python running locally on Windows.
- **Port Allocations**:
  - **Frontend (Next.js 16.4 / React 19)**: Port `3001` (`http://localhost:3001`) — *Port 3000 is reserved for user's Elanor project*.
  - **Backend (FastAPI / Uvicorn)**: Port `8000` (`http://127.0.0.1:8000`).
  - **PostgreSQL Database**: `postgresql://postgres:postgres@localhost:5432/prooflens`.
- **Database Schema & Migrations**: Auto-migrated on application startup via `backend/app/db/init_db.py`.

---

## 2. Completed Capabilities & Features

### A. Strict Authentication for Every User
- **JWT & Password Security**:
  - Implemented `bcrypt` password hashing (`backend/app/core/security.py`).
  - Implemented PyJWT token encoding/decoding (`HS256`, 7-day expiration).
  - Created auth API routes (`backend/app/api/routes/auth.py`):
    - `POST /api/v1/auth/register`: Create user with hashed password and return access token.
    - `POST /api/v1/auth/login`: Authenticate email + password and return access token.
    - `GET /api/v1/auth/me`: Authenticated profile endpoint with `Authorization: Bearer <token>`.
    - `POST /api/v1/auth/logout`: Server-acknowledged logout.
- **Mandatory Authentication Gate (`frontend/src/app/page.tsx`)**:
  - Unauthenticated access is blocked. If no valid JWT token is stored in `localStorage`, the dashboard is completely gated.
  - Dedicated **Authentication Portal** with tabs for **Sign In** and **Create Account**.
  - Show/Hide password toggle, error messaging, and form validation.
  - Automatic injection of `Authorization: Bearer <token>` on all requests via `frontend/src/lib/api.ts`.
  - Sign-out clears tokens, resets session state, and redirects immediately to the login portal.

### B. Multiuser System & Identity Management
- **Pre-Seeded Auditor Profiles (Default Password: `password123`)**:
  - **Rasika Kudale** (`rasika@prooflens.ai`, *Lead Forensic Auditor*) — Avatar `#6366f1`
  - **Alex Vance** (`alex@prooflens.ai`, *Senior Research Analyst*) — Avatar `#06b6d4`
  - **Devin Hayes** (`devin@prooflens.ai`, *Compliance Officer*) — Avatar `#10b981`
- **One-Click Team Logins**:
  - Quick demo login buttons integrated into the Auth Modal for instant credential verification during testing.
- **User Interface Identity**:
  - **Top Header**: Prominently displays the active user's initials, name, role badge, account switch trigger, and sign-out button.
  - **Sidebar User Switcher**: Displays active profiles, team member count, and switching triggers.
  - **Credential-Gated Switching**: Switching profiles opens the authentication modal with the target email pre-filled to prevent unauthorized impersonation.
  - **Add Team Member**: Form includes an explicit password field (defaults to `password123`) so new accounts can log in independently.

### C. Persistent Evidence Assistant Conversations
- **Database Models (`backend/app/db/models.py`)**:
  - `Conversation`: Tracks `id`, `workspace_id`, `user_id`, `title`, `created_at`, `updated_at`.
  - `ConversationMessage`: Stores role (`user` vs `assistant`), content, verified citations, limitations, and timestamps.
- **CRUD Endpoints (`backend/app/api/routes/conversations.py`)**:
  - `GET /api/v1/workspaces/{id}/conversations`: Lists conversations with message counts and previews.
  - `POST /api/v1/workspaces/{id}/conversations`: Initiates a new thread.
  - `GET /api/v1/workspaces/{id}/conversations/{id}`: Retrieves complete thread history with citations.
  - `PATCH /api/v1/workspaces/{id}/conversations/{id}`: Renames thread.
  - `DELETE /api/v1/workspaces/{id}/conversations/{id}`: Deletes thread.
- **Frontend Conversation History (`frontend/src/components/evidence-assistant.tsx`)**:
  - Collapsible **Past Conversations** sidebar.
  - `+ New Chat` action.
  - Active conversation indicator and thread selection.
  - Server-validated citations and evidentiary quotes preserved when revisiting older discussions.
  - Full grounding verification with explicit abstention when evidence is insufficient.

### D. Core Signature Modules
1. **Document Library**: PDF extraction via PyMuPDF/fitz, page-level chunking, and metadata extraction.
2. **Claim Evidence Ledger**: Four-tier claim assessment (`supported`, `partially_supported`, `contradicted`, `insufficient_evidence`).
3. **Contradiction Radar**: Multi-document cross-comparison to detect data discrepancies, shifts in scope, or timeline divergence.
4. **Research Brief Generator**: Synthesizes verified findings with citation matrices and one-click Markdown download.
5. **Trust & Evaluation Dashboard**: Audits retrieval hit rate, citation validity rate, abstention accuracy, and P95 latency.

---

## 3. Verification & Test Results

- **Backend Pytest Suite**: 24/24 tests passed (`backend/venv/Scripts/pytest -v`).
  - Unit tests: PDF parsing, chunking, storage, health endpoints.
  - Integration tests: Grounded Q&A, citation validation, abstention, multiuser management, conversation persistence.
- **End-to-End Suite**: 12/12 stages passed (`backend/scripts/e2e_verification.py`).
- **Frontend Turbopack Build**: Next.js 16.4 production build completed with 0 errors (`npm run build`).

---

## 4. Production Cloud Deployment Configuration

### Target Architecture:
- **Database & Storage**: **Supabase**
  - PostgreSQL with `pgvector` enabled (`CREATE EXTENSION IF NOT EXISTS vector;`).
  - Storage Bucket: `prooflens-documents` (private, managed via Supabase Service Role).
  - Setup script created: `supabase_setup.sql`.
- **Backend Service**: **Render**
  - Python Web Service configured via `render.yaml` root Blueprint and `backend/runtime.txt` (Python 3.11.9).
  - Native health checks at `/health`.
  - Auto-normalizes Supabase `DATABASE_URL` (direct & session pooler) to `postgresql+psycopg://`.
  - CORS supports all Vercel domains via `allow_origin_regex=r"^https:\/\/.*\.vercel\.app$"` alongside explicit origin lists.
- **Frontend Application**: **Vercel**
  - Next.js 16.4 deployed with Root Directory: `frontend`.
  - `NEXT_PUBLIC_API_URL` environment variable pointing to the Render backend URL.
  - Pre-configured `frontend/vercel.json` and `frontend/.env.example`.

---

## 5. How to Resume Locally

### Start Backend Server:
```powershell
cd e:\ProofLens\backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Start Frontend Server:
```powershell
cd e:\ProofLens\frontend
npm run dev -- -p 3001
```

### Log In to ProofLens:
- Open: `http://localhost:3001`
- Select **Rasika Kudale** (or enter `rasika@prooflens.ai` / `password123`)
- All past chats, workspaces, documents, and audit ledgers will load automatically.

---

## 6. Next Planned Actions
- [x] Configure cloud deployment architecture (Supabase + Render + Vercel).
- [ ] Connect Supabase instance and run `supabase_setup.sql`.
- [ ] Deploy backend on Render using root `render.yaml`.
- [ ] Deploy frontend on Vercel with `NEXT_PUBLIC_API_URL`.
