import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

interface PanelSidebarProps {
  title: string;
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  className?: string;
}

export function PanelSidebar({
  title,
  children,
  open,
  onClose,
  className,
}: PanelSidebarProps) {
  if (!open) return null;

  return (
    <aside
      className={cn(
        "flex h-full w-80 flex-col border-l bg-card",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Button variant="ghost" size="icon-xs" onClick={onClose}>
          <X />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </aside>
  );
}

export default PanelSidebar;
