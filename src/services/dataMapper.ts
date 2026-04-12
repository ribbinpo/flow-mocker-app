import type { DataMapping, RequestConfig } from "@/types";
import { resolveJsonPath } from "@/utils/jsonPath";

export function applyDataMappings(
  config: RequestConfig,
  mappings: DataMapping[],
  context: Record<string, unknown>,
): RequestConfig {
  let result: RequestConfig = { ...config };

  for (const mapping of mappings) {
    const sourceData = context[mapping.sourceNodeId];
    const value = resolveJsonPath(sourceData, mapping.sourcePath);

    if (value === undefined) continue;

    const stringValue = typeof value === "string" ? value : JSON.stringify(value);

    switch (mapping.targetField) {
      case "header":
        result = {
          ...result,
          headers: { ...result.headers, [mapping.targetKey]: stringValue },
        };
        break;

      case "query":
        result = {
          ...result,
          queryParams: { ...result.queryParams, [mapping.targetKey]: stringValue },
        };
        break;

      case "url":
        result = {
          ...result,
          url: result.url.replace(`{{${mapping.targetKey}}}`, stringValue),
        };
        break;

      case "body": {
        const body = result.body ? JSON.parse(result.body) : {};
        body[mapping.targetKey] = value;
        result = { ...result, body: JSON.stringify(body) };
        break;
      }
    }
  }

  return result;
}
