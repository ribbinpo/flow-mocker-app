import { describe, it, expect } from "vitest";
import { extractVariableReferences, generateDataMappings } from "../templateParser";
import type { ApiNode, StoreNode } from "@/types";

describe("extractVariableReferences", () => {
  it("extracts single variable", () => {
    expect(extractVariableReferences("{{token}}")).toEqual(["token"]);
  });

  it("extracts multiple variables", () => {
    expect(extractVariableReferences("{{userId}}/{{name}}")).toEqual(["userId", "name"]);
  });

  it("returns empty for no variables", () => {
    expect(extractVariableReferences("plain text")).toEqual([]);
  });

  it("returns empty for empty string", () => {
    expect(extractVariableReferences("")).toEqual([]);
  });

  it("extracts from URL template", () => {
    expect(extractVariableReferences("https://api.com/users/{{userId}}/posts")).toEqual(["userId"]);
  });
});

describe("generateDataMappings", () => {
  const storeNode: StoreNode = {
    id: "store-1",
    type: "store",
    label: "Auth Store",
    variables: [
      { id: "v1", name: "token", sourceNodeId: "api-1", sourcePath: "data.token" },
      { id: "v2", name: "userId", sourceNodeId: "api-1", sourcePath: "data.userId" },
    ],
    position: { x: 0, y: 0 },
  };

  it("generates mapping from URL template", () => {
    const apiNode: ApiNode = {
      id: "api-2",
      type: "api",
      label: "Get Profile",
      method: "GET",
      url: "https://api.com/users/{{userId}}",
      headers: {},
      queryParams: {},
      body: "",
      dataMapping: [],
      position: { x: 0, y: 0 },
    };

    const mappings = generateDataMappings(apiNode, [storeNode]);
    expect(mappings).toHaveLength(1);
    expect(mappings[0]).toEqual({
      sourceNodeId: "store-1",
      sourcePath: "userId",
      targetField: "url",
      targetKey: "",
    });
  });

  it("generates mapping from header value", () => {
    const apiNode: ApiNode = {
      id: "api-2",
      type: "api",
      label: "Get Profile",
      method: "GET",
      url: "https://api.com/profile",
      headers: { Authorization: "Bearer {{token}}" },
      queryParams: {},
      body: "",
      dataMapping: [],
      position: { x: 0, y: 0 },
    };

    const mappings = generateDataMappings(apiNode, [storeNode]);
    expect(mappings).toHaveLength(1);
    expect(mappings[0]).toEqual({
      sourceNodeId: "store-1",
      sourcePath: "token",
      targetField: "header",
      targetKey: "Authorization",
    });
  });

  it("generates multiple mappings from different fields", () => {
    const apiNode: ApiNode = {
      id: "api-2",
      type: "api",
      label: "Update",
      method: "PUT",
      url: "https://api.com/users/{{userId}}",
      headers: { Authorization: "Bearer {{token}}" },
      queryParams: {},
      body: "",
      dataMapping: [],
      position: { x: 0, y: 0 },
    };

    const mappings = generateDataMappings(apiNode, [storeNode]);
    expect(mappings).toHaveLength(2);
  });

  it("returns empty for no templates", () => {
    const apiNode: ApiNode = {
      id: "api-2",
      type: "api",
      label: "List",
      method: "GET",
      url: "https://api.com/items",
      headers: {},
      queryParams: {},
      body: "",
      dataMapping: [],
      position: { x: 0, y: 0 },
    };

    const mappings = generateDataMappings(apiNode, [storeNode]);
    expect(mappings).toHaveLength(0);
  });

  it("ignores unknown variable names", () => {
    const apiNode: ApiNode = {
      id: "api-2",
      type: "api",
      label: "Test",
      method: "GET",
      url: "https://api.com/{{unknown}}",
      headers: {},
      queryParams: {},
      body: "",
      dataMapping: [],
      position: { x: 0, y: 0 },
    };

    const mappings = generateDataMappings(apiNode, [storeNode]);
    expect(mappings).toHaveLength(0);
  });
});
