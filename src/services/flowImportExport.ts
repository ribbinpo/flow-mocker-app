import { z } from "zod/v4";
import type { Flow } from "@/types";

type ImportResult =
  | { success: true; flow: Flow }
  | { success: false; error: string };

const dataMappingSchema = z.object({
  sourceNodeId: z.string(),
  sourcePath: z.string(),
  targetField: z.enum(["header", "query", "body", "url"]),
  targetKey: z.string(),
});

const retryConfigSchema = z.object({
  maxRetries: z.number(),
  delayMs: z.number(),
});

const flowNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  url: z.string(),
  headers: z.record(z.string(), z.string()),
  queryParams: z.record(z.string(), z.string()),
  body: z.string(),
  dataMapping: z.array(dataMappingSchema),
  retryConfig: retryConfigSchema.optional(),
  position: z.object({ x: z.number(), y: z.number() }),
});

const flowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
});

const flowImportSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  nodes: z.array(flowNodeSchema),
  edges: z.array(flowEdgeSchema),
  envVariables: z.record(z.string(), z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export function exportFlowToJson(flow: Flow): string {
  return JSON.stringify(flow, null, 2);
}

export function slugifyFlowName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isTauriContext(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

async function downloadViaTauri(content: string, filename: string): Promise<string> {
  const { writeTextFile, BaseDirectory } = await import("@tauri-apps/plugin-fs");
  const { downloadDir } = await import("@tauri-apps/api/path");

  await writeTextFile(filename, content, { baseDir: BaseDirectory.Download });

  const dir = await downloadDir();
  const separator = dir.endsWith("/") ? "" : "/";
  return `${dir}${separator}${filename}`;
}

function downloadViaBrowser(content: string, filename: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export async function downloadJsonFile(content: string, filename: string): Promise<string | null> {
  if (isTauriContext()) {
    return downloadViaTauri(content, filename);
  }
  downloadViaBrowser(content, filename);
  return null;
}

export function parseAndValidateFlowJson(jsonString: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { success: false, error: "Invalid JSON" };
  }

  const result = flowImportSchema.safeParse(parsed);
  if (!result.success) {
    return { success: false, error: z.prettifyError(result.error) };
  }

  return { success: true, flow: result.data as Flow };
}

export function regenerateFlowIds(flow: Flow): Flow {
  const idMap = new Map<string, string>();

  const newFlowId = crypto.randomUUID();
  idMap.set(flow.id, newFlowId);

  for (const node of flow.nodes) {
    idMap.set(node.id, crypto.randomUUID());
  }

  for (const edge of flow.edges) {
    idMap.set(edge.id, crypto.randomUUID());
  }

  const remap = (oldId: string): string => idMap.get(oldId) ?? oldId;
  const now = new Date().toISOString();

  return {
    ...flow,
    id: newFlowId,
    createdAt: now,
    updatedAt: now,
    nodes: flow.nodes.map((node) => ({
      ...node,
      id: remap(node.id),
      dataMapping: node.dataMapping.map((dm) => ({
        ...dm,
        sourceNodeId: remap(dm.sourceNodeId),
      })),
    })),
    edges: flow.edges.map((edge) => ({
      ...edge,
      id: remap(edge.id),
      source: remap(edge.source),
      target: remap(edge.target),
    })),
  };
}

export function importFlowFromJson(jsonString: string): ImportResult {
  const result = parseAndValidateFlowJson(jsonString);
  if (!result.success) return result;

  return { success: true, flow: regenerateFlowIds(result.flow) };
}
