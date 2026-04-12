import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Play, SkipForward, Square, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnvVariablesDialog } from "./EnvVariablesDialog";
import { useFlowStore } from "@/store/flowStore";
import { useFlowExecution } from "@/hooks/useFlowExecution";
import { FLOW_BUILDER, DEFAULT_NODE, DEFAULT_HEADERS, EXECUTION, ENV_EDITOR } from "@/utils/constants";
import type { FlowNode } from "@/types";

interface FlowToolbarProps {
  flowId: string;
}

export function FlowToolbar({ flowId }: FlowToolbarProps) {
  const navigate = useNavigate();
  const flow = useFlowStore((s) => s.flows.find((f) => f.id === flowId));
  const addNode = useFlowStore((s) => s.addNode);
  const { isRunning, isStepMode, runFlow, stepNext, stopRun, toggleStepMode } =
    useFlowExecution(flowId);
  const [envDialogOpen, setEnvDialogOpen] = useState(false);

  const handleAddNode = () => {
    const existingCount = flow?.nodes.length ?? 0;
    const node: FlowNode = {
      id: crypto.randomUUID(),
      label: DEFAULT_NODE.LABEL,
      method: DEFAULT_NODE.METHOD,
      url: DEFAULT_NODE.URL,
      headers: { ...DEFAULT_HEADERS },
      queryParams: {},
      body: DEFAULT_NODE.BODY,
      dataMapping: [],
      position: { x: 100 + existingCount * 300, y: 150 },
    };
    addNode(flowId, node);
  };

  return (
    <>
      <div className="flex items-center gap-3 border-b bg-card px-4 py-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft />
          {FLOW_BUILDER.BACK_BUTTON}
        </Button>
        <div className="h-5 w-px bg-border" />
        <h1 className="flex-1 truncate text-sm font-semibold">
          {flow?.name ?? FLOW_BUILDER.UNTITLED_FLOW}
        </h1>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setEnvDialogOpen(true)}
          disabled={isRunning}
        >
          <Settings2 />
          {ENV_EDITOR.BUTTON_LABEL}
        </Button>

        <div className="h-5 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={isStepMode}
              onChange={(e) => toggleStepMode(e.target.checked)}
              disabled={isRunning}
              className="accent-primary"
            />
            {EXECUTION.STEP_MODE_LABEL}
          </label>
        </div>

        <div className="h-5 w-px bg-border" />

        {isRunning && isStepMode && (
          <Button size="sm" variant="outline" onClick={stepNext}>
            <SkipForward />
            {EXECUTION.STEP_NEXT_BUTTON}
          </Button>
        )}

        {isRunning ? (
          <Button size="sm" variant="destructive" onClick={stopRun}>
            <Square />
            {EXECUTION.STOP_BUTTON}
          </Button>
        ) : (
          <Button size="sm" variant="default" onClick={runFlow}>
            <Play />
            {EXECUTION.RUN_BUTTON}
          </Button>
        )}

        <div className="h-5 w-px bg-border" />

        <Button size="sm" onClick={handleAddNode} disabled={isRunning}>
          <Plus />
          {FLOW_BUILDER.TOOLBAR_ADD_NODE}
        </Button>
      </div>

      <EnvVariablesDialog
        flowId={flowId}
        open={envDialogOpen}
        onOpenChange={setEnvDialogOpen}
      />
    </>
  );
}

export default FlowToolbar;
