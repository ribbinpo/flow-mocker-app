import { create } from "zustand";
import type { CatalogEntry, CatalogEntryDraft, CatalogFolder } from "@/types";

interface CatalogState {
  folders: CatalogFolder[];
  entries: CatalogEntry[];

  // Folder actions
  setFolders: (folders: CatalogFolder[]) => void;
  addFolder: (name: string) => CatalogFolder;
  renameFolder: (id: string, name: string) => void;
  removeFolder: (id: string) => void;

  // Entry actions
  setEntries: (entries: CatalogEntry[]) => void;
  addEntry: (draft: CatalogEntryDraft) => CatalogEntry;
  updateEntry: (id: string, updates: Partial<CatalogEntryDraft>) => void;
  removeEntry: (id: string) => void;
  moveEntry: (entryId: string, folderId: string | null) => void;
  importEntries: (drafts: CatalogEntryDraft[]) => number;

  // Helpers
  getUniqueFolderName: (baseName: string) => string;
  importFolderWithDedup: (name: string) => CatalogFolder;
}

function createEntry(draft: CatalogEntryDraft): CatalogEntry {
  const now = new Date().toISOString();
  return {
    ...draft,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
}

function deduplicateName(baseName: string, existingNames: Set<string>): string {
  if (!existingNames.has(baseName)) return baseName;

  let counter = 1;
  let candidate = `${baseName} (${counter})`;
  while (existingNames.has(candidate)) {
    counter++;
    candidate = `${baseName} (${counter})`;
  }
  return candidate;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  folders: [],
  entries: [],

  // --- Folder actions ---

  setFolders: (folders) => set({ folders }),

  addFolder: (name) => {
    const uniqueName = get().getUniqueFolderName(name);
    const now = new Date().toISOString();
    const folder: CatalogFolder = {
      id: crypto.randomUUID(),
      name: uniqueName,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ folders: [...state.folders, folder] }));
    return folder;
  },

  renameFolder: (id, name) => {
    const existingNames = new Set(
      get().folders.filter((f) => f.id !== id).map((f) => f.name),
    );
    const uniqueName = deduplicateName(name, existingNames);
    set((state) => ({
      folders: state.folders.map((f) =>
        f.id === id
          ? { ...f, name: uniqueName, updatedAt: new Date().toISOString() }
          : f,
      ),
    }));
  },

  removeFolder: (id) =>
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== id),
      // Move entries from deleted folder to root
      entries: state.entries.map((e) =>
        e.folderId === id ? { ...e, folderId: null, updatedAt: new Date().toISOString() } : e,
      ),
    })),

  // --- Entry actions ---

  setEntries: (entries) => set({ entries }),

  addEntry: (draft) => {
    const entry = createEntry(draft);
    set((state) => ({ entries: [...state.entries, entry] }));
    return entry;
  },

  updateEntry: (id, updates) =>
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id
          ? { ...e, ...updates, updatedAt: new Date().toISOString() }
          : e,
      ),
    })),

  removeEntry: (id) =>
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    })),

  moveEntry: (entryId, folderId) =>
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === entryId
          ? { ...e, folderId, updatedAt: new Date().toISOString() }
          : e,
      ),
    })),

  importEntries: (drafts) => {
    const newEntries = drafts.map(createEntry);
    set((state) => ({ entries: [...state.entries, ...newEntries] }));
    return newEntries.length;
  },

  // --- Helpers ---

  getUniqueFolderName: (baseName) => {
    const existingNames = new Set(get().folders.map((f) => f.name));
    return deduplicateName(baseName, existingNames);
  },

  importFolderWithDedup: (name) => {
    // Check if folder with exact name already exists
    const existing = get().folders.find((f) => f.name === name);
    if (existing) return existing;

    // Create new folder (dedup handled by addFolder)
    return get().addFolder(name);
  },
}));
