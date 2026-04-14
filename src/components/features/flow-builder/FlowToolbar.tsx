import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Plus, Database, Play, SkipForward, Square, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { EnvVariablesDialog } from "./EnvVariablesDialog";
import { useFlowStore } from "@/store/flowStore";
import { useUiStore } from "@/store/uiStore";
import { useExecutionStore } from "@/store/executionStore";
import { useFlowExecution } from "@/hooks/useFlowExecution";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useFlowImportExport } from "@/hooks/useFlowImportExport";
import {
  FLOW_BUILDER,
  DEFAULT_NODE,
  DEFAULT_HEADERS,
  STORE_NODE,
  EXECUTION,
  ENV_EDITOR,
  IMPORT_EXPORT,
  SHORTCUTS,
} from "@/utils/constants";
import type { ApiNode, StoreNode } from "@/types";

interface FlowToolbarProps {
  flowId: string;
}

export function FlowToolbar({ flowId }: FlowToolbarProps) {
  const navigate = useNavigate();
  const flow = useFlowStore((s) => s.flows.find((f) => f.id === flowId));
  const addNode = useFlowStore((s) => s.addNode);
  const selectNode = useUiStore((s) => s.selectNode);
  const { isRunning, isStepMode, runFlow, stepNext, stopRun, toggleStepMode } =
    useFlowExecution(flowId);
  const { exportFlow } = useFlowImportExport();
  const [envDialogOpen, setEnvDialogOpen] = useState(false);

  const getNextPosition = useCallback(() => {
    const nodes = useFlowStore.getState().flows.find((f) => f.id === flowId)?.nodes ?? [];
    const maxX = nodes.reduce((max, n) => Math.max(max, n.position.x), 0);
    return { x: maxX + 300, y: 150 };
  }, [flowId]);

  const handleAddNode = useCallback(() => {
    const node: ApiNode = {
      id: crypto.randomUUID(),
      type: "api",
      label: DEFAULT_NODE.LABEL,
      method: DEFAULT_NODE.METHOD,
      url: DEFAULT_NODE.URL,
      headers: { ...DEFAULT_HEADERS },
      queryParams: {},
      body: DEFAULT_NODE.BODY,
      dataMapping: [],
      position: getNextPosition(),
    };
    addNode(flowId, node);
  }, [flowId, addNode, getNextPosition]);

  const handleAddStoreNode = useCallback(() => {
    const node: StoreNode = {
      id: crypto.randomUUID(),
      type: "store",
      label: STORE_NODE.LABEL,
      variables: [],
      position: getNextPosition(),
    };
    addNode(flowId, node);
  }, [flowId, addNode, getNextPosition]);

  const handleRun = useCallback(async () => {
    await runFlow();
    const run = useExecutionStore.getState().currentRun;
    if (run?.status === "success") {
      toast.success(EXECUTION.EXECUTION_SUCCESS_TOAST);
    } else if (run?.status === "error") {
      toast.error(EXECUTION.EXECUTION_ERROR_TOAST);
    }
  }, [runFlow]);

  const handleDeselect = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  useKeyboardShortcuts({
    onRun: handleRun,
    onStop: stopRun,
    onStepNext: stepNext,
    onAddNode: handleAddNode,
    onDeselect: handleDeselect,
    isRunning,
  });

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

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEnvDialogOpen(true)}
              disabled={isRunning}
            >
              <Settings2 />
              {ENV_EDITOR.BUTTON_LABEL}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{ENV_EDITOR.DIALOG_TITLE}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              onClick={() => flow && exportFlow(flow)}
              disabled={isRunning || !flow}
            >
              <Download />
              {IMPORT_EXPORT.EXPORT_BUTTON}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{IMPORT_EXPORT.EXPORT_TOOLTIP}</TooltipContent>
        </Tooltip>

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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={stepNext}>
                <SkipForward />
                {EXECUTION.STEP_NEXT_BUTTON}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{SHORTCUTS.STEP_NEXT}</TooltipContent>
          </Tooltip>
        )}

        {isRunning ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="destructive" onClick={stopRun}>
                <Square />
                {EXECUTION.STOP_BUTTON}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{SHORTCUTS.STOP}</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="default" onClick={handleRun}>
                <Play />
                {EXECUTION.RUN_BUTTON}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{SHORTCUTS.RUN}</TooltipContent>
          </Tooltip>
        )}

        <div className="h-5 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" onClick={handleAddNode} disabled={isRunning}>
              <Plus />
              {FLOW_BUILDER.TOOLBAR_ADD_API_NODE}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{SHORTCUTS.ADD_NODE}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline" onClick={handleAddStoreNode} disabled={isRunning}>
              <Database />
              {FLOW_BUILDER.TOOLBAR_ADD_STORE_NODE}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add Store node</TooltipContent>
        </Tooltip>
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
