import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ApiFlowNode } from "@/types";
import { NodeContainer } from "@/components/bases/NodeContainer";
import { useExecutionStore } from "@/store/executionStore";
import { NODE_CONFIG } from "@/utils/constants";

const VARIABLE_TARGET_HANDLES = [
  { id: "target-header", label: "H", title: "Header" },
  { id: "target-query", label: "Q", title: "Query" },
  { id: "target-body", label: "B", title: "Body" },
  { id: "target-url", label: "U", title: "URL" },
] as const;

export function ApiNode({ id, data, selected }: NodeProps<ApiFlowNode>) {
  const status = useExecutionStore((s) => s.getNodeStatus(id));

  return (
    <NodeContainer label={data.label} method={data.method} status={status} selected={selected}>
      <p className="truncate text-xs text-muted-foreground">
        {data.url || NODE_CONFIG.NO_URL}
      </p>
      <div className="mt-1 flex gap-1">
        {VARIABLE_TARGET_HANDLES.map((handle) => (
          <div key={handle.id} className="relative">
            <span
              className="inline-block rounded bg-muted px-1 py-0.5 text-[9px] font-medium text-muted-foreground"
              title={handle.title}
            >
              {handle.label}
            </span>
            <Handle
              type="target"
              position={Position.Top}
              id={handle.id}
              className="!bg-violet-400 !h-1.5 !w-1.5"
              style={{ top: -6, left: "50%", transform: "translateX(-50%)", position: "absolute" }}
            />
          </div>
        ))}
      </div>
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      <Handle type="source" position={Position.Right} className="!bg-primary" />
    </NodeContainer>
  );
}

export default ApiNode;
