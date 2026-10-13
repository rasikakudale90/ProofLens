import {
  Workspace,
  DocumentItem,
  DocumentUploadResponse,
  RetrievedEvidenceItem,
  GroundedAnswerResponse,
  ClaimAssessmentResponse,
  ContradictionResponse,
  ResearchBriefResponse,
  EvaluationSummaryResponse,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

class ApiClient {
  private base = API_BASE_URL;

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.base}${endpoint}`;
    const headers = {
      ...(options?.headers || {}),
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errMsg = `API error ${res.status}: ${res.statusText}`;
      try {
        const errorData = await res.json();
        errMsg = errorData.detail?.message || errorData.detail || errorData.message || errMsg;
      } catch {
        // fallback to status text
      }
      throw new Error(errMsg);
    }

    // Handle 204 or empty responses
    if (res.status === 204) {
      return {} as T;
    }

    return res.json();
  }

  // Health
  async getHealth(): Promise<{ status: string; app: string }> {
    return this.request("/health");
  }

  async getReady(): Promise<{ status: string; dependencies: Record<string, string> }> {
    return this.request("/ready");
  }

  // Workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    return this.request("/api/v1/workspaces");
  }

  async createWorkspace(name: string): Promise<Workspace> {
    return this.request("/api/v1/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  }

  async deleteWorkspace(workspaceId: string): Promise<{ message: string }> {
    return this.request(`/api/v1/workspaces/${workspaceId}`, {
      method: "DELETE",
    });
  }

  // Documents
  async getDocuments(workspaceId: string): Promise<DocumentItem[]> {
    return this.request(`/api/v1/workspaces/${workspaceId}/documents`);
  }

  async uploadDocument(workspaceId: string, file: File): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const url = `${this.base}/api/v1/workspaces/${workspaceId}/documents`;
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      let errMsg = `Upload failed with status ${res.status}`;
      try {
        const err = await res.json();
        errMsg = err.detail?.message || err.detail || errMsg;
      } catch {
        // use fallback
      }
      throw new Error(errMsg);
    }

    return res.json();
  }

  async deleteDocument(workspaceId: string, documentId: string): Promise<{ message: string }> {
    return this.request(`/api/v1/workspaces/${workspaceId}/documents/${documentId}`, {
      method: "DELETE",
    });
  }

  // Grounded Q&A Assistant
  async askQuestion(
    workspaceId: string,
    question: string,
    documentIds?: string[]
  ): Promise<GroundedAnswerResponse> {
    return this.request(`/api/v1/workspaces/${workspaceId}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        document_ids: documentIds && documentIds.length > 0 ? documentIds : undefined,
      }),
    });
  }

  // Scoped Vector Retrieval
  async retrieveEvidence(
    workspaceId: string,
    question: string,
    documentIds?: string[],
    topK: number = 5
  ): Promise<{ query: string; results: RetrievedEvidenceItem[] }> {
    return this.request(`/api/v1/workspaces/${workspaceId}/retrieve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        document_ids: documentIds && documentIds.length > 0 ? documentIds : undefined,
        top_k: topK,
      }),
    });
  }

  // Claim Evidence Ledger
  async assessClaims(
    workspaceId: string,
    claims: string[],
    documentIds?: string[]
  ): Promise<ClaimAssessmentResponse> {
    return this.request(`/api/v1/workspaces/${workspaceId}/claims/assess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        claims,
        document_ids: documentIds && documentIds.length > 0 ? documentIds : undefined,
      }),
    });
  }

  // Contradiction Radar
  async compareDocuments(
    workspaceId: string,
    documentIds: string[],
    topic: string
  ): Promise<ContradictionResponse> {
    return this.request(`/api/v1/workspaces/${workspaceId}/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document_ids: documentIds,
        topic,
      }),
    });
  }

  // Research Briefs
  async generateBrief(
    workspaceId: string,
    topic: string,
    documentIds?: string[]
  ): Promise<ResearchBriefResponse> {
    return this.request(`/api/v1/workspaces/${workspaceId}/briefs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        document_ids: documentIds && documentIds.length > 0 ? documentIds : undefined,
      }),
    });
  }

  async exportBriefMarkdown(workspaceId: string, briefId: string): Promise<string> {
    const url = `${this.base}/api/v1/workspaces/${workspaceId}/briefs/${briefId}/markdown`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to download markdown: HTTP ${res.status}`);
    }
    return res.text();
  }

  // Trust & Evaluation
  async getEvaluationSummary(): Promise<EvaluationSummaryResponse> {
    return this.request("/api/v1/evaluation/summary");
  }

  async runEvaluation(): Promise<EvaluationSummaryResponse> {
    return this.request("/api/v1/evaluation/run", {
      method: "POST",
    });
  }
}

export const api = new ApiClient();
