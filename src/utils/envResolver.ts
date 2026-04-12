import type { RequestConfig } from "@/types";

const ENV_PATTERN = /\{\{(\w+)\}\}/g;

export function resolveEnvVariables(
  template: string,
  env: Record<string, string>,
): string {
  return template.replace(ENV_PATTERN, (match, key: string) => {
    return key in env ? env[key] : match;
  });
}

function resolveRecord(
  record: Record<string, string>,
  env: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    result[key] = resolveEnvVariables(value, env);
  }
  return result;
}

export function resolveEnvInRequest(
  config: RequestConfig,
  env: Record<string, string>,
): RequestConfig {
  return {
    method: config.method,
    url: resolveEnvVariables(config.url, env),
    headers: resolveRecord(config.headers, env),
    queryParams: resolveRecord(config.queryParams, env),
    body: resolveEnvVariables(config.body, env),
  };
}
