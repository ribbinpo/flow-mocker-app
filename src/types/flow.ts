export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface DataMapping {
  sourceNodeId: string;
  sourcePath: string;
  targetField: "header" | "query" | "body" | "url";
  targetKey: string;
}

export interface FlowNode {
  id: string;
  label: string;
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: string;
  dataMapping: DataMapping[];
  position: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
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
