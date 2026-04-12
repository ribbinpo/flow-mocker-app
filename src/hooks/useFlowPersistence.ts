import { useEffect, useRef } from "react";
import { useFlowStore } from "@/store/flowStore";
import { saveFlows, loadFlows } from "@/services/flowStorage";
import { toast } from "sonner";
import { PERSISTENCE } from "@/utils/constants";

const SAVE_DEBOUNCE_MS = 1000;

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
      timer = setTimeout(() => {
        saveFlows(state.flows).then(() => {
          if ("__TAURI_INTERNALS__" in window) {
            toast.success(PERSISTENCE.SAVED_MESSAGE, { duration: 1500 });
          }
        });
      }, SAVE_DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);
}
