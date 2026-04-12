import { describe, it, expect } from "vitest";
import { resolveJsonPath } from "../jsonPath";

describe("resolveJsonPath", () => {
  const obj = {
    data: {
      users: [
        { id: 1, name: "Alice", tags: ["admin", "active"] },
        { id: 2, name: "Bob", tags: ["user"] },
      ],
      token: "abc123",
      count: 0,
      empty: null,
    },
    status: 200,
  };

  it("resolves dot notation", () => {
    expect(resolveJsonPath(obj, "data.token")).toBe("abc123");
  });

  it("resolves nested dot notation", () => {
    expect(resolveJsonPath(obj, "data.users")).toEqual(obj.data.users);
  });

  it("resolves top-level key", () => {
    expect(resolveJsonPath(obj, "status")).toBe(200);
  });

  it("resolves array indexing", () => {
    expect(resolveJsonPath(obj, "data.users[0].name")).toBe("Alice");
    expect(resolveJsonPath(obj, "data.users[1].id")).toBe(2);
  });

  it("resolves nested array indexing", () => {
    expect(resolveJsonPath(obj, "data.users[0].tags[1]")).toBe("active");
  });

  it("returns undefined for missing path", () => {
    expect(resolveJsonPath(obj, "data.nonexistent")).toBeUndefined();
    expect(resolveJsonPath(obj, "missing.deep.path")).toBeUndefined();
  });

  it("returns undefined for out-of-bounds array index", () => {
    expect(resolveJsonPath(obj, "data.users[99]")).toBeUndefined();
  });

  it("returns undefined for null intermediate", () => {
    expect(resolveJsonPath(obj, "data.empty.key")).toBeUndefined();
  });

  it("returns undefined for non-object intermediate", () => {
    expect(resolveJsonPath(obj, "status.nested")).toBeUndefined();
  });

  it("returns root object for empty path", () => {
    expect(resolveJsonPath(obj, "")).toBe(obj);
  });

  it("returns undefined when obj is null or undefined", () => {
    expect(resolveJsonPath(null, "key")).toBeUndefined();
    expect(resolveJsonPath(undefined, "key")).toBeUndefined();
  });

  it("resolves falsy values correctly", () => {
    expect(resolveJsonPath(obj, "data.count")).toBe(0);
    expect(resolveJsonPath(obj, "data.empty")).toBeNull();
  });
});
