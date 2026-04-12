import { create } from "zustand";
import type { Flow, FlowNode, FlowEdge } from "@/types";

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
    const flow: Flow = {
      id: generateId(),
      name,
      description: "",
      nodes: [],
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
        nodes: f.nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n)),
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
      flows: updateFlowInList(state.flows, flowId, (f) => ({
        ...f,
        edges: f.edges.filter((e) => e.id !== edgeId),
        updatedAt: new Date().toISOString(),
      })),
    })),

  updateEnvVariables: (flowId, envVariables) =>
    set((state) => ({
      flows: updateFlowInList(state.flows, flowId, (f) => ({
        ...f,
        envVariables,
        updatedAt: new Date().toISOString(),
      })),
    })),
}));
