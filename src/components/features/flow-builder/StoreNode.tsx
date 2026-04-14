import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { StoreFlowNode } from "@/types/reactFlow";
import { useExecutionStore } from "@/store/executionStore";
import type { ExecutionStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Database } from "lucide-react";

const STATUS_STYLES: Record<ExecutionStatus, string> = {
  idle: "border-border",
  running: "border-blue-500 shadow-blue-500/25 shadow-md",
  success: "border-green-500",
  error: "border-destructive",
  skipped: "border-muted opacity-60",
};

export function StoreNode({ id, data, selected }: NodeProps<StoreFlowNode>) {
  const status = useExecutionStore((s) => s.getNodeStatus(id));

  return (
    <div
      className={cn(
        "w-56 rounded-lg border-2 bg-card p-3 transition-all duration-200",
        STATUS_STYLES[status],
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background"
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-violet-100 px-1.5 py-0.5 text-xs font-bold text-violet-700">
          <Database className="inline-block h-3 w-3" />
        </span>
        <span className="truncate text-sm font-medium">{data.label}</span>
      </div>
      {data.variableNames.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {data.variableNames.map((name) => (
            <span
              key={name}
              className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700"
            >
              {name}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No variables</p>
      )}
      <Handle type="target" position={Position.Left} className="!bg-violet-500" />
      <Handle
        type="target"
        position={Position.Top}
        id="data-in"
        className="!bg-violet-500 !h-2.5 !w-2.5"
      />
      <Handle type="source" position={Position.Right} id="sequence" className="!bg-violet-500" />
    </div>
  );
}

export default StoreNode;
