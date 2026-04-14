import type { FlowNode, FlowEdge } from "@/types";
import { isApiNode, isStoreNode, isDataEdge } from "@/types";

/**
 * Returns the set of node IDs that execute before the given node,
 * following both sequence and data edges (both establish execution order).
 */
export function getUpstreamNodeIds(
  nodeId: string,
  _nodes: FlowNode[],
  edges: FlowEdge[],
): Set<string> {
  // Both sequence and data edges establish execution order
  const reverseAdj = new Map<string, string[]>();
  for (const edge of edges) {
    const list = reverseAdj.get(edge.target) ?? [];
    list.push(edge.source);
    reverseAdj.set(edge.target, list);
  }

  const upstream = new Set<string>();
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.pop()!;
    const parents = reverseAdj.get(current) ?? [];
    for (const parentId of parents) {
      if (!upstream.has(parentId)) {
        upstream.add(parentId);
        queue.push(parentId);
      }
    }
  }

  return upstream;
}

export interface CleanupResult {
  removedVariableCount: number;
  removedMappingCount: number;
  removedEdgeIds: string[];
}

/**
 * Validates all variable references in a flow and returns what should be removed.
 */
export function findInvalidReferences(
  nodes: FlowNode[],
  edges: FlowEdge[],
): CleanupResult {
  const result: CleanupResult = {
    removedVariableCount: 0,
    removedMappingCount: 0,
    removedEdgeIds: [],
  };

  for (const node of nodes) {
    const upstream = getUpstreamNodeIds(node.id, nodes, edges);

    if (isStoreNode(node)) {
      for (const variable of node.variables) {
        if (variable.sourceNodeId && !upstream.has(variable.sourceNodeId)) {
          result.removedVariableCount++;
        }
      }
    }

    if (isApiNode(node)) {
      for (const mapping of node.dataMapping) {
        if (mapping.sourceNodeId && !upstream.has(mapping.sourceNodeId)) {
          result.removedMappingCount++;
        }
      }
    }
  }

  // Check data edges — source and target nodes must exist
  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const edge of edges) {
    if (isDataEdge(edge)) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        result.removedEdgeIds.push(edge.id);
      }
    }
  }

  return result;
}

/**
 * Returns cleaned nodes and edges with invalid references removed.
 */
export function cleanInvalidReferences(
  nodes: FlowNode[],
  edges: FlowEdge[],
): { nodes: FlowNode[]; edges: FlowEdge[]; totalRemoved: number } {
  let totalRemoved = 0;

  const cleanedNodes = nodes.map((node) => {
    const upstream = getUpstreamNodeIds(node.id, nodes, edges);

    if (isStoreNode(node)) {
      const validVars = node.variables.filter((v) => !v.sourceNodeId || upstream.has(v.sourceNodeId));
      const removed = node.variables.length - validVars.length;
      totalRemoved += removed;
      if (removed > 0) {
        return { ...node, variables: validVars };
      }
    }

    if (isApiNode(node)) {
      const validMappings = node.dataMapping.filter((dm) => !dm.sourceNodeId || upstream.has(dm.sourceNodeId));
      const removed = node.dataMapping.length - validMappings.length;
      totalRemoved += removed;
      if (removed > 0) {
        return { ...node, dataMapping: validMappings };
      }
    }

    return node;
  });

  // Remove data edges where source or target node no longer exists
  const nodeIds = new Set(cleanedNodes.map((n) => n.id));
  const invalidEdgeIds = new Set<string>();
  for (const edge of edges) {
    if (isDataEdge(edge)) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        invalidEdgeIds.add(edge.id);
        totalRemoved++;
      }
    }
  }
  const cleanedEdges = edges.filter((e) => !invalidEdgeIds.has(e.id));

  return { nodes: cleanedNodes, edges: cleanedEdges, totalRemoved };
}
