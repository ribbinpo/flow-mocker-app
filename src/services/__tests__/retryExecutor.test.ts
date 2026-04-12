import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendWithRetry } from "../retryExecutor";
import type { RequestConfig, ResponseData } from "@/types";

vi.mock("../apiClient", () => ({
  sendRequest: vi.fn(),
}));

import { sendRequest } from "../apiClient";

const mockSendRequest = vi.mocked(sendRequest);

const baseConfig: RequestConfig = {
  method: "GET",
  url: "https://api.example.com",
  headers: {},
  queryParams: {},
  body: "",
};

const successResponse: ResponseData = {
  status: 200,
  headers: {},
  body: { ok: true },
  latencyMs: 50,
};

const serverErrorResponse: ResponseData = {
  status: 500,
  headers: {},
  body: { error: "Internal Server Error" },
  latencyMs: 50,
};

describe("sendWithRetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succeeds on first attempt with no retry config", async () => {
    mockSendRequest.mockResolvedValue(successResponse);

    const result = await sendWithRetry(baseConfig);

    expect(result.response).toEqual(successResponse);
    expect(result.attempts).toBe(1);
    expect(mockSendRequest).toHaveBeenCalledTimes(1);
  });

  it("succeeds on first attempt with retry config", async () => {
    mockSendRequest.mockResolvedValue(successResponse);

    const result = await sendWithRetry(baseConfig, {
      maxRetries: 3,
      delayMs: 10,
    });

    expect(result.response).toEqual(successResponse);
    expect(result.attempts).toBe(1);
    expect(mockSendRequest).toHaveBeenCalledTimes(1);
  });

  it("retries on 5xx and succeeds", async () => {
    mockSendRequest
      .mockResolvedValueOnce(serverErrorResponse)
      .mockResolvedValueOnce(successResponse);

    const result = await sendWithRetry(baseConfig, {
      maxRetries: 2,
      delayMs: 10,
    });

    expect(result.response).toEqual(successResponse);
    expect(result.attempts).toBe(2);
    expect(mockSendRequest).toHaveBeenCalledTimes(2);
  });

  it("retries on network error and succeeds", async () => {
    mockSendRequest
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValueOnce(successResponse);

    const result = await sendWithRetry(baseConfig, {
      maxRetries: 2,
      delayMs: 10,
    });

    expect(result.response).toEqual(successResponse);
    expect(result.attempts).toBe(2);
  });

  it("exhausts retries on persistent 5xx", async () => {
    mockSendRequest.mockResolvedValue(serverErrorResponse);

    const result = await sendWithRetry(baseConfig, {
      maxRetries: 2,
      delayMs: 10,
    });

    expect(result.response.status).toBe(500);
    expect(result.attempts).toBe(3);
    expect(mockSendRequest).toHaveBeenCalledTimes(3);
  });

  it("throws on persistent network error", async () => {
    mockSendRequest.mockRejectedValue(new Error("Network Error"));

    await expect(
      sendWithRetry(baseConfig, { maxRetries: 1, delayMs: 10 }),
    ).rejects.toThrow("Network Error");

    expect(mockSendRequest).toHaveBeenCalledTimes(2);
  });

  it("does not retry 4xx errors", async () => {
    const notFoundResponse: ResponseData = {
      status: 404,
      headers: {},
      body: { error: "Not Found" },
      latencyMs: 30,
    };
    mockSendRequest.mockResolvedValue(notFoundResponse);

    const result = await sendWithRetry(baseConfig, {
      maxRetries: 2,
      delayMs: 10,
    });

    expect(result.response.status).toBe(404);
    expect(result.attempts).toBe(1);
    expect(mockSendRequest).toHaveBeenCalledTimes(1);
  });

  it("respects abort signal", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      sendWithRetry(baseConfig, { maxRetries: 2, delayMs: 10 }, controller.signal),
    ).rejects.toThrow("Aborted");

    expect(mockSendRequest).not.toHaveBeenCalled();
  });
});
