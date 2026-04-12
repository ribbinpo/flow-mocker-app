import { describe, it, expect, vi, beforeEach } from "vitest";
import { getExecutionOrder, executeFlow } from "../executionEngine";
import type { Flow, FlowNode, FlowEdge, NodeLog } from "@/types";

vi.mock("../retryExecutor", () => ({
  sendWithRetry: vi.fn(),
}));

vi.mock("../requestValidator", () => ({
  validateRequest: vi.fn(() => ({ valid: true, errors: [] })),
}));

import { sendWithRetry } from "../retryExecutor";
import { validateRequest } from "../requestValidator";

const mockSendWithRetry = vi.mocked(sendWithRetry);
const mockValidateRequest = vi.mocked(validateRequest);

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
    mockValidateRequest.mockReturnValue({ valid: true, errors: [] });
  });

  it("executes a single node successfully", async () => {
    mockSendWithRetry.mockResolvedValue({
      response: { status: 200, headers: {}, body: { ok: true }, latencyMs: 50 },
      attempts: 1,
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
    expect(logs[0].retryAttempts).toBe(1);
    expect(result.value).toBe("success");
  });

  it("executes multiple nodes in order", async () => {
    mockSendWithRetry.mockResolvedValue({
      response: { status: 200, headers: {}, body: { ok: true }, latencyMs: 50 },
      attempts: 1,
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
    mockSendWithRetry
      .mockResolvedValueOnce({
        response: { status: 200, headers: {}, body: { ok: true }, latencyMs: 50 },
        attempts: 1,
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
    mockSendWithRetry.mockResolvedValue({
      response: { status: 200, headers: {}, body: {}, latencyMs: 10 },
      attempts: 1,
    });

    const node = makeNode("a", { url: "{{BASE_URL}}/users" });
    const flow = makeFlow([node], [], { BASE_URL: "https://api.test.com" });

    const gen = executeFlow(flow, noopCallbacks);
    let result = await gen.next();
    while (!result.done) {
      result = await gen.next();
    }

    expect(mockSendWithRetry).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://api.test.com/users" }),
      undefined,
      undefined,
    );
  });

  it("applies data mappings between nodes", async () => {
    mockSendWithRetry
      .mockResolvedValueOnce({
        response: { status: 200, headers: {}, body: { token: "secret123" }, latencyMs: 10 },
        attempts: 1,
      })
      .mockResolvedValueOnce({
        response: { status: 200, headers: {}, body: { ok: true }, latencyMs: 10 },
        attempts: 1,
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

    expect(mockSendWithRetry).toHaveBeenCalledTimes(2);
    expect(mockSendWithRetry.mock.calls[1][0].headers.Authorization).toBe(
      "secret123",
    );
  });

  it("calls onNodeStart and onNodeComplete callbacks", async () => {
    mockSendWithRetry.mockResolvedValue({
      response: { status: 200, headers: {}, body: {}, latencyMs: 10 },
      attempts: 1,
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
    expect(mockSendWithRetry).not.toHaveBeenCalled();
  });

  it("returns error status for empty flow", async () => {
    const flow = makeFlow([], []);

    const gen = executeFlow(flow, noopCallbacks);
    const result = await gen.next();

    expect(result.done).toBe(true);
    expect(result.value).toBe("error");
  });

  it("passes cookies from previous step responses to subsequent requests", async () => {
    mockSendWithRetry
      .mockResolvedValueOnce({
        response: {
          status: 200,
          headers: { "set-cookie": "session=abc123; Path=/; HttpOnly" },
          body: { ok: true },
          latencyMs: 10,
        },
        attempts: 1,
      })
      .mockResolvedValueOnce({
        response: {
          status: 200,
          headers: {},
          body: { data: "private" },
          latencyMs: 10,
        },
        attempts: 1,
      });

    const nodeA = makeNode("a");
    const nodeB = makeNode("b");
    const flow = makeFlow([nodeA, nodeB], [makeEdge("a", "b")]);

    const gen = executeFlow(flow, noopCallbacks);
    let result = await gen.next();
    while (!result.done) {
      result = await gen.next();
    }

    expect(mockSendWithRetry).toHaveBeenCalledTimes(2);
    expect(mockSendWithRetry.mock.calls[1][0].headers.Cookie).toBe(
      "session=abc123",
    );
  });

  it("accumulates cookies across multiple steps", async () => {
    mockSendWithRetry
      .mockResolvedValueOnce({
        response: {
          status: 200,
          headers: { "set-cookie": "session=abc" },
          body: {},
          latencyMs: 10,
        },
        attempts: 1,
      })
      .mockResolvedValueOnce({
        response: {
          status: 200,
          headers: { "set-cookie": "csrf=xyz" },
          body: {},
          latencyMs: 10,
        },
        attempts: 1,
      })
      .mockResolvedValueOnce({
        response: {
          status: 200,
          headers: {},
          body: {},
          latencyMs: 10,
        },
        attempts: 1,
      });

    const nodes = [makeNode("a"), makeNode("b"), makeNode("c")];
    const edges = [makeEdge("a", "b"), makeEdge("b", "c")];
    const flow = makeFlow(nodes, edges);

    const gen = executeFlow(flow, noopCallbacks);
    let result = await gen.next();
    while (!result.done) {
      result = await gen.next();
    }

    expect(mockSendWithRetry).toHaveBeenCalledTimes(3);
    const thirdCallHeaders = mockSendWithRetry.mock.calls[2][0].headers;
    expect(thirdCallHeaders.Cookie).toContain("session=abc");
    expect(thirdCallHeaders.Cookie).toContain("csrf=xyz");
  });

  it("stops on validation error", async () => {
    mockValidateRequest.mockReturnValue({
      valid: false,
      errors: ["URL is required"],
    });

    const flow = makeFlow(
      [makeNode("a", { url: "" }), makeNode("b")],
      [makeEdge("a", "b")],
    );
    const logs: NodeLog[] = [];

    const gen = executeFlow(flow, noopCallbacks);
    let result = await gen.next();
    while (!result.done) {
      logs.push(result.value);
      result = await gen.next();
    }

    expect(logs).toHaveLength(2);
    expect(logs[0].status).toBe("error");
    expect(logs[0].validationErrors).toContain("URL is required");
    expect(logs[1].status).toBe("skipped");
    expect(mockSendWithRetry).not.toHaveBeenCalled();
  });
});
