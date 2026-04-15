import { useState } from "react";
import { Pencil, Trash2, Plus, FolderInput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCatalogStore } from "@/store/catalogStore";
import { getMethodStyle } from "@/utils/methodColors";
import { cn } from "@/lib/utils";
import { API_CATALOG } from "@/utils/constants";
import type { CatalogEntry } from "@/types";

interface CatalogEntryCardProps {
  entry: CatalogEntry;
  onEdit: (entry: CatalogEntry) => void;
  onDelete: (entry: CatalogEntry) => void;
  onUse?: (entry: CatalogEntry) => void;
}

export function CatalogEntryCard({
  entry,
  onEdit,
  onDelete,
  onUse,
}: CatalogEntryCardProps) {
  const [moveOpen, setMoveOpen] = useState(false);
  const folders = useCatalogStore((s) => s.folders);
  const moveEntry = useCatalogStore((s) => s.moveEntry);

  const handleMove = (folderId: string | null) => {
    moveEntry(entry.id, folderId);
    setMoveOpen(false);
  };

  return (
    <div className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent/50 transition-colors">
      <span
        className={cn(
          "shrink-0 rounded px-2 py-0.5 text-xs font-bold",
          getMethodStyle(entry.method),
        )}
      >
        {entry.method}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {entry.url || "No URL"}
        </p>
        {entry.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {entry.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="relative flex items-center gap-1 shrink-0">
        {onUse && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onUse(entry)}
            title="Use in flow"
          >
            <Plus />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setMoveOpen((prev) => !prev)}
          title={API_CATALOG.MOVE_TO_FOLDER}
        >
          <FolderInput />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onEdit(entry)}
          title="Edit"
        >
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onDelete(entry)}
          title="Delete"
        >
          <Trash2 />
        </Button>

        {moveOpen && (
          <MoveMenu
            folders={folders}
            currentFolderId={entry.folderId}
            onMove={handleMove}
            onClose={() => setMoveOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

function MoveMenu({
  folders,
  currentFolderId,
  onMove,
  onClose,
}: {
  folders: { id: string; name: string }[];
  currentFolderId: string | null;
  onMove: (folderId: string | null) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-md border bg-popover p-1 shadow-md">
        {currentFolderId !== null && (
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
            onClick={() => onMove(null)}
          >
            {API_CATALOG.MOVE_TO_ROOT}
          </button>
        )}
        {folders
          .filter((f) => f.id !== currentFolderId)
          .map((f) => (
            <button
              key={f.id}
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors truncate"
              onClick={() => onMove(f.id)}
            >
              {f.name}
            </button>
          ))}
        {folders.length === 0 && currentFolderId === null && (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">No folders</p>
        )}
      </div>
    </>
  );
}

export default CatalogEntryCard;
