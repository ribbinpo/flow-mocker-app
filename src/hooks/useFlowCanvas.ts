import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type Edge,
} from "@xyflow/react";
import { useFlowStore } from "@/store/flowStore";
import { useUiStore } from "@/store/uiStore";
import type { ApiFlowNode } from "@/types";
import { toReactFlowNode, toReactFlowEdge } from "@/types";
import ApiNode from "@/components/features/flow-builder/ApiNode";

const nodeTypes = { apiNode: ApiNode };

export function useFlowCanvas(flowId: string) {
  const flow = useFlowStore((s) => s.flows.find((f) => f.id === flowId));
  const updateNode = useFlowStore((s) => s.updateNode);
  const removeNode = useFlowStore((s) => s.removeNode);
  const addEdge = useFlowStore((s) => s.addEdge);
  const removeEdge = useFlowStore((s) => s.removeEdge);
  const selectNode = useUiStore((s) => s.selectNode);

  const storeNodes = useMemo(
    () => flow?.nodes.map(toReactFlowNode) ?? [],
    [flow?.nodes],
  );
  const storeEdges = useMemo(
    () => flow?.edges.map(toReactFlowEdge) ?? [],
    [flow?.edges],
  );

  const [nodes, setNodes] = useState<ApiFlowNode[]>(storeNodes);
  const [edges, setEdges] = useState<Edge[]>(storeEdges);

  useEffect(() => {
    setNodes(storeNodes);
  }, [storeNodes]);

  useEffect(() => {
    setEdges(storeEdges);
  }, [storeEdges]);

  const onNodesChange = useCallback(
    (changes: NodeChange<ApiFlowNode>[]) => {
      setNodes((prev) => applyNodeChanges(changes, prev));

      for (const change of changes) {
        if (change.type === "position" && change.position && !change.dragging) {
          updateNode(flowId, change.id, { position: change.position });
        }
        if (change.type === "remove") {
          removeNode(flowId, change.id);
          selectNode(null);
        }
      }
    },
    [flowId, updateNode, removeNode, selectNode],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      setEdges((prev) => applyEdgeChanges(changes, prev));

      for (const change of changes) {
        if (change.type === "remove") {
          removeEdge(flowId, change.id);
        }
      }
    },
    [flowId, removeEdge],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      addEdge(flowId, {
        id: crypto.randomUUID(),
        source: connection.source,
        target: connection.target,
      });
    },
    [flowId, addEdge],
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: ApiFlowNode) => {
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
