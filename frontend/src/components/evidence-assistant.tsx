"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Send,
  Loader2,
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  FileQuestion,
  History,
  Plus,
  Trash2,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import {
  DocumentItem,
  GroundedAnswerResponse,
  CitationItem,
  ConversationSummary,
  UserProfile,
} from "@/lib/types";
import { api } from "@/lib/api";

interface MessageItem {
  id: string;
  question: string;
  answerResponse?: GroundedAnswerResponse;
  loading?: boolean;
  error?: string;
}

interface EvidenceAssistantProps {
  workspaceId?: string;
  currentUser?: UserProfile | null;
  documents: DocumentItem[];
  selectedDocumentIds: string[];
  onAsk: (question: string, conversationId?: string) => Promise<GroundedAnswerResponse>;
  onSelectCitation: (citation: CitationItem) => void;
  activeCitation: CitationItem | null;
}

export function EvidenceAssistant({
  workspaceId,
  currentUser,
  documents,
  selectedDocumentIds,
  onAsk,
  onSelectCitation,
  activeCitation,
}: EvidenceAssistantProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [query, setQuery] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const scopedDocs = documents.filter((d) => selectedDocumentIds.includes(d.id));

  // Load conversation list for active workspace
  const loadConversations = useCallback(
    async (selectLatest = false) => {
      if (!workspaceId) return;
      setIsLoadingHistory(true);
      try {
        const list = await api.getConversations(workspaceId, currentUser?.id);
        setConversations(list);
        if (selectLatest && list.length > 0 && !activeConversationId) {
          await loadConversationDetail(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load conversations:", err);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [workspaceId, currentUser?.id, activeConversationId]
  );

  // Load specific conversation messages
  const loadConversationDetail = async (conversationId: string) => {
    if (!workspaceId) return;
    try {
      setActiveConversationId(conversationId);
      const detail = await api.getConversation(workspaceId, conversationId);

      // Group pair messages: user -> assistant
      const loadedMessages: MessageItem[] = [];
      const msgs = detail.messages || [];

      for (let i = 0; i < msgs.length; i++) {
        if (msgs[i].role === "user") {
          const userMsg = msgs[i];
          const nextMsg = msgs[i + 1]?.role === "assistant" ? msgs[i + 1] : null;

          const answerRes: GroundedAnswerResponse | undefined = nextMsg
            ? {
                query_id: nextMsg.id,
                status: nextMsg.status || "answered",
                answer: nextMsg.content,
                citations: nextMsg.citations || [],
                limitations: nextMsg.limitations || [],
                model_metadata: nextMsg.model_metadata || {},
                conversation_id: conversationId,
              }
            : undefined;

          loadedMessages.push({
            id: userMsg.id,
            question: userMsg.content,
            answerResponse: answerRes,
          });

          if (nextMsg) i++; // skip assistant since paired
        }
      }
      setMessages(loadedMessages);
    } catch (err) {
      console.error("Failed to load conversation details:", err);
    }
  };

  // Initial load
  useEffect(() => {
    loadConversations(true);
  }, [workspaceId, currentUser?.id]);

  // Start new conversation
  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setQuery("");
  };

  // Delete a conversation
  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (!workspaceId) return;
    try {
      await api.deleteConversation(workspaceId, conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversationId === conversationId) {
        handleNewConversation();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  // Handle question submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isAsking) return;

    const currentQuery = query.trim();
    setQuery("");
    const messageId = Date.now().toString();

    // Optimistically append user message with loading state
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
      const response = await onAsk(currentQuery, activeConversationId || undefined);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, loading: false, answerResponse: response }
            : m
        )
      );

      // Auto-set active conversation ID
      if (response.conversation_id) {
        setActiveConversationId(response.conversation_id);
      }

      // Refresh conversations list to update titles and message counts
      await loadConversations(false);

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

  const formatTimestamp = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Past Conversations Sidebar Panel */}
      <div
        className={`border-r border-border bg-surface flex flex-col transition-all duration-200 shrink-0 ${
          isSidebarOpen ? "w-[260px]" : "w-0 overflow-hidden"
        }`}
      >
        {/* Panel Header */}
        <div className="p-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <History className="w-4 h-4 text-primary" />
            <span>Past Conversations</span>
          </div>
          <button
            onClick={handleNewConversation}
            title="Start new conversation"
            className="flex items-center gap-1 px-2 py-1 rounded-[6px] text-[11px] font-semibold bg-primary text-primary-foreground hover:bg-primary-hover shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Loading past chats...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-muted-foreground">
              <MessageSquare className="w-6 h-6 mx-auto stroke-1 mb-2 text-muted-foreground/60" />
              <p className="text-xs font-medium text-foreground">No past chats yet</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Every question you ask will automatically be saved here.
              </p>
            </div>
          ) : (
            conversations.map((convo) => {
              const isActive = activeConversationId === convo.id;
              return (
                <div
                  key={convo.id}
                  onClick={() => loadConversationDetail(convo.id)}
                  className={`group flex items-start justify-between p-2.5 rounded-[8px] cursor-pointer text-xs transition-all border ${
                    isActive
                      ? "bg-accent text-accent-foreground border-primary/30 shadow-2xs font-medium"
                      : "text-foreground hover:bg-surface-muted border-transparent"
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-1 flex-1">
                    <span className="font-medium truncate leading-snug">
                      {convo.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTimestamp(convo.updated_at)}
                      </span>
                      <span>•</span>
                      <span>{convo.message_count} msgs</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteConversation(e, convo.id)}
                    title="Delete conversation"
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-danger rounded hover:bg-danger-soft transition-all shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Canvas */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-background">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Hide chat history" : "Show chat history"}
              className="p-1.5 rounded-[7px] text-muted-foreground hover:text-foreground hover:bg-surface-muted border border-border"
            >
              {isSidebarOpen ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <History className="w-4 h-4" />
              )}
            </button>

            <div className="flex items-center gap-2 text-xs">
              <FileCheck className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">Search Scope:</span>
              <span className="text-muted-foreground">
                {scopedDocs.length > 0
                  ? `${scopedDocs.length} PDF(s) active`
                  : `All workspace files (${documents.length})`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeConversationId && (
              <button
                onClick={handleNewConversation}
                className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-xs font-medium text-primary hover:bg-surface-muted transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Question Thread</span>
              </button>
            )}
          </div>
        </div>

        {/* Message Thread Canvas */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-8 text-muted-foreground gap-4 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                <FileQuestion className="w-7 h-7 stroke-1" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Ask Evidence-Grounded Questions
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Every answer is extracted strictly with verbatim excerpts and exact page provenance from your uploaded PDFs. All past conversations are stored permanently for your team.
                </p>
              </div>

              {/* Quick suggestions */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {[
                  "What is this document about?",
                  "Summarize the key conclusions",
                  "What methodology or process is recorded?",
                  "What limitations or risks are stated?",
                ].map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(sug);
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-[8px] border border-border bg-surface hover:bg-surface-muted text-left text-xs text-foreground transition-all group"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate">{sug}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex flex-col gap-4 max-w-[960px] mx-auto w-full animate-in fade-in duration-150">
                {/* Question Bubble */}
                <div className="flex justify-end">
                  <div className="bg-surface-muted text-foreground border border-border rounded-[12px] px-4 py-3 max-w-[85%] text-xs shadow-2xs font-medium">
                    {msg.question}
                  </div>
                </div>

                {/* Answer Card */}
                <div className="flex justify-start">
                  <div className="bg-surface border border-border rounded-[12px] p-5 max-w-[95%] w-full shadow-xs flex flex-col gap-3">
                    {msg.loading && (
                      <div className="flex items-center gap-2.5 text-xs text-muted-foreground py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span>Retrieving passages & verifying citations...</span>
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

                          {(msg.answerResponse.status === "answered" || msg.answerResponse.status === "supported") && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-[11px] font-medium bg-success-soft text-success">
                              <CheckCircle2 className="w-3 h-3" />
                              Grounded & Verified
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
                                Available evidence in the selected documents does not substantiate an answer. ProofLens abstains rather than speculating.
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Main Answer Body */}
                        <div className="text-xs leading-relaxed text-foreground whitespace-pre-wrap select-text">
                          {msg.answerResponse.answer}
                        </div>

                        {/* Server-Validated Citations */}
                        {msg.answerResponse.citations && msg.answerResponse.citations.length > 0 && (
                          <div className="pt-2 border-t border-border flex flex-col gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Verified Provenance Citations ({msg.answerResponse.citations.length})
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {msg.answerResponse.citations.map((c, cIdx) => {
                                const isSelected = activeCitation?.chunk_id === c.chunk_id;
                                const displayOrder = c.citation_order ?? cIdx + 1;
                                return (
                                  <button
                                    key={c.citation_id || c.chunk_id || cIdx}
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
                                      [#{displayOrder}] {c.document_name} (p. {c.page_number})
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

        {/* Input Bar */}
        <div className="p-4 border-t border-border bg-surface shrink-0">
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 max-w-[960px] mx-auto w-full"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about the active PDFs (e.g. What qualifications are listed?)..."
              disabled={isAsking}
              className="flex-1 px-4 py-3 text-xs bg-surface border border-border-strong rounded-[8px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground shadow-xs"
            />
            <button
              type="submit"
              disabled={!query.trim() || isAsking}
              className="flex items-center gap-1.5 px-5 py-3 rounded-[8px] text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-xs"
            >
              {isAsking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
