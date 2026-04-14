import { describe, it, expect, vi, beforeEach } from "vitest";
import { getExecutionOrder, getExecutionLevels, executeFlow } from "../executionEngine";
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
    type: "api",
    label: `Node ${id}`,
    method: "GET",
    url: "https://api.example.com",
    headers: {},
    queryParams: {},
    body: "",
    dataMapping: [],
    position: { x: 0, y: 0 },
    ...overrides,
  } as FlowNode;
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

async function collectLogs(
  gen: AsyncGenerator<NodeLog[], unknown, void>,
): Promise<{ logs: NodeLog[]; status: unknown }> {
  const logs: NodeLog[] = [];
  let result = await gen.next();
  while (!result.done) {
    logs.push(...result.value);
    result = await gen.next();
  }
  return { logs, status: result.value };
}

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

describe("getExecutionLevels", () => {
  it("returns levels for a linear chain", () => {
    const nodes = [makeNode("a"), makeNode("b"), makeNode("c")];
    const edges = [makeEdge("a", "b"), makeEdge("b", "c")];

    const levels = getExecutionLevels(nodes, edges);
    expect(levels.map((l) => l.map((n) => n.id))).toEqual([["a"], ["b"], ["c"]]);
  });

  it("returns fan-out as parallel level", () => {
    const nodes = [makeNode("a"), makeNode("b"), makeNode("c")];
    const edges = [makeEdge("a", "b"), makeEdge("a", "c")];

    const levels = getExecutionLevels(nodes, edges);
    expect(levels.map((l) => l.map((n) => n.id))).toEqual([["a"], ["b", "c"]]);
  });

  it("returns diamond as three levels", () => {
    const nodes = [makeNode("a"), makeNode("b"), makeNode("c"), makeNode("d")];
    const edges = [
      makeEdge("a", "b"),
      makeEdge("a", "c"),
      makeEdge("b", "d"),
      makeEdge("c", "d"),
    ];

    const levels = getExecutionLevels(nodes, edges);
    expect(levels.map((l) => l.map((n) => n.id))).toEqual([["a"], ["b", "c"], ["d"]]);
  });

  it("handles disconnected components", () => {
    const nodes = [makeNode("a"), makeNode("b"), makeNode("c")];
    const edges = [makeEdge("a", "b")];

    const levels = getExecutionLevels(nodes, edges);
    expect(levels[0].map((n) => n.id)).toContain("a");
    expect(levels[0].map((n) => n.id)).toContain("c");
    expect(levels[1].map((n) => n.id)).toEqual(["b"]);
  });

  it("returns empty array for empty nodes", () => {
    expect(getExecutionLevels([], [])).toEqual([]);
  });

  it("throws on cycle", () => {
    const nodes = [makeNode("a"), makeNode("b"), makeNode("c")];
    const edges = [makeEdge("a", "b"), makeEdge("b", "c"), makeEdge("c", "a")];

    expect(() => getExecutionLevels(nodes, edges)).toThrow("Cycle detected");
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
    const { logs, status } = await collectLogs(executeFlow(flow, noopCallbacks));

    expect(logs).toHaveLength(1);
    expect(logs[0].status).toBe("success");
    expect(logs[0].nodeId).toBe("a");
    expect(logs[0].retryAttempts).toBe(1);
    expect(status).toBe("success");
  });

  it("executes multiple nodes in order", async () => {
    mockSendWithRetry.mockResolvedValue({
      response: { status: 200, headers: {}, body: { ok: true }, latencyMs: 50 },
      attempts: 1,
    });

    const nodes = [makeNode("a"), makeNode("b"), makeNode("c")];
    const edges = [makeEdge("a", "b"), makeEdge("b", "c")];
    const flow = makeFlow(nodes, edges);
    const { logs, status } = await collectLogs(executeFlow(flow, noopCallbacks));

    expect(logs).toHaveLength(3);
    expect(logs.map((l) => l.nodeId)).toEqual(["a", "b", "c"]);
    expect(status).toBe("success");
  });

  it("stops on error and marks downstream as skipped", async () => {
    mockSendWithRetry
      .mockResolvedValueOnce({
        response: { status: 200, headers: {}, body: { ok: true }, latencyMs: 50 },
        attempts: 1,
      })
      .mockRejectedValueOnce(new Error("Connection refused"));

    const nodes = [makeNode("a"), makeNode("b"), makeNode("c")];
    const edges = [makeEdge("a", "b"), makeEdge("b", "c")];
    const flow = makeFlow(nodes, edges);
    const { logs, status } = await collectLogs(executeFlow(flow, noopCallbacks));

    expect(logs).toHaveLength(3);
    expect(logs[0].status).toBe("success");
    expect(logs[1].status).toBe("error");
    expect(logs[1].error).toBe("Connection refused");
    expect(logs[2].status).toBe("skipped");
    expect(status).toBe("error");
  });

  it("resolves env variables in request", async () => {
    mockSendWithRetry.mockResolvedValue({
      response: { status: 200, headers: {}, body: {}, latencyMs: 10 },
      attempts: 1,
    });

    const node = makeNode("a", { url: "{{BASE_URL}}/users" });
    const flow = makeFlow([node], [], { BASE_URL: "https://api.test.com" });

    await collectLogs(executeFlow(flow, noopCallbacks));

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

    await collectLogs(executeFlow(flow, noopCallbacks));

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
    await collectLogs(executeFlow(flow, callbacks));

    expect(callbacks.onNodeStart).toHaveBeenCalledWith("a");
    expect(callbacks.onNodeComplete).toHaveBeenCalledTimes(1);
    expect(callbacks.onNodeComplete.mock.calls[0][0].nodeId).toBe("a");
  });

  it("handles abort signal", async () => {
    const controller = new AbortController();
    controller.abort();

    const flow = makeFlow([makeNode("a"), makeNode("b")], [makeEdge("a", "b")]);
    const { logs, status } = await collectLogs(
      executeFlow(flow, noopCallbacks, controller.signal),
    );

    expect(logs.every((l) => l.status === "skipped")).toBe(true);
    expect(status).toBe("error");
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

    await collectLogs(executeFlow(flow, noopCallbacks));

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

    await collectLogs(executeFlow(flow, noopCallbacks));

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
    const { logs } = await collectLogs(executeFlow(flow, noopCallbacks));

    expect(logs).toHaveLength(2);
    expect(logs[0].status).toBe("error");
    expect(logs[0].validationErrors).toContain("URL is required");
    expect(logs[1].status).toBe("skipped");
    expect(mockSendWithRetry).not.toHaveBeenCalled();
  });
});

