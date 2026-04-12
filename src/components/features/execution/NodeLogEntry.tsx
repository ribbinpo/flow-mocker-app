import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Loader2, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NodeLog, ExecutionStatus } from "@/types";
import { EXECUTION } from "@/utils/constants";

const STATUS_ICON: Record<ExecutionStatus, React.ReactNode> = {
  idle: null,
  running: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
  success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  error: <XCircle className="h-4 w-4 text-destructive" />,
  skipped: <MinusCircle className="h-4 w-4 text-muted-foreground" />,
};

const STATUS_LABEL: Record<ExecutionStatus, string> = {
  idle: EXECUTION.STATUS_IDLE,
  running: EXECUTION.STATUS_RUNNING,
  success: EXECUTION.STATUS_SUCCESS,
  error: EXECUTION.STATUS_ERROR,
  skipped: EXECUTION.STATUS_SKIPPED,
};

interface NodeLogEntryProps {
  log: NodeLog;
  nodeLabel: string;
}

export function NodeLogEntry({ log, nodeLabel }: NodeLogEntryProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border bg-card">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent/50"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        {STATUS_ICON[log.status]}
        <span className="truncate font-medium">{nodeLabel}</span>
        <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-bold">
          {log.request.method}
        </span>
        <span className="flex-1 truncate text-xs text-muted-foreground">
          {log.request.url}
        </span>
        {log.response && (
          <span
            className={cn(
              "shrink-0 text-xs font-medium",
              log.response.status >= 200 && log.response.status < 300
                ? "text-green-600"
                : "text-destructive",
            )}
          >
            {log.response.status}
          </span>
        )}
        {log.response && (
          <span className="shrink-0 text-xs text-muted-foreground">
            {log.response.latencyMs}
            {EXECUTION.LATENCY_SUFFIX}
          </span>
        )}
        {log.retryAttempts > 1 && (
          <span className="shrink-0 rounded bg-amber-100 px-1 text-xs font-medium text-amber-700">
            {log.retryAttempts} {EXECUTION.RETRY_ATTEMPTS_LABEL}
          </span>
        )}
        <span className="shrink-0 text-xs text-muted-foreground">
          {STATUS_LABEL[log.status]}
        </span>
      </button>

      {expanded && (
        <div className="space-y-2 border-t px-3 py-2">
          {log.validationErrors.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-amber-600">
                {EXECUTION.VALIDATION_ERRORS_SECTION}
              </p>
              <ul className="list-inside list-disc rounded bg-amber-50 p-2 text-xs text-amber-700">
                {log.validationErrors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {log.error && (
            <div>
              <p className="mb-1 text-xs font-medium text-destructive">
                {EXECUTION.ERROR_SECTION}
              </p>
              <pre className="rounded bg-destructive/10 p-2 text-xs text-destructive">
                {log.error}
              </pre>
            </div>
          )}

          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {EXECUTION.REQUEST_SECTION}
            </p>
            <pre className="max-h-32 overflow-auto rounded bg-muted p-2 font-mono text-xs">
              {JSON.stringify(
                {
                  method: log.request.method,
                  url: log.request.url,
                  headers: log.request.headers,
                  body: log.request.body || undefined,
                },
                null,
                2,
              )}
            </pre>
          </div>

          {log.response && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                {EXECUTION.RESPONSE_SECTION}
              </p>
              <pre className="max-h-32 overflow-auto rounded bg-muted p-2 font-mono text-xs">
                {JSON.stringify(
                  {
                    status: log.response.status,
                    headers: log.response.headers,
                    body: log.response.body,
                    latencyMs: log.response.latencyMs,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NodeLogEntry;
