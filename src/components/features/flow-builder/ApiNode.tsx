import { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Play } from "lucide-react";
import { toast } from "sonner";
import type { ApiFlowNode } from "@/types";
import { isApiNode } from "@/types";
import { NodeContainer } from "@/components/bases/NodeContainer";
import { useExecutionStore } from "@/store/executionStore";
import { useFlowStore } from "@/store/flowStore";
import { useUiStore } from "@/store/uiStore";
import { executeOneNode } from "@/services/executionEngine";
import { NODE_CONFIG, EXECUTION } from "@/utils/constants";

export function ApiNode({ id, data, selected }: NodeProps<ApiFlowNode>) {
  const status = useExecutionStore((s) => s.getNodeStatus(id));
  const isRunning = useExecutionStore((s) => s.currentRun?.status === "running");

  const handleRunNode = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();

    const flow = useFlowStore.getState().getActiveFlow();
    if (!flow) return;

    const node = flow.nodes.find((n) => n.id === id);
    if (!node || !isApiNode(node)) return;

    const { startRun, addNodeLog, finishRun } = useExecutionStore.getState();
    useUiStore.getState().setLogPanelOpen(true);

    startRun(flow.id);

    const log = await executeOneNode(node, flow);
    addNodeLog(log);

    finishRun(log.status === "error" ? "error" : "success");

    if (log.status === "success") {
      toast.success(EXECUTION.EXECUTION_SUCCESS_TOAST);
    } else {
      toast.error(EXECUTION.EXECUTION_ERROR_TOAST);
    }
  }, [id]);

  return (
    <NodeContainer label={data.label} method={data.method} status={status} selected={selected}>
      <div className="flex items-center gap-1">
        <p className="flex-1 truncate text-xs text-muted-foreground">
          {data.url || NODE_CONFIG.NO_URL}
        </p>
        <button
          type="button"
          onClick={handleRunNode}
          disabled={isRunning}
          className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-green-100 hover:text-green-600 disabled:opacity-50"
          title="Run this node"
        >
          <Play className="h-3 w-3" />
        </button>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      <Handle type="source" position={Position.Right} className="!bg-primary" />
      <Handle
        type="source"
        position={Position.Bottom}
        id="data-out"
        className="!bg-violet-500 !h-2.5 !w-2.5"
      />
    </NodeContainer>
  );
}

export default ApiNode;