describe("executeFlow parallel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateRequest.mockReturnValue({ valid: true, errors: [] });
  });

  it("executes fan-out nodes in parallel", async () => {
    mockSendWithRetry.mockResolvedValue({
      response: { status: 200, headers: {}, body: { ok: true }, latencyMs: 50 },
      attempts: 1,
    });

    const nodes = [makeNode("a"), makeNode("b"), makeNode("c")];
    const edges = [makeEdge("a", "b"), makeEdge("a", "c")];
    const flow = makeFlow(nodes, edges);

    const { logs, status } = await collectLogs(executeFlow(flow, noopCallbacks));

    expect(logs).toHaveLength(3);
    expect(logs[0].nodeId).toBe("a");
    const parallelIds = logs.slice(1).map((l) => l.nodeId).sort();
    expect(parallelIds).toEqual(["b", "c"]);
    expect(status).toBe("success");
  });

  it("isolates errors between parallel branches", async () => {
    mockSendWithRetry
      .mockResolvedValueOnce({
        response: { status: 200, headers: {}, body: {}, latencyMs: 10 },
        attempts: 1,
      })
      .mockRejectedValueOnce(new Error("B failed"))
      .mockResolvedValueOnce({
        response: { status: 200, headers: {}, body: {}, latencyMs: 10 },
        attempts: 1,
      });

    const nodes = [makeNode("a"), makeNode("b"), makeNode("c")];
    const edges = [makeEdge("a", "b"), makeEdge("a", "c")];
    const flow = makeFlow(nodes, edges);

    const { logs, status } = await collectLogs(executeFlow(flow, noopCallbacks));

    expect(logs).toHaveLength(3);
    expect(logs[0].status).toBe("success");

    const bLog = logs.find((l) => l.nodeId === "b");
    const cLog = logs.find((l) => l.nodeId === "c");
    expect(bLog?.status).toBe("error");
    expect(cLog?.status).toBe("success");
    expect(status).toBe("error");
  });

  it("skips fan-in node when any parent fails", async () => {
    mockSendWithRetry
      .mockResolvedValueOnce({
        response: { status: 200, headers: {}, body: {}, latencyMs: 10 },
        attempts: 1,
      })
      .mockRejectedValueOnce(new Error("B failed"))
      .mockResolvedValueOnce({
        response: { status: 200, headers: {}, body: {}, latencyMs: 10 },
        attempts: 1,
      });

    const nodes = [makeNode("a"), makeNode("b"), makeNode("c"), makeNode("d")];
    const edges = [
      makeEdge("a", "b"),
      makeEdge("a", "c"),
      makeEdge("b", "d"),
      makeEdge("c", "d"),
    ];
    const flow = makeFlow(nodes, edges);

    const { logs, status } = await collectLogs(executeFlow(flow, noopCallbacks));

    expect(logs).toHaveLength(4);
    const dLog = logs.find((l) => l.nodeId === "d");
    expect(dLog?.status).toBe("skipped");
    expect(status).toBe("error");
  });

  it("does not skip fan-in node when all parents succeed", async () => {
    mockSendWithRetry.mockResolvedValue({
      response: { status: 200, headers: {}, body: { val: 1 }, latencyMs: 10 },
      attempts: 1,
    });

    const nodes = [makeNode("a"), makeNode("b"), makeNode("c"), makeNode("d")];
    const edges = [
      makeEdge("a", "b"),
      makeEdge("a", "c"),
      makeEdge("b", "d"),
      makeEdge("c", "d"),
    ];
    const flow = makeFlow(nodes, edges);

    const { logs, status } = await collectLogs(executeFlow(flow, noopCallbacks));

    expect(logs).toHaveLength(4);
    expect(logs.every((l) => l.status === "success")).toBe(true);
    expect(status).toBe("success");
  });

  it("isolates cookies within a wave — parallel nodes do not see each other's response cookies", async () => {
    mockSendWithRetry
      .mockResolvedValueOnce({
        response: { status: 200, headers: {}, body: {}, latencyMs: 10 },
        attempts: 1,
      })
      .mockResolvedValueOnce({
        response: {
          status: 200,
          headers: { "set-cookie": "from_b=1" },
          body: {},
          latencyMs: 10,
        },
        attempts: 1,
      })
      .mockResolvedValueOnce({
        response: { status: 200, headers: {}, body: {}, latencyMs: 10 },
        attempts: 1,
      });

    const nodes = [makeNode("a"), makeNode("b"), makeNode("c")];
    const edges = [makeEdge("a", "b"), makeEdge("a", "c")];
    const flow = makeFlow(nodes, edges);

    await collectLogs(executeFlow(flow, noopCallbacks));

    // B and C are in the same wave — C should NOT see B's cookie
    const cCall = mockSendWithRetry.mock.calls[2][0];
    expect(cCall.headers.Cookie).toBeUndefined();
  });

  it("merges cookies after wave for next wave to use", async () => {
    mockSendWithRetry
      .mockResolvedValueOnce({
        response: { status: 200, headers: {}, body: {}, latencyMs: 10 },
        attempts: 1,
      })
      .mockResolvedValueOnce({
        response: {
          status: 200,
          headers: { "set-cookie": "from_b=1" },
          body: {},
          latencyMs: 10,
        },
        attempts: 1,
      })
      .mockResolvedValueOnce({
        response: {
          status: 200,
          headers: { "set-cookie": "from_c=2" },
          body: {},
          latencyMs: 10,
        },
        attempts: 1,
      })
      .mockResolvedValueOnce({
        response: { status: 200, headers: {}, body: {}, latencyMs: 10 },
        attempts: 1,
      });

    const nodes = [makeNode("a"), makeNode("b"), makeNode("c"), makeNode("d")];
    const edges = [
      makeEdge("a", "b"),
      makeEdge("a", "c"),
      makeEdge("b", "d"),
      makeEdge("c", "d"),
    ];
    const flow = makeFlow(nodes, edges);

    await collectLogs(executeFlow(flow, noopCallbacks));

    // D is in wave 2, should have cookies from both B and C
    const dCall = mockSendWithRetry.mock.calls[3][0];
    expect(dCall.headers.Cookie).toContain("from_b=1");
    expect(dCall.headers.Cookie).toContain("from_c=2");
  });

  it("skips all remaining waves on abort", async () => {
    mockSendWithRetry.mockResolvedValueOnce({
      response: { status: 200, headers: {}, body: {}, latencyMs: 10 },
      attempts: 1,
    });

    const controller = new AbortController();

    const nodes = [makeNode("a"), makeNode("b"), makeNode("c")];
    const edges = [makeEdge("a", "b"), makeEdge("a", "c")];
    const flow = makeFlow(nodes, edges);

    const gen = executeFlow(flow, noopCallbacks, controller.signal);

    // Execute first wave (node a)
    await gen.next();

    // Abort before second wave
    controller.abort();

    const result = await gen.next();
    if (!result.done) {
      // Should yield skipped logs for b and c
      expect(result.value.every((l: NodeLog) => l.status === "skipped")).toBe(true);
      const final = await gen.next();
      expect(final.done).toBe(true);
      expect(final.value).toBe("error");
    }
  });

  it("yields one wave per generator step", async () => {
    mockSendWithRetry.mockResolvedValue({
      response: { status: 200, headers: {}, body: {}, latencyMs: 10 },
      attempts: 1,
    });

    const nodes = [makeNode("a"), makeNode("b"), makeNode("c"), makeNode("d")];
    const edges = [
      makeEdge("a", "b"),
      makeEdge("a", "c"),
      makeEdge("b", "d"),
      makeEdge("c", "d"),
    ];
    const flow = makeFlow(nodes, edges);

    const gen = executeFlow(flow, noopCallbacks);

    const wave1 = await gen.next();
    expect(wave1.done).toBe(false);
    const wave1Logs = wave1.value as NodeLog[];
    expect(wave1Logs).toHaveLength(1);
    expect(wave1Logs[0].nodeId).toBe("a");

    const wave2 = await gen.next();
    expect(wave2.done).toBe(false);
    const wave2Logs = wave2.value as NodeLog[];
    expect(wave2Logs).toHaveLength(2);
    expect(wave2Logs.map((l) => l.nodeId).sort()).toEqual(["b", "c"]);

    const wave3 = await gen.next();
    expect(wave3.done).toBe(false);
    const wave3Logs = wave3.value as NodeLog[];
    expect(wave3Logs).toHaveLength(1);
    expect(wave3Logs[0].nodeId).toBe("d");

    const done = await gen.next();
    expect(done.done).toBe(true);
    expect(done.value).toBe("success");
  });

  it("propagates failure through chain but not to sibling branches", async () => {
    // Flow: A -> B -> D, A -> C -> E
    // B fails, so D is skipped. C and E still succeed.
    mockSendWithRetry
      .mockResolvedValueOnce({
        response: { status: 200, headers: {}, body: {}, latencyMs: 10 },
        attempts: 1,
      })
      .mockRejectedValueOnce(new Error("B failed"))
      .mockResolvedValueOnce({
        response: { status: 200, headers: {}, body: {}, latencyMs: 10 },
        attempts: 1,
      })
      .mockResolvedValueOnce({
        response: { status: 200, headers: {}, body: {}, latencyMs: 10 },
        attempts: 1,
      });

    const nodes = [
      makeNode("a"),
      makeNode("b"),
      makeNode("c"),
      makeNode("d"),
      makeNode("e"),
    ];
    const edges = [
      makeEdge("a", "b"),
      makeEdge("a", "c"),
      makeEdge("b", "d"),
      makeEdge("c", "e"),
    ];
    const flow = makeFlow(nodes, edges);

    const { logs, status } = await collectLogs(executeFlow(flow, noopCallbacks));

    expect(logs).toHaveLength(5);
    expect(logs.find((l) => l.nodeId === "b")?.status).toBe("error");
    expect(logs.find((l) => l.nodeId === "c")?.status).toBe("success");
    expect(logs.find((l) => l.nodeId === "d")?.status).toBe("skipped");
    expect(logs.find((l) => l.nodeId === "e")?.status).toBe("success");
    expect(status).toBe("error");
  });
});

