import type {
  Flow,
  FlowNode,
  FlowEdge,
  NodeLog,
  ExecutionStatus,
  RequestConfig,
} from "@/types";
import { resolveEnvInRequest } from "@/utils/envResolver";
import { CookieJar } from "@/utils/cookieJar";
import { applyDataMappings } from "./dataMapper";
import { sendWithRetry } from "./retryExecutor";
import { validateRequest } from "./requestValidator";

export interface EngineCallbacks {
  onNodeStart: (nodeId: string) => void;
  onNodeComplete: (log: NodeLog) => void;
}

export function getExecutionLevels(
  nodes: FlowNode[],
  edges: FlowEdge[],
): FlowNode[][] {
  if (nodes.length === 0) return [];

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const inDegree = new Map<string, number>();
  const outEdges = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    outEdges.set(node.id, []);
  }

  for (const edge of edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    outEdges.get(edge.source)!.push(edge.target);
  }

  const levels: FlowNode[][] = [];
  let currentWave = nodes.filter((n) => inDegree.get(n.id) === 0);

  if (currentWave.length === 0) {
    throw new Error("Cycle detected in flow — cannot execute");
  }

  let processed = 0;

  while (currentWave.length > 0) {
    levels.push(currentWave);
    processed += currentWave.length;

    const nextWave: FlowNode[] = [];

    for (const node of currentWave) {
      for (const targetId of outEdges.get(node.id) ?? []) {
        const newDegree = (inDegree.get(targetId) ?? 1) - 1;
        inDegree.set(targetId, newDegree);
        if (newDegree === 0) {
          const targetNode = nodeMap.get(targetId);
          if (targetNode) nextWave.push(targetNode);
        }
      }
    }

    currentWave = nextWave;
  }

  if (processed !== nodes.length) {
    throw new Error("Cycle detected in flow — cannot execute");
  }

  return levels;
}

export function getExecutionOrder(
  nodes: FlowNode[],
  edges: FlowEdge[],
): FlowNode[] {
  return getExecutionLevels(nodes, edges).flat();
}

function buildParentMap(edges: FlowEdge[]): Map<string, string[]> {
  const parents = new Map<string, string[]>();
  for (const edge of edges) {
    const list = parents.get(edge.target) ?? [];
    list.push(edge.source);
    parents.set(edge.target, list);
  }
  return parents;
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

async function executeSingleNode(
  node: FlowNode,
  context: Record<string, unknown>,
  cookieJar: CookieJar,
  flow: Flow,
  signal?: AbortSignal,
): Promise<NodeLog> {
  const startedAt = new Date().toISOString();

  let config = buildRequestConfig(node);
  config = resolveEnvInRequest(config, flow.envVariables);
  config = applyDataMappings(config, node.dataMapping, context);

  if (!cookieJar.isEmpty()) {
    const cookieHeader = cookieJar.getCookieHeader();
    if (cookieHeader) {
      const existingCookie = config.headers["Cookie"] || config.headers["cookie"] || "";
      config = {
        ...config,
        headers: {
          ...config.headers,
          Cookie: existingCookie ? `${existingCookie}; ${cookieHeader}` : cookieHeader,
        },
      };
    }
  }

  const validation = validateRequest(config);
  if (!validation.valid) {
    return buildNodeLog(
      node,
      config,
      "error",
      null,
      validation.errors.join("; "),
      startedAt,
      0,
      validation.errors,
    );
  }

  try {
    const { response, attempts } = await sendWithRetry(
      config,
      node.retryConfig,
      signal,
    );
    context[node.id] = response.body;
    cookieJar.parseSetCookieHeaders(response.headers);

    const nodeStatus: ExecutionStatus = response.status >= 400 ? "error" : "success";
    const nodeError = response.status >= 400 ? `HTTP ${response.status}` : null;

    return buildNodeLog(node, config, nodeStatus, response, nodeError, startedAt, attempts, []);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return buildNodeLog(node, config, "error", null, errorMessage, startedAt, 0, []);
  }
}

export async function* executeFlow(
  flow: Flow,
  callbacks: EngineCallbacks,
  signal?: AbortSignal,
): AsyncGenerator<NodeLog[], ExecutionStatus, void> {
  const levels = getExecutionLevels(flow.nodes, flow.edges);

  if (levels.length === 0) {
    return "error" as ExecutionStatus;
  }

  const context: Record<string, unknown> = {};
  const cookieJar = new CookieJar();
  const failedNodes = new Set<string>();
  const parentMap = buildParentMap(flow.edges);

  for (let waveIdx = 0; waveIdx < levels.length; waveIdx++) {
    const wave = levels[waveIdx];

    if (signal?.aborted) {
      for (let w = waveIdx; w < levels.length; w++) {
        const skippedLogs = levels[w].map((node) => {
          const log = buildSkippedLog(node);
          callbacks.onNodeComplete(log);
          return log;
        });
        yield skippedLogs;
      }
      return "error" as ExecutionStatus;
    }

    const toExecute: FlowNode[] = [];
    const waveLogs: NodeLog[] = [];

    for (const node of wave) {
      const parents = parentMap.get(node.id) ?? [];
      if (parents.some((p) => failedNodes.has(p))) {
        failedNodes.add(node.id);
        const log = buildSkippedLog(node);
        callbacks.onNodeComplete(log);
        waveLogs.push(log);
      } else {
        toExecute.push(node);
      }
    }

    if (toExecute.length > 0) {
      const waveSnapshot = cookieJar.clone();

      for (const node of toExecute) {
        callbacks.onNodeStart(node.id);
      }

      const results = await Promise.allSettled(
        toExecute.map((node) => {
          const nodeJar = waveSnapshot.clone();
          return executeSingleNode(node, context, nodeJar, flow, signal).then((log) => ({
            log,
            jar: nodeJar,
          }));
        }),
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          const { log, jar } = result.value;
          cookieJar.merge(jar);
          callbacks.onNodeComplete(log);
          waveLogs.push(log);
          if (log.status === "error") {
            failedNodes.add(log.nodeId);
          }
        }
      }
    }

    yield waveLogs;
  }

  return (failedNodes.size === 0 ? "success" : "error") as ExecutionStatus;
}
