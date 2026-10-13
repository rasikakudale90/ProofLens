"use client";

import React from "react";
import { NavTab } from "./sidebar";
import { UserProfile, DocumentItem } from "@/lib/types";
import { FileCheck, Menu, LogOut, Key } from "lucide-react";

interface HeaderProps {
  currentTab: NavTab;
  workspaceName?: string;
  selectedDocuments: DocumentItem[];
  totalDocuments: number;
  onToggleMobileMenu?: () => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
  onOpenAuth?: (email?: string) => void;
}

export function Header({
  currentTab,
  workspaceName,
  selectedDocuments,
  totalDocuments,
  onToggleMobileMenu,
  currentUser,
  onLogout,
  onOpenAuth,
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

      <div className="flex items-center gap-3">
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

        {/* Authenticated User Badge */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-border">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-xs shrink-0 ring-1 ring-border"
              style={{ backgroundColor: currentUser.avatar_color || "#6366f1" }}
              title={`${currentUser.name} (${currentUser.role})`}
            >
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="hidden lg:flex flex-col min-w-0">
              <span className="text-xs font-semibold text-foreground truncate leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-muted-foreground truncate leading-tight">
                {currentUser.role}
              </span>
            </div>
            {onOpenAuth && (
              <button
                onClick={() => onOpenAuth()}
                title="Switch Account"
                className="hidden sm:inline-flex p-1.5 rounded-[6px] text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
              >
                <Key className="w-3.5 h-3.5" />
              </button>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 rounded-[6px] text-muted-foreground hover:text-danger hover:bg-danger-soft transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
