import axios from "axios";
import { z } from "zod/v4";
import type { RequestConfig, ResponseData } from "@/types";
import { API_TIMEOUT_MS } from "@/utils/constants";

const client = axios.create({
  timeout: API_TIMEOUT_MS,
});

const responseSchema = z.object({
  status: z.number(),
  headers: z.any(),
  data: z.unknown(),
});

function isTauriContext(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

async function sendViaTauri(config: RequestConfig): Promise<ResponseData> {
  const { invoke } = await import("@tauri-apps/api/core");

  const body = config.body ? config.body.replace(/\n/g, "").trim() : undefined;

  const result = await invoke<{
    status: number;
    headers: Record<string, string>;
    body: unknown;
    latencyMs: number;
  }>("proxy_request", {
    request: {
      method: config.method,
      url: config.url,
      headers: config.headers,
      queryParams: config.queryParams,
      body: body || undefined,
    },
  });

  return {
    status: result.status,
    headers: result.headers,
    body: result.body,
    latencyMs: result.latencyMs,
  };
}

async function sendViaAxios(config: RequestConfig): Promise<ResponseData> {
  const startTime = performance.now();

  const response = await client.request({
    method: config.method,
    url: config.url,
    headers: config.headers,
    params: config.queryParams,
    data: config.body ? JSON.parse(config.body.replace(/\n/g, "")) : undefined,
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

export async function sendRequest(config: RequestConfig): Promise<ResponseData> {
  if (isTauriContext()) {
    return sendViaTauri(config);
  }
  return sendViaAxios(config);
}
