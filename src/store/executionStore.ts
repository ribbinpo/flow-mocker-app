import { create } from "zustand";
import type { ExecutionResult, ExecutionStatus, NodeLog } from "@/types";

interface ExecutionState {
  currentRun: ExecutionResult | null;
  isStepMode: boolean;

  startRun: (flowId: string) => void;
  addNodeLog: (log: NodeLog) => void;
  finishRun: (status: ExecutionStatus) => void;
  resetRun: () => void;
  setStepMode: (enabled: boolean) => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
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

  resetRun: () => set({ currentRun: null }),

  setStepMode: (enabled) => set({ isStepMode: enabled }),
}));
