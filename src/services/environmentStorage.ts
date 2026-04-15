import type { Environment } from "@/types";
import {
  ENVIRONMENT_STORAGE_DIR_NAME,
  ENVIRONMENT_STORAGE_FILE_NAME,
} from "@/utils/constants";

interface EnvironmentFile {
  version: 1;
  environments: Environment[];
  activeEnvironmentId: string | null;
}

export interface EnvironmentData {
  environments: Environment[];
  activeEnvironmentId: string | null;
}

function isTauriContext(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

async function getEnvironmentDir(): Promise<string> {
  const { appDataDir } = await import("@tauri-apps/api/path");
  const dir = await appDataDir();
  const separator = dir.endsWith("/") ? "" : "/";
  return `${dir}${separator}${ENVIRONMENT_STORAGE_DIR_NAME}`;
}

export async function saveEnvironments(
  environments: Environment[],
  activeEnvironmentId: string | null,
): Promise<void> {
  if (!isTauriContext()) return;

  const { writeTextFile, mkdir } = await import("@tauri-apps/plugin-fs");

  const envDir = await getEnvironmentDir();
  await mkdir(envDir, { recursive: true }).catch(() => {});

  const data: EnvironmentFile = { version: 1, environments, activeEnvironmentId };
  await writeTextFile(
    `${envDir}/${ENVIRONMENT_STORAGE_FILE_NAME}`,
    JSON.stringify(data, null, 2),
  );
}

export async function loadEnvironments(): Promise<EnvironmentData> {
  const empty: EnvironmentData = { environments: [], activeEnvironmentId: null };
  if (!isTauriContext()) return empty;

  try {
    const { readTextFile, exists } = await import("@tauri-apps/plugin-fs");

    const envDir = await getEnvironmentDir();
    const filePath = `${envDir}/${ENVIRONMENT_STORAGE_FILE_NAME}`;

    const fileExists = await exists(filePath);
    if (!fileExists) return empty;

    const content = await readTextFile(filePath);
    const data = JSON.parse(content) as EnvironmentFile;

    return {
      environments: Array.isArray(data.environments) ? data.environments : [],
      activeEnvironmentId: data.activeEnvironmentId ?? null,
    };
  } catch {
    return empty;
  }
}
