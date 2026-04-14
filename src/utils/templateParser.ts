import type { ApiNode, DataMapping, StoreNode } from "@/types";

const STORE_VAR_PATTERN = /\[\[(\w+)\]\]/g;

/**
 * Extract all [[variableName]] references from a string.
 */
export function extractVariableReferences(text: string): string[] {
  const refs: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = STORE_VAR_PATTERN.exec(text)) !== null) {
    refs.push(match[1]);
  }
  return refs;
}

/**
 * Scan all fields of an API node and auto-generate DataMapping entries
 * based on [[variableName]] templates found in url, headers, query params, and body.
 * Maps each reference to the Store node that contains that variable.
 */
export function generateDataMappings(
  node: ApiNode,
  upstreamStoreNodes: StoreNode[],
): DataMapping[] {
  const mappings: DataMapping[] = [];

  // Build a lookup: variableName -> storeNodeId
  const varToStore = new Map<string, string>();
  for (const store of upstreamStoreNodes) {
    for (const variable of store.variables) {
      if (variable.name) {
        varToStore.set(variable.name, store.id);
      }
    }
  }

  function addMappingsFromText(
    text: string,
    targetField: "header" | "query" | "body" | "url",
    targetKey: string,
  ) {
    const refs = extractVariableReferences(text);
    for (const varName of refs) {
      const storeId = varToStore.get(varName);
      if (storeId) {
        mappings.push({
          sourceNodeId: storeId,
          sourcePath: varName,
          targetField,
          targetKey,
        });
      }
    }
  }

  // Scan URL
  addMappingsFromText(node.url, "url", "");

  // Scan headers
  for (const [key, value] of Object.entries(node.headers)) {
    addMappingsFromText(value, "header", key);
  }

  // Scan query params
  for (const [key, value] of Object.entries(node.queryParams)) {
    addMappingsFromText(value, "query", key);
  }

  // Scan body
  if (node.body) {
    addMappingsFromText(node.body, "body", "");
  }

  return mappings;
}
