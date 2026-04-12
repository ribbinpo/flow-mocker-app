import type { RequestConfig, ResponseData, RetryConfig } from "@/types";
import { sendRequest } from "./apiClient";

export interface RetryResult {
  response: ResponseData;
  attempts: number;
}

function isRetryable(error: unknown, response?: ResponseData): boolean {
  if (error) return true;
  if (response && response.status >= 500) return true;
  return false;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new Error("Aborted"));
    }, { once: true });
  });
}

export async function sendWithRetry(
  config: RequestConfig,
  retryConfig?: RetryConfig,
  signal?: AbortSignal,
): Promise<RetryResult> {
  const maxRetries = retryConfig?.maxRetries ?? 0;
  const delayMs = retryConfig?.delayMs ?? 1000;

  let lastError: unknown = null;
  let lastResponse: ResponseData | undefined;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    if (signal?.aborted) {
      throw new Error("Aborted");
    }

    try {
      const response = await sendRequest(config);
      lastResponse = response;

      if (response.status < 500 || attempt > maxRetries) {
        return { response, attempts: attempt };
      }
    } catch (error) {
      lastError = error;

      if (attempt > maxRetries || !isRetryable(error)) {
        throw error;
      }
    }

    if (attempt <= maxRetries) {
      await delay(delayMs, signal);
    }
  }

  if (lastResponse) {
    return { response: lastResponse, attempts: maxRetries + 1 };
  }

  throw lastError;
}
