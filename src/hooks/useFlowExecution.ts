import { useCallback, useRef } from "react";
import { useFlowStore } from "@/store/flowStore";
import { useExecutionStore } from "@/store/executionStore";
import { useUiStore } from "@/store/uiStore";
import { executeFlow } from "@/services/executionEngine";
import type { NodeLog, ExecutionStatus } from "@/types";

interface UseFlowExecutionReturn {
  isRunning: boolean;
  isStepMode: boolean;
  runFlow: () => Promise<void>;
  stepNext: () => Promise<void>;
  stopRun: () => void;
  toggleStepMode: (enabled: boolean) => void;
}

export function useFlowExecution(flowId: string): UseFlowExecutionReturn {
  const generatorRef = useRef<AsyncGenerator<NodeLog, ExecutionStatus, void> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isRunning = useExecutionStore((s) => s.currentRun?.status === "running");
  const isStepMode = useExecutionStore((s) => s.isStepMode);

  const runFlow = useCallback(async () => {
    const flow = useFlowStore.getState().flows.find((f) => f.id === flowId);
    if (!flow) return;

    const { startRun, addNodeLog, finishRun } = useExecutionStore.getState();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    startRun(flowId);
    useUiStore.getState().setLogPanelOpen(true);

    const callbacks = {
      onNodeStart: () => {},
      onNodeComplete: (log: NodeLog) => addNodeLog(log),
    };

    const gen = executeFlow(flow, callbacks, controller.signal);
    generatorRef.current = gen;

    const stepMode = useExecutionStore.getState().isStepMode;

    if (stepMode) {
      const result = await gen.next();
      if (result.done) {
        finishRun(result.value);
        generatorRef.current = null;
        abortControllerRef.current = null;
      }
    } else {
      let result = await gen.next();
      while (!result.done) {
        result = await gen.next();
      }
      finishRun(result.value);
      generatorRef.current = null;
      abortControllerRef.current = null;
    }
  }, [flowId]);

  const stepNext = useCallback(async () => {
    const gen = generatorRef.current;
    if (!gen) return;

    const { finishRun } = useExecutionStore.getState();

    const result = await gen.next();
    if (result.done) {
      finishRun(result.value);
      generatorRef.current = null;
      abortControllerRef.current = null;
    }
  }, []);

  const stopRun = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const { finishRun } = useExecutionStore.getState();
    finishRun("error");
    generatorRef.current = null;
    abortControllerRef.current = null;
  }, []);

  const toggleStepMode = useCallback((enabled: boolean) => {
    useExecutionStore.getState().setStepMode(enabled);
  }, []);

  return {
    isRunning,
    isStepMode,
    runFlow,
    stepNext,
    stopRun,
    toggleStepMode,
  };
}
