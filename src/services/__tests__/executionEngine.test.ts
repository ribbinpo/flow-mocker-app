import { describe, it, expect, vi, beforeEach } from "vitest";
import { getExecutionOrder, executeFlow } from "../executionEngine";
import type { Flow, FlowNode, FlowEdge, NodeLog } from "@/types";

vi.mock("../apiClient", () => ({
  sendRequest: vi.fn(),
}));

import { sendRequest } from "../apiClient";

const mockSendRequest = vi.mocked(sendRequest);

function makeNode(id: string, overrides?: Partial<FlowNode>): FlowNode {
  return {
    id,
    label: `Node ${id}`,
    method: "GET",
    url: "https://api.example.com",
    headers: {},
    queryParams: {},
    body: "",
    dataMapping: [],
    position: { x: 0, y: 0 },
    ...overrides,
  };
}

function makeEdge(source: string, target: string): FlowEdge {
  return { id: `${source}-${target}`, source, target };
}

function makeFlow(
  nodes: FlowNode[],
  edges: FlowEdge[],
  envVariables: Record<string, string> = {},
): Flow {
  return {
    id: "flow-1",
    name: "Test Flow",
    description: "",
    nodes,
    edges,
    envVariables,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const noopCallbacks = {
  onNodeStart: vi.fn(),
  onNodeComplete: vi.fn(),
};

describe("getExecutionOrder", () => {
  it("returns nodes in topological order for a linear chain", () => {
    const nodes = [makeNode("a"), makeNode("b"), makeNode("c")];
    const edges = [makeEdge("a", "b"), makeEdge("b", "c")];

    const order = getExecutionOrder(nodes, edges);
    expect(order.map((n) => n.id)).toEqual(["a", "b", "c"]);
  });

  it("returns single node for flow with no edges", () => {
    const nodes = [makeNode("a")];
    const order = getExecutionOrder(nodes, []);
    expect(order.map((n) => n.id)).toEqual(["a"]);
  });

  it("returns empty array for empty node list", () => {
    expect(getExecutionOrder([], [])).toEqual([]);
  });

  it("handles disconnected nodes", () => {
    const nodes = [makeNode("a"), makeNode("b")];
    const order = getExecutionOrder(nodes, []);
    expect(order).toHaveLength(2);
  });

  it("throws on cycle", () => {
    const nodes = [makeNode("a"), makeNode("b")];
    const edges = [makeEdge("a", "b"), makeEdge("b", "a")];

    expect(() => getExecutionOrder(nodes, edges)).toThrow("Cycle detected");
  });
});

describe("executeFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("executes a single node successfully", async () => {
    mockSendRequest.mockResolvedValue({
      status: 200,
      headers: {},
      body: { ok: true },
      latencyMs: 50,
    });

    const flow = makeFlow([makeNode("a")], []);
    const logs: NodeLog[] = [];

    const gen = executeFlow(flow, noopCallbacks);
    let result = await gen.next();
    while (!result.done) {
      logs.push(result.value);
      result = await gen.next();
    }

    expect(logs).toHaveLength(1);
    expect(logs[0].status).toBe("success");
    expect(logs[0].nodeId).toBe("a");
    expect(result.value).toBe("success");
  });

  it("executes multiple nodes in order", async () => {
    mockSendRequest.mockResolvedValue({
      status: 200,
      headers: {},
      body: { ok: true },
      latencyMs: 50,
    });

    const nodes = [makeNode("a"), makeNode("b"), makeNode("c")];
    const edges = [makeEdge("a", "b"), makeEdge("b", "c")];
    const flow = makeFlow(nodes, edges);
    const logs: NodeLog[] = [];

    const gen = executeFlow(flow, noopCallbacks);
    let result = await gen.next();
    while (!result.done) {
      logs.push(result.value);
      result = await gen.next();
    }

    expect(logs).toHaveLength(3);
    expect(logs.map((l) => l.nodeId)).toEqual(["a", "b", "c"]);
    expect(result.value).toBe("success");
  });

  it("stops on error and marks remaining as skipped", async () => {
    mockSendRequest
      .mockResolvedValueOnce({
        status: 200,
        headers: {},
        body: { ok: true },
        latencyMs: 50,
      })
      .mockRejectedValueOnce(new Error("Connection refused"));

    const nodes = [makeNode("a"), makeNode("b"), makeNode("c")];
    const edges = [makeEdge("a", "b"), makeEdge("b", "c")];
    const flow = makeFlow(nodes, edges);
    const logs: NodeLog[] = [];

    const gen = executeFlow(flow, noopCallbacks);
    let result = await gen.next();
    while (!result.done) {
      logs.push(result.value);
      result = await gen.next();
    }

    expect(logs).toHaveLength(3);
    expect(logs[0].status).toBe("success");
    expect(logs[1].status).toBe("error");
    expect(logs[1].error).toBe("Connection refused");
    expect(logs[2].status).toBe("skipped");
    expect(result.value).toBe("error");
  });

  it("resolves env variables in request", async () => {
    mockSendRequest.mockResolvedValue({
      status: 200,
      headers: {},
      body: {},
      latencyMs: 10,
    });

    const node = makeNode("a", { url: "{{BASE_URL}}/users" });
    const flow = makeFlow([node], [], { BASE_URL: "https://api.test.com" });

    const gen = executeFlow(flow, noopCallbacks);
    let result = await gen.next();
    while (!result.done) {
      result = await gen.next();
    }

    expect(mockSendRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://api.test.com/users" }),
    );
  });

  it("applies data mappings between nodes", async () => {
    mockSendRequest
      .mockResolvedValueOnce({
        status: 200,
        headers: {},
        body: { token: "secret123" },
        latencyMs: 10,
      })
      .mockResolvedValueOnce({
        status: 200,
        headers: {},
        body: { ok: true },
        latencyMs: 10,
      });

    const nodeA = makeNode("a");
    const nodeB = makeNode("b", {
      dataMapping: [
        {
          sourceNodeId: "a",
          sourcePath: "token",
          targetField: "header",
          targetKey: "Authorization",
        },
      ],
    });
    const flow = makeFlow([nodeA, nodeB], [makeEdge("a", "b")]);

    const gen = executeFlow(flow, noopCallbacks);
    let result = await gen.next();
    while (!result.done) {
      result = await gen.next();
    }

    expect(mockSendRequest).toHaveBeenCalledTimes(2);
    expect(mockSendRequest.mock.calls[1][0].headers.Authorization).toBe(
      "secret123",
    );
  });

  it("calls onNodeStart and onNodeComplete callbacks", async () => {
    mockSendRequest.mockResolvedValue({
      status: 200,
      headers: {},
      body: {},
      latencyMs: 10,
    });

    const callbacks = {
      onNodeStart: vi.fn(),
      onNodeComplete: vi.fn(),
    };

    const flow = makeFlow([makeNode("a")], []);
    const gen = executeFlow(flow, callbacks);
    let result = await gen.next();
    while (!result.done) {
      result = await gen.next();
    }

    expect(callbacks.onNodeStart).toHaveBeenCalledWith("a");
    expect(callbacks.onNodeComplete).toHaveBeenCalledTimes(1);
    expect(callbacks.onNodeComplete.mock.calls[0][0].nodeId).toBe("a");
  });

  it("handles abort signal", async () => {
    const controller = new AbortController();
    controller.abort();

    const flow = makeFlow([makeNode("a"), makeNode("b")], [makeEdge("a", "b")]);
    const logs: NodeLog[] = [];

    const gen = executeFlow(flow, noopCallbacks, controller.signal);
    let result = await gen.next();
    while (!result.done) {
      logs.push(result.value);
      result = await gen.next();
    }

    expect(logs.every((l) => l.status === "skipped")).toBe(true);
    expect(result.value).toBe("error");
    expect(mockSendRequest).not.toHaveBeenCalled();
  });

  it("returns error status for empty flow", async () => {
    const flow = makeFlow([], []);

    const gen = executeFlow(flow, noopCallbacks);
    const result = await gen.next();

    expect(result.done).toBe(true);
    expect(result.value).toBe("error");
  });
});
