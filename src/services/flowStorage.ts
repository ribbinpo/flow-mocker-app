import type { Flow } from "@/types";
import { STORAGE_FILE_NAME } from "@/utils/constants";

function isTauriContext(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

export async function saveFlows(flows: Flow[]): Promise<void> {
  if (!isTauriContext()) return;

  const { writeTextFile, mkdir } = await import("@tauri-apps/plugin-fs");
  const { appDataDir } = await import("@tauri-apps/api/path");

  const dir = await appDataDir();

  await mkdir(dir, { recursive: true }).catch(() => {});
  await writeTextFile(`${dir}${STORAGE_FILE_NAME}`, JSON.stringify(flows, null, 2));
}

export async function loadFlows(): Promise<Flow[]> {
  if (!isTauriContext()) return [];

  try {
    const { readTextFile } = await import("@tauri-apps/plugin-fs");
    const { appDataDir } = await import("@tauri-apps/api/path");

    const dir = await appDataDir();
    const content = await readTextFile(`${dir}${STORAGE_FILE_NAME}`);
    return JSON.parse(content) as Flow[];
  } catch {
    return [];
  }
}
