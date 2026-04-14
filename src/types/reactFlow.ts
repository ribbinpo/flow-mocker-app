import type { Node, Edge } from "@xyflow/react";
import type { FlowNode, FlowEdge, HttpMethod } from "./flow";

export interface ApiNodeData {
  label: string;
  method: HttpMethod;
  url: string;
  [key: string]: unknown;
}

export type ApiFlowNode = Node<ApiNodeData, "apiNode">;

export interface StartNodeData {
  label: string;
  [key: string]: unknown;
}

export type StartFlowNode = Node<StartNodeData, "startNode">;

export interface StoreNodeData {
  label: string;
  variableNames: string[];
  [key: string]: unknown;
}

export type StoreFlowNode = Node<StoreNodeData, "storeNode">;

export type FlowReactNode = ApiFlowNode | StartFlowNode | StoreFlowNode;

export function toReactFlowNode(node: FlowNode): FlowReactNode {
  switch (node.type) {
    case "start":
      return {
        id: node.id,
        type: "startNode",
        position: node.position,
        data: {
          label: node.label,
        },
      };
    case "store":
      return {
        id: node.id,
        type: "storeNode",
        position: node.position,
        data: {
          label: node.label,
          variableNames: node.variables.map((v) => v.name),
        },
      };
    case "api":
    default:
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
}

export function toReactFlowEdge(edge: FlowEdge): Edge {
  if (edge.edgeType === "variable") {
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: false,
      style: { strokeDasharray: "5,5", stroke: "#8b5cf6" },
      label: edge.sourceVariable ?? "",
      labelStyle: { fontSize: 10, fill: "#8b5cf6" },
    };
  }

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    animated: true,
  };
}
