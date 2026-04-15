import { useEffect, useRef, useState } from "react";
import { Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CatalogDialog } from "./CatalogDialog";
import { useCatalogStore } from "@/store/catalogStore";
import { FLOW_BUILDER, API_CATALOG } from "@/utils/constants";
import type { CatalogEntry } from "@/types";

interface CatalogPickerPopoverProps {
  onAddEmpty: () => void;
  onAddFromCatalog: (entry: CatalogEntry) => void;
  disabled?: boolean;
}

export function CatalogPickerPopover({
  onAddEmpty,
  onAddFromCatalog,
  disabled,
}: CatalogPickerPopoverProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const entryCount = useCatalogStore((s) => s.entries.length);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleEmpty = () => {
    setMenuOpen(false);
    onAddEmpty();
  };

  const handleFromCatalog = () => {
    setMenuOpen(false);
    setCatalogOpen(true);
  };

  const handleSelectEntry = (entry: CatalogEntry) => {
    onAddFromCatalog(entry);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <Button
          size="sm"
          disabled={disabled}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <Plus />
          {FLOW_BUILDER.TOOLBAR_ADD_API_NODE}
        </Button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border bg-popover p-1 shadow-md">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
              onClick={handleEmpty}
            >
              <Plus className="size-4" />
              {API_CATALOG.TOOLBAR_POPOVER_EMPTY}
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
              onClick={handleFromCatalog}
            >
              <BookOpen className="size-4" />
              {API_CATALOG.TOOLBAR_POPOVER_CATALOG}
              {entryCount === 0 && (
                <span className="ml-auto text-xs text-muted-foreground">(empty)</span>
              )}
            </button>
          </div>
        )}
      </div>

      <CatalogDialog
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        onSelectEntry={handleSelectEntry}
      />
    </>
  );
}

export default CatalogPickerPopover;