function makeStartNode(id: string): FlowNode {
  return {
    id,
    type: "start",
    label: "Start",
    position: { x: 0, y: 0 },
  };
}

describe("executeFlow with Start node", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateRequest.mockReturnValue({ valid: true, errors: [] });
  });

  it("passes through Start node with success status and no request", async () => {
    mockSendWithRetry.mockResolvedValue({
      response: { status: 200, headers: {}, body: { ok: true }, latencyMs: 10 },
      attempts: 1,
    });

    const nodes = [makeStartNode("start"), makeNode("a")];
    const edges = [makeEdge("start", "a")];
    const flow = makeFlow(nodes, edges);

    const { logs, status } = await collectLogs(executeFlow(flow, noopCallbacks));

    expect(logs).toHaveLength(2);
    expect(logs[0].nodeId).toBe("start");
    expect(logs[0].status).toBe("success");
    expect(logs[0].nodeType).toBe("start");
    expect(logs[0].request).toBeNull();
    expect(logs[1].nodeId).toBe("a");
    expect(logs[1].status).toBe("success");
    expect(status).toBe("success");
  });

  it("does not call sendWithRetry for Start node", async () => {
    mockSendWithRetry.mockResolvedValue({
      response: { status: 200, headers: {}, body: {}, latencyMs: 10 },
      attempts: 1,
    });

    const nodes = [makeStartNode("start"), makeNode("a")];
    const edges = [makeEdge("start", "a")];
    const flow = makeFlow(nodes, edges);

    await collectLogs(executeFlow(flow, noopCallbacks));

    expect(mockSendWithRetry).toHaveBeenCalledTimes(1);
  });

  it("skips downstream nodes when Start node is in an abort scenario", async () => {
    const controller = new AbortController();
    controller.abort();

    const nodes = [makeStartNode("start"), makeNode("a")];
    const edges = [makeEdge("start", "a")];
    const flow = makeFlow(nodes, edges);

    const { logs, status } = await collectLogs(
      executeFlow(flow, noopCallbacks, controller.signal),
    );

    expect(logs.every((l) => l.status === "skipped")).toBe(true);
    expect(status).toBe("error");
    expect(mockSendWithRetry).not.toHaveBeenCalled();
  });

  it("executes Start -> API -> API chain correctly", async () => {
    mockSendWithRetry
      .mockResolvedValueOnce({
        response: { status: 200, headers: {}, body: { token: "xyz" }, latencyMs: 10 },
        attempts: 1,
      })
      .mockResolvedValueOnce({
        response: { status: 200, headers: {}, body: { data: "ok" }, latencyMs: 10 },
        attempts: 1,
      });

    const nodeA = makeNode("a");
    const nodeB = makeNode("b", {
      dataMapping: [
        { sourceNodeId: "a", sourcePath: "token", targetField: "header", targetKey: "Authorization" },
      ],
    });
    const nodes = [makeStartNode("start"), nodeA, nodeB];
    const edges = [makeEdge("start", "a"), makeEdge("a", "b")];
    const flow = makeFlow(nodes, edges);

    const { logs, status } = await collectLogs(executeFlow(flow, noopCallbacks));

    expect(logs).toHaveLength(3);
    expect(logs[0].nodeType).toBe("start");
    expect(logs[1].nodeType).toBe("api");
    expect(logs[2].nodeType).toBe("api");
    expect(status).toBe("success");
    expect(mockSendWithRetry.mock.calls[1][0].headers.Authorization).toBe("xyz");
  });

  it("includes Start node in execution levels", () => {
    const nodes = [makeStartNode("start"), makeNode("a"), makeNode("b")];
    const edges = [makeEdge("start", "a"), makeEdge("a", "b")];

    const levels = getExecutionLevels(nodes, edges);
    expect(levels.map((l) => l.map((n) => n.id))).toEqual([["start"], ["a"], ["b"]]);
  });
});

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

