import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { StartFlowNode } from "@/types/reactFlow";
import { useExecutionStore } from "@/store/executionStore";
import type { ExecutionStatus } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<ExecutionStatus, string> = {
  idle: "border-green-500/50",
  running: "border-blue-500 shadow-blue-500/25 shadow-md",
  success: "border-green-500",
  error: "border-destructive",
  skipped: "border-muted opacity-60",
};

export function StartNode({ id, selected }: NodeProps<StartFlowNode>) {
  const status = useExecutionStore((s) => s.getNodeStatus(id));

  return (
    <div
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full border-2 bg-green-500/10 transition-all duration-200",
        STATUS_STYLES[status],
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
      )}
    >
      <span className="text-xs font-bold text-green-600">Start</span>
      <Handle type="source" position={Position.Right} className="!bg-green-500" />
    </div>
  );
}

export default StartNode;
