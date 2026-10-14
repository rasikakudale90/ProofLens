"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sidebar, NavTab } from "@/components/sidebar";
import { Header } from "@/components/header";
import { DocumentLibrary } from "@/components/document-library";
import { EvidenceAssistant } from "@/components/evidence-assistant";
import { EvidenceInspector } from "@/components/evidence-inspector";
import { ClaimLedger } from "@/components/claim-ledger";
import { ContradictionRadar } from "@/components/contradiction-radar";
import { ResearchBrief } from "@/components/research-brief";
import { EvaluationDashboard } from "@/components/evaluation-dashboard";
import { AuthModal } from "@/components/auth-modal";
import { api } from "@/lib/api";
import {
  Workspace,
  UserProfile,
  DocumentItem,
  CitationItem,
  GroundedAnswerResponse,
  ClaimAssessmentResponse,
  ContradictionResponse,
  ResearchBriefResponse,
  EvaluationSummaryResponse,
} from "@/lib/types";
import { X, Loader2 } from "lucide-react";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<NavTab>("documents");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPrefillEmail, setAuthPrefillEmail] = useState("");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [activeCitation, setActiveCitation] = useState<CitationItem | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Ask Question handler
  const handleAskQuestion = async (
    question: string,
    conversationId?: string
  ): Promise<GroundedAnswerResponse> => {
    if (!currentWorkspace) throw new Error("No active workspace selected.");
    return api.askQuestion(
      currentWorkspace.id,
      question,
      selectedDocumentIds.length > 0 ? selectedDocumentIds : undefined,
      conversationId,
      currentUser?.id
    );
  };

  // Claim Assessment handler
  const handleAssessClaims = async (claims: string[]): Promise<ClaimAssessmentResponse> => {
    if (!currentWorkspace) throw new Error("No active workspace selected.");
    return api.assessClaims(
      currentWorkspace.id,
      claims,
      selectedDocumentIds.length > 0 ? selectedDocumentIds : undefined
    );
  };

  // Contradiction Radar handler
  const handleCompareDocuments = async (
    docIds: string[],
    topic: string
  ): Promise<ContradictionResponse> => {
    if (!currentWorkspace) throw new Error("No active workspace selected.");
    return api.compareDocuments(currentWorkspace.id, docIds, topic);
  };

  // Research Brief handler
  const handleGenerateBrief = async (topic: string): Promise<ResearchBriefResponse> => {
    if (!currentWorkspace) throw new Error("No active workspace selected.");
    return api.generateBrief(
      currentWorkspace.id,
      topic,
      selectedDocumentIds.length > 0 ? selectedDocumentIds : undefined
    );
  };

  const handleDownloadMarkdown = async (briefId: string, filename: string): Promise<void> => {
    if (!currentWorkspace) return;
    const md = await api.exportBriefMarkdown(currentWorkspace.id, briefId);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Evaluation handlers
  const handleLoadEvaluationSummary = async (): Promise<EvaluationSummaryResponse | null> => {
    return api.getEvaluationSummary();
  };

  const handleRunEvaluation = async (): Promise<EvaluationSummaryResponse> => {
    return api.runEvaluation();
  };

  // New Workspace Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  // Multiuser & Auth Handlers
  const handleOpenAuth = (email?: string) => {
    setAuthPrefillEmail(email || "");
    setIsAuthModalOpen(true);
  };

  const handleSelectUser = (user: UserProfile) => {
    if (user.id !== currentUser?.id) {
      handleOpenAuth(user.email);
    }
  };

  const handleAuthSuccess = async (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    setAuthPrefillEmail("");
    if (typeof window !== "undefined") {
      localStorage.setItem("prooflens_user_id", user.id);
    }
    try {
      const userList = await api.getUsers();
      setUsers(userList);
      const wsList = await api.getWorkspaces(user.id);
      setWorkspaces(wsList);
      if (wsList.length > 0) {
        setCurrentWorkspace(wsList[0]);
      } else {
        const defaultWs = await api.createWorkspace("ProofLens Default Investigation", user.id);
        setWorkspaces([defaultWs]);
        setCurrentWorkspace(defaultWs);
      }
    } catch (err) {
      console.error("Failed to refresh state after authentication:", err);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setCurrentWorkspace(null);
    setDocuments([]);
    setWorkspaces([]);
    setAuthPrefillEmail("");
    setIsAuthModalOpen(true);
  };

  const handleCreateUser = async (payload: {
    name: string;
    email: string;
    password?: string;
    role: string;
    avatar_color: string;
  }) => {
    const newUser = await api.createUser(payload);
    setUsers((prev) => [...prev, newUser]);
    handleOpenAuth(newUser.email);
  };

  // 1. Initial health, auth check, users, and workspace load
  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        try {
          const readyRes = await api.getReady();
          if (active) setBackendOnline(readyRes.status === "ready");
        } catch (readyErr) {
          console.warn("Backend ready check pending or degraded:", readyErr);
          if (active) setBackendOnline(false);
        }

        // Check authentication token
        const token = typeof window !== "undefined" ? localStorage.getItem("prooflens_token") : null;
        let authenticatedUser: UserProfile | null = null;

        if (token) {
          try {
            authenticatedUser = await api.getMe();
            if (active) setCurrentUser(authenticatedUser);
          } catch {
            if (typeof window !== "undefined") {
              localStorage.removeItem("prooflens_token");
              localStorage.removeItem("prooflens_user_id");
            }
          }
        }

        // Load users list for demo & switcher display
        try {
          const userList = await api.getUsers();
          if (active) {
            setUsers(userList);
          }
        } catch (uErr) {
          console.error("Failed to load users:", uErr);
        }

        if (authenticatedUser) {
          const wsList = await api.getWorkspaces(authenticatedUser.id);
          if (active) {
            if (wsList.length > 0) {
              setWorkspaces(wsList);
              setCurrentWorkspace(wsList[0]);
            } else {
              const defaultWs = await api.createWorkspace("ProofLens Default Investigation", authenticatedUser.id);
              setWorkspaces([defaultWs]);
              setCurrentWorkspace(defaultWs);
            }
          }
        } else {
          // Authentication required for each and every user
          if (active) {
            setCurrentUser(null);
            setIsAuthModalOpen(true);
          }
        }
      } catch (err) {
        console.error("Failed to connect to backend:", err);
        if (active) setBackendOnline(false);
      } finally {
        if (active) setLoadingInitial(false);
      }
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  // 2. Load documents when active workspace changes
  const loadDocuments = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      const docs = await api.getDocuments(currentWorkspace.id);
      setDocuments(docs);
      setSelectedDocumentIds((prev) => {
        if (prev.length === 0) {
          return docs.filter((d) => d.status === "ready").map((d) => d.id);
        }
        return prev.filter((id) => docs.some((d) => d.id === id));
      });
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    let active = true;
    if (!currentWorkspace) return;
    const fetchDocs = async () => {
      try {
        const docs = await api.getDocuments(currentWorkspace.id);
        if (active) {
          setDocuments(docs);
          setSelectedDocumentIds((prev) => {
            if (prev.length === 0) {
              return docs.filter((d) => d.status === "ready").map((d) => d.id);
            }
            return prev.filter((id) => docs.some((d) => d.id === id));
          });
        }
      } catch (err) {
        console.error("Failed to load documents:", err);
      }
    };
    fetchDocs();
    return () => {
      active = false;
    };
  }, [currentWorkspace]);

  // 3. Document handlers
  const handleUploadDocument = async (file: File) => {
    if (!currentWorkspace) return;
    setIsUploading(true);
    try {
      await api.uploadDocument(currentWorkspace.id, file);
      await loadDocuments();
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!currentWorkspace) return;
    await api.deleteDocument(currentWorkspace.id, docId);
    setSelectedDocumentIds((prev) => prev.filter((id) => id !== docId));
    await loadDocuments();
  };

  const handleToggleSelectDocument = (docId: string) => {
    setSelectedDocumentIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleSelectAll = () => {
    setSelectedDocumentIds(documents.map((d) => d.id));
  };

  const handleDeselectAll = () => {
    setSelectedDocumentIds([]);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setIsCreatingWorkspace(true);
    try {
      const created = await api.createWorkspace(newWorkspaceName.trim(), currentUser?.id);
      setWorkspaces((prev) => [created, ...prev]);
      setCurrentWorkspace(created);
      setNewWorkspaceName("");
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error("Failed to create workspace:", err);
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const selectedDocs = documents.filter((d) => selectedDocumentIds.includes(d.id));

  // Gated Authentication: If initial loading, display verification spinner
  if (loadingInitial) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3 animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="text-base font-semibold text-foreground tracking-tight">ProofLens AI</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Verifying authentication & security credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  // Strict Authentication Wall: If unauthenticated, render the full Auth Portal
  if (!currentUser) {
    return (
      <div className="min-h-screen w-screen bg-background relative flex flex-col justify-center items-center p-4 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <AuthModal
          isOpen={true}
          canDismiss={false}
          onAuthSuccess={handleAuthSuccess}
          initialEmail={authPrefillEmail}
          registeredUsers={users}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Left Application Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          setIsMobileMenuOpen(false);
        }}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onWorkspaceChange={setCurrentWorkspace}
        onOpenCreateWorkspace={() => setIsCreateModalOpen(true)}
        users={users}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        onCreateUser={handleCreateUser}
        onLogout={handleLogout}
        onOpenAuth={handleOpenAuth}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        backendOnline={backendOnline}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <Header
          currentTab={currentTab}
          workspaceName={currentWorkspace?.name}
          selectedDocuments={selectedDocs}
          totalDocuments={documents.length}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenAuth={handleOpenAuth}
        />

        {/* Tab Canvas */}
        <main className="flex-1 overflow-y-auto">
          {loadingInitial ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Connecting to ProofLens Intelligence Engine...</p>
            </div>
          ) : (
            <>
              {currentTab === "documents" && (
                <DocumentLibrary
                  documents={documents}
                  selectedDocumentIds={selectedDocumentIds}
                  onToggleSelectDocument={handleToggleSelectDocument}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  onUpload={handleUploadDocument}
                  onDelete={handleDeleteDocument}
                  isUploading={isUploading}
                />
              )}

              {currentTab === "assistant" && (
                <div className="flex h-full w-full overflow-hidden">
                  <div className="flex-1 overflow-hidden">
                    <EvidenceAssistant
                      workspaceId={currentWorkspace?.id}
                      currentUser={currentUser}
                      documents={documents}
                      selectedDocumentIds={selectedDocumentIds}
                      onAsk={handleAskQuestion}
                      onSelectCitation={setActiveCitation}
                      activeCitation={activeCitation}
                    />
                  </div>
                  <EvidenceInspector
                    activeCitation={activeCitation}
                    activeEvidence={null}
                    onClose={() => setActiveCitation(null)}
                  />
                </div>
              )}

              {currentTab === "claims" && (
                <ClaimLedger
                  documents={documents}
                  selectedDocumentIds={selectedDocumentIds}
                  onAssess={handleAssessClaims}
                />
              )}

              {currentTab === "radar" && (
                <ContradictionRadar
                  documents={documents}
                  onCompare={handleCompareDocuments}
                />
              )}

              {currentTab === "briefs" && (
                <ResearchBrief
                  documents={documents}
                  selectedDocumentIds={selectedDocumentIds}
                  onGenerateBrief={handleGenerateBrief}
                  onDownloadMarkdown={handleDownloadMarkdown}
                />
              )}

              {currentTab === "evaluation" && (
                <EvaluationDashboard
                  onLoadSummary={handleLoadEvaluationSummary}
                  onRunEvaluation={handleRunEvaluation}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Create Workspace Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-surface border border-border rounded-[10px] shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Create New Workspace</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-[4px] hover:bg-surface-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateWorkspace} className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Financial Audit or Healthcare Guidelines"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-[7px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-[7px] text-xs font-medium text-muted-foreground hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingWorkspace}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[7px] text-xs font-medium bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
                >
                  {isCreatingWorkspace && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Authentication Modal (for switching accounts or signing in) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        canDismiss={!!currentUser}
        initialEmail={authPrefillEmail}
        registeredUsers={users}
      />
    </div>
  );
}
