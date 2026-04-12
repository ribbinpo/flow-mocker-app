import { create } from "zustand";
import type { ExecutionResult, ExecutionStatus, NodeLog } from "@/types";

interface ExecutionState {
  currentRun: ExecutionResult | null;
  isStepMode: boolean;

  startRun: (flowId: string) => void;
  addNodeLog: (log: NodeLog) => void;
  finishRun: (status: ExecutionStatus) => void;
  setStepMode: (enabled: boolean) => void;
  getNodeStatus: (nodeId: string) => ExecutionStatus;
}

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  currentRun: null,
  isStepMode: false,

  startRun: (flowId) =>
    set({
      currentRun: {
        flowId,
        status: "running",
        logs: [],
        startedAt: new Date().toISOString(),
        finishedAt: null,
      },
    }),

  addNodeLog: (log) =>
    set((state) => {
      if (!state.currentRun) return state;
      return {
        currentRun: {
          ...state.currentRun,
          logs: [...state.currentRun.logs, log],
        },
      };
    }),

  finishRun: (status) =>
    set((state) => {
      if (!state.currentRun) return state;
      return {
        currentRun: {
          ...state.currentRun,
          status,
          finishedAt: new Date().toISOString(),
        },
      };
    }),

  setStepMode: (enabled) => set({ isStepMode: enabled }),

  getNodeStatus: (nodeId) => {
    const run = get().currentRun;
    if (!run) return "idle";
    const log = run.logs.find((l: NodeLog) => l.nodeId === nodeId);
    return log?.status ?? "idle";
  },
}));
