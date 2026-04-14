import { describe, it, expect } from "vitest";
import { getUpstreamNodeIds, findInvalidReferences, cleanInvalidReferences } from "../variableResolver";
import type { FlowNode, FlowEdge } from "@/types";

function makeApiNode(id: string): FlowNode {
  return {
    id,
    type: "api",
    label: `API ${id}`,
    method: "GET",
    url: "",
    headers: {},
    queryParams: {},
    body: "",
    dataMapping: [],
    position: { x: 0, y: 0 },
  } as FlowNode;
}

function makeStoreNode(
  id: string,
  variables: { id: string; name: string; sourceNodeId: string; sourcePath: string }[],
): FlowNode {
  return {
    id,
    type: "store",
    label: "Store",
    variables,
    position: { x: 0, y: 0 },
  } as FlowNode;
}

function makeStartNode(id: string): FlowNode {
  return {
    id,
    type: "start",
    label: "Start",
    position: { x: 0, y: 0 },
  } as FlowNode;
}

function seqEdge(source: string, target: string): FlowEdge {
  return { id: `${source}-${target}`, source, target };
}

function dataEdge(source: string, target: string): FlowEdge {
  return {
    id: `data-${source}-${target}`,
    source,
    target,
    edgeType: "data",
  };
}

describe("getUpstreamNodeIds", () => {
  it("returns empty set for node with no parents", () => {
    const nodes = [makeApiNode("a")];
    const result = getUpstreamNodeIds("a", nodes, []);
    expect(result.size).toBe(0);
  });

  it("returns direct parent in linear chain", () => {
    const nodes = [makeApiNode("a"), makeApiNode("b")];
    const edges = [seqEdge("a", "b")];
    const result = getUpstreamNodeIds("b", nodes, edges);
    expect(result).toEqual(new Set(["a"]));
  });

  it("returns all ancestors in linear chain", () => {
    const nodes = [makeApiNode("a"), makeApiNode("b"), makeApiNode("c")];
    const edges = [seqEdge("a", "b"), seqEdge("b", "c")];
    const result = getUpstreamNodeIds("c", nodes, edges);
    expect(result).toEqual(new Set(["a", "b"]));
  });

  it("handles diamond DAG", () => {
    const nodes = [makeApiNode("a"), makeApiNode("b"), makeApiNode("c"), makeApiNode("d")];
    const edges = [seqEdge("a", "b"), seqEdge("a", "c"), seqEdge("b", "d"), seqEdge("c", "d")];
    const result = getUpstreamNodeIds("d", nodes, edges);
    expect(result).toEqual(new Set(["a", "b", "c"]));
  });

  it("includes data edges as upstream", () => {
    const nodes = [makeApiNode("a"), makeApiNode("b"), makeApiNode("c")];
    const edges = [
      seqEdge("a", "b"),
      dataEdge("a", "c"), // data edge counts as upstream
    ];
    const result = getUpstreamNodeIds("c", nodes, edges);
    expect(result).toEqual(new Set(["a"]));
  });

  it("does not include disconnected nodes", () => {
    const nodes = [makeApiNode("a"), makeApiNode("b"), makeApiNode("c")];
    const edges = [seqEdge("a", "b")];
    const result = getUpstreamNodeIds("b", nodes, edges);
    expect(result).toEqual(new Set(["a"]));
    expect(result.has("c")).toBe(false);
  });
});

describe("findInvalidReferences", () => {
  it("returns zero for valid flow", () => {
    const nodes = [
      makeApiNode("a"),
      makeStoreNode("s", [{ id: "v1", name: "token", sourceNodeId: "a", sourcePath: "data" }]),
    ];
    const edges = [seqEdge("a", "s")];
    const result = findInvalidReferences(nodes, edges);
    expect(result.removedVariableCount).toBe(0);
    expect(result.removedMappingCount).toBe(0);
    expect(result.removedEdgeIds).toHaveLength(0);
  });

  it("detects store variable referencing non-upstream node", () => {
    const nodes = [
      makeApiNode("a"),
      makeStoreNode("s", [{ id: "v1", name: "token", sourceNodeId: "a", sourcePath: "data" }]),
    ];
    // No sequence edge from a to s — a is not upstream of s
    const result = findInvalidReferences(nodes, []);
    expect(result.removedVariableCount).toBe(1);
  });

  it("detects API dataMapping referencing non-upstream node", () => {
    const apiB = {
      ...makeApiNode("b"),
      type: "api" as const,
      dataMapping: [
        { sourceNodeId: "a", sourcePath: "token", targetField: "header" as const, targetKey: "Auth" },
      ],
    } as FlowNode;
    const nodes = [makeApiNode("a"), apiB];
    // No edge from a to b
    const result = findInvalidReferences(nodes, []);
    expect(result.removedMappingCount).toBe(1);
  });

  it("data edge from upstream is valid", () => {
    const nodes = [makeApiNode("a"), makeApiNode("b")];
    // Data edge from a to b — a is upstream via the data edge itself
    const edges = [dataEdge("a", "b")];
    const result = findInvalidReferences(nodes, edges);
    expect(result.removedEdgeIds).toHaveLength(0);
  });
});

describe("cleanInvalidReferences", () => {
  it("removes store variable referencing non-upstream node", () => {
    const nodes = [
      makeApiNode("a"),
      makeStoreNode("s", [
        { id: "v1", name: "valid", sourceNodeId: "a", sourcePath: "data" },
        { id: "v2", name: "invalid", sourceNodeId: "x", sourcePath: "data" },
      ]),
    ];
    const edges = [seqEdge("a", "s")];

    const { nodes: cleaned, totalRemoved } = cleanInvalidReferences(nodes, edges);
    const store = cleaned.find((n) => n.id === "s");
    expect(store?.type).toBe("store");
    if (store?.type === "store") {
      expect(store.variables).toHaveLength(1);
      expect(store.variables[0].name).toBe("valid");
    }
    expect(totalRemoved).toBe(1);
  });

  it("removes data edge referencing deleted node", () => {
    // Data edge references node "x" which doesn't exist in nodes
    const nodes = [makeApiNode("a"), makeApiNode("b")];
    const edges: FlowEdge[] = [
      seqEdge("a", "b"),
      dataEdge("x", "b"), // invalid: x doesn't exist
    ];

    const { edges: cleaned, totalRemoved } = cleanInvalidReferences(nodes, edges);
    expect(cleaned).toHaveLength(1);
    expect(cleaned[0].id).toBe("a-b");
    expect(totalRemoved).toBe(1);
  });

  it("returns unchanged data when everything is valid", () => {
    const nodes = [
      makeStartNode("start"),
      makeApiNode("a"),
      makeStoreNode("s", [{ id: "v1", name: "token", sourceNodeId: "a", sourcePath: "data" }]),
    ];
    const edges = [seqEdge("start", "a"), seqEdge("a", "s")];

    const { nodes: cleaned, edges: cleanedEdges, totalRemoved } = cleanInvalidReferences(nodes, edges);
    expect(totalRemoved).toBe(0);
    expect(cleaned).toEqual(nodes);
    expect(cleanedEdges).toEqual(edges);
  });
});
