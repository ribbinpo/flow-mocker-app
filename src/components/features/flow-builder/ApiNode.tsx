import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ApiFlowNode } from "@/types";
import { NodeContainer } from "@/components/bases/NodeContainer";
import { useExecutionStore } from "@/store/executionStore";
import { NODE_CONFIG } from "@/utils/constants";

export function ApiNode({ id, data, selected }: NodeProps<ApiFlowNode>) {
  const status = useExecutionStore((s) => s.getNodeStatus(id));

  return (
    <NodeContainer label={data.label} method={data.method} status={status} selected={selected}>
      <p className="truncate text-xs text-muted-foreground">
        {data.url || NODE_CONFIG.NO_URL}
      </p>
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      <Handle type="source" position={Position.Right} className="!bg-primary" />
    </NodeContainer>
  );
}

export default ApiNode;
