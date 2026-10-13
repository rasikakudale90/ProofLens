"use client";

import React from "react";
import { NavTab } from "./sidebar";
import { DocumentItem } from "@/lib/types";
import { FileCheck, Menu } from "lucide-react";

interface HeaderProps {
  currentTab: NavTab;
  workspaceName?: string;
  selectedDocuments: DocumentItem[];
  totalDocuments: number;
  onToggleMobileMenu?: () => void;
}

export function Header({
  currentTab,
  workspaceName,
  selectedDocuments,
  totalDocuments,
  onToggleMobileMenu,
}: HeaderProps) {
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    documents: {
      title: "Document Library",
      subtitle: "Upload and manage reference PDFs with page-aware provenance tracking.",
    },
    assistant: {
      title: "Evidence-First AI Assistant",
      subtitle: "Ask questions grounded strictly in selected documents with server-validated citations.",
    },
    claims: {
      title: "Claim Evidence Ledger",
      subtitle: "Assess claims as Supported, Partially Supported, Contradicted, or Insufficient Evidence.",
    },
    radar: {
      title: "Contradiction Radar",
      subtitle: "Compare evidence across 2+ documents to detect discrepancies in data and scope.",
    },
    briefs: {
      title: "Research Brief Generator",
      subtitle: "Synthesize findings into structured, verifiable briefs with clean Markdown export.",
    },
    evaluation: {
      title: "Trust & Evaluation Dashboard",
      subtitle: "Audit retrieval hit rate, citation validity, abstention accuracy, and P95 latency.",
    },
  };

  const { title, subtitle } = titles[currentTab];

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-border bg-surface flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            aria-label="Open navigation menu"
            className="md:hidden p-1.5 rounded-[7px] text-muted-foreground hover:text-foreground hover:bg-surface-muted"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-semibold text-foreground tracking-tight truncate">
              {title}
            </h1>
            {workspaceName && (
              <span className="hidden xs:inline-block text-[11px] px-2 py-0.5 rounded-[4px] bg-surface-muted text-muted-foreground border border-border font-medium truncate max-w-[140px]">
                {workspaceName}
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>
      </div>

      {/* Scope Indicator for investigation tabs */}
      {currentTab !== "documents" && currentTab !== "evaluation" && (
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[7px] bg-surface-muted border border-border text-xs">
          <FileCheck className="w-3.5 h-3.5 text-primary" />
          <span className="text-muted-foreground">Scope:</span>
          <span className="font-medium text-foreground">
            {selectedDocuments.length > 0
              ? `${selectedDocuments.length} of ${totalDocuments} PDF(s) active`
              : "All documents active"}
          </span>
        </div>
      )}
    </header>
  );
}
