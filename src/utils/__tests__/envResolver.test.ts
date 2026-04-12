import { describe, it, expect } from "vitest";
import { resolveEnvVariables, resolveEnvInRequest } from "../envResolver";

describe("resolveEnvVariables", () => {
  it("replaces a single variable", () => {
    expect(
      resolveEnvVariables("{{BASE_URL}}/users", { BASE_URL: "http://api.com" }),
    ).toBe("http://api.com/users");
  });

  it("replaces multiple variables", () => {
    expect(
      resolveEnvVariables("{{SCHEME}}://{{HOST}}/api", {
        SCHEME: "https",
        HOST: "example.com",
      }),
    ).toBe("https://example.com/api");
  });

  it("leaves unknown variables as-is", () => {
    expect(resolveEnvVariables("{{UNKNOWN}}/path", {})).toBe(
      "{{UNKNOWN}}/path",
    );
  });

  it("returns string unchanged when no variables present", () => {
    expect(resolveEnvVariables("plain string", { KEY: "value" })).toBe(
      "plain string",
    );
  });

  it("handles empty string", () => {
    expect(resolveEnvVariables("", { KEY: "value" })).toBe("");
  });

  it("handles empty env", () => {
    expect(resolveEnvVariables("{{KEY}}", {})).toBe("{{KEY}}");
  });
});

describe("resolveEnvInRequest", () => {
  it("resolves variables in all request fields", () => {
    const config = {
      method: "GET" as const,
      url: "{{BASE_URL}}/users",
      headers: { Authorization: "Bearer {{TOKEN}}" },
      queryParams: { env: "{{ENV}}" },
      body: '{"key": "{{VALUE}}"}',
    };

    const env = {
      BASE_URL: "http://api.com",
      TOKEN: "secret",
      ENV: "production",
      VALUE: "test",
    };

    const result = resolveEnvInRequest(config, env);

    expect(result.url).toBe("http://api.com/users");
    expect(result.headers.Authorization).toBe("Bearer secret");
    expect(result.queryParams.env).toBe("production");
    expect(result.body).toBe('{"key": "test"}');
    expect(result.method).toBe("GET");
  });
});