describe("executeFlow with Store node", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateRequest.mockReturnValue({ valid: true, errors: [] });
  });

  it("resolves Store variables from upstream API response", async () => {
    mockSendWithRetry
      .mockResolvedValueOnce({
        response: { status: 200, headers: {}, body: { data: { token: "abc", userId: 42 } }, latencyMs: 10 },
        attempts: 1,
      })
      .mockResolvedValueOnce({
        response: { status: 200, headers: {}, body: { ok: true }, latencyMs: 10 },
        attempts: 1,
      });

    const apiA = makeNode("a");
    const store = makeStoreNode("store-1", [
      { id: "v1", name: "authToken", sourceNodeId: "a", sourcePath: "data.token" },
      { id: "v2", name: "uid", sourceNodeId: "a", sourcePath: "data.userId" },
    ]);
    const apiB = makeNode("b", {
      dataMapping: [
        { sourceNodeId: "store-1", sourcePath: "authToken", targetField: "header", targetKey: "Authorization" },
      ],
    });

    const nodes = [apiA, store, apiB];
    const edges = [makeEdge("a", "store-1"), makeEdge("store-1", "b")];
    const flow = makeFlow(nodes, edges);

    const { logs, status } = await collectLogs(executeFlow(flow, noopCallbacks));

    expect(logs).toHaveLength(3);
    expect(logs[1].nodeId).toBe("store-1");
    expect(logs[1].nodeType).toBe("store");
    expect(logs[1].status).toBe("success");
    expect(logs[1].request).toBeNull();

    // Store node exposes resolved variables in response body
    expect(logs[1].response?.body).toEqual({ authToken: "abc", uid: 42 });

    // Downstream API node received the mapped value
    expect(status).toBe("success");
    expect(mockSendWithRetry.mock.calls[1][0].headers.Authorization).toBe("abc");
  });

  it("handles Store node with no variables", async () => {
    mockSendWithRetry.mockResolvedValue({
      response: { status: 200, headers: {}, body: {}, latencyMs: 10 },
      attempts: 1,
    });

    const apiA = makeNode("a");
    const store = makeStoreNode("store-1", []);

    const nodes = [apiA, store];
    const edges = [makeEdge("a", "store-1")];
    const flow = makeFlow(nodes, edges);

    const { logs, status } = await collectLogs(executeFlow(flow, noopCallbacks));

    expect(logs).toHaveLength(2);
    expect(logs[1].status).toBe("success");
    expect(logs[1].response?.body).toEqual({});
    expect(status).toBe("success");
  });

  it("skips Store node when upstream fails", async () => {
    mockSendWithRetry.mockRejectedValue(new Error("Network error"));

    const apiA = makeNode("a");
    const store = makeStoreNode("store-1", [
      { id: "v1", name: "token", sourceNodeId: "a", sourcePath: "data.token" },
    ]);

    const nodes = [apiA, store];
    const edges = [makeEdge("a", "store-1")];
    const flow = makeFlow(nodes, edges);

    const { logs, status } = await collectLogs(executeFlow(flow, noopCallbacks));

    expect(logs).toHaveLength(2);
    expect(logs[0].status).toBe("error");
    expect(logs[1].status).toBe("skipped");
    expect(status).toBe("error");
  });

  it("handles Store variable referencing missing source node in context", async () => {
    mockSendWithRetry.mockResolvedValue({
      response: { status: 200, headers: {}, body: { val: 1 }, latencyMs: 10 },
      attempts: 1,
    });

    const apiA = makeNode("a");
    const store = makeStoreNode("store-1", [
      { id: "v1", name: "token", sourceNodeId: "nonexistent", sourcePath: "data.token" },
    ]);

    const nodes = [apiA, store];
    const edges = [makeEdge("a", "store-1")];
    const flow = makeFlow(nodes, edges);

    const { logs, status } = await collectLogs(executeFlow(flow, noopCallbacks));

    expect(logs).toHaveLength(2);
    expect(logs[1].status).toBe("success");
    // Missing source is simply omitted from results
    expect(logs[1].response?.body).toEqual({});
    expect(status).toBe("success");
  });

  it("executes full chain: Start -> API -> Store -> API", async () => {
    mockSendWithRetry
      .mockResolvedValueOnce({
        response: { status: 200, headers: {}, body: { session: "xyz" }, latencyMs: 10 },
        attempts: 1,
      })
      .mockResolvedValueOnce({
        response: { status: 200, headers: {}, body: { ok: true }, latencyMs: 10 },
        attempts: 1,
      });

    const start = makeStartNode("start");
    const apiA = makeNode("a");
    const store = makeStoreNode("store-1", [
      { id: "v1", name: "sessionId", sourceNodeId: "a", sourcePath: "session" },
    ]);
    const apiB = makeNode("b", {
      dataMapping: [
        { sourceNodeId: "store-1", sourcePath: "sessionId", targetField: "header", targetKey: "X-Session" },
      ],
    });

    const nodes = [start, apiA, store, apiB];
    const edges = [
      makeEdge("start", "a"),
      makeEdge("a", "store-1"),
      makeEdge("store-1", "b"),
    ];
    const flow = makeFlow(nodes, edges);

    const { logs, status } = await collectLogs(executeFlow(flow, noopCallbacks));

    expect(logs).toHaveLength(4);
    expect(logs.map((l) => l.nodeType)).toEqual(["start", "api", "store", "api"]);
    expect(status).toBe("success");
    expect(mockSendWithRetry.mock.calls[1][0].headers["X-Session"]).toBe("xyz");
  });

  it("does not call sendWithRetry for Store node", async () => {
    mockSendWithRetry.mockResolvedValue({
      response: { status: 200, headers: {}, body: { data: 1 }, latencyMs: 10 },
      attempts: 1,
    });

    const apiA = makeNode("a");
    const store = makeStoreNode("store-1", [
      { id: "v1", name: "val", sourceNodeId: "a", sourcePath: "data" },
    ]);

    const nodes = [apiA, store];
    const edges = [makeEdge("a", "store-1")];
    const flow = makeFlow(nodes, edges);

    await collectLogs(executeFlow(flow, noopCallbacks));

    // Only 1 call for API node "a", not for store
    expect(mockSendWithRetry).toHaveBeenCalledTimes(1);
  });
});

