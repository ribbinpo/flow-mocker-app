import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type Edge,
} from "@xyflow/react";
import { toast } from "sonner";
import { useFlowStore } from "@/store/flowStore";
import { useUiStore } from "@/store/uiStore";
import type { FlowReactNode } from "@/types/reactFlow";
import { toReactFlowNode, toReactFlowEdge, isStartNode } from "@/types";
import type { FlowEdge } from "@/types";
import { START_NODE } from "@/utils/constants";
import ApiNode from "@/components/features/flow-builder/ApiNode";
import StartNode from "@/components/features/flow-builder/StartNode";
import StoreNode from "@/components/features/flow-builder/StoreNode";

const nodeTypes = { apiNode: ApiNode, startNode: StartNode, storeNode: StoreNode };

export function useFlowCanvas(flowId: string) {
  const flow = useFlowStore((s) => s.flows.find((f) => f.id === flowId));
  const updateNode = useFlowStore((s) => s.updateNode);
  const removeNode = useFlowStore((s) => s.removeNode);
  const addEdge = useFlowStore((s) => s.addEdge);
  const removeEdge = useFlowStore((s) => s.removeEdge);
  const addDataMapping = useFlowStore((s) => s.addDataMapping);
  const validateReferences = useFlowStore((s) => s.validateReferences);
  const selectNode = useUiStore((s) => s.selectNode);

  const storeNodes = useMemo(
    () => flow?.nodes.map(toReactFlowNode) ?? [],
    [flow?.nodes],
  );
  const storeEdges = useMemo(
    () => flow?.edges.map(toReactFlowEdge) ?? [],
    [flow?.edges],
  );

  const [nodes, setNodes] = useState<FlowReactNode[]>(storeNodes);
  const [edges, setEdges] = useState<Edge[]>(storeEdges);

  useEffect(() => {
    setNodes(storeNodes);
  }, [storeNodes]);

  useEffect(() => {
    setEdges(storeEdges);
  }, [storeEdges]);

  const onNodesChange = useCallback(
    (changes: NodeChange<FlowReactNode>[]) => {
      setNodes((prev) => applyNodeChanges(changes, prev));

      for (const change of changes) {
        if (change.type === "position" && change.position && !change.dragging) {
          updateNode(flowId, change.id, { position: change.position });
        }
        if (change.type === "remove") {
          const targetNode = flow?.nodes.find((n) => n.id === change.id);
          if (targetNode && isStartNode(targetNode)) {
            toast.error(START_NODE.CANNOT_DELETE);
            return;
          }
          removeNode(flowId, change.id);
          selectNode(null);
          const removed = validateReferences(flowId);
          if (removed > 0) {
            toast.info(`Removed ${removed} invalid variable reference${removed > 1 ? "s" : ""} due to node removal`);
          }
        }
      }
    },
    [flowId, flow?.nodes, updateNode, removeNode, selectNode, validateReferences],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      setEdges((prev) => applyEdgeChanges(changes, prev));

      let edgesChanged = false;
      for (const change of changes) {
        if (change.type === "remove") {
          removeEdge(flowId, change.id);
          edgesChanged = true;
        }
      }

      if (edgesChanged) {
        const removed = validateReferences(flowId);
        if (removed > 0) {
          toast.info(`Removed ${removed} invalid variable reference${removed > 1 ? "s" : ""} due to sequence change`);
        }
      }
    },
    [flowId, removeEdge, validateReferences],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceHandle = connection.sourceHandle ?? "";
      const targetHandle = connection.targetHandle ?? "";

      // Variable connection: Store variable handle -> API field handle
      if (sourceHandle.startsWith("var-") && targetHandle.startsWith("target-")) {
        const varName = sourceHandle.slice(4);
        const targetField = targetHandle.slice(7) as "header" | "query" | "body" | "url";

        const variableEdge: FlowEdge = {
          id: crypto.randomUUID(),
          source: connection.source,
          target: connection.target,
          edgeType: "variable",
          sourceVariable: varName,
          targetField,
          targetKey: varName,
        };
        addEdge(flowId, variableEdge);
        addDataMapping(flowId, connection.target, {
          sourceNodeId: connection.source,
          sourcePath: varName,
          targetField,
          targetKey: varName,
        });
      } else {
        // Regular sequence edge
        addEdge(flowId, {
          id: crypto.randomUUID(),
          source: connection.source,
          target: connection.target,
        });
      }
    },
    [flowId, addEdge, addDataMapping],
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: FlowReactNode) => {
      selectNode(node.id);
    },
    [selectNode],
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  return {
    nodes,
    edges,
    nodeTypes,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    onPaneClick,
  };
}
