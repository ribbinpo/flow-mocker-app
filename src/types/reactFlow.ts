import type { Node, Edge } from "@xyflow/react";
import type { FlowNode, FlowEdge, HttpMethod } from "./flow";

export interface ApiNodeData {
  label: string;
  method: HttpMethod;
  url: string;
  [key: string]: unknown;
}

export type ApiFlowNode = Node<ApiNodeData, "apiNode">;

export function toReactFlowNode(node: FlowNode): ApiFlowNode {
  return {
    id: node.id,
    type: "apiNode",
    position: node.position,
    data: {
      label: node.label,
      method: node.method,
      url: node.url,
    },
  };
}

export function toReactFlowEdge(edge: FlowEdge): Edge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    animated: true,
  };
}
