export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type NodeType = "api" | "start" | "store";

export interface DataMapping {
  sourceNodeId: string;
  sourcePath: string;
  targetField: "header" | "query" | "body" | "url";
  targetKey: string;
}

export interface RetryConfig {
  maxRetries: number;
  delayMs: number;
}

interface BaseNode {
  id: string;
  type: NodeType;
  label: string;
  position: { x: number; y: number };
}

export interface ApiNode extends BaseNode {
  type: "api";
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: string;
  dataMapping: DataMapping[];
  retryConfig?: RetryConfig;
}

export interface StartNode extends BaseNode {
  type: "start";
}

export interface StoreVariable {
  id: string;
  name: string;
  sourceNodeId: string;
  sourcePath: string;
}

export interface StoreNode extends BaseNode {
  type: "store";
  variables: StoreVariable[];
}

export type FlowNode = ApiNode | StartNode | StoreNode;

export function isApiNode(node: FlowNode): node is ApiNode {
  return node.type === "api";
}

export function isStartNode(node: FlowNode): node is StartNode {
  return node.type === "start";
}

export function isStoreNode(node: FlowNode): node is StoreNode {
  return node.type === "store";
}

export type EdgeType = "sequence" | "data";

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  edgeType?: EdgeType;
}

export function isSequenceEdge(edge: FlowEdge): boolean {
  return !edge.edgeType || edge.edgeType === "sequence";
}

export function isDataEdge(edge: FlowEdge): boolean {
  return edge.edgeType === "data";
}

export interface Flow {
  id: string;
  name: string;
  description: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  envVariables: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}
