"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Play,
  Loader2,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { EvaluationSummaryResponse } from "@/lib/types";

interface EvaluationDashboardProps {
  onLoadSummary: () => Promise<EvaluationSummaryResponse | null>;
  onRunEvaluation: () => Promise<EvaluationSummaryResponse>;
}

export function EvaluationDashboard({
  onLoadSummary,
  onRunEvaluation,
}: EvaluationDashboardProps) {
  const [data, setData] = useState<EvaluationSummaryResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchSummary = async () => {
      try {
        const res = await onLoadSummary();
        if (mounted && res) setData(res);
      } catch (err: unknown) {
        console.warn("No evaluation runs yet:", err);
      }
    };
    fetchSummary();
    return () => {
      mounted = false;
    };
  }, [onLoadSummary]);

  const handleRunSuite = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await onRunEvaluation();
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to execute evaluation suite";
      setError(msg);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Trust & Quality Evaluation Suite
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated empirical audit measuring retrieval precision, citation validity, and hallucination abstention.
          </p>
        </div>
        <button
          onClick={handleRunSuite}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-4 py-2 rounded-[7px] text-xs font-medium bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-xs self-start"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Auditing Benchmark Cases...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Run Benchmark Suite</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-[7px] bg-danger-soft text-danger text-xs border border-danger/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Retrieval Hit Rate */}
        <div className="bg-surface border border-border rounded-[10px] p-5 shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Retrieval Hit Rate
            </span>
            <span className="text-[10px] text-muted-foreground font-medium bg-surface-muted px-1.5 py-0.5 rounded-[4px]">
              Target: &ge; 80%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {data ? `${data.retrieval_hit_rate.toFixed(1)}%` : "—"}
          </div>
          <span className="text-[11px] text-muted-foreground">
            Top-5 retrieved chunks contain required ground-truth evidence passages.
          </span>
        </div>

        {/* Metric 2: Citation Validity */}
        <div className="bg-surface border border-border rounded-[10px] p-5 shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Citation Validity
            </span>
            <span className="text-[10px] text-muted-foreground font-medium bg-surface-muted px-1.5 py-0.5 rounded-[4px]">
              Target: &ge; 95%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {data ? `${data.citation_validity_rate.toFixed(1)}%` : "—"}
          </div>
          <span className="text-[11px] text-muted-foreground">
            Citations mapped strictly to retrieved evidence; hallucinated references stripped.
          </span>
        </div>

        {/* Metric 3: Abstention Correctness */}
        <div className="bg-surface border border-border rounded-[10px] p-5 shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Abstention Rate
            </span>
            <span className="text-[10px] text-muted-foreground font-medium bg-surface-muted px-1.5 py-0.5 rounded-[4px]">
              Target: &ge; 90%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {data ? `${data.abstention_success_rate.toFixed(1)}%` : "—"}
          </div>
          <span className="text-[11px] text-muted-foreground">
            Correctly returns insufficient_evidence when query is unsubstantiated.
          </span>
        </div>

        {/* Metric 4: Average Latency */}
        <div className="bg-surface border border-border rounded-[10px] p-5 shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Avg Latency
            </span>
            <span className="text-[10px] text-muted-foreground font-medium bg-surface-muted px-1.5 py-0.5 rounded-[4px]">
              Target: &le; 5000ms
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {data ? `${data.average_latency_ms.toFixed(0)} ms` : "—"}
          </div>
          <span className="text-[11px] text-muted-foreground">
            End-to-end vector retrieval, LLM synthesis, and citation validation latency.
          </span>
        </div>
      </div>

      {/* Benchmark Results Table (if run executed) */}
      {data && data.results && data.results.length > 0 && (
        <div className="bg-surface border border-border rounded-[10px] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border bg-surface-muted/40 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground">
              Audit Case Logs ({data.results.length} Test Cases)
            </h3>
            <span className="text-[11px] text-muted-foreground font-mono">
              Run ID: {data.run_id.slice(0, 8)}...
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface text-muted-foreground font-semibold">
                  <th className="py-3 px-4 w-12 text-center">Result</th>
                  <th className="py-3 px-4">Evaluation Query</th>
                  <th className="py-3 px-4 w-36">Expected Behaviour</th>
                  <th className="py-3 px-4 w-32">Actual Status</th>
                  <th className="py-3 px-4 w-28">Latency</th>
                  <th className="py-3 px-4">Audit Provenance Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.results.map((r) => (
                  <tr key={r.case_id} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="py-3 px-4 text-center">
                      {r.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-success inline-block" />
                      ) : (
                        <XCircle className="w-4 h-4 text-danger inline-block" />
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      {r.question}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                      {r.expected_behaviour}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <span className={r.passed ? "text-success font-medium" : "text-danger font-medium"}>
                        {r.actual_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                      {r.latency_ms.toFixed(1)} ms
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-[11px]">
                      {r.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Provenance Card */}
      <div className="bg-surface border border-border rounded-[10px] p-5 shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold text-foreground">
            Benchmark Methodology & Provenance
          </h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Evaluations are executed against curated test cases defined in{" "}
          <code className="text-foreground font-mono bg-surface-muted px-1 py-0.5 rounded">
            backend/evals/cases.json
          </code>
          . ProofLens measures empirical precision on page-level evidence chunks without fabricating metrics.
        </p>
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground pt-2 border-t border-border">
          <span>
            Total Benchmark Cases:{" "}
            <strong className="text-foreground font-mono">{data?.sample_count ?? 3}</strong>
          </span>
          {data?.created_at && (
            <span>
              Last Audit Run:{" "}
              <strong className="text-foreground">
                {new Date(data.created_at).toLocaleString()}
              </strong>
            </span>
          )}
          <span>
            Provider Model:{" "}
            <strong className="text-foreground font-mono">
              gemini-2.5-flash / text-embedding-004
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}

