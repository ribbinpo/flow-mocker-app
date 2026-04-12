import { describe, it, expect } from "vitest";
import {
  exportFlowToJson,
  slugifyFlowName,
  parseAndValidateFlowJson,
  regenerateFlowIds,
  importFlowFromJson,
} from "../flowImportExport";
import type { Flow } from "@/types";

function makeTestFlow(): Flow {
  return {
    id: "flow-1",
    name: "Test Flow",
    description: "A test flow",
    nodes: [
      {
        id: "node-a",
        label: "Login",
        method: "POST",
        url: "https://api.example.com/login",
        headers: { "Content-Type": "application/json" },
        queryParams: {},
        body: '{"user":"admin"}',
        dataMapping: [],
        position: { x: 0, y: 0 },
      },
      {
        id: "node-b",
        label: "Get Profile",
        method: "GET",
        url: "https://api.example.com/profile",
        headers: {},
        queryParams: {},
        body: "",
        dataMapping: [
          {
            sourceNodeId: "node-a",
            sourcePath: "token",
            targetField: "header",
            targetKey: "Authorization",
          },
        ],
        position: { x: 300, y: 0 },
      },
    ],
    edges: [{ id: "edge-1", source: "node-a", target: "node-b" }],
    envVariables: { BASE_URL: "https://api.example.com" },
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  };
}

describe("exportFlowToJson", () => {
  it("serializes a flow to formatted JSON", () => {
    const flow = makeTestFlow();
    const json = exportFlowToJson(flow);
    const parsed = JSON.parse(json);
    expect(parsed.id).toBe("flow-1");
    expect(parsed.nodes).toHaveLength(2);
  });
});

describe("slugifyFlowName", () => {
  it("converts spaces and special chars to hyphens", () => {
    expect(slugifyFlowName("My API Flow")).toBe("my-api-flow");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugifyFlowName("  Hello World!  ")).toBe("hello-world");
  });

  it("collapses consecutive hyphens", () => {
    expect(slugifyFlowName("foo---bar")).toBe("foo-bar");
  });

  it("handles empty string", () => {
    expect(slugifyFlowName("")).toBe("");
  });
});

describe("parseAndValidateFlowJson", () => {
  it("accepts valid flow JSON", () => {
    const json = exportFlowToJson(makeTestFlow());
    const result = parseAndValidateFlowJson(json);
    expect(result.success).toBe(true);
  });

  it("rejects invalid JSON", () => {
    const result = parseAndValidateFlowJson("{not valid json");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid JSON");
    }
  });

  it("rejects JSON with missing required fields", () => {
    const result = parseAndValidateFlowJson('{"id":"1"}');
    expect(result.success).toBe(false);
  });

  it("rejects invalid HTTP method", () => {
    const flow = makeTestFlow();
    const json = exportFlowToJson(flow).replace('"POST"', '"INVALID"');
    const result = parseAndValidateFlowJson(json);
    expect(result.success).toBe(false);
  });

  it("rejects empty flow name", () => {
    const flow = makeTestFlow();
    flow.name = "";
    const json = exportFlowToJson(flow);
    const result = parseAndValidateFlowJson(json);
    expect(result.success).toBe(false);
  });
});

describe("regenerateFlowIds", () => {
  it("generates new IDs for flow, nodes, and edges", () => {
    const original = makeTestFlow();
    const regenerated = regenerateFlowIds(original);

    expect(regenerated.id).not.toBe(original.id);
    expect(regenerated.nodes[0].id).not.toBe(original.nodes[0].id);
    expect(regenerated.nodes[1].id).not.toBe(original.nodes[1].id);
    expect(regenerated.edges[0].id).not.toBe(original.edges[0].id);
  });

  it("remaps edge source and target to new node IDs", () => {
    const original = makeTestFlow();
    const regenerated = regenerateFlowIds(original);

    const newNodeAId = regenerated.nodes[0].id;
    const newNodeBId = regenerated.nodes[1].id;

    expect(regenerated.edges[0].source).toBe(newNodeAId);
    expect(regenerated.edges[0].target).toBe(newNodeBId);
  });

  it("remaps dataMapping sourceNodeId to new node IDs", () => {
    const original = makeTestFlow();
    const regenerated = regenerateFlowIds(original);

    const newNodeAId = regenerated.nodes[0].id;
    expect(regenerated.nodes[1].dataMapping[0].sourceNodeId).toBe(newNodeAId);
  });

  it("sets new timestamps", () => {
    const original = makeTestFlow();
    const regenerated = regenerateFlowIds(original);

    expect(regenerated.createdAt).not.toBe(original.createdAt);
    expect(regenerated.updatedAt).not.toBe(original.updatedAt);
  });

  it("preserves non-ID fields", () => {
    const original = makeTestFlow();
    const regenerated = regenerateFlowIds(original);

    expect(regenerated.name).toBe(original.name);
    expect(regenerated.description).toBe(original.description);
    expect(regenerated.envVariables).toEqual(original.envVariables);
    expect(regenerated.nodes[0].label).toBe(original.nodes[0].label);
    expect(regenerated.nodes[0].url).toBe(original.nodes[0].url);
  });
});

describe("importFlowFromJson", () => {
  it("round-trips: export then import produces valid flow with new IDs", () => {
    const original = makeTestFlow();
    const json = exportFlowToJson(original);
    const result = importFlowFromJson(json);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.flow.id).not.toBe(original.id);
      expect(result.flow.name).toBe(original.name);
      expect(result.flow.nodes).toHaveLength(2);
      expect(result.flow.edges).toHaveLength(1);
    }
  });

  it("returns error for invalid input", () => {
    const result = importFlowFromJson("not json");
    expect(result.success).toBe(false);
  });
});
