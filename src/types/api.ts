import type { HttpMethod } from "./flow";

export interface RequestConfig {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: string;
}

export interface ResponseData {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  latencyMs: number;
}
