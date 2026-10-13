export interface Workspace {
  id: string;
  name: string;
  user_id?: string | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_color: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface DocumentItem {
  id: string;
  workspace_id: string;
  filename: string;
  size_bytes: number;
  status: "uploaded" | "processing" | "ready" | "failed" | string;
  page_count?: number | null;
  checksum?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  created_at: string;
}

export interface DocumentUploadResponse {
  document_id: string;
  workspace_id: string;
  filename: string;
  status: string;
  uploaded_at: string;
}

export interface RetrievedEvidenceItem {
  document_id: string;
  document_name: string;
  page_number: number;
  chunk_id: string;
  chunk_index: number;
  excerpt: string;
  similarity: number;
}

export interface CitationItem {
  citation_id: string;
  document_id: string;
  document_name: string;
  page_number: number;
  chunk_id: string;
  excerpt: string;
  citation_order?: number;
}

export interface GroundedAnswerResponse {
  query_id: string;
  status: "answered" | "insufficient_evidence" | "supported" | "partially_supported" | string;
  answer: string;
  citations: CitationItem[];
  limitations: string[];
  model_metadata?: Record<string, unknown>;
  conversation_id?: string;
}

export interface ConversationSummary {
  id: string;
  workspace_id: string;
  user_id?: string | null;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_preview?: string | null;
}

export interface ConversationMessageItem {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  status?: string | null;
  citations: CitationItem[];
  limitations: string[];
  model_metadata: Record<string, unknown>;
  created_at: string;
}

export interface ConversationDetail {
  id: string;
  workspace_id: string;
  user_id?: string | null;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ConversationMessageItem[];
}

export interface ClaimAssessmentItem {
  claim_id: string;
  claim_text: string;
  status: "supported" | "partially_supported" | "contradicted" | "insufficient_evidence";
  rationale: string;
  citations: CitationItem[];
  limitations: string[];
}

export interface ClaimAssessmentResponse {
  workspace_id: string;
  total_claims: number;
  claims: ClaimAssessmentItem[];
}

export interface DocumentFinding {
  document_id: string;
  document_name: string;
  finding: string;
  citations: CitationItem[];
}

export interface CompareResponse {
  comparison_id: string;
  workspace_id: string;
  topic: string;
  relationship: "agreement" | "difference" | "apparent_contradiction" | "inconclusive";
  summary: string;
  document_findings: DocumentFinding[];
  limitations: string[];
}

export type ContradictionResponse = CompareResponse;

export interface BriefFinding {
  statement: string;
  citations: CitationItem[];
}

export interface ResearchBriefResponse {
  brief_id: string;
  workspace_id: string;
  topic: string;
  executive_summary: string;
  key_findings: BriefFinding[];
  disagreements: string[];
  limitations: string[];
  markdown_content: string;
}

export interface EvaluationResultItem {
  case_id: string;
  question: string;
  expected_behaviour: string;
  actual_status: string;
  passed: boolean;
  latency_ms: number;
  notes: string;
}

export interface EvaluationSummaryResponse {
  run_id: string;
  sample_count: number;
  retrieval_hit_rate: number;
  citation_validity_rate: number;
  abstention_success_rate: number;
  average_latency_ms: number;
  provider_error_count?: number;
  results: EvaluationResultItem[];
  created_at?: string;
}

