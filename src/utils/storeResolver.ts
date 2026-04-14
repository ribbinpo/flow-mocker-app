import type { RequestConfig } from "@/types";

const TEMPLATE_PATTERN = /\{\{(\w+)\}\}/g;

/**
 * Build a flat lookup of variable name → resolved value
 * from all Store node contexts.
 */
export function buildStoreVariableLookup(
  context: Record<string, unknown>,
): Record<string, string> {
  const lookup: Record<string, string> = {};

  for (const value of Object.values(context)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        if (val !== undefined && !(key in lookup)) {
          lookup[key] = typeof val === "string" ? val : JSON.stringify(val);
        }
      }
    }
  }

  return lookup;
}

function resolveTemplate(
  template: string,
  lookup: Record<string, string>,
): string {
  return template.replace(TEMPLATE_PATTERN, (match, key: string) => {
    return key in lookup ? lookup[key] : match;
  });
}

function resolveRecord(
  record: Record<string, string>,
  lookup: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    result[key] = resolveTemplate(value, lookup);
  }
  return result;
}

/**
 * Resolve {{variableName}} templates in all request fields
 * using values from Store node contexts.
 */
export function resolveStoreVariablesInRequest(
  config: RequestConfig,
  context: Record<string, unknown>,
): RequestConfig {
  const lookup = buildStoreVariableLookup(context);

  return {
    method: config.method,
    url: resolveTemplate(config.url, lookup),
    headers: resolveRecord(config.headers, lookup),
    queryParams: resolveRecord(config.queryParams, lookup),
    body: resolveTemplate(config.body, lookup),
  };
}
