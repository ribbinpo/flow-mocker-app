import { describe, it, expect } from "vitest";
import { validateRequest } from "../requestValidator";
import type { RequestConfig } from "@/types";

describe("validateRequest", () => {
  const validConfig: RequestConfig = {
    method: "GET",
    url: "https://api.example.com/users",
    headers: { "Content-Type": "application/json" },
    queryParams: {},
    body: "",
  };

  it("passes valid GET request", () => {
    const result = validateRequest(validConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("passes valid POST request with JSON body", () => {
    const config: RequestConfig = {
      ...validConfig,
      method: "POST",
      body: '{"key": "value"}',
    };
    const result = validateRequest(config);
    expect(result.valid).toBe(true);
  });

  it("fails when URL is empty", () => {
    const config: RequestConfig = { ...validConfig, url: "" };
    const result = validateRequest(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("URL is required");
  });

  it("fails when URL has no protocol", () => {
    const config: RequestConfig = { ...validConfig, url: "api.example.com" };
    const result = validateRequest(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("URL must start with http:// or https://");
  });

  it("passes http:// URL", () => {
    const config: RequestConfig = {
      ...validConfig,
      url: "http://localhost:3000/api",
    };
    const result = validateRequest(config);
    expect(result.valid).toBe(true);
  });

  it("fails when POST body is invalid JSON", () => {
    const config: RequestConfig = {
      ...validConfig,
      method: "POST",
      body: "not json {",
    };
    const result = validateRequest(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Request body is not valid JSON");
  });

  it("passes when GET has non-JSON body (ignored)", () => {
    const config: RequestConfig = {
      ...validConfig,
      method: "GET",
      body: "not json",
    };
    const result = validateRequest(config);
    expect(result.valid).toBe(true);
  });

  it("fails when header key is empty", () => {
    const config: RequestConfig = {
      ...validConfig,
      headers: { "": "value" },
    };
    const result = validateRequest(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Header keys must not be empty");
  });

  it("collects multiple errors", () => {
    const config: RequestConfig = {
      ...validConfig,
      url: "",
      method: "POST",
      body: "bad json",
    };
    const result = validateRequest(config);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});
