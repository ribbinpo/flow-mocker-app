import type { HttpMethod } from "./flow";

export type ExecutionStatus = "idle" | "running" | "success" | "error" | "skipped";

export interface NodeLog {
  nodeId: string;
  status: ExecutionStatus;
  request: {
    method: HttpMethod;
    url: string;
    headers: Record<string, string>;
    body: string;
  };
  response: {
    status: number;
    headers: Record<string, string>;
    body: unknown;
    latencyMs: number;
  } | null;
  error: string | null;
  retryAttempts: number;
  validationErrors: string[];
  startedAt: string;
  finishedAt: string | null;
}

export interface ExecutionResult {
  flowId: string;
  status: ExecutionStatus;
  logs: NodeLog[];
  startedAt: string;
  finishedAt: string | null;
}
