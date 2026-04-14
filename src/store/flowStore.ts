import { create } from "zustand";
import type { Flow, FlowNode, FlowEdge, StartNode, DataMapping } from "@/types";
import { isApiNode, isVariableEdge } from "@/types";
import { cleanInvalidReferences } from "@/services/variableResolver";
import { START_NODE } from "@/utils/constants";

interface FlowState {
  flows: Flow[];
  activeFlowId: string | null;

  createFlow: (name: string) => Flow;
  addFlow: (flow: Flow) => void;
  deleteFlow: (flowId: string) => void;
  renameFlow: (flowId: string, name: string) => void;
  setActiveFlow: (flowId: string | null) => void;
  getActiveFlow: () => Flow | undefined;

  addNode: (flowId: string, node: FlowNode) => void;
  updateNode: (flowId: string, nodeId: string, updates: Partial<FlowNode>) => void;
  removeNode: (flowId: string, nodeId: string) => void;

  addEdge: (flowId: string, edge: FlowEdge) => void;
  removeEdge: (flowId: string, edgeId: string) => void;

  addDataMapping: (flowId: string, nodeId: string, mapping: DataMapping) => void;
  removeDataMapping: (flowId: string, nodeId: string, sourceNodeId: string, sourcePath: string) => void;

  validateReferences: (flowId: string) => number;

  updateEnvVariables: (flowId: string, envVariables: Record<string, string>) => void;
}

function generateId(): string {
  return crypto.randomUUID();
}

function updateFlowInList(flows: Flow[], flowId: string, updater: (flow: Flow) => Flow): Flow[] {
  return flows.map((f) => (f.id === flowId ? updater(f) : f));
}

export const useFlowStore = create<FlowState>((set, get) => ({
  flows: [],
  activeFlowId: null,

  createFlow: (name: string) => {
    const now = new Date().toISOString();
    const startNode: StartNode = {
      id: generateId(),
      type: "start",
      label: START_NODE.LABEL,
      position: { x: 100, y: 150 },
    };
    const flow: Flow = {
      id: generateId(),
      name,
      description: "",
      nodes: [startNode],
      edges: [],
      envVariables: {},
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ flows: [...state.flows, flow] }));
    return flow;
  },

  addFlow: (flow) =>
    set((state) => ({ flows: [...state.flows, flow] })),

  deleteFlow: (flowId) =>
    set((state) => ({
      flows: state.flows.filter((f) => f.id !== flowId),
      activeFlowId: state.activeFlowId === flowId ? null : state.activeFlowId,
    })),

  renameFlow: (flowId, name) =>
    set((state) => ({
      flows: updateFlowInList(state.flows, flowId, (f) => ({
        ...f,
        name,
        updatedAt: new Date().toISOString(),
      })),
    })),

  setActiveFlow: (flowId) => set({ activeFlowId: flowId }),

  getActiveFlow: () => {
    const { flows, activeFlowId } = get();
    return flows.find((f) => f.id === activeFlowId);
  },

  addNode: (flowId, node) =>
    set((state) => ({
      flows: updateFlowInList(state.flows, flowId, (f) => ({
        ...f,
        nodes: [...f.nodes, node],
        updatedAt: new Date().toISOString(),
      })),
    })),

  updateNode: (flowId, nodeId, updates) =>
    set((state) => ({
      flows: updateFlowInList(state.flows, flowId, (f) => ({
        ...f,
        nodes: f.nodes.map((n) =>
          n.id === nodeId ? ({ ...n, ...updates } as FlowNode) : n,
        ),
        updatedAt: new Date().toISOString(),
      })),
    })),

  removeNode: (flowId, nodeId) =>
    set((state) => ({
      flows: updateFlowInList(state.flows, flowId, (f) => ({
        ...f,
        nodes: f.nodes.filter((n) => n.id !== nodeId),
        edges: f.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
        updatedAt: new Date().toISOString(),
      })),
    })),

  addEdge: (flowId, edge) =>
    set((state) => ({
      flows: updateFlowInList(state.flows, flowId, (f) => ({
        ...f,
        edges: [...f.edges, edge],
        updatedAt: new Date().toISOString(),
      })),
    })),

  removeEdge: (flowId, edgeId) =>
    set((state) => ({
      flows: updateFlowInList(state.flows, flowId, (f) => {
        const edge = f.edges.find((e) => e.id === edgeId);
        let nodes = f.nodes;

        // If removing a variable edge, also remove the matching DataMapping
        if (edge && isVariableEdge(edge) && edge.sourceVariable) {
          nodes = f.nodes.map((n) => {
            if (n.id === edge.target && isApiNode(n)) {
              return {
                ...n,
                dataMapping: n.dataMapping.filter(
                  (dm) => !(dm.sourceNodeId === edge.source && dm.sourcePath === edge.sourceVariable),
                ),
              };
            }
            return n;
          });
        }

        return {
          ...f,
          nodes,
          edges: f.edges.filter((e) => e.id !== edgeId),
          updatedAt: new Date().toISOString(),
        };
      }),
    })),

  addDataMapping: (flowId, nodeId, mapping) =>
    set((state) => ({
      flows: updateFlowInList(state.flows, flowId, (f) => ({
        ...f,
        nodes: f.nodes.map((n) => {
          if (n.id === nodeId && isApiNode(n)) {
            return { ...n, dataMapping: [...n.dataMapping, mapping] };
          }
          return n;
        }),
        updatedAt: new Date().toISOString(),
      })),
    })),

  removeDataMapping: (flowId, nodeId, sourceNodeId, sourcePath) =>
    set((state) => ({
      flows: updateFlowInList(state.flows, flowId, (f) => ({
        ...f,
        nodes: f.nodes.map((n) => {
          if (n.id === nodeId && isApiNode(n)) {
            return {
              ...n,
              dataMapping: n.dataMapping.filter(
                (dm) => !(dm.sourceNodeId === sourceNodeId && dm.sourcePath === sourcePath),
              ),
            };
          }
          return n;
        }),
        updatedAt: new Date().toISOString(),
      })),
    })),

  validateReferences: (flowId) => {
    const flow = get().flows.find((f) => f.id === flowId);
    if (!flow) return 0;

    const { nodes, edges, totalRemoved } = cleanInvalidReferences(flow.nodes, flow.edges);
    if (totalRemoved > 0) {
      set((state) => ({
        flows: updateFlowInList(state.flows, flowId, (f) => ({
          ...f,
          nodes: nodes as FlowNode[],
          edges,
          updatedAt: new Date().toISOString(),
        })),
      }));
    }
    return totalRemoved;
  },

  updateEnvVariables: (flowId, envVariables) =>
    set((state) => ({
      flows: updateFlowInList(state.flows, flowId, (f) => ({
        ...f,
        envVariables,
        updatedAt: new Date().toISOString(),
      })),
    })),
}));
