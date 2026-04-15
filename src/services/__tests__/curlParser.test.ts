import { describe, it, expect } from "vitest";
import { parseCurlCommand } from "../curlParser";

describe("parseCurlCommand", () => {
  it("parses a simple GET request", () => {
    const result = parseCurlCommand("curl https://api.example.com/users");
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entry.method).toBe("GET");
    expect(result.entry.url).toBe("https://api.example.com/users");
    expect(result.entry.body).toBe("");
    expect(result.entry.name).toBe("users");
  });

  it("parses POST with explicit method and body", () => {
    const result = parseCurlCommand(
      `curl -X POST https://api.example.com/login -H "Content-Type: application/json" -d '{"user":"admin","pass":"secret"}'`,
    );
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entry.method).toBe("POST");
    expect(result.entry.url).toBe("https://api.example.com/login");
    expect(result.entry.headers["Content-Type"]).toBe("application/json");
    expect(result.entry.body).toBe('{"user":"admin","pass":"secret"}');
  });

  it("auto-detects POST when body is present without -X", () => {
    const result = parseCurlCommand(
      `curl https://api.example.com/data -d '{"key":"value"}'`,
    );
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entry.method).toBe("POST");
  });

  it("parses multiple headers", () => {
    const result = parseCurlCommand(
      `curl -H "Authorization: Bearer token123" -H "Accept: application/json" https://api.example.com/me`,
    );
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entry.headers["Authorization"]).toBe("Bearer token123");
    expect(result.entry.headers["Accept"]).toBe("application/json");
  });

  it("parses basic auth (-u flag)", () => {
    const result = parseCurlCommand(
      `curl -u admin:password https://api.example.com/secure`,
    );
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entry.headers["Authorization"]).toMatch(/^Basic /);
  });

  it("handles multiline cURL with backslash continuations", () => {
    const result = parseCurlCommand(
      `curl \\\n  -X PUT \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"updated"}' \\\n  https://api.example.com/items/1`,
    );
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entry.method).toBe("PUT");
    expect(result.entry.url).toBe("https://api.example.com/items/1");
    expect(result.entry.body).toBe('{"name":"updated"}');
  });

  it("extracts query params from URL", () => {
    const result = parseCurlCommand(
      `curl "https://api.example.com/search?q=test&page=1"`,
    );
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entry.queryParams["q"]).toBe("test");
    expect(result.entry.queryParams["page"]).toBe("1");
    expect(result.entry.url).toBe("https://api.example.com/search");
  });

  it("handles --data-raw flag", () => {
    const result = parseCurlCommand(
      `curl -X POST https://api.example.com/data --data-raw '{"key":"value"}'`,
    );
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entry.body).toBe('{"key":"value"}');
  });

  it("skips boolean flags like -s, -k, -L", () => {
    const result = parseCurlCommand(
      `curl -s -k -L https://api.example.com/redirect`,
    );
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entry.url).toBe("https://api.example.com/redirect");
  });

  it("handles DELETE method", () => {
    const result = parseCurlCommand(
      `curl -X DELETE https://api.example.com/items/42`,
    );
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entry.method).toBe("DELETE");
  });

  it("returns error for empty input", () => {
    const result = parseCurlCommand("");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBe("Empty input");
  });

  it("returns error when no URL is found", () => {
    const result = parseCurlCommand("curl -X POST -H 'Content-Type: text/plain'");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBe("No URL found in cURL command");
  });

  it("handles URL with --url flag", () => {
    const result = parseCurlCommand(
      `curl --url https://api.example.com/endpoint`,
    );
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entry.url).toBe("https://api.example.com/endpoint");
  });

  it("handles PATCH method", () => {
    const result = parseCurlCommand(
      `curl -X PATCH -d '{"status":"active"}' https://api.example.com/users/1`,
    );
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entry.method).toBe("PATCH");
  });
});
