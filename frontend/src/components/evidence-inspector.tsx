"use client";

import React from "react";
import { X, FileText, Bookmark } from "lucide-react";
import { CitationItem, RetrievedEvidenceItem } from "@/lib/types";

interface EvidenceInspectorProps {
  activeCitation: CitationItem | null;
  activeEvidence: RetrievedEvidenceItem | null;
  onClose: () => void;
}

export function EvidenceInspector({
  activeCitation,
  activeEvidence,
  onClose,
}: EvidenceInspectorProps) {
  if (!activeCitation && !activeEvidence) {
    return (
      <aside className="w-[360px] border-l border-border bg-surface flex flex-col p-6 items-center justify-center text-center text-muted-foreground shrink-0 hidden lg:flex">
        <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center text-muted-foreground/50 mb-3">
          <Bookmark className="w-6 h-6 stroke-1" />
        </div>
        <h3 className="text-xs font-semibold text-foreground">Evidence Inspector</h3>
        <p className="text-[11px] text-muted-foreground mt-1 max-w-[220px]">
          Click any citation badge in an answer to audit its exact source passage and page provenance.
        </p>
      </aside>
    );
  }

  const title = activeCitation?.document_name || activeEvidence?.document_name || "Document";
  const pageNumber = activeCitation?.page_number ?? activeEvidence?.page_number;
  const excerpt = activeCitation?.excerpt || activeEvidence?.excerpt || "";
  const chunkId = activeCitation?.chunk_id || activeEvidence?.chunk_id || "";
  const similarity = activeEvidence?.similarity;
  const citationOrder = activeCitation?.citation_order;

  return (
    <aside className="w-[360px] border-l border-border bg-surface flex flex-col h-full shrink-0 animate-in slide-in-from-right-4 duration-150 z-10">
      {/* Inspector Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface-muted/30">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold text-foreground">Evidence Provenance</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-[4px] hover:bg-surface-muted text-muted-foreground hover:text-foreground"
          aria-label="Close inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Inspector Body */}
      <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
        {/* Document & Page Badge */}
        <div className="p-3 rounded-[7px] bg-surface-muted border border-border flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-semibold text-foreground truncate" title={title}>
              {title}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
            <span className="font-medium text-foreground">
              Page {pageNumber}
            </span>
            {citationOrder !== undefined && (
              <span className="text-primary font-semibold">
                Citation [{citationOrder}]
              </span>
            )}
            {similarity !== undefined && (
              <span className="font-mono text-muted-foreground">
                Cosine Match: {(similarity * 100).toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Verbatim Excerpt */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Verified Source Excerpt
            </span>
            <span className="text-[10px] text-success font-medium bg-success-soft px-1.5 py-0.5 rounded-[4px]">
              Server-Validated
            </span>
          </div>
          <blockquote className="p-3.5 rounded-[7px] bg-accent/20 border-l-2 border-primary text-xs leading-relaxed text-foreground italic whitespace-pre-wrap select-text font-serif">
            &ldquo;{excerpt}&rdquo;
          </blockquote>
        </div>

        {/* Provenance Metadata */}
        <div className="mt-auto p-3 rounded-[7px] border border-border bg-surface-muted/20 text-[11px] text-muted-foreground flex flex-col gap-1 font-mono">
          <span className="text-foreground/80 font-semibold font-sans">Provenance Audit Trail</span>
          <span className="truncate">Chunk ID: {chunkId}</span>
          <span>Index: #{activeEvidence?.chunk_index ?? 0}</span>
          <span className="font-sans text-[10px] text-muted-foreground pt-1 border-t border-border/50">
            Guaranteed page-level provenance extracted via PyMuPDF.
          </span>
        </div>
      </div>
    </aside>
  );
}
