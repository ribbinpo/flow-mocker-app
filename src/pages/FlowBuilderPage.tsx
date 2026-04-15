import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ReactFlow, ReactFlowProvider, Background, Controls } from "@xyflow/react";
import { ScrollText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { FlowToolbar } from "@/components/features/flow-builder/FlowToolbar";
import { NodeConfigPanel } from "@/components/features/node-config/NodeConfigPanel";
import { ExecutionLogPanel } from "@/components/features/execution/ExecutionLogPanel";
import { useFlowStore } from "@/store/flowStore";
import { useUiStore } from "@/store/uiStore";
import type { SidePanelTab } from "@/store/uiStore";
import { useExecutionStore } from "@/store/executionStore";
import { useFlowCanvas } from "@/hooks/useFlowCanvas";
import { EXECUTION, NODE_CONFIG } from "@/utils/constants";

function FlowBuilderContent({ flowId }: { flowId: string }) {
  const {
    nodes,
    edges,
    nodeTypes,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    onPaneClick,
  } = useFlowCanvas(flowId);

  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const logPanelOpen = useUiStore((s) => s.logPanelOpen);
  const sidePanelTab = useUiStore((s) => s.sidePanelTab);
  const selectNode = useUiStore((s) => s.selectNode);
  const setLogPanelOpen = useUiStore((s) => s.setLogPanelOpen);
  const setSidePanelTab = useUiStore((s) => s.setSidePanelTab);
  const hasLogs = useExecutionStore((s) => (s.currentRun?.logs.length ?? 0) > 0);

  const isPanelOpen = sidebarOpen || logPanelOpen;

  const handleClose = () => {
    selectNode(null);
    setLogPanelOpen(false);
  };

  const handleTabChange = (tab: string) => {
    setSidePanelTab(tab as SidePanelTab);
  };

  return (
    <div className="flex h-screen flex-col">
      <FlowToolbar flowId={flowId} />
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        <ResizablePanel defaultSize={isPanelOpen ? "70%" : "100%"} minSize="30%">
          <div className="relative h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              fitView
            >
              <Background />
              <Controls />
            </ReactFlow>
            {!isPanelOpen && hasLogs && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute bottom-4 right-4 z-10 shadow-md"
                    onClick={() => setLogPanelOpen(true)}
                  >
                    <ScrollText />
                    {EXECUTION.LOG_PANEL_TITLE}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open execution log</TooltipContent>
              </Tooltip>
            )}
          </div>
        </ResizablePanel>

        {isPanelOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="30%" minSize="30%">
              <aside className="flex h-full flex-col border-l bg-card">
                <Tabs value={sidePanelTab} onValueChange={handleTabChange} className="flex h-full flex-col">
                  <div className="flex items-center gap-2 border-b px-3 py-2">
                    <TabsList className="flex-1 grid w-full grid-cols-2">
                      <TabsTrigger value="config" className="text-sm">
                        {NODE_CONFIG.PANEL_TITLE}
                      </TabsTrigger>
                      <TabsTrigger value="logs" className="text-sm">
                        {EXECUTION.LOG_PANEL_TITLE}
                      </TabsTrigger>
                    </TabsList>
                    <Button variant="ghost" size="icon-xs" onClick={handleClose} className="shrink-0">
                      <X />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    {sidePanelTab === "config" && <NodeConfigPanel />}
                    {sidePanelTab === "logs" && <ExecutionLogPanel />}
                  </div>
                </Tabs>
              </aside>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}

export function FlowBuilderPage() {
  const { flowId } = useParams<{ flowId: string }>();
  const navigate = useNavigate();
  const setActiveFlow = useFlowStore((s) => s.setActiveFlow);
  const selectNode = useUiStore((s) => s.selectNode);
  const flowExists = useFlowStore((s) =>
    s.flows.some((f) => f.id === flowId),
  );

  useEffect(() => {
    if (!flowId || !flowExists) {
      navigate("/", { replace: true });
      return;
    }
    setActiveFlow(flowId);
    return () => {
      setActiveFlow(null);
      selectNode(null);
    };
  }, [flowId, flowExists, navigate, setActiveFlow, selectNode]);

  if (!flowId || !flowExists) return null;

  return (
    <ReactFlowProvider>
      <FlowBuilderContent flowId={flowId} />
    </ReactFlowProvider>
  );
}

export default FlowBuilderPage;
