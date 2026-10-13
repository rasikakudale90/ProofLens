"use client";

import React from "react";
import {
  Files,
  MessageSquare,
  CheckCircle2,
  GitCompare,
  FileText,
  BarChart3,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useTheme } from "./theme-provider";
import { Workspace } from "@/lib/types";

export type NavTab = "documents" | "assistant" | "claims" | "radar" | "briefs" | "evaluation";

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  onWorkspaceChange: (ws: Workspace) => void;
  onOpenCreateWorkspace: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  backendOnline: boolean;
}

export function Sidebar({
  currentTab,
  onTabChange,
  workspaces,
  currentWorkspace,
  onWorkspaceChange,
  onOpenCreateWorkspace,
  isCollapsed,
  onToggleCollapse,
  backendOnline,
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: "documents" as NavTab, label: "Document Library", icon: Files },
    { id: "assistant" as NavTab, label: "Evidence Assistant", icon: MessageSquare },
    { id: "claims" as NavTab, label: "Claim Ledger", icon: CheckCircle2 },
    { id: "radar" as NavTab, label: "Contradiction Radar", icon: GitCompare },
    { id: "briefs" as NavTab, label: "Research Briefs", icon: FileText },
    { id: "evaluation" as NavTab, label: "Trust & Evaluation", icon: BarChart3 },
  ];

  return (
    <aside
      className={`relative flex flex-col justify-between border-r border-border bg-surface transition-all duration-200 z-20 ${
        isCollapsed ? "w-[72px]" : "w-[248px]"
      } shrink-0`}
    >
      {/* Top: Brand & Workspace Selector */}
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex items-center justify-center w-8 h-8 rounded-[7px] bg-primary text-primary-foreground font-semibold text-sm shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm tracking-tight text-foreground truncate">
                  ProofLens AI
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  Evidence-first RAG
                </span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="mx-auto flex items-center justify-center w-8 h-8 rounded-[7px] bg-primary text-primary-foreground font-semibold shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1.5 rounded-[7px] hover:bg-surface-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Workspace Dropdown */}
        <div className="p-3 border-b border-border">
          {!isCollapsed ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground px-1 font-medium">
                <span>Workspace</span>
                <button
                  onClick={onOpenCreateWorkspace}
                  title="Create new workspace"
                  className="hover:text-primary transition-colors flex items-center gap-0.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <select
                aria-label="Select active workspace"
                value={currentWorkspace?.id || ""}
                onChange={(e) => {
                  const ws = workspaces.find((w) => w.id === e.target.value);
                  if (ws) onWorkspaceChange(ws);
                }}
                className="w-full text-xs bg-surface-muted border border-border rounded-[7px] px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary truncate cursor-pointer font-medium"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <button
              onClick={onOpenCreateWorkspace}
              title="Workspaces"
              className="w-full flex justify-center p-2 rounded-[7px] hover:bg-surface-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <FolderOpen className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[7px] text-xs font-medium transition-all ${
                  isActive
                    ? "bg-accent text-accent-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Status & Theme Toggle */}
      <div className="p-3 border-t border-border flex flex-col gap-2">
        {/* Backend health status badge */}
        <div
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[7px] text-[11px] bg-surface-muted ${
            isCollapsed ? "justify-center px-0" : ""
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              backendOnline ? "bg-success" : "bg-danger animate-pulse"
            }`}
          />
          {!isCollapsed && (
            <span className="text-muted-foreground truncate">
              {backendOnline ? "PostgreSQL & API Online" : "Connecting to API..."}
            </span>
          )}
        </div>

        {/* Theme Mode Switcher */}
        <button
          onClick={toggleTheme}
          aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-[7px] text-xs text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors ${
            isCollapsed ? "justify-center px-0" : ""
          }`}
        >
          {theme === "light" ? (
            <>
              <Moon className="w-4 h-4 shrink-0 text-muted-foreground" />
              {!isCollapsed && <span>Dark theme</span>}
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 shrink-0 text-warning" />
              {!isCollapsed && <span>Light theme</span>}
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
