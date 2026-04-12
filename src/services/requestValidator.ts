import type { RequestConfig } from "@/types";
import { HTTP_METHODS } from "@/utils/constants";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const URL_PATTERN = /^https?:\/\/.+/;

export function validateRequest(config: RequestConfig): ValidationResult {
  const errors: string[] = [];

  if (!config.url) {
    errors.push("URL is required");
  } else if (!URL_PATTERN.test(config.url)) {
    errors.push("URL must start with http:// or https://");
  }

  if (!HTTP_METHODS.includes(config.method)) {
    errors.push(`Invalid HTTP method: ${config.method}`);
  }

  if (config.body && ["POST", "PUT", "PATCH"].includes(config.method)) {
    try {
      JSON.parse(config.body);
    } catch {
      errors.push("Request body is not valid JSON");
    }
  }

  for (const key of Object.keys(config.headers)) {
    if (!key.trim()) {
      errors.push("Header keys must not be empty");
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
