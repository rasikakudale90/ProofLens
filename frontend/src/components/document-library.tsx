"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCheck2,
} from "lucide-react";
import { DocumentItem } from "@/lib/types";

interface DocumentLibraryProps {
  documents: DocumentItem[];
  selectedDocumentIds: string[];
  onToggleSelectDocument: (docId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onUpload: (file: File) => Promise<void>;
  onDelete: (docId: string) => Promise<void>;
  isUploading: boolean;
}

export function DocumentLibrary({
  documents,
  selectedDocumentIds,
  onToggleSelectDocument,
  onSelectAll,
  onDeselectAll,
  onUpload,
  onDelete,
  isUploading,
}: DocumentLibraryProps) {
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await validateAndUpload(file);
      e.target.value = "";
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await validateAndUpload(file);
    }
  };

  const validateAndUpload = async (file: File) => {
    setErrorMessage(null);
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Only PDF documents are supported (.pdf).");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage("Uploaded PDF exceeds the maximum 25 MB limit.");
      return;
    }
    try {
      await onUpload(file);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setErrorMessage(msg);
    }
  };

  const handleDeleteClick = async (docId: string) => {
    if (confirm("Are you sure you want to delete this document and all its extracted chunks?")) {
      setDeletingId(docId);
      try {
        await onDelete(docId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const allSelected = documents.length > 0 && selectedDocumentIds.length === documents.length;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1440px] mx-auto w-full">
      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-[10px] p-8 text-center cursor-pointer transition-all duration-150 ${
          dragOver
            ? "border-primary bg-accent/30"
            : "border-border hover:border-primary/50 bg-surface"
        } ${isUploading ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center text-primary">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {isUploading ? "Extracting & Embedding PDF..." : "Upload PDF Document"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Drag and drop your file here, or click to browse. Max file size: 25 MB.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-[7px] bg-danger-soft text-danger text-xs border border-danger/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Document Library Table */}
      <div className="bg-surface rounded-[10px] border border-border shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-muted/50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-foreground">
              Documents ({documents.length})
            </span>
            {documents.length > 0 && (
              <button
                onClick={allSelected ? onDeselectAll : onSelectAll}
                className="text-xs text-primary hover:underline font-medium"
              >
                {allSelected ? "Deselect All" : "Select All for Scope"}
              </button>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {selectedDocumentIds.length} document(s) in active investigation scope
          </span>
        </div>

        {/* Documents List */}
        {documents.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
            <FileText className="w-10 h-10 text-muted-foreground/40 stroke-1" />
            <p className="text-sm font-medium text-foreground">No documents uploaded yet</p>
            <p className="text-xs max-w-sm text-muted-foreground">
              Upload your first PDF document to begin asking grounded questions and auditing claims.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface text-muted-foreground font-medium">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={allSelected ? onDeselectAll : onSelectAll}
                      className="rounded accent-primary cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4 font-semibold">Document</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Pages</th>
                  <th className="py-3 px-4 font-semibold">Size</th>
                  <th className="py-3 px-4 font-semibold">Uploaded</th>
                  <th className="py-3 px-4 w-12 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {documents.map((doc) => {
                  const isSelected = selectedDocumentIds.includes(doc.id);
                  return (
                    <tr
                      key={doc.id}
                      className={`hover:bg-surface-muted/60 transition-colors ${
                        isSelected ? "bg-accent/15" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelectDocument(doc.id)}
                          className="rounded accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <FileCheck2 className="w-4 h-4 text-primary shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-foreground truncate max-w-[280px]">
                              {doc.filename}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              ID: {doc.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {doc.status === "ready" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-success-soft text-success">
                            <CheckCircle2 className="w-3 h-3" />
                            Ready
                          </span>
                        )}
                        {doc.status === "processing" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-warning-soft text-warning">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Processing
                          </span>
                        )}
                        {doc.status === "failed" && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-danger-soft text-danger cursor-help"
                            title={doc.error_message || "Processing failed"}
                          >
                            <AlertCircle className="w-3 h-3" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-tabular-nums">
                        {doc.page_count ?? "—"}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-tabular-nums">
                        {formatSize(doc.size_bytes)}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-tabular-nums">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteClick(doc.id)}
                          disabled={deletingId === doc.id}
                          className="p-1.5 rounded-[4px] text-muted-foreground hover:text-danger hover:bg-danger-soft/40 transition-colors"
                          title="Delete document and chunks"
                        >
                          {deletingId === doc.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-danger" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
