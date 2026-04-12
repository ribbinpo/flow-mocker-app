import { describe, it, expect } from "vitest";
import { CookieJar } from "../cookieJar";

describe("CookieJar", () => {
  it("starts empty", () => {
    const jar = new CookieJar();
    expect(jar.isEmpty()).toBe(true);
    expect(jar.getCookieHeader()).toBe("");
  });

  it("parses a simple set-cookie header", () => {
    const jar = new CookieJar();
    jar.parseSetCookieHeaders({ "set-cookie": "session=abc123" });

    expect(jar.isEmpty()).toBe(false);
    expect(jar.getCookieHeader()).toBe("session=abc123");
  });

  it("parses set-cookie with attributes", () => {
    const jar = new CookieJar();
    jar.parseSetCookieHeaders({
      "set-cookie": "token=xyz; Path=/; HttpOnly; Secure",
    });

    expect(jar.getCookieHeader()).toBe("token=xyz");
  });

  it("handles multiple set-cookie calls (accumulates)", () => {
    const jar = new CookieJar();
    jar.parseSetCookieHeaders({ "set-cookie": "session=abc" });
    jar.parseSetCookieHeaders({ "set-cookie": "csrf=def456" });

    const header = jar.getCookieHeader();
    expect(header).toContain("session=abc");
    expect(header).toContain("csrf=def456");
  });

  it("overwrites cookies with the same name", () => {
    const jar = new CookieJar();
    jar.parseSetCookieHeaders({ "set-cookie": "session=old" });
    jar.parseSetCookieHeaders({ "set-cookie": "session=new" });

    expect(jar.getCookieHeader()).toBe("session=new");
  });

  it("excludes expired cookies", () => {
    const jar = new CookieJar();
    jar.parseSetCookieHeaders({
      "set-cookie": "expired=val; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    });

    expect(jar.getCookieHeader()).toBe("");
  });

  it("handles cookie values with equals signs", () => {
    const jar = new CookieJar();
    jar.parseSetCookieHeaders({ "set-cookie": "data=a=b=c" });

    expect(jar.getCookieHeader()).toBe("data=a=b=c");
  });

  it("ignores non-set-cookie headers", () => {
    const jar = new CookieJar();
    jar.parseSetCookieHeaders({
      "content-type": "application/json",
      "x-request-id": "123",
    });

    expect(jar.isEmpty()).toBe(true);
  });

  it("handles Set-Cookie case-insensitively", () => {
    const jar = new CookieJar();
    jar.parseSetCookieHeaders({ "Set-Cookie": "token=abc" });

    expect(jar.getCookieHeader()).toBe("token=abc");
  });
});
