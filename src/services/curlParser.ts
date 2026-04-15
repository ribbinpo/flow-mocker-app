import type { HttpMethod } from "@/types";
import type { CatalogEntryDraft } from "@/types";

type ParseSuccess = { success: true; entry: CatalogEntryDraft };
type ParseError = { success: false; error: string };
export type CurlParseResult = ParseSuccess | ParseError;

const VALID_METHODS = new Set<string>(["GET", "POST", "PUT", "DELETE", "PATCH"]);

function normalizeInput(input: string): string {
  return input
    .replace(/\\\r?\n/g, " ")
    .replace(/\r?\n/g, " ")
    .trim();
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      continue;
    }

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      continue;
    }

    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }

    if ((ch === " " || ch === "\t") && !inSingle && !inDouble) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += ch;
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

function parseQueryParams(urlString: string): {
  baseUrl: string;
  queryParams: Record<string, string>;
} {
  try {
    const url = new URL(urlString);
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    url.search = "";
    return { baseUrl: url.toString(), queryParams };
  } catch {
    return { baseUrl: urlString, queryParams: {} };
  }
}

function toBase64(str: string): string {
  return globalThis.btoa(str);
}

export function parseCurlCommand(input: string): CurlParseResult {
  const normalized = normalizeInput(input);
  if (!normalized) {
    return { success: false, error: "Empty input" };
  }

  const tokens = tokenize(normalized);
  if (tokens.length === 0) {
    return { success: false, error: "Empty input" };
  }

  // Strip leading "curl" if present
  let startIdx = 0;
  if (tokens[0].toLowerCase() === "curl") {
    startIdx = 1;
  }

  let method: string | null = null;
  let url: string | null = null;
  let body = "";
  const headers: Record<string, string> = {};

  for (let i = startIdx; i < tokens.length; i++) {
    const token = tokens[i];

    if (token === "-X" || token === "--request") {
      i++;
      if (i < tokens.length) {
        method = tokens[i].toUpperCase();
      }
      continue;
    }

    if (token === "-H" || token === "--header") {
      i++;
      if (i < tokens.length) {
        const headerStr = tokens[i];
        const colonIdx = headerStr.indexOf(":");
        if (colonIdx > 0) {
          const key = headerStr.slice(0, colonIdx).trim();
          const value = headerStr.slice(colonIdx + 1).trim();
          headers[key] = value;
        }
      }
      continue;
    }

    if (
      token === "-d" ||
      token === "--data" ||
      token === "--data-raw" ||
      token === "--data-binary" ||
      token === "--data-urlencode"
    ) {
      i++;
      if (i < tokens.length) {
        body = tokens[i];
      }
      continue;
    }

    if (token === "-u" || token === "--user") {
      i++;
      if (i < tokens.length) {
        const encoded = toBase64(tokens[i]);
        headers["Authorization"] = `Basic ${encoded}`;
      }
      continue;
    }

    // Skip known flags with values
    if (
      token === "--url" ||
      token === "-o" ||
      token === "--output" ||
      token === "--connect-timeout" ||
      token === "--max-time" ||
      token === "-A" ||
      token === "--user-agent"
    ) {
      i++;
      if (token === "--url" && i < tokens.length) {
        url = tokens[i];
      }
      continue;
    }

    // Skip known boolean flags
    if (
      token === "-s" ||
      token === "--silent" ||
      token === "-S" ||
      token === "--show-error" ||
      token === "-k" ||
      token === "--insecure" ||
      token === "-L" ||
      token === "--location" ||
      token === "-v" ||
      token === "--verbose" ||
      token === "-i" ||
      token === "--include" ||
      token === "--compressed"
    ) {
      continue;
    }

    // Skip flags starting with - that we don't handle
    if (token.startsWith("-")) {
      continue;
    }

    // Positional argument — URL
    if (!url) {
      url = token;
    }
  }

  if (!url) {
    return { success: false, error: "No URL found in cURL command" };
  }

  // Auto-detect method
  if (!method) {
    method = body ? "POST" : "GET";
  }

  if (!VALID_METHODS.has(method)) {
    return { success: false, error: `Unsupported HTTP method: ${method}` };
  }

  const { baseUrl, queryParams } = parseQueryParams(url);

  // Derive a name from the URL path
  const name = deriveNameFromUrl(baseUrl);

  return {
    success: true,
    entry: {
      name,
      description: "",
      tags: [],
      folderId: null,
      method: method as HttpMethod,
      url: baseUrl,
      headers,
      queryParams,
      body,
    },
  };
}

function deriveNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      return segments[segments.length - 1];
    }
    return parsed.hostname;
  } catch {
    return "Imported Request";
  }
}
