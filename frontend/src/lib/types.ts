export interface Workspace {
  id: string;
  name: string;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  workspace_id: string;
  filename: string;
  size_bytes: number;
  status: "processing" | "ready" | "failed";
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
  citation_order: number;
  document_id: string;
  document_name: string;
  page_number: number;
  chunk_id: string;
  excerpt: string;
}

export interface GroundedAnswerResponse {
  answer: string;
  status: "supported" | "partially_supported" | "insufficient_evidence";
  citations: CitationItem[];
  limitations: string[];
  query_run_id: string;
}

export interface ClaimAssessmentItem {
  claim: string;
  status: "supported" | "partially_supported" | "contradicted" | "insufficient_evidence";
  evidence_excerpts: string[];
  source_references: string[];
  uncertainty_notes?: string | null;
}

export interface ClaimAssessmentResponse {
  workspace_id: string;
  total_claims: number;
  assessments: ClaimAssessmentItem[];
}

export interface ContradictionItem {
  topic: string;
  status: "contradicted" | "potential_disagreement" | "compatible";
  doc_a_claim: string;
  doc_a_citation: string;
  doc_b_claim: string;
  doc_b_citation: string;
  differences_context?: string | null;
}

export interface ContradictionResponse {
  workspace_id: string;
  topics_compared: number;
  contradictions: ContradictionItem[];
}

export interface ResearchBriefResponse {
  brief_id: string;
  workspace_id: string;
  title: string;
  executive_summary: string;
  key_findings: string[];
  discrepancies: string[];
  limitations: string[];
  markdown?: string;
}

export interface EvaluationMetrics {
  retrieval_hit_rate: number;
  citation_validity: number;
  abstention_correctness: number;
  p95_latency_ms: number;
  error_rate?: number;
}

export interface EvaluationSummaryResponse {
  run_id?: string;
  sample_count: number;
  metrics: EvaluationMetrics;
  created_at?: string;
}
