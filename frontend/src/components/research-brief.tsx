"use client";

import React, { useState } from "react";
import {
  FileText,
  Download,
  Loader2,
  Printer,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Bookmark,
} from "lucide-react";
import { DocumentItem, ResearchBriefResponse } from "@/lib/types";

interface ResearchBriefProps {
  documents: DocumentItem[];
  selectedDocumentIds: string[];
  onGenerateBrief: (topic: string) => Promise<ResearchBriefResponse>;
  onDownloadMarkdown: (briefId: string, filename: string) => Promise<void>;
}

export function ResearchBrief({
  documents,
  selectedDocumentIds,
  onGenerateBrief,
  onDownloadMarkdown,
}: ResearchBriefProps) {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [brief, setBrief] = useState<ResearchBriefResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scopedDocs = documents.filter((d) => selectedDocumentIds.includes(d.id));

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setError(null);
    try {
      const res = await onGenerateBrief(topic.trim());
      setBrief(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate research brief";
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!brief) return;
    const filename = `${brief.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-brief.md`;
    await onDownloadMarkdown(brief.brief_id, filename);
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1200px] mx-auto w-full">
      {/* Header and Scope */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Verifiable Research Brief Generator
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Synthesize multi-document evidence into a publication-ready brief with source traceability.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <FileCheck className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">
            {scopedDocs.length > 0 ? `${scopedDocs.length} PDF(s) in scope` : "All documents"}
          </span>
        </div>
      </div>

      {/* Generator Prompt Box */}
      <form
        onSubmit={handleGenerate}
        className="bg-surface border border-border rounded-[10px] p-5 shadow-xs flex flex-col gap-4 print:hidden"
      >
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">
            Research Inquiry or Topic for Executive Synthesis
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Synthesis of quarterly revenue trends and compliance findings across 2024-2025..."
            className="w-full px-3.5 py-2.5 text-xs bg-surface-muted border border-border rounded-[7px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {error && (
          <div className="p-3 rounded-[7px] bg-danger-soft text-danger text-xs border border-danger/20 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isGenerating || !topic.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[7px] text-xs font-medium bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-xs"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing Multi-Document Brief...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Generate Research Brief</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Rendered Brief View */}
      {brief && (
        <article className="bg-surface border border-border rounded-[10px] p-8 shadow-xs flex flex-col gap-6">
          {/* Action Toolbar */}
          <div className="flex items-center justify-between pb-4 border-b border-border print:hidden">
            <span className="text-xs text-muted-foreground font-mono">
              Brief ID: {brief.brief_id.slice(0, 8)}...
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-xs font-medium bg-surface-muted hover:bg-surface-muted/80 text-foreground border border-border transition-colors"
                title="Print or Save as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print to PDF</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-xs font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Markdown (.md)</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              ProofLens Executive Research Brief
            </span>
            <h1 className="text-xl font-bold text-foreground mt-1 tracking-tight font-serif">
              {brief.title}
            </h1>
          </div>

          {/* Executive Summary */}
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Executive Summary
            </h2>
            <div className="p-4 rounded-[7px] bg-surface-muted border border-border text-xs leading-relaxed text-foreground whitespace-pre-wrap font-serif">
              {brief.executive_summary}
            </div>
          </div>

          {/* Key Findings */}
          {brief.key_findings && brief.key_findings.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Key Findings & Supporting Evidence
              </h2>
              <ul className="space-y-2">
                {brief.key_findings.map((f, i) => (
                  <li
                    key={i}
                    className="p-3 rounded-[7px] bg-accent/15 border-l-2 border-primary text-xs leading-relaxed text-foreground flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Discrepancies & Disagreements */}
          {brief.discrepancies && brief.discrepancies.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Observed Discrepancies & Divergences
              </h2>
              <ul className="space-y-2">
                {brief.discrepancies.map((d, i) => (
                  <li
                    key={i}
                    className="p-3 rounded-[7px] bg-warning-soft/30 border border-warning/30 text-xs leading-relaxed text-foreground flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Limitations */}
          {brief.limitations && brief.limitations.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Investigation Limitations & Boundary Conditions
              </h2>
              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                {brief.limitations.map((lim, i) => (
                  <li key={i}>{lim}</li>
                ))}
              </ul>
            </div>
          )}
        </article>
      )}

      {/* Empty State */}
      {!brief && !isGenerating && (
        <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
          <FileText className="w-12 h-12 text-muted-foreground/40 stroke-1" />
          <p className="text-sm font-medium text-foreground">No Research Brief Generated</p>
          <p className="text-xs max-w-sm text-muted-foreground">
            Enter an investigation prompt above to synthesize findings across your scoped documents.
          </p>
        </div>
      )}
    </div>
  );
}
