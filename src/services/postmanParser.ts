import type { HttpMethod } from "@/types";
import type { CatalogEntryDraft } from "@/types";

export interface PostmanFolderInfo {
  name: string;
  entryIndices: number[];
}

type ParseSuccess = {
  success: true;
  entries: CatalogEntryDraft[];
  folders: PostmanFolderInfo[];
};
type ParseError = { success: false; error: string };
export type PostmanParseResult = ParseSuccess | ParseError;

const VALID_METHODS = new Set<string>(["GET", "POST", "PUT", "DELETE", "PATCH"]);

interface PostmanHeader {
  key: string;
  value: string;
  disabled?: boolean;
}

interface PostmanQueryParam {
  key: string;
  value: string;
  disabled?: boolean;
}

interface PostmanUrl {
  raw?: string;
  host?: string[];
  path?: string[];
  query?: PostmanQueryParam[];
}

interface PostmanBody {
  mode?: string;
  raw?: string;
}

interface PostmanRequest {
  method?: string;
  header?: PostmanHeader[];
  url?: PostmanUrl | string;
  body?: PostmanBody;
}

interface PostmanItem {
  name?: string;
  request?: PostmanRequest;
  item?: PostmanItem[];
}

interface PostmanCollection {
  info?: { name?: string };
  item?: PostmanItem[];
}

function resolveUrl(url: PostmanUrl | string | undefined): string {
  if (!url) return "";
  if (typeof url === "string") return url;
  return url.raw ?? "";
}

function resolveHeaders(headers: PostmanHeader[] | undefined): Record<string, string> {
  if (!headers) return {};
  const result: Record<string, string> = {};
  for (const h of headers) {
    if (!h.disabled && h.key) {
      result[h.key] = h.value ?? "";
    }
  }
  return result;
}

function resolveQueryParams(url: PostmanUrl | string | undefined): Record<string, string> {
  if (!url || typeof url === "string") return {};
  if (!url.query) return {};
  const result: Record<string, string> = {};
  for (const q of url.query) {
    if (!q.disabled && q.key) {
      result[q.key] = q.value ?? "";
    }
  }
  return result;
}

function resolveBody(body: PostmanBody | undefined): string {
  if (!body) return "";
  if (body.mode === "raw" && body.raw) return body.raw;
  return "";
}

interface ExtractResult {
  entries: CatalogEntryDraft[];
  folders: PostmanFolderInfo[];
}

function extractItems(
  items: PostmanItem[],
  parentTags: string[],
): ExtractResult {
  const entries: CatalogEntryDraft[] = [];
  const folders: PostmanFolderInfo[] = [];

  for (const item of items) {
    // Folder: recurse into nested items
    if (item.item && Array.isArray(item.item)) {
      const currentFolderName = item.name ?? "folder";
      const nested = extractItems(item.item, [...parentTags, currentFolderName]);

      // Track indices of nested entries relative to the flat list
      const baseIndex = entries.length;
      const folderInfo: PostmanFolderInfo = {
        name: currentFolderName,
        entryIndices: nested.entries.map((_, i) => baseIndex + i),
      };

      entries.push(...nested.entries);
      folders.push(folderInfo);
      // Sub-folders from nested are also top-level folders in the flat result
      folders.push(...nested.folders);
      continue;
    }

    // Request item
    if (item.request) {
      const req = item.request;
      const method = (req.method ?? "GET").toUpperCase();

      if (!VALID_METHODS.has(method)) continue;

      const rawUrl = resolveUrl(req.url);

      entries.push({
        name: item.name ?? "Unnamed Request",
        description: "",
        tags: [...parentTags],
        folderId: null, // Will be resolved during import by CatalogImportDialog
        method: method as HttpMethod,
        url: rawUrl,
        headers: resolveHeaders(req.header),
        queryParams: resolveQueryParams(req.url),
        body: resolveBody(req.body),
      });
    }
  }

  return { entries, folders };
}

export function parsePostmanCollection(json: string): PostmanParseResult {
  let collection: PostmanCollection;

  try {
    collection = JSON.parse(json) as PostmanCollection;
  } catch {
    return { success: false, error: "Invalid JSON" };
  }

  if (!collection.item || !Array.isArray(collection.item)) {
    return { success: false, error: "No items found in collection" };
  }

  const { entries, folders } = extractItems(collection.item, []);

  if (entries.length === 0) {
    return { success: false, error: "No valid requests found in collection" };
  }

  return { success: true, entries, folders };
}
