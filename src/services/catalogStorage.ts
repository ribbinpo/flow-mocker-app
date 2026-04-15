import type { CatalogEntry, CatalogFolder } from "@/types";
import { CATALOG_STORAGE_DIR_NAME, CATALOG_STORAGE_FILE_NAME } from "@/utils/constants";

interface CatalogFileV1 {
  version: 1;
  entries: Omit<CatalogEntry, "folderId">[];
}

interface CatalogFileV2 {
  version: 2;
  folders: CatalogFolder[];
  entries: CatalogEntry[];
}

type CatalogFile = CatalogFileV1 | CatalogFileV2;

export interface CatalogData {
  folders: CatalogFolder[];
  entries: CatalogEntry[];
}

function isTauriContext(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

async function getCatalogDir(): Promise<string> {
  const { appDataDir } = await import("@tauri-apps/api/path");
  const dir = await appDataDir();
  const separator = dir.endsWith("/") ? "" : "/";
  return `${dir}${separator}${CATALOG_STORAGE_DIR_NAME}`;
}

function migrateV1ToV2(data: CatalogFileV1): CatalogData {
  return {
    folders: [],
    entries: data.entries.map((e) => ({ ...e, folderId: null } as CatalogEntry)),
  };
}

export async function saveCatalog(folders: CatalogFolder[], entries: CatalogEntry[]): Promise<void> {
  if (!isTauriContext()) return;

  const { writeTextFile, mkdir } = await import("@tauri-apps/plugin-fs");

  const catalogDir = await getCatalogDir();
  await mkdir(catalogDir, { recursive: true }).catch(() => {});

  const data: CatalogFileV2 = { version: 2, folders, entries };
  await writeTextFile(
    `${catalogDir}/${CATALOG_STORAGE_FILE_NAME}`,
    JSON.stringify(data, null, 2),
  );
}

export async function loadCatalog(): Promise<CatalogData> {
  if (!isTauriContext()) return { folders: [], entries: [] };

  try {
    const { readTextFile, exists } = await import("@tauri-apps/plugin-fs");

    const catalogDir = await getCatalogDir();
    const filePath = `${catalogDir}/${CATALOG_STORAGE_FILE_NAME}`;

    const fileExists = await exists(filePath);
    if (!fileExists) return { folders: [], entries: [] };

    const content = await readTextFile(filePath);
    const data = JSON.parse(content) as CatalogFile;

    // Migrate v1 → v2
    if (!data.version || data.version === 1) {
      const migrated = migrateV1ToV2(data as CatalogFileV1);
      // Persist migrated data
      await saveCatalog(migrated.folders, migrated.entries);
      return migrated;
    }

    const v2 = data as CatalogFileV2;
    return {
      folders: Array.isArray(v2.folders) ? v2.folders : [],
      entries: Array.isArray(v2.entries) ? v2.entries : [],
    };
  } catch {
    return { folders: [], entries: [] };
  }
}