function makeDataEdge(source: string, target: string): FlowEdge {
  return {
    id: `data-${source}-${target}`,
    source,
    target,
    edgeType: "data",
  };
}

describe("data edges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateRequest.mockReturnValue({ valid: true, errors: [] });
  });

  it("data edges establish execution order (source before target)", () => {
    const nodes = [makeNode("a"), makeNode("b"), makeNode("c")];
    // Sequence: a -> b. Data edge: a -> c (c depends on a via data)
    const edges: FlowEdge[] = [
      makeEdge("a", "b"),
      makeDataEdge("a", "c"),
    ];

    const levels = getExecutionLevels(nodes, edges);
    // a executes first, then b and c in parallel
    expect(levels[0].map((n) => n.id)).toEqual(["a"]);
    expect(levels[1].map((n) => n.id).sort()).toEqual(["b", "c"]);
  });

  it("data edges propagate failure (target skipped if source fails)", async () => {
    mockSendWithRetry.mockRejectedValue(new Error("A failed"));

    const nodes = [makeNode("a"), makeNode("b")];
    // Data edge from a to b — b depends on a
    const edges: FlowEdge[] = [
      makeDataEdge("a", "b"),
    ];
    const flow = makeFlow(nodes, edges);

    const { logs } = await collectLogs(executeFlow(flow, noopCallbacks));

    const bLog = logs.find((l) => l.nodeId === "b");
    expect(bLog?.status).toBe("skipped");
  });

  it("mixed sequence and data edges: both contribute to order", () => {
    const nodes = [makeNode("a"), makeNode("b"), makeNode("c")];
    const edges: FlowEdge[] = [
      makeEdge("a", "b"),
      makeEdge("b", "c"),
      makeDataEdge("a", "c"),
    ];

    const levels = getExecutionLevels(nodes, edges);
    expect(levels.map((l) => l.map((n) => n.id))).toEqual([["a"], ["b"], ["c"]]);
  });

  it("data edge alone creates dependency for Store to execute after API", async () => {
    mockSendWithRetry.mockResolvedValue({
      response: { status: 200, headers: {}, body: { token: "xyz" }, latencyMs: 10 },
      attempts: 1,
    });

    const apiA = makeNode("a");
    const store = makeStoreNode("store-1", [
      { id: "v1", name: "token", sourceNodeId: "a", sourcePath: "token" },
    ]);
    const nodes = [apiA, store];
    // Only a data edge — should still ensure a executes before store
    const edges: FlowEdge[] = [makeDataEdge("a", "store-1")];
    const flow = makeFlow(nodes, edges);

    const { logs, status } = await collectLogs(executeFlow(flow, noopCallbacks));

    expect(logs[0].nodeId).toBe("a");
    expect(logs[1].nodeId).toBe("store-1");
    expect(logs[1].response?.body).toEqual({ token: "xyz" });
    expect(status).toBe("success");
  });
});

