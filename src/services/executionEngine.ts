import type {
  Flow,
  FlowNode,
  FlowEdge,
  ApiNode,
  StoreNode,
  NodeLog,
  ExecutionStatus,
  RequestConfig,
} from "@/types";
import { isApiNode, isStoreNode, isStartNode } from "@/types";
import { resolveEnvInRequest } from "@/utils/envResolver";
import { resolveStoreVariablesInRequest } from "@/utils/storeResolver";
import { CookieJar } from "@/utils/cookieJar";
import { resolveJsonPath } from "@/utils/jsonPath";
import { applyDataMappings } from "./dataMapper";
import { sendWithRetry } from "./retryExecutor";
import { validateRequest } from "./requestValidator";

export interface EngineCallbacks {
  onNodeStart: (nodeId: string) => void;
  onNodeComplete: (log: NodeLog) => void;
}

/**
 * BFS from Start node to find all reachable nodes.
 */
function getReachableNodes(
  nodes: FlowNode[],
  edges: FlowEdge[],
): FlowNode[] {
  const startNode = nodes.find(isStartNode);
  if (!startNode) return nodes; // graceful fallback for old flows

  const adj = new Map<string, string[]>();
  for (const edge of edges) {
    const list = adj.get(edge.source) ?? [];
    list.push(edge.target);
    adj.set(edge.source, list);
  }

  const visited = new Set<string>();
  const queue = [startNode.id];
  visited.add(startNode.id);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const targetId of adj.get(current) ?? []) {
      if (!visited.has(targetId)) {
        visited.add(targetId);
        queue.push(targetId);
      }
    }
  }

  return nodes.filter((n) => visited.has(n.id));
}

export function getExecutionLevels(
  nodes: FlowNode[],
  edges: FlowEdge[],
): FlowNode[][] {
  if (nodes.length === 0) return [];

  // Only execute nodes reachable from Start node
  const reachable = getReachableNodes(nodes, edges);
  const reachableIds = new Set(reachable.map((n) => n.id));
  const reachableEdges = edges.filter(
    (e) => reachableIds.has(e.source) && reachableIds.has(e.target),
  );

  const nodeMap = new Map(reachable.map((n) => [n.id, n]));
  const inDegree = new Map<string, number>();
  const outEdges = new Map<string, string[]>();

  for (const node of reachable) {
    inDegree.set(node.id, 0);
    outEdges.set(node.id, []);
  }

  for (const edge of reachableEdges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    outEdges.get(edge.source)!.push(edge.target);
  }

  const levels: FlowNode[][] = [];
  let currentWave = reachable.filter((n) => inDegree.get(n.id) === 0);

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

  if (processed !== reachable.length) {
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

function buildRequestConfig(node: ApiNode): RequestConfig {
  return {
    method: node.method,
    url: node.url,
    headers: { ...node.headers },
    queryParams: { ...node.queryParams },
    body: node.body,
  };
}

function buildNodeLog(
  node: ApiNode,
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
    nodeType: node.type,
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
  const now = new Date().toISOString();

  if (isApiNode(node)) {
    return {
      nodeId: node.id,
      nodeType: node.type,
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
      startedAt: now,
      finishedAt: now,
    };
  }

  return {
    nodeId: node.id,
    nodeType: node.type,
    status: "skipped",
    request: null,
    response: null,
    error: null,
    retryAttempts: 0,
    validationErrors: [],
    startedAt: now,
    finishedAt: now,
  };
}

function buildPassthroughLog(node: FlowNode): NodeLog {
  const now = new Date().toISOString();
  return {
    nodeId: node.id,
    nodeType: node.type,
    status: "success",
    request: null,
    response: null,
    error: null,
    retryAttempts: 0,
    validationErrors: [],
    startedAt: now,
    finishedAt: now,
  };
}

function executeStoreNode(
  node: StoreNode,
  context: Record<string, unknown>,
): NodeLog {
  const now = new Date().toISOString();
  const storeResult: Record<string, unknown> = {};

  for (const variable of node.variables) {
    const sourceData = context[variable.sourceNodeId];
    console.log(sourceData, '=>', resolveJsonPath(sourceData, variable.sourcePath));
    if (sourceData !== undefined) {
      storeResult[variable.name] = resolveJsonPath(sourceData, variable.sourcePath);
    }
  }

  context[node.id] = storeResult;

  return {
    nodeId: node.id,
    nodeType: node.type,
    status: "success",
    request: null,
    response: {
      status: 0,
      headers: {},
      body: storeResult,
      latencyMs: 0,
    },
    error: null,
    retryAttempts: 0,
    validationErrors: [],
    startedAt: now,
    finishedAt: now,
  };
}

async function executeSingleNode(
  node: ApiNode,
  context: Record<string, unknown>,
  cookieJar: CookieJar,
  flow: Flow,
  signal?: AbortSignal,
): Promise<NodeLog> {
  const startedAt = new Date().toISOString();

  let config = buildRequestConfig(node);
  config = resolveEnvInRequest(config, flow.envVariables);
  config = resolveStoreVariablesInRequest(config, context);
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

function executeNodeInWave(
  node: FlowNode,
  context: Record<string, unknown>,
  waveSnapshot: CookieJar,
  flow: Flow,
  signal?: AbortSignal,
): Promise<{ log: NodeLog; jar: CookieJar }> {
  if (isApiNode(node)) {
    const nodeJar = waveSnapshot.clone();
    return executeSingleNode(node, context, nodeJar, flow, signal).then((log) => ({
      log,
      jar: nodeJar,
    }));
  }

  if (isStoreNode(node)) {
    const log = executeStoreNode(node, context);
    return Promise.resolve({ log, jar: waveSnapshot.clone() });
  }

  // Start node or unknown — passthrough
  const log = buildPassthroughLog(node);
  return Promise.resolve({ log, jar: waveSnapshot.clone() });
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
        toExecute.map((node) => executeNodeInWave(node, context, waveSnapshot, flow, signal)),
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
