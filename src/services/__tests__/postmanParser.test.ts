import { describe, it, expect } from "vitest";
import { parsePostmanCollection } from "../postmanParser";

function makeCollection(items: unknown[]) {
  return JSON.stringify({
    info: {
      name: "Test Collection",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: items,
  });
}

describe("parsePostmanCollection", () => {
  it("parses a simple GET request", () => {
    const json = makeCollection([
      {
        name: "Get Users",
        request: {
          method: "GET",
          header: [],
          url: {
            raw: "https://api.example.com/users",
            host: ["api", "example", "com"],
            path: ["users"],
          },
        },
      },
    ]);

    const result = parsePostmanCollection(json);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].method).toBe("GET");
    expect(result.entries[0].url).toBe("https://api.example.com/users");
    expect(result.entries[0].name).toBe("Get Users");
    expect(result.entries[0].folderId).toBeNull();
    expect(result.folders).toHaveLength(0);
  });

  it("parses POST with headers and body", () => {
    const json = makeCollection([
      {
        name: "Create User",
        request: {
          method: "POST",
          header: [
            { key: "Content-Type", value: "application/json" },
            { key: "Authorization", value: "Bearer {{token}}" },
          ],
          url: { raw: "https://api.example.com/users" },
          body: {
            mode: "raw",
            raw: '{"name":"John","email":"john@test.com"}',
          },
        },
      },
    ]);

    const result = parsePostmanCollection(json);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entries[0].method).toBe("POST");
    expect(result.entries[0].headers["Content-Type"]).toBe("application/json");
    expect(result.entries[0].headers["Authorization"]).toBe("Bearer {{token}}");
    expect(result.entries[0].body).toBe('{"name":"John","email":"john@test.com"}');
  });

  it("extracts query params from url.query", () => {
    const json = makeCollection([
      {
        name: "Search",
        request: {
          method: "GET",
          header: [],
          url: {
            raw: "https://api.example.com/search?q=test&page=1",
            query: [
              { key: "q", value: "test" },
              { key: "page", value: "1" },
            ],
          },
        },
      },
    ]);

    const result = parsePostmanCollection(json);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entries[0].queryParams["q"]).toBe("test");
    expect(result.entries[0].queryParams["page"]).toBe("1");
  });

  it("skips disabled headers and query params", () => {
    const json = makeCollection([
      {
        name: "Request",
        request: {
          method: "GET",
          header: [
            { key: "Accept", value: "application/json" },
            { key: "X-Debug", value: "true", disabled: true },
          ],
          url: {
            raw: "https://api.example.com/data",
            query: [
              { key: "active", value: "true" },
              { key: "debug", value: "1", disabled: true },
            ],
          },
        },
      },
    ]);

    const result = parsePostmanCollection(json);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entries[0].headers["Accept"]).toBe("application/json");
    expect(result.entries[0].headers["X-Debug"]).toBeUndefined();
    expect(result.entries[0].queryParams["active"]).toBe("true");
    expect(result.entries[0].queryParams["debug"]).toBeUndefined();
  });

  it("handles nested folders with tags and folder info", () => {
    const json = makeCollection([
      {
        name: "Auth",
        item: [
          {
            name: "Login",
            request: {
              method: "POST",
              header: [],
              url: { raw: "https://api.example.com/auth/login" },
              body: { mode: "raw", raw: '{"user":"admin"}' },
            },
          },
          {
            name: "Logout",
            request: {
              method: "POST",
              header: [],
              url: { raw: "https://api.example.com/auth/logout" },
            },
          },
        ],
      },
      {
        name: "Get Profile",
        request: {
          method: "GET",
          header: [],
          url: { raw: "https://api.example.com/me" },
        },
      },
    ]);

    const result = parsePostmanCollection(json);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entries).toHaveLength(3);
    expect(result.entries[0].name).toBe("Login");
    expect(result.entries[0].tags).toEqual(["Auth"]);
    expect(result.entries[1].name).toBe("Logout");
    expect(result.entries[1].tags).toEqual(["Auth"]);
    expect(result.entries[2].name).toBe("Get Profile");
    expect(result.entries[2].tags).toEqual([]);

    // Folder info
    expect(result.folders).toHaveLength(1);
    expect(result.folders[0].name).toBe("Auth");
    expect(result.folders[0].entryIndices).toEqual([0, 1]);
  });

  it("handles deeply nested folders", () => {
    const json = makeCollection([
      {
        name: "V2",
        item: [
          {
            name: "Users",
            item: [
              {
                name: "List Users",
                request: {
                  method: "GET",
                  header: [],
                  url: { raw: "https://api.example.com/v2/users" },
                },
              },
            ],
          },
        ],
      },
    ]);

    const result = parsePostmanCollection(json);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].tags).toEqual(["V2", "Users"]);

    // V2 folder contains the entry (index 0), Users sub-folder also contains it
    expect(result.folders).toHaveLength(2);
    const folderNames = result.folders.map((f) => f.name);
    expect(folderNames).toContain("V2");
    expect(folderNames).toContain("Users");

    const usersFolder = result.folders.find((f) => f.name === "Users");
    expect(usersFolder?.entryIndices).toEqual([0]);
  });

  it("preserves Postman variables in URL and headers", () => {
    const json = makeCollection([
      {
        name: "Get Item",
        request: {
          method: "GET",
          header: [
            { key: "Authorization", value: "Bearer {{access_token}}" },
          ],
          url: { raw: "{{base_url}}/items/{{item_id}}" },
        },
      },
    ]);

    const result = parsePostmanCollection(json);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entries[0].url).toBe("{{base_url}}/items/{{item_id}}");
    expect(result.entries[0].headers["Authorization"]).toBe("Bearer {{access_token}}");
  });

  it("handles string URL format", () => {
    const json = makeCollection([
      {
        name: "Simple",
        request: {
          method: "GET",
          header: [],
          url: "https://api.example.com/simple",
        },
      },
    ]);

    const result = parsePostmanCollection(json);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entries[0].url).toBe("https://api.example.com/simple");
  });

  it("returns error for invalid JSON", () => {
    const result = parsePostmanCollection("not json");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBe("Invalid JSON");
  });

  it("returns error when no items found", () => {
    const result = parsePostmanCollection(JSON.stringify({ info: {} }));
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBe("No items found in collection");
  });

  it("returns error when no valid requests found", () => {
    const json = makeCollection([{ name: "Empty folder", item: [] }]);
    const result = parsePostmanCollection(json);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBe("No valid requests found in collection");
  });

  it("defaults method to GET when not specified", () => {
    const json = makeCollection([
      {
        name: "No Method",
        request: {
          header: [],
          url: { raw: "https://api.example.com/default" },
        },
      },
    ]);

    const result = parsePostmanCollection(json);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entries[0].method).toBe("GET");
  });

  it("returns multiple folder infos for sibling folders", () => {
    const json = makeCollection([
      {
        name: "Auth",
        item: [
          {
            name: "Login",
            request: { method: "POST", header: [], url: { raw: "https://api.example.com/login" } },
          },
        ],
      },
      {
        name: "Users",
        item: [
          {
            name: "Get User",
            request: { method: "GET", header: [], url: { raw: "https://api.example.com/users/1" } },
          },
          {
            name: "Delete User",
            request: { method: "DELETE", header: [], url: { raw: "https://api.example.com/users/1" } },
          },
        ],
      },
    ]);

    const result = parsePostmanCollection(json);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entries).toHaveLength(3);
    expect(result.folders).toHaveLength(2);

    const authFolder = result.folders.find((f) => f.name === "Auth");
    expect(authFolder?.entryIndices).toEqual([0]);

    const usersFolder = result.folders.find((f) => f.name === "Users");
    expect(usersFolder?.entryIndices).toEqual([1, 2]);
  });
});
