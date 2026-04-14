import { describe, it, expect } from "vitest";
import { buildStoreVariableLookup, resolveStoreVariablesInRequest } from "../storeResolver";
import type { RequestConfig } from "@/types";

describe("buildStoreVariableLookup", () => {
  it("builds lookup from store contexts", () => {
    const context = {
      "store-1": { token: "abc123", userId: 42 },
      "store-2": { sessionId: "xyz" },
      "api-1": { data: { nested: true } }, // API response, also included
    };

    const lookup = buildStoreVariableLookup(context);
    expect(lookup.token).toBe("abc123");
    expect(lookup.userId).toBe("42");
    expect(lookup.sessionId).toBe("xyz");
  });

  it("returns empty for empty context", () => {
    expect(buildStoreVariableLookup({})).toEqual({});
  });

  it("skips non-object values", () => {
    const context = {
      "api-1": "plain string",
      "api-2": 42,
      "store-1": { token: "abc" },
    };

    const lookup = buildStoreVariableLookup(context);
    expect(lookup.token).toBe("abc");
    expect(Object.keys(lookup)).toHaveLength(1);
  });
});

describe("resolveStoreVariablesInRequest", () => {
  const context = {
    "store-1": { token: "abc123", userId: 42 },
  };

  it("resolves templates in URL", () => {
    const config: RequestConfig = {
      method: "GET",
      url: "https://api.com/users/{{userId}}",
      headers: {},
      queryParams: {},
      body: "",
    };

    const result = resolveStoreVariablesInRequest(config, context);
    expect(result.url).toBe("https://api.com/users/42");
  });

  it("resolves templates in headers", () => {
    const config: RequestConfig = {
      method: "GET",
      url: "https://api.com",
      headers: { Authorization: "Bearer {{token}}" },
      queryParams: {},
      body: "",
    };

    const result = resolveStoreVariablesInRequest(config, context);
    expect(result.headers.Authorization).toBe("Bearer abc123");
  });

  it("resolves templates in query params", () => {
    const config: RequestConfig = {
      method: "GET",
      url: "https://api.com",
      headers: {},
      queryParams: { user: "{{userId}}" },
      body: "",
    };

    const result = resolveStoreVariablesInRequest(config, context);
    expect(result.queryParams.user).toBe("42");
  });

  it("resolves templates in body", () => {
    const config: RequestConfig = {
      method: "POST",
      url: "https://api.com",
      headers: {},
      queryParams: {},
      body: '{"token": "{{token}}"}',
    };

    const result = resolveStoreVariablesInRequest(config, context);
    expect(result.body).toBe('{"token": "abc123"}');
  });

  it("leaves unmatched templates unchanged", () => {
    const config: RequestConfig = {
      method: "GET",
      url: "https://api.com/{{unknown}}",
      headers: {},
      queryParams: {},
      body: "",
    };

    const result = resolveStoreVariablesInRequest(config, context);
    expect(result.url).toBe("https://api.com/{{unknown}}");
  });

  it("resolves multiple templates in one field", () => {
    const config: RequestConfig = {
      method: "GET",
      url: "https://api.com/users/{{userId}}/token/{{token}}",
      headers: {},
      queryParams: {},
      body: "",
    };

    const result = resolveStoreVariablesInRequest(config, context);
    expect(result.url).toBe("https://api.com/users/42/token/abc123");
  });
});
