"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Plus,
  Loader2,
  Bookmark,
  FileCheck,
  ShieldCheck,
  X,
} from "lucide-react";
import { DocumentItem, ClaimAssessmentItem, ClaimAssessmentResponse } from "@/lib/types";

interface ClaimLedgerProps {
  documents: DocumentItem[];
  selectedDocumentIds: string[];
  onAssess: (claims: string[]) => Promise<ClaimAssessmentResponse>;
}

export function ClaimLedger({
  documents,
  selectedDocumentIds,
  onAssess,
}: ClaimLedgerProps) {
  const [claimInputs, setClaimInputs] = useState<string[]>([""]);
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<ClaimAssessmentItem[]>([]);
  const [activeInspectClaim, setActiveInspectClaim] = useState<ClaimAssessmentItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddClaimField = () => {
    setClaimInputs((prev) => [...prev, ""]);
  };

  const handleRemoveClaimField = (index: number) => {
    setClaimInputs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClaimChange = (index: number, value: string) => {
    setClaimInputs((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validClaims = claimInputs.map((c) => c.trim()).filter(Boolean);
    if (validClaims.length === 0) return;

    setIsAssessing(true);
    setError(null);
    try {
      const res = await onAssess(validClaims);
      setAssessmentResults(res.claims || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to assess claims";
      setError(msg);
    } finally {
      setIsAssessing(false);
    }
  };

  const scopedDocs = documents.filter((d) => selectedDocumentIds.includes(d.id));

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1440px] mx-auto w-full">
      {/* Scope Notice */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2 text-xs">
          <FileCheck className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">Audit Scope:</span>
          <span className="text-muted-foreground">
            {scopedDocs.length > 0
              ? `${scopedDocs.length} PDF(s) active for verification`
              : "All workspace documents"}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          Assesses claims as Supported, Partially Supported, Contradicted, or Insufficient Evidence.
        </span>
      </div>

      {/* Claim Input Form */}
      <div className="bg-surface border border-border rounded-[10px] p-5 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Evaluate Propositions & Claims
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter one or more claims to audit against the retrieved passages in the scoped PDFs.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddClaimField}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-[7px] text-xs font-medium text-primary hover:bg-accent/30 border border-border transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Claim</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {claimInputs.map((input, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground w-6 text-right">
                {idx + 1}.
              </span>
              <input
                type="text"
                value={input}
                onChange={(e) => handleClaimChange(idx, e.target.value)}
                placeholder="e.g. Model embeddings are 768 dimensions using cosine similarity..."
                className="flex-1 px-3 py-2 text-xs bg-surface-muted border border-border rounded-[7px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {claimInputs.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveClaimField(idx)}
                  className="p-1.5 rounded-[4px] hover:bg-danger-soft text-muted-foreground hover:text-danger transition-colors"
                  title="Remove claim field"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {error && (
            <div className="p-3 rounded-[7px] bg-danger-soft text-danger text-xs border border-danger/20 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isAssessing || claimInputs.every((c) => !c.trim())}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[7px] text-xs font-medium bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-xs"
            >
              {isAssessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Auditing Claims with Evidence Engine...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Audit Claims</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Claim Assessment Ledger Table */}
      {assessmentResults.length > 0 && (
        <div className="bg-surface rounded-[10px] border border-border shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border bg-surface-muted/40 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground">
              Audit Results ({assessmentResults.length} Claims)
            </h3>
            <span className="text-[11px] text-muted-foreground">
              Click &quot;Inspect Excerpts&quot; to audit supporting/contradicting passages
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface text-muted-foreground font-semibold">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Claim Proposition</th>
                  <th className="py-3 px-4 w-44">Status Assessment</th>
                  <th className="py-3 px-4 w-32">Sources</th>
                  <th className="py-3 px-4">Rationale & Nuance</th>
                  <th className="py-3 px-4 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assessmentResults.map((item, index) => (
                  <tr key={item.claim_id || index} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-foreground max-w-[320px]">
                      {item.claim_text}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.status === "supported" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[11px] font-medium bg-success-soft text-success">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          Supported
                        </span>
                      )}
                      {item.status === "partially_supported" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[11px] font-medium bg-warning-soft text-warning">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          Partially Supported
                        </span>
                      )}
                      {item.status === "contradicted" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[11px] font-medium bg-danger-soft text-danger">
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          Contradicted
                        </span>
                      )}
                      {item.status === "insufficient_evidence" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[11px] font-medium bg-surface-muted text-muted-foreground border border-border">
                          <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                          Insufficient Evidence
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono">
                      {item.citations?.length ?? 0} passage(s)
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                      {item.rationale || "None noted"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setActiveInspectClaim(item)}
                        className="px-2.5 py-1 rounded-[4px] text-[11px] font-medium bg-accent/30 text-accent-foreground hover:bg-accent/60 border border-border transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Claim Excerpts Modal Drawer */}
      {activeInspectClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-surface border border-border rounded-[10px] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface-muted/40">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold text-foreground">Claim Evidence Provenance</h3>
              </div>
              <button
                onClick={() => setActiveInspectClaim(null)}
                className="p-1 rounded-[4px] hover:bg-surface-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex flex-col gap-4">
              <div className="p-3 rounded-[7px] bg-surface-muted border border-border">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                  Evaluated Proposition
                </span>
                <p className="text-xs font-medium text-foreground">{activeInspectClaim.claim_text}</p>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                  Audit Rationale
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed bg-surface-muted/50 p-3 rounded-[7px] border border-border">
                  {activeInspectClaim.rationale}
                </p>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block mb-2">
                  Retrieved Source Passages ({activeInspectClaim.citations?.length || 0})
                </span>
                {activeInspectClaim.citations && activeInspectClaim.citations.length > 0 ? (
                  <div className="space-y-2.5">
                    {activeInspectClaim.citations.map((c, idx) => (
                      <div
                        key={c.citation_id || idx}
                        className="p-3 rounded-[7px] bg-accent/15 border-l-2 border-primary text-xs leading-relaxed text-foreground flex flex-col gap-1.5"
                      >
                        <blockquote className="italic font-serif">
                          &ldquo;{c.excerpt}&rdquo;
                        </blockquote>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium pt-1 border-t border-border/50">
                          <span>{c.document_name}</span>
                          <span>&bull;</span>
                          <span>Page {c.page_number}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No relevant passages substantiated this claim in the selected documents.
                  </p>
                )}
              </div>

              {activeInspectClaim.limitations && activeInspectClaim.limitations.length > 0 && (
                <div className="p-3 rounded-[7px] bg-warning-soft/30 border border-warning/30 text-xs text-warning">
                  <span className="font-semibold block mb-0.5">Audit Limitations & Caveats:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {activeInspectClaim.limitations.map((lim, i) => (
                      <li key={i}>{lim}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-border bg-surface flex justify-end">
              <button
                onClick={() => setActiveInspectClaim(null)}
                className="px-3 py-1.5 rounded-[7px] text-xs font-medium bg-surface-muted hover:bg-surface-muted/80 text-foreground"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
