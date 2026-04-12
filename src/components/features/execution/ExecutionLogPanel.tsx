import { useEffect, useRef } from "react";
import { ScrollText } from "lucide-react";
import { PanelSidebar } from "@/components/bases/PanelSidebar";
import { EmptyState } from "@/components/bases/EmptyState";
import { NodeLogEntry } from "./NodeLogEntry";
import { useExecutionStore } from "@/store/executionStore";
import { useFlowStore } from "@/store/flowStore";
import { EXECUTION } from "@/utils/constants";

interface ExecutionLogPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ExecutionLogPanel({ open, onClose }: ExecutionLogPanelProps) {
  const currentRun = useExecutionStore((s) => s.currentRun);
  const flow = useFlowStore((s) =>
    s.flows.find((f) => f.id === s.activeFlowId),
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const logs = currentRun?.logs ?? [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

  const getNodeLabel = (nodeId: string): string => {
    return flow?.nodes.find((n) => n.id === nodeId)?.label ?? nodeId;
  };

  return (
    <PanelSidebar
      title={EXECUTION.LOG_PANEL_TITLE}
      open={open}
      onClose={onClose}
    >
      {logs.length === 0 ? (
        <EmptyState
          icon={<ScrollText />}
          title={EXECUTION.NO_LOGS}
          description={EXECUTION.NO_LOGS_DESCRIPTION}
        />
      ) : (
        <div ref={scrollRef} className="flex flex-col gap-2">
          {logs.map((log) => (
            <NodeLogEntry
              key={log.nodeId}
              log={log}
              nodeLabel={getNodeLabel(log.nodeId)}
            />
          ))}
        </div>
      )}
    </PanelSidebar>
  );
}

export default ExecutionLogPanel;
