import {
  Workspace,
  UserProfile,
  AuthResponse,
  DocumentItem,
  DocumentUploadResponse,
  RetrievedEvidenceItem,
  GroundedAnswerResponse,
  ConversationSummary,
  ConversationDetail,
  ClaimAssessmentResponse,
  ContradictionResponse,
  ResearchBriefResponse,
  EvaluationSummaryResponse,
} from "./types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

class ApiClient {
  private base = API_BASE_URL;

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.base}${endpoint}`;
    const token = typeof window !== "undefined" ? localStorage.getItem("prooflens_token") : null;
    const headers: Record<string, string> = {
      ...((options?.headers as Record<string, string>) || {}),
    };
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }

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

  // Authentication
  async login(payload: { email: string; password: string }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (typeof window !== "undefined" && res.access_token) {
      localStorage.setItem("prooflens_token", res.access_token);
      localStorage.setItem("prooflens_user_id", res.user.id);
    }
    return res;
  }

  async register(payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
    avatar_color?: string;
  }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (typeof window !== "undefined" && res.access_token) {
      localStorage.setItem("prooflens_token", res.access_token);
      localStorage.setItem("prooflens_user_id", res.user.id);
    }
    return res;
  }

  async getMe(): Promise<UserProfile> {
    return this.request<UserProfile>("/api/v1/auth/me");
  }

  async logout(): Promise<void> {
    try {
      await this.request("/api/v1/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("prooflens_token");
      localStorage.removeItem("prooflens_user_id");
    }
  }

  // Health
  async getHealth(): Promise<{ status: string; app: string }> {
    return this.request("/health");
  }

  async getReady(): Promise<{ status: string; dependencies: Record<string, string> }> {
    return this.request("/ready");
  }

  // Users
  async getUsers(): Promise<UserProfile[]> {
    return this.request("/api/v1/users");
  }

  async createUser(payload: {
    name: string;
    email: string;
    role?: string;
    avatar_color?: string;
  }): Promise<UserProfile> {
    return this.request("/api/v1/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  // Workspaces
  async getWorkspaces(userId?: string): Promise<Workspace[]> {
    const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
    return this.request(`/api/v1/workspaces${qs}`);
  }

  async createWorkspace(name: string, userId?: string): Promise<Workspace> {
    return this.request("/api/v1/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, user_id: userId }),
    });
  }

  async deleteWorkspace(workspaceId: string): Promise<{ message: string }> {
    return this.request(`/api/v1/workspaces/${workspaceId}`, {
      method: "DELETE",
    });
  }

  // Conversations
  async getConversations(workspaceId: string, userId?: string): Promise<ConversationSummary[]> {
    const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
    return this.request(`/api/v1/workspaces/${workspaceId}/conversations${qs}`);
  }

  async createConversation(
    workspaceId: string,
    title?: string,
    userId?: string
  ): Promise<ConversationDetail> {
    return this.request(`/api/v1/workspaces/${workspaceId}/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title || "New Conversation", user_id: userId }),
    });
  }

  async getConversation(
    workspaceId: string,
    conversationId: string
  ): Promise<ConversationDetail> {
    return this.request(`/api/v1/workspaces/${workspaceId}/conversations/${conversationId}`);
  }

  async updateConversationTitle(
    workspaceId: string,
    conversationId: string,
    title: string
  ): Promise<ConversationDetail> {
    return this.request(`/api/v1/workspaces/${workspaceId}/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  }

  async deleteConversation(
    workspaceId: string,
    conversationId: string
  ): Promise<{ message: string }> {
    return this.request(`/api/v1/workspaces/${workspaceId}/conversations/${conversationId}`, {
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

    const token = typeof window !== "undefined" ? localStorage.getItem("prooflens_token") : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${this.base}/api/v1/workspaces/${workspaceId}/documents`;
    const res = await fetch(url, {
      method: "POST",
      headers,
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
    documentIds?: string[],
    conversationId?: string,
    userId?: string
  ): Promise<GroundedAnswerResponse> {
    return this.request(`/api/v1/workspaces/${workspaceId}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        document_ids: documentIds && documentIds.length > 0 ? documentIds : undefined,
        conversation_id: conversationId,
        user_id: userId,
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
    const token = typeof window !== "undefined" ? localStorage.getItem("prooflens_token") : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const url = `${this.base}/api/v1/workspaces/${workspaceId}/briefs/${briefId}/markdown`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to download markdown: HTTP ${res.status}`);
    }
    return res.text();
  }

  // Trust & Evaluation
  async getEvaluationSummary(): Promise<EvaluationSummaryResponse | null> {
    try {
      return await this.request<EvaluationSummaryResponse>("/api/v1/evaluation/summary");
    } catch {
      return null;
    }
  }

  async runEvaluation(): Promise<EvaluationSummaryResponse> {
    return this.request("/api/v1/evaluation/run", {
      method: "POST",
    });
  }
}


export const api = new ApiClient();
