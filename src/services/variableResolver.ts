import type { FlowNode, FlowEdge } from "@/types";
import { isSequenceEdge, isApiNode, isStoreNode, isVariableEdge } from "@/types";

/**
 * Returns the set of node IDs that execute before the given node,
 * following only sequence edges.
 */
export function getUpstreamNodeIds(
  nodeId: string,
  _nodes: FlowNode[],
  edges: FlowEdge[],
): Set<string> {
  const sequenceEdges = edges.filter(isSequenceEdge);

  // Build reverse adjacency: target -> sources
  const reverseAdj = new Map<string, string[]>();
  for (const edge of sequenceEdges) {
    const list = reverseAdj.get(edge.target) ?? [];
    list.push(edge.source);
    reverseAdj.set(edge.target, list);
  }

  // BFS/DFS backwards from nodeId
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
 * Does NOT mutate — the caller applies the changes.
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

    // Check Store node variables
    if (isStoreNode(node)) {
      for (const variable of node.variables) {
        if (variable.sourceNodeId && !upstream.has(variable.sourceNodeId)) {
          result.removedVariableCount++;
        }
      }
    }

    // Check API node data mappings
    if (isApiNode(node)) {
      for (const mapping of node.dataMapping) {
        if (mapping.sourceNodeId && !upstream.has(mapping.sourceNodeId)) {
          result.removedMappingCount++;
        }
      }
    }
  }

  // Check variable edges
  for (const edge of edges) {
    if (isVariableEdge(edge)) {
      const targetUpstream = getUpstreamNodeIds(edge.target, nodes, edges);
      if (!targetUpstream.has(edge.source)) {
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

  // Remove invalid variable edges
  const invalidEdgeIds = new Set<string>();
  for (const edge of edges) {
    if (isVariableEdge(edge)) {
      const targetUpstream = getUpstreamNodeIds(edge.target, nodes, edges);
      if (!targetUpstream.has(edge.source)) {
        invalidEdgeIds.add(edge.id);
        totalRemoved++;
      }
    }
  }
  const cleanedEdges = edges.filter((e) => !invalidEdgeIds.has(e.id));

  return { nodes: cleanedNodes, edges: cleanedEdges, totalRemoved };
}
