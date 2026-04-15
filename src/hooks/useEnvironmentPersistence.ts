import { useEffect, useRef } from "react";
import { useEnvironmentStore } from "@/store/environmentStore";
import { saveEnvironments, loadEnvironments } from "@/services/environmentStorage";
import { toast } from "sonner";
import { PERSISTENCE } from "@/utils/constants";

const SAVE_DEBOUNCE_MS = 1000;

export function useEnvironmentPersistence() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    loadEnvironments().then((data) => {
      if (data.environments.length > 0) {
        useEnvironmentStore.setState({
          environments: data.environments,
          activeEnvironmentId: data.activeEnvironmentId,
        });
      }
    });

    let timer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = useEnvironmentStore.subscribe((state, prevState) => {
      if (
        state.environments === prevState.environments &&
        state.activeEnvironmentId === prevState.activeEnvironmentId
      ) {
        return;
      }

      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        await saveEnvironments(state.environments, state.activeEnvironmentId);
        if ("__TAURI_INTERNALS__" in window) {
          toast.success(PERSISTENCE.ENVIRONMENTS_SAVED_MESSAGE, { duration: 1500 });
        }
      }, SAVE_DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);
}
