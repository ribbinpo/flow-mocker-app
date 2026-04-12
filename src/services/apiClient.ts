import axios from "axios";
import { z } from "zod/v4";
import type { RequestConfig, ResponseData } from "@/types";
import { API_TIMEOUT_MS } from "@/utils/constants";

const client = axios.create({
  timeout: API_TIMEOUT_MS,
});

const responseSchema = z.object({
  status: z.number(),
  headers: z.record(z.string(), z.string()),
  data: z.unknown(),
});

export async function sendRequest(config: RequestConfig): Promise<ResponseData> {
  const startTime = performance.now();

  const response = await client.request({
    method: config.method,
    url: config.url,
    headers: config.headers,
    params: config.queryParams,
    data: config.body ? JSON.parse(config.body) : undefined,
    validateStatus: () => true,
  });

  const latencyMs = Math.round(performance.now() - startTime);

  const parsed = responseSchema.parse({
    status: response.status,
    headers: response.headers as Record<string, string>,
    data: response.data,
  });

  return {
    status: parsed.status,
    headers: parsed.headers,
    body: parsed.data,
    latencyMs,
  };
}
