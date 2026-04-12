import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { ExecutionStatus, HttpMethod } from "@/types";
import { getMethodStyle } from "@/utils/methodColors";

const STATUS_STYLES: Record<ExecutionStatus, string> = {
  idle: "border-border",
  running: "border-blue-500 shadow-blue-500/25 shadow-md",
  success: "border-green-500",
  error: "border-destructive",
  skipped: "border-muted opacity-60",
};

interface NodeContainerProps {
  label: string;
  method: HttpMethod;
  status?: ExecutionStatus;
  selected?: boolean;
  children?: ReactNode;
  className?: string;
}

export function NodeContainer({
  label,
  method,
  status = "idle",
  selected = false,
  children,
  className,
}: NodeContainerProps) {
  return (
    <div
      className={cn(
        "w-56 rounded-lg border-2 bg-card p-3 transition-all duration-200",
        STATUS_STYLES[status],
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={cn("rounded px-1.5 py-0.5 text-xs font-bold", getMethodStyle(method))}>
          {method}
        </span>
        <span className="truncate text-sm font-medium">{label}</span>
      </div>
      {children}
    </div>
  );
}

export default NodeContainer;
