import { useEffect, useRef } from "react";
import { useFlowStore } from "@/store/flowStore";
import { saveFlow, deleteFlowFile, loadFlows } from "@/services/flowStorage";
import { toast } from "sonner";
import { PERSISTENCE } from "@/utils/constants";
import type { Flow } from "@/types";

const SAVE_DEBOUNCE_MS = 1000;

function diffFlows(
  prev: Flow[],
  next: Flow[],
): { changed: Flow[]; deleted: string[] } {
  const prevMap = new Map(prev.map((f) => [f.id, f]));
  const nextMap = new Map(next.map((f) => [f.id, f]));

  const changed: Flow[] = [];
  for (const flow of next) {
    const old = prevMap.get(flow.id);
    if (!old || old.updatedAt !== flow.updatedAt || old !== flow) {
      changed.push(flow);
    }
  }

  const deleted: string[] = [];
  for (const id of prevMap.keys()) {
    if (!nextMap.has(id)) {
      deleted.push(id);
    }
  }

  return { changed, deleted };
}

export function useFlowPersistence() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    loadFlows().then((flows) => {
      if (flows.length > 0) {
        useFlowStore.setState({ flows });
      }
    });

    let timer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = useFlowStore.subscribe((state, prevState) => {
      if (state.flows === prevState.flows) return;

      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        const { changed, deleted } = diffFlows(prevState.flows, state.flows);

        const ops: Promise<void>[] = [
          ...changed.map((flow) => saveFlow(flow)),
          ...deleted.map((id) => deleteFlowFile(id)),
        ];

        if (ops.length > 0) {
          await Promise.all(ops);
          if ("__TAURI_INTERNALS__" in window) {
            toast.success(PERSISTENCE.SAVED_MESSAGE, { duration: 1500 });
          }
        }
      }, SAVE_DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);
}
