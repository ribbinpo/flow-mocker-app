import { useEffect, useRef } from "react";
import { useCatalogStore } from "@/store/catalogStore";
import { saveCatalog, loadCatalog } from "@/services/catalogStorage";
import { toast } from "sonner";
import { PERSISTENCE } from "@/utils/constants";

const SAVE_DEBOUNCE_MS = 1000;

export function useCatalogPersistence() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    loadCatalog().then(({ folders, entries }) => {
      if (folders.length > 0 || entries.length > 0) {
        useCatalogStore.setState({ folders, entries });
      }
    });

    let timer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = useCatalogStore.subscribe((state, prevState) => {
      if (state.entries === prevState.entries && state.folders === prevState.folders) return;

      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        await saveCatalog(state.folders, state.entries);
        if ("__TAURI_INTERNALS__" in window) {
          toast.success(PERSISTENCE.CATALOG_SAVED_MESSAGE, { duration: 1500 });
        }
      }, SAVE_DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);
}
