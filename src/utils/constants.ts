import type { HttpMethod } from "../types";

export const HTTP_METHODS: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
];

export const DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
};

export const API_TIMEOUT_MS = 30_000;

export const APP_NAME = "Flow Mocker";

export const STORAGE_FILE_NAME = "flows.json";
