import type {
  Flow,
  FlowNode,
  FlowEdge,
  NodeLog,
  ExecutionStatus,
  RequestConfig,
} from "@/types";
import { resolveEnvInRequest } from "@/utils/envResolver";
import { applyDataMappings } from "./dataMapper";
import { sendWithRetry } from "./retryExecutor";
import { validateRequest } from "./requestValidator";

export interface EngineCallbacks {
  onNodeStart: (nodeId: string) => void;
  onNodeComplete: (log: NodeLog) => void;
}

export function getExecutionOrder(
  nodes: FlowNode[],
  edges: FlowEdge[],
): FlowNode[] {
  if (nodes.length === 0) return [];

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const inDegree = new Map<string, number>();
  const outEdges = new Map<string, string>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    outEdges.set(edge.source, edge.target);
  }

  const starts = nodes.filter((n) => inDegree.get(n.id) === 0);

  if (starts.length === 0) {
    throw new Error("Cycle detected in flow — cannot execute");
  }

  const order: FlowNode[] = [];
  const visited = new Set<string>();

  let current: string | undefined = starts[0].id;
  while (current) {
    if (visited.has(current)) {
      throw new Error("Cycle detected in flow — cannot execute");
    }
    visited.add(current);

    const node = nodeMap.get(current);
    if (node) order.push(node);

    current = outEdges.get(current);
  }

  for (const start of starts.slice(1)) {
    if (!visited.has(start.id)) {
      let cursor: string | undefined = start.id;
      while (cursor) {
        if (visited.has(cursor)) break;
        visited.add(cursor);
        const node = nodeMap.get(cursor);
        if (node) order.push(node);
        cursor = outEdges.get(cursor);
      }
    }
  }

  return order;
}

function buildRequestConfig(node: FlowNode): RequestConfig {
  return {
    method: node.method,
    url: node.url,
    headers: { ...node.headers },
    queryParams: { ...node.queryParams },
    body: node.body,
  };
}

function buildNodeLog(
  node: FlowNode,
  config: RequestConfig,
  status: ExecutionStatus,
  response: { status: number; headers: Record<string, string>; body: unknown; latencyMs: number } | null,
  error: string | null,
  startedAt: string,
  retryAttempts: number,
  validationErrors: string[],
): NodeLog {
  return {
    nodeId: node.id,
    status,
    request: {
      method: config.method,
      url: config.url,
      headers: config.headers,
      body: config.body,
    },
    response,
    error,
    retryAttempts,
    validationErrors,
    startedAt,
    finishedAt: new Date().toISOString(),
  };
}

function buildSkippedLog(node: FlowNode): NodeLog {
  return {
    nodeId: node.id,
    status: "skipped",
    request: {
      method: node.method,
      url: node.url,
      headers: node.headers,
      body: node.body,
    },
    response: null,
    error: null,
    retryAttempts: 0,
    validationErrors: [],
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
  };
}

export async function* executeFlow(
  flow: Flow,
  callbacks: EngineCallbacks,
  signal?: AbortSignal,
): AsyncGenerator<NodeLog, ExecutionStatus, void> {
  const order = getExecutionOrder(flow.nodes, flow.edges);

  if (order.length === 0) {
    return "error" as ExecutionStatus;
  }

  const context: Record<string, unknown> = {};

  for (let i = 0; i < order.length; i++) {
    const node = order[i];

    if (signal?.aborted) {
      for (let j = i; j < order.length; j++) {
        const skippedLog = buildSkippedLog(order[j]);
        callbacks.onNodeComplete(skippedLog);
        yield skippedLog;
      }
      return "error" as ExecutionStatus;
    }

    callbacks.onNodeStart(node.id);
    const startedAt = new Date().toISOString();

    let config = buildRequestConfig(node);
    config = resolveEnvInRequest(config, flow.envVariables);
    config = applyDataMappings(config, node.dataMapping, context);

    // Validate request before sending
    const validation = validateRequest(config);
    if (!validation.valid) {
      const log = buildNodeLog(
        node,
        config,
        "error",
        null,
        validation.errors.join("; "),
        startedAt,
        0,
        validation.errors,
      );
      callbacks.onNodeComplete(log);
      yield log;

      for (let j = i + 1; j < order.length; j++) {
        const skippedLog = buildSkippedLog(order[j]);
        callbacks.onNodeComplete(skippedLog);
        yield skippedLog;
      }

      return "error" as ExecutionStatus;
    }

    try {
      const { response, attempts } = await sendWithRetry(
        config,
        node.retryConfig,
        signal,
      );
      context[node.id] = response.body;

      const log = buildNodeLog(node, config, "success", response, null, startedAt, attempts, []);
      callbacks.onNodeComplete(log);
      yield log;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const log = buildNodeLog(node, config, "error", null, errorMessage, startedAt, 0, []);
      callbacks.onNodeComplete(log);
      yield log;

      for (let j = i + 1; j < order.length; j++) {
        const skippedLog = buildSkippedLog(order[j]);
        callbacks.onNodeComplete(skippedLog);
        yield skippedLog;
      }

      return "error" as ExecutionStatus;
    }
  }

  return "success" as ExecutionStatus;
}
