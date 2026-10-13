"use client";

import React, { useState } from "react";
import {
  GitCompare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Loader2,
  Info,
  Calendar,
  Layers,
} from "lucide-react";
import { DocumentItem, ContradictionItem, ContradictionResponse } from "@/lib/types";

interface ContradictionRadarProps {
  documents: DocumentItem[];
  onCompare: (docIds: string[], topic: string) => Promise<ContradictionResponse>;
}

export function ContradictionRadar({ documents, onCompare }: ContradictionRadarProps) {
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [topic, setTopic] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [results, setResults] = useState<ContradictionItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggleDoc = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleRunComparison = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDocIds.length < 2) {
      setError("Please select at least 2 documents to compare for contradictions.");
      return;
    }
    if (!topic.trim()) {
      setError("Please enter a topic or subject to compare across documents.");
      return;
    }

    setIsComparing(true);
    setError(null);
    try {
      const res = await onCompare(selectedDocIds, topic.trim());
      setResults(res.contradictions);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Comparison failed";
      setError(msg);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1440px] mx-auto w-full">
      {/* Header & Description */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Cross-Document Contradiction Radar
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify factual, methodological, and temporal disagreements across 2 or more PDFs.
          </p>
        </div>
      </div>

      {/* Comparison Setup Card */}
      <form onSubmit={handleRunComparison} className="bg-surface border border-border rounded-[10px] p-5 shadow-xs flex flex-col gap-5">
        <div>
          <span className="text-xs font-semibold text-foreground block mb-2">
            1. Select at least 2 Documents to Compare ({selectedDocIds.length} selected)
          </span>
          {documents.length < 2 ? (
            <p className="text-xs text-warning bg-warning-soft px-3 py-2 rounded-[7px]">
              You need at least 2 uploaded documents in this workspace to run cross-document contradiction radar.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {documents.map((doc) => {
                const isSelected = selectedDocIds.includes(doc.id);
                return (
                  <button
                    type="button"
                    key={doc.id}
                    onClick={() => toggleDoc(doc.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-[7px] border text-left text-xs transition-all ${
                      isSelected
                        ? "bg-accent/30 border-primary font-medium text-foreground"
                        : "bg-surface-muted/50 border-border hover:border-primary/40 text-muted-foreground"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="rounded accent-primary cursor-pointer shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-foreground font-medium">{doc.filename}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {doc.page_count ?? 0} pages
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground block mb-1.5">
            2. Topic or Inquiry to Compare
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Revenue targets for 2025, Clinical trial criteria, or Security safeguards..."
            className="w-full px-3.5 py-2.5 text-xs bg-surface-muted border border-border rounded-[7px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {error && (
          <div className="p-3 rounded-[7px] bg-danger-soft text-danger text-xs border border-danger/20 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isComparing || selectedDocIds.length < 2 || !topic.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[7px] text-xs font-medium bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-xs"
          >
            {isComparing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Comparing Documents on Topic...</span>
              </>
            ) : (
              <>
                <GitCompare className="w-4 h-4" />
                <span>Run Contradiction Radar</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Comparison Results */}
      {results.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Detected Topics & Discrepancy Analysis ({results.length})
          </h3>

          <div className="space-y-4">
            {results.map((item, idx) => (
              <div
                key={idx}
                className="bg-surface border border-border rounded-[10px] p-5 shadow-xs flex flex-col gap-4"
              >
                {/* Topic Header & Status */}
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-foreground">
                      Topic: {item.topic}
                    </span>
                  </div>

                  {item.status === "contradicted" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-medium bg-danger-soft text-danger">
                      <XCircle className="w-3.5 h-3.5" />
                      Direct Contradiction
                    </span>
                  )}
                  {item.status === "potential_disagreement" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-medium bg-warning-soft text-warning">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Potential Disagreement
                    </span>
                  )}
                  {item.status === "compatible" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-medium bg-success-soft text-success">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Compatible Evidence
                    </span>
                  )}
                </div>

                {/* Side-by-Side Dual Source Panels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Doc A */}
                  <div className="p-3.5 rounded-[7px] bg-surface-muted border border-border flex flex-col gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-primary font-semibold">
                      Source A Viewpoint
                    </span>
                    <p className="text-xs text-foreground font-medium">"{item.doc_a_claim}"</p>
                    <span className="text-[11px] text-muted-foreground font-mono mt-auto pt-1 border-t border-border/50">
                      Citation: {item.doc_a_citation}
                    </span>
                  </div>

                  {/* Doc B */}
                  <div className="p-3.5 rounded-[7px] bg-surface-muted border border-border flex flex-col gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-primary font-semibold">
                      Source B Viewpoint
                    </span>
                    <p className="text-xs text-foreground font-medium">"{item.doc_b_claim}"</p>
                    <span className="text-[11px] text-muted-foreground font-mono mt-auto pt-1 border-t border-border/50">
                      Citation: {item.doc_b_citation}
                    </span>
                  </div>
                </div>

                {/* Differences Context */}
                {item.differences_context && (
                  <div className="p-3 rounded-[7px] bg-accent/20 border border-accent/40 text-xs text-accent-foreground flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                    <div>
                      <span className="font-semibold block mb-0.5">Contextual Differences & Nuances:</span>
                      <p className="text-[11px] leading-relaxed">{item.differences_context}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
