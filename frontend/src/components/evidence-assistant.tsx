"use client";

import React, { useState } from "react";
import {
  Send,
  Loader2,
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  FileQuestion,
} from "lucide-react";
import { DocumentItem, GroundedAnswerResponse, CitationItem } from "@/lib/types";

interface MessageItem {
  id: string;
  question: string;
  answerResponse?: GroundedAnswerResponse;
  loading?: boolean;
  error?: string;
}

interface EvidenceAssistantProps {
  documents: DocumentItem[];
  selectedDocumentIds: string[];
  onAsk: (question: string) => Promise<GroundedAnswerResponse>;
  onSelectCitation: (citation: CitationItem) => void;
  activeCitation: CitationItem | null;
}

export function EvidenceAssistant({
  documents,
  selectedDocumentIds,
  onAsk,
  onSelectCitation,
  activeCitation,
}: EvidenceAssistantProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [query, setQuery] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  const scopedDocs = documents.filter((d) => selectedDocumentIds.includes(d.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isAsking) return;

    const currentQuery = query.trim();
    setQuery("");
    const messageId = Date.now().toString();

    // Append user question with loading state
    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        question: currentQuery,
        loading: true,
      },
    ]);

    setIsAsking(true);
    try {
      const response = await onAsk(currentQuery);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, loading: false, answerResponse: response }
            : m
        )
      );
      // Auto-select first citation if available
      if (response.citations && response.citations.length > 0) {
        onSelectCitation(response.citations[0]);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to obtain grounded answer";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, loading: false, error: errorMsg }
            : m
        )
      );
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-[960px] mx-auto w-full p-6">
      {/* Scope Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
        <div className="flex items-center gap-2 text-xs">
          <FileCheck className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">Active Search Scope:</span>
          <span className="text-muted-foreground">
            {scopedDocs.length > 0
              ? `${scopedDocs.length} PDF(s) selected`
              : "All workspace documents"}
          </span>
        </div>
        {scopedDocs.length === 0 && documents.length > 0 && (
          <span className="text-[11px] text-warning bg-warning-soft px-2 py-0.5 rounded-[4px]">
            Searching across all {documents.length} workspace files
          </span>
        )}
      </div>

      {/* Messages Canvas */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {messages.length === 0 ? (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-8 text-muted-foreground gap-3">
            <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center text-primary">
              <FileQuestion className="w-6 h-6 stroke-1" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Ask Questions Grounded in Evidence
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Every answer references verbatim passages and page provenance from your uploaded PDFs. If evidence is lacking, ProofLens explicitly abstains.
              </p>
            </div>
            {documents.length === 0 && (
              <p className="text-xs text-warning bg-warning-soft px-3 py-1.5 rounded-[7px] mt-2">
                Note: No documents uploaded yet. Go to Document Library to upload a PDF first.
              </p>
            )}
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-4 animate-in fade-in duration-150">
              {/* Question Card */}
              <div className="flex justify-end">
                <div className="bg-surface-muted text-foreground border border-border rounded-[10px] px-4 py-3 max-w-[85%] text-xs shadow-2xs font-medium">
                  {msg.question}
                </div>
              </div>

              {/* Answer Card */}
              <div className="flex justify-start">
                <div className="bg-surface border border-border rounded-[10px] p-5 max-w-[95%] w-full shadow-xs flex flex-col gap-3">
                  {msg.loading && (
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>Retrieving chunks & generating grounded answer...</span>
                    </div>
                  )}

                  {msg.error && (
                    <div className="flex items-center gap-2 p-3 rounded-[7px] bg-danger-soft text-danger text-xs border border-danger/20">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{msg.error}</span>
                    </div>
                  )}

                  {msg.answerResponse && (
                    <>
                      {/* Status Protocol Badge */}
                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-primary" />
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Evidence Assessment
                          </span>
                        </div>

                        {msg.answerResponse.status === "supported" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-[11px] font-medium bg-success-soft text-success">
                            <CheckCircle2 className="w-3 h-3" />
                            Supported
                          </span>
                        )}
                        {msg.answerResponse.status === "partially_supported" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-[11px] font-medium bg-warning-soft text-warning">
                            <AlertTriangle className="w-3 h-3" />
                            Partially Supported
                          </span>
                        )}
                        {msg.answerResponse.status === "insufficient_evidence" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-[11px] font-medium bg-danger-soft text-danger">
                            <AlertTriangle className="w-3 h-3" />
                            Insufficient Evidence
                          </span>
                        )}
                      </div>

                      {/* Explicit Abstention Protocol Banner */}
                      {msg.answerResponse.status === "insufficient_evidence" && (
                        <div className="flex items-start gap-2.5 p-3 rounded-[7px] bg-danger-soft/60 border border-danger/30 text-xs text-danger">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block">Explicit Abstention Protocol Triggered</span>
                            <span className="text-[11px]">
                              Available evidence in the selected documents does not substantiate an answer to this question. ProofLens abstains from answering rather than speculating or hallucinating.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Main Answer Body */}
                      <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap select-text">
                        {msg.answerResponse.answer}
                      </p>

                      {/* Validated Citations */}
                      {msg.answerResponse.citations && msg.answerResponse.citations.length > 0 && (
                        <div className="pt-2 border-t border-border flex flex-col gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Server-Validated Citations ({msg.answerResponse.citations.length})
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {msg.answerResponse.citations.map((c) => {
                              const isSelected = activeCitation?.chunk_id === c.chunk_id;
                              return (
                                <button
                                  key={c.chunk_id}
                                  onClick={() => onSelectCitation(c)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] border transition-all ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                                      : "bg-surface-muted text-link border-border hover:border-primary/50"
                                  }`}
                                  title="Click to view exact source passage"
                                >
                                  <Bookmark className="w-3 h-3 shrink-0" />
                                  <span>
                                    [{c.citation_order}] {c.document_name} (p. {c.page_number})
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Stated Limitations */}
                      {msg.answerResponse.limitations && msg.answerResponse.limitations.length > 0 && (
                        <div className="pt-1 flex flex-col gap-1 text-[11px] text-muted-foreground">
                          <span className="font-medium text-foreground">Analysis Limitations:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                            {msg.answerResponse.limitations.map((lim, i) => (
                              <li key={i}>{lim}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Query Input Bar */}
      <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-border flex gap-2 shrink-0">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about the selected documents (e.g. What is the verified methodology?)..."
          disabled={isAsking}
          className="flex-1 px-4 py-2.5 text-xs bg-surface border border-border-strong rounded-[7px] text-foreground focus:outline-none focus:ring-2 focus:ring-focus-ring placeholder:text-muted-foreground shadow-xs"
        />
        <button
          type="submit"
          disabled={!query.trim() || isAsking}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-[7px] text-xs font-medium bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-xs"
        >
          {isAsking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
