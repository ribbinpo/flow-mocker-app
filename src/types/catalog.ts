import type { HttpMethod } from "./flow";

export interface CatalogFolder {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type CatalogFolderDraft = Pick<CatalogFolder, "name">;

export interface CatalogEntry {
  id: string;
  name: string;
  description: string;
  tags: string[];
  folderId: string | null;
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export type CatalogEntryDraft = Omit<CatalogEntry, "id" | "createdAt" | "updatedAt">;
