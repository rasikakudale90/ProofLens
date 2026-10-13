"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sidebar, NavTab } from "@/components/sidebar";
import { Header } from "@/components/header";
import { DocumentLibrary } from "@/components/document-library";
import { EvidenceAssistant } from "@/components/evidence-assistant";
import { EvidenceInspector } from "@/components/evidence-inspector";
import { api } from "@/lib/api";
import { Workspace, DocumentItem, CitationItem, GroundedAnswerResponse } from "@/lib/types";
import { Plus, X, Loader2, AlertCircle } from "lucide-react";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<NavTab>("documents");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [activeCitation, setActiveCitation] = useState<CitationItem | null>(null);

  // Ask Question handler
  const handleAskQuestion = async (question: string): Promise<GroundedAnswerResponse> => {
    if (!currentWorkspace) throw new Error("No active workspace selected.");
    return api.askQuestion(
      currentWorkspace.id,
      question,
      selectedDocumentIds.length > 0 ? selectedDocumentIds : undefined
    );
  };

  // New Workspace Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  // 1. Initial health and workspace load
  const loadInitialData = useCallback(async () => {
    try {
      const readyRes = await api.getReady();
      setBackendOnline(readyRes.status === "ready");

      const wsList = await api.getWorkspaces();
      if (wsList.length > 0) {
        setWorkspaces(wsList);
        setCurrentWorkspace(wsList[0]);
      } else {
        // Create default workspace if none exists
        const defaultWs = await api.createWorkspace("ProofLens Default Investigation");
        setWorkspaces([defaultWs]);
        setCurrentWorkspace(defaultWs);
      }
    } catch (err) {
      console.error("Failed to connect to backend:", err);
      setBackendOnline(false);
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Load documents when active workspace changes
  const loadDocuments = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      const docs = await api.getDocuments(currentWorkspace.id);
      setDocuments(docs);
      // Automatically scope all ready documents by default if not set
      setSelectedDocumentIds((prev) => {
        if (prev.length === 0) {
          return docs.filter((d) => d.status === "ready").map((d) => d.id);
        }
        // Filter out any IDs no longer in list
        return prev.filter((id) => docs.some((d) => d.id === id));
      });
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (currentWorkspace) {
      loadDocuments();
    }
  }, [currentWorkspace, loadDocuments]);

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

  // 4. Create Workspace
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setIsCreatingWorkspace(true);
    try {
      const created = await api.createWorkspace(newWorkspaceName.trim());
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Left Application Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onWorkspaceChange={setCurrentWorkspace}
        onOpenCreateWorkspace={() => setIsCreateModalOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        backendOnline={backendOnline}
      />

      {/* Main Workspace Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <Header
          currentTab={currentTab}
          workspaceName={currentWorkspace?.name}
          selectedDocuments={selectedDocs}
          totalDocuments={documents.length}
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
                  <div className="flex-1 overflow-y-auto">
                    <EvidenceAssistant
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

              {currentTab !== "documents" && currentTab !== "assistant" && (
                <div className="p-8 max-w-[1200px] mx-auto text-center flex flex-col items-center justify-center min-h-[500px] gap-3">
                  <div className="p-4 rounded-full bg-surface-muted text-primary">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    Tab Under Construction (Next Phase)
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-md">
                    You are in Phase 3. The Document Library, Evidence Assistant, and Evidence Inspector are active. Next phase implements Claim Ledger and Contradiction Radar.
                  </p>
                </div>
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
    </div>
  );
}
