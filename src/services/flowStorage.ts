import type { Flow } from "@/types";
import { STORAGE_DIR_NAME, LEGACY_STORAGE_FILE_NAME } from "@/utils/constants";

function isTauriContext(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

async function getFlowsDir(): Promise<string> {
  const { appDataDir } = await import("@tauri-apps/api/path");
  const dir = await appDataDir();
  const separator = dir.endsWith("/") ? "" : "/";
  return `${dir}${separator}${STORAGE_DIR_NAME}`;
}

async function getLegacyFilePath(): Promise<string> {
  const { appDataDir } = await import("@tauri-apps/api/path");
  const dir = await appDataDir();
  const separator = dir.endsWith("/") ? "" : "/";
  return `${dir}${separator}${LEGACY_STORAGE_FILE_NAME}`;
}

async function migrateFromLegacy(): Promise<Flow[]> {
  const { readTextFile, remove, exists } = await import("@tauri-apps/plugin-fs");

  const legacyPath = await getLegacyFilePath();
  const legacyExists = await exists(legacyPath);
  if (!legacyExists) return [];

  const content = await readTextFile(legacyPath);
  const flows = JSON.parse(content) as Flow[];

  for (const flow of flows) {
    await saveFlow(flow);
  }

  await remove(legacyPath);
  return flows;
}

export async function saveFlow(flow: Flow): Promise<void> {
  if (!isTauriContext()) return;

  const { writeTextFile, mkdir } = await import("@tauri-apps/plugin-fs");

  const flowsDir = await getFlowsDir();
  await mkdir(flowsDir, { recursive: true }).catch(() => {});
  await writeTextFile(`${flowsDir}/${flow.id}.json`, JSON.stringify(flow, null, 2));
}

export async function deleteFlowFile(flowId: string): Promise<void> {
  if (!isTauriContext()) return;

  const { remove, exists } = await import("@tauri-apps/plugin-fs");

  const flowsDir = await getFlowsDir();
  const filePath = `${flowsDir}/${flowId}.json`;

  if (await exists(filePath)) {
    await remove(filePath);
  }
}

export async function loadFlows(): Promise<Flow[]> {
  if (!isTauriContext()) return [];

  try {
    const { readTextFile, readDir, mkdir, exists } = await import("@tauri-apps/plugin-fs");

    const flowsDir = await getFlowsDir();
    await mkdir(flowsDir, { recursive: true }).catch(() => {});

    const dirExists = await exists(flowsDir);
    if (!dirExists) return [];

    const entries = await readDir(flowsDir);
    const jsonFiles = entries.filter((e) => e.name?.endsWith(".json"));

    if (jsonFiles.length === 0) {
      return migrateFromLegacy();
    }

    const flows: Flow[] = [];
    for (const entry of jsonFiles) {
      try {
        const content = await readTextFile(`${flowsDir}/${entry.name}`);
        flows.push(JSON.parse(content) as Flow);
      } catch {
        // Skip corrupted files
      }
    }

    return flows;
  } catch {
    return [];
  }
}
