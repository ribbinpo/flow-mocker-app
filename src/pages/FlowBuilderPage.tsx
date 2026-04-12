import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ReactFlow, ReactFlowProvider, Background, Controls } from "@xyflow/react";
import { FlowToolbar } from "@/components/features/flow-builder/FlowToolbar";
import { NodeConfigPanel } from "@/components/features/node-config/NodeConfigPanel";
import { ExecutionLogPanel } from "@/components/features/execution/ExecutionLogPanel";
import { useFlowStore } from "@/store/flowStore";
import { useUiStore } from "@/store/uiStore";
import { useFlowCanvas } from "@/hooks/useFlowCanvas";

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

  const logPanelOpen = useUiStore((s) => s.logPanelOpen);
  const setLogPanelOpen = useUiStore((s) => s.setLogPanelOpen);

  const handleCloseLogPanel = () => setLogPanelOpen(false);

  return (
    <div className="flex h-screen flex-col">
      <FlowToolbar flowId={flowId} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
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
        </div>
        <NodeConfigPanel />
        <ExecutionLogPanel
          open={logPanelOpen}
          onClose={handleCloseLogPanel}
        />
      </div>
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
