import { useMemo, useState } from "react";
import {
  BookOpen,
  Plus,
  Upload,
  Folder,
  FolderPlus,
  Pencil,
  Trash2,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/bases/EmptyState";
import { CatalogEntryCard } from "./CatalogEntryCard";
import { CatalogEntryForm } from "./CatalogEntryForm";
import { CatalogImportDialog } from "./CatalogImportDialog";
import { useCatalogStore } from "@/store/catalogStore";
import { API_CATALOG } from "@/utils/constants";
import { cn } from "@/lib/utils";
import type { CatalogEntry, CatalogEntryDraft, CatalogFolder } from "@/types";

type View = "list" | "create" | "edit";

// null = show all, "root" = uncategorized, string = folder id
type FolderFilter = null | "root" | string;

interface CatalogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectEntry?: (entry: CatalogEntry) => void;
}

export function CatalogDialog({ open, onOpenChange, onSelectEntry }: CatalogDialogProps) {
  const entries = useCatalogStore((s) => s.entries);
  const folders = useCatalogStore((s) => s.folders);
  const addEntry = useCatalogStore((s) => s.addEntry);
  const updateEntry = useCatalogStore((s) => s.updateEntry);
  const removeEntry = useCatalogStore((s) => s.removeEntry);
  const addFolder = useCatalogStore((s) => s.addFolder);
  const renameFolder = useCatalogStore((s) => s.renameFolder);
  const removeFolder = useCatalogStore((s) => s.removeFolder);

  const [view, setView] = useState<View>("list");
  const [editingEntry, setEditingEntry] = useState<CatalogEntry | null>(null);
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [activeFolder, setActiveFolder] = useState<FolderFilter>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const filtered = useMemo(() => {
    let list = entries;

    // Filter by folder
    if (activeFolder === "root") {
      list = list.filter((e) => e.folderId === null);
    } else if (activeFolder !== null) {
      list = list.filter((e) => e.folderId === activeFolder);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.url.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [entries, search, activeFolder]);

  const folderEntryCounts = useMemo(() => {
    const counts = new Map<string | null, number>();
    for (const e of entries) {
      counts.set(e.folderId, (counts.get(e.folderId) ?? 0) + 1);
    }
    return counts;
  }, [entries]);

  const handleCreate = (draft: CatalogEntryDraft) => {
    addEntry(draft);
    setView("list");
  };

  const handleEdit = (draft: CatalogEntryDraft) => {
    if (editingEntry) {
      updateEntry(editingEntry.id, draft);
    }
    setEditingEntry(null);
    setView("list");
  };

  const handleDelete = (entry: CatalogEntry) => {
    if (window.confirm(API_CATALOG.DELETE_CONFIRM)) {
      removeEntry(entry.id);
    }
  };

  const handleUse = (entry: CatalogEntry) => {
    onSelectEntry?.(entry);
    onOpenChange(false);
  };

  const handleStartEdit = (entry: CatalogEntry) => {
    setEditingEntry(entry);
    setView("edit");
  };

  const handleCancel = () => {
    setEditingEntry(null);
    setView("list");
  };

  const handleCreateFolder = () => {
    const folder = addFolder(API_CATALOG.FOLDER_DEFAULT_NAME);
    setRenamingFolderId(folder.id);
    setRenameValue(folder.name);
  };

  const handleRenameSubmit = () => {
    if (renamingFolderId && renameValue.trim()) {
      renameFolder(renamingFolderId, renameValue.trim());
    }
    setRenamingFolderId(null);
    setRenameValue("");
  };

  const handleDeleteFolder = (folder: CatalogFolder) => {
    if (window.confirm(API_CATALOG.FOLDER_DELETE_CONFIRM)) {
      if (activeFolder === folder.id) {
        setActiveFolder(null);
      }
      removeFolder(folder.id);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setView("list");
      setEditingEntry(null);
      setSearch("");
      setActiveFolder(null);
      setRenamingFolderId(null);
    }
    onOpenChange(nextOpen);
  };

  const currentFolderId = activeFolder === "root" ? null : activeFolder;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{API_CATALOG.DIALOG_TITLE}</DialogTitle>
            <DialogDescription>{API_CATALOG.DIALOG_DESCRIPTION}</DialogDescription>
          </DialogHeader>

          {view === "list" && (
            <div className="flex flex-1 gap-3 overflow-hidden min-h-0">
              {/* Folder sidebar */}
              <div className="w-48 shrink-0 flex flex-col gap-1 overflow-y-auto border-r pr-3">
                <FolderItem
                  label={API_CATALOG.FOLDER_ALL}
                  count={entries.length}
                  active={activeFolder === null}
                  onClick={() => setActiveFolder(null)}
                />
                <FolderItem
                  label={API_CATALOG.FOLDER_ROOT}
                  count={folderEntryCounts.get(null) ?? 0}
                  active={activeFolder === "root"}
                  onClick={() => setActiveFolder("root")}
                />

                {folders.length > 0 && (
                  <div className="my-1 h-px bg-border" />
                )}

                {folders.map((folder) => (
                  <div key={folder.id} className="group flex items-center gap-1">
                    {renamingFolderId === folder.id ? (
                      <Input
                        className="h-7 text-xs"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameSubmit();
                          if (e.key === "Escape") {
                            setRenamingFolderId(null);
                            setRenameValue("");
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <>
                        <button
                          type="button"
                          className={cn(
                            "flex flex-1 items-center gap-1.5 rounded-sm px-2 py-1 text-xs transition-colors truncate min-w-0",
                            activeFolder === folder.id
                              ? "bg-accent font-medium"
                              : "hover:bg-accent/50",
                          )}
                          onClick={() => setActiveFolder(folder.id)}
                        >
                          <Folder className="size-3.5 shrink-0" />
                          <span className="truncate">{folder.name}</span>
                          <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                            {folderEntryCounts.get(folder.id) ?? 0}
                          </span>
                        </button>
                        <div className="hidden group-hover:flex items-center shrink-0">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => {
                              setRenamingFolderId(folder.id);
                              setRenameValue(folder.name);
                            }}
                            title={API_CATALOG.FOLDER_RENAME}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleDeleteFolder(folder)}
                            title="Delete folder"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-xs mt-1"
                  onClick={handleCreateFolder}
                >
                  <FolderPlus className="size-3.5" />
                  {API_CATALOG.FOLDER_NEW}
                </Button>
              </div>

              {/* Entry list */}
              <div className="flex flex-1 flex-col gap-2 min-w-0">
                <div className="flex items-center gap-2">
                  <Input
                    className="flex-1"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={API_CATALOG.SEARCH_PLACEHOLDER}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setImportOpen(true)}
                  >
                    <Upload />
                    {API_CATALOG.IMPORT_BUTTON}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setView("create")}
                  >
                    <Plus />
                    {API_CATALOG.CREATE_BUTTON}
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                  {filtered.length === 0 ? (
                    <EmptyState
                      icon={<BookOpen />}
                      title={API_CATALOG.EMPTY_TITLE}
                      description={API_CATALOG.EMPTY_DESCRIPTION}
                      className="py-8"
                    />
                  ) : (
                    <div className="flex flex-col gap-2">
                      {filtered.map((entry) => (
                        <CatalogEntryCard
                          key={entry.id}
                          entry={entry}
                          onEdit={handleStartEdit}
                          onDelete={handleDelete}
                          onUse={onSelectEntry ? handleUse : undefined}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {view === "create" && (
            <div className="flex-1 overflow-y-auto min-h-0">
              <CatalogEntryForm
                defaultFolderId={currentFolderId}
                onSave={handleCreate}
                onCancel={handleCancel}
              />
            </div>
          )}

          {view === "edit" && editingEntry && (
            <div className="flex-1 overflow-y-auto min-h-0">
              <CatalogEntryForm
                entry={editingEntry}
                onSave={handleEdit}
                onCancel={handleCancel}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CatalogImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        targetFolderId={currentFolderId}
      />
    </>
  );
}

function FolderItem({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs transition-colors",
        active ? "bg-accent font-medium" : "hover:bg-accent/50",
      )}
      onClick={onClick}
    >
      <ChevronRight className={cn("size-3 transition-transform", active && "rotate-90")} />
      <span className="truncate">{label}</span>
      <span className="ml-auto text-[10px] text-muted-foreground">{count}</span>
    </button>
  );
}

export default CatalogDialog;
