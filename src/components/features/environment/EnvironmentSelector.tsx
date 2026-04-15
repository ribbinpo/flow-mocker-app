import { useEffect, useRef, useState } from "react";
import { ChevronDown, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useEnvironmentStore } from "@/store/environmentStore";
import { ENVIRONMENT } from "@/utils/constants";

interface EnvironmentSelectorProps {
  onManageClick: () => void;
  disabled?: boolean;
}

export function EnvironmentSelector({
  onManageClick,
  disabled,
}: EnvironmentSelectorProps) {
  const environments = useEnvironmentStore((s) => s.environments);
  const activeEnvironmentId = useEnvironmentStore((s) => s.activeEnvironmentId);
  const setActiveEnvironment = useEnvironmentStore((s) => s.setActiveEnvironment);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeEnv = environments.find((e) => e.id === activeEnvironmentId);

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

  const handleSelect = (id: string | null) => {
    setActiveEnvironment(id);
    setMenuOpen(false);
  };

  return (
    <div className="relative flex items-center gap-1" ref={menuRef}>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() => setMenuOpen((prev) => !prev)}
        className="min-w-[120px] justify-between"
      >
        <span className="truncate text-xs">
          {activeEnv?.name ?? ENVIRONMENT.SELECTOR_PLACEHOLDER}
        </span>
        <ChevronDown className="ml-1 size-3 shrink-0 opacity-50" />
      </Button>

      {menuOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-md border bg-popover p-1 shadow-md">
          <button
            type="button"
            className={`flex w-full items-center rounded-sm px-2 py-1.5 text-sm transition-colors ${
              !activeEnvironmentId ? "bg-accent font-medium" : "hover:bg-accent"
            }`}
            onClick={() => handleSelect(null)}
          >
            {ENVIRONMENT.SELECTOR_PLACEHOLDER}
          </button>

          {environments.length > 0 && (
            <div className="my-1 h-px bg-border" />
          )}

          {environments.map((env) => (
            <button
              key={env.id}
              type="button"
              className={`flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors ${
                env.id === activeEnvironmentId
                  ? "bg-accent font-medium"
                  : "hover:bg-accent"
              }`}
              onClick={() => handleSelect(env.id)}
            >
              <span className="truncate">{env.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {Object.keys(env.variables).length} vars
              </span>
            </button>
          ))}

          <div className="my-1 h-px bg-border" />

          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
            onClick={() => {
              setMenuOpen(false);
              onManageClick();
            }}
          >
            <Settings2 className="size-4" />
            {ENVIRONMENT.MANAGER_TITLE}
          </button>
        </div>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={onManageClick}
            disabled={disabled}
          >
            <Settings2 className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{ENVIRONMENT.MANAGER_TITLE}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export default EnvironmentSelector;
