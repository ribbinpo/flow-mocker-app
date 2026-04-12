import { describe, it, expect } from "vitest";
import { applyDataMappings } from "../dataMapper";
import type { DataMapping, RequestConfig } from "@/types";

describe("applyDataMappings", () => {
  const baseConfig: RequestConfig = {
    method: "GET",
    url: "https://api.example.com/users",
    headers: { "Content-Type": "application/json" },
    queryParams: {},
    body: "",
  };

  const context: Record<string, unknown> = {
    "node-1": {
      data: { token: "abc123", userId: 42 },
      status: 200,
    },
    "node-2": {
      items: [{ id: 1 }, { id: 2 }],
    },
  };

  it("injects into headers", () => {
    const mappings: DataMapping[] = [
      {
        sourceNodeId: "node-1",
        sourcePath: "data.token",
        targetField: "header",
        targetKey: "Authorization",
      },
    ];

    const result = applyDataMappings(baseConfig, mappings, context);
    expect(result.headers.Authorization).toBe("abc123");
    expect(result.headers["Content-Type"]).toBe("application/json");
  });

  it("injects into query params", () => {
    const mappings: DataMapping[] = [
      {
        sourceNodeId: "node-1",
        sourcePath: "data.userId",
        targetField: "query",
        targetKey: "user_id",
      },
    ];

    const result = applyDataMappings(baseConfig, mappings, context);
    expect(result.queryParams.user_id).toBe("42");
  });

  it("injects into URL via template replacement", () => {
    const config: RequestConfig = {
      ...baseConfig,
      url: "https://api.example.com/users/{{userId}}/profile",
    };
    const mappings: DataMapping[] = [
      {
        sourceNodeId: "node-1",
        sourcePath: "data.userId",
        targetField: "url",
        targetKey: "userId",
      },
    ];

    const result = applyDataMappings(config, mappings, context);
    expect(result.url).toBe("https://api.example.com/users/42/profile");
  });

  it("injects into body as top-level key", () => {
    const mappings: DataMapping[] = [
      {
        sourceNodeId: "node-1",
        sourcePath: "data.token",
        targetField: "body",
        targetKey: "accessToken",
      },
    ];

    const result = applyDataMappings(baseConfig, mappings, context);
    expect(JSON.parse(result.body)).toEqual({ accessToken: "abc123" });
  });

  it("skips mapping when source value is undefined", () => {
    const mappings: DataMapping[] = [
      {
        sourceNodeId: "node-1",
        sourcePath: "data.nonexistent",
        targetField: "header",
        targetKey: "X-Missing",
      },
    ];

    const result = applyDataMappings(baseConfig, mappings, context);
    expect(result.headers["X-Missing"]).toBeUndefined();
  });

  it("skips mapping when source node is missing", () => {
    const mappings: DataMapping[] = [
      {
        sourceNodeId: "missing-node",
        sourcePath: "data.token",
        targetField: "header",
        targetKey: "X-Token",
      },
    ];

    const result = applyDataMappings(baseConfig, mappings, context);
    expect(result.headers["X-Token"]).toBeUndefined();
  });

  it("applies multiple mappings in order", () => {
    const mappings: DataMapping[] = [
      {
        sourceNodeId: "node-1",
        sourcePath: "data.token",
        targetField: "header",
        targetKey: "Authorization",
      },
      {
        sourceNodeId: "node-1",
        sourcePath: "data.userId",
        targetField: "query",
        targetKey: "id",
      },
    ];

    const result = applyDataMappings(baseConfig, mappings, context);
    expect(result.headers.Authorization).toBe("abc123");
    expect(result.queryParams.id).toBe("42");
  });

  it("preserves non-string values in body injection", () => {
    const mappings: DataMapping[] = [
      {
        sourceNodeId: "node-2",
        sourcePath: "items",
        targetField: "body",
        targetKey: "list",
      },
    ];

    const result = applyDataMappings(baseConfig, mappings, context);
    expect(JSON.parse(result.body)).toEqual({
      list: [{ id: 1 }, { id: 2 }],
    });
  });

  it("returns config unchanged with empty mappings", () => {
    const result = applyDataMappings(baseConfig, [], context);
    expect(result).toEqual(baseConfig);
  });
});