describe("start node reachability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateRequest.mockReturnValue({ valid: true, errors: [] });
  });

  it("only executes nodes reachable from Start node", async () => {
    mockSendWithRetry.mockResolvedValue({
      response: { status: 200, headers: {}, body: {}, latencyMs: 10 },
      attempts: 1,
    });

    const nodes = [
      makeStartNode("start"),
      makeNode("a"),
      makeNode("b"), // standalone, not connected to start
    ];
    const edges = [makeEdge("start", "a")];
    const flow = makeFlow(nodes, edges);

    const { logs } = await collectLogs(executeFlow(flow, noopCallbacks));

    expect(logs.map((l) => l.nodeId)).toEqual(["start", "a"]);
    expect(logs.find((l) => l.nodeId === "b")).toBeUndefined();
  });

  it("skips disconnected chain not connected to Start", async () => {
    mockSendWithRetry.mockResolvedValue({
      response: { status: 200, headers: {}, body: {}, latencyMs: 10 },
      attempts: 1,
    });

    const nodes = [
      makeStartNode("start"),
      makeNode("a"),
      makeNode("c"), // disconnected chain c -> d
      makeNode("d"),
    ];
    const edges = [makeEdge("start", "a"), makeEdge("c", "d")];
    const flow = makeFlow(nodes, edges);

    const { logs } = await collectLogs(executeFlow(flow, noopCallbacks));

    expect(logs.map((l) => l.nodeId)).toEqual(["start", "a"]);
  });

  it("executes full connected chain from Start", async () => {
    mockSendWithRetry.mockResolvedValue({
      response: { status: 200, headers: {}, body: {}, latencyMs: 10 },
      attempts: 1,
    });

    const nodes = [
      makeStartNode("start"),
      makeNode("a"),
      makeNode("b"),
      makeNode("standalone"),
    ];
    const edges = [makeEdge("start", "a"), makeEdge("a", "b")];
    const flow = makeFlow(nodes, edges);

    const { logs, status } = await collectLogs(executeFlow(flow, noopCallbacks));

    expect(logs.map((l) => l.nodeId)).toEqual(["start", "a", "b"]);
    expect(status).toBe("success");
  });

  it("getExecutionLevels excludes unreachable nodes", () => {
    const nodes = [
      makeStartNode("start"),
      makeNode("a"),
      makeNode("b"),
      makeNode("x"), // not connected
    ];
    const edges = [makeEdge("start", "a"), makeEdge("a", "b")];

    const levels = getExecutionLevels(nodes, edges);
    const allIds = levels.flat().map((n) => n.id);
    expect(allIds).toEqual(["start", "a", "b"]);
    expect(allIds).not.toContain("x");
  });
});
