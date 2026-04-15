import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Loader2, MinusCircle, Play, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NodeLog, ExecutionStatus } from "@/types";
import { EXECUTION } from "@/utils/constants";
import { getMethodStyle } from "@/utils/methodColors";

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

function StartLogHeader({ log, nodeLabel }: NodeLogEntryProps) {
  return (
    <>
      {STATUS_ICON[log.status]}
      <Play className="h-3 w-3 text-green-600" />
      <span className="truncate font-medium text-green-600">{nodeLabel}</span>
      <span className="flex-1 text-xs text-muted-foreground">Flow started</span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {STATUS_LABEL[log.status]}
      </span>
    </>
  );
}

function StoreLogHeader({ log, nodeLabel }: NodeLogEntryProps) {
  return (
    <>
      {STATUS_ICON[log.status]}
      <Database className="h-3 w-3 text-violet-600" />
      <span className="truncate font-medium text-violet-600">{nodeLabel}</span>
      <span className="flex-1 text-xs text-muted-foreground">Variables resolved</span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {STATUS_LABEL[log.status]}
      </span>
    </>
  );
}

function ApiLogHeader({ log, nodeLabel }: NodeLogEntryProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex items-center gap-2">
        {STATUS_ICON[log.status]}
        <span className="truncate font-medium">{nodeLabel}</span>
        {log.request && (
          <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-xs font-bold", getMethodStyle(log.request.method))}>
            {log.request.method}
          </span>
        )}
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
        {log.response && log.response.latencyMs > 0 && (
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
      </div>
      {log.request && (
        <span className="truncate text-xs text-muted-foreground">
          {log.request.url}
        </span>
      )}
    </div>
  );
}

function LogHeader(props: NodeLogEntryProps) {
  switch (props.log.nodeType) {
    case "start":
      return <StartLogHeader {...props} />;
    case "store":
      return <StoreLogHeader {...props} />;
    default:
      return <ApiLogHeader {...props} />;
  }
}

export function NodeLogEntry({ log, nodeLabel }: NodeLogEntryProps) {
  const [expanded, setExpanded] = useState(false);

  const isExpandable = log.nodeType === "api" || (log.nodeType === "store" && log.response !== null);

  return (
    <div className="rounded-md border bg-card">
      <button
        type="button"
        onClick={() => isExpandable && setExpanded(!expanded)}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
          isExpandable && "hover:bg-accent/50",
        )}
      >
        {isExpandable ? (
          expanded ? (
            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          )
        ) : (
          <div className="h-3 w-3 shrink-0" />
        )}
        <LogHeader log={log} nodeLabel={nodeLabel} />
      </button>

      {expanded && log.nodeType === "store" && log.response && (
        <div className="space-y-2 border-t px-3 py-2">
          <div>
            <p className="mb-1 text-xs font-medium text-violet-600">
              Resolved Variables
            </p>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded bg-violet-50 p-2 font-mono text-xs text-violet-800">
              {JSON.stringify(log.response.body, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {expanded && log.nodeType === "api" && (
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
              <pre className="whitespace-pre-wrap break-all rounded bg-destructive/10 p-2 text-xs text-destructive">
                {log.error}
              </pre>
            </div>
          )}

          {log.request && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                {EXECUTION.REQUEST_SECTION}
              </p>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded bg-muted p-2 font-mono text-xs">
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
          )}

          {log.response && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                {EXECUTION.RESPONSE_SECTION}
              </p>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded bg-muted p-2 font-mono text-xs">
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
