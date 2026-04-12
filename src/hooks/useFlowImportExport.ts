import { useCallback } from "react";
import { toast } from "sonner";
import { useFlowStore } from "@/store/flowStore";
import {
  exportFlowToJson,
  slugifyFlowName,
  downloadJsonFile,
  importFlowFromJson,
} from "@/services/flowImportExport";
import { IMPORT_EXPORT } from "@/utils/constants";
import type { Flow } from "@/types";

export function useFlowImportExport() {
  const addFlow = useFlowStore((s) => s.addFlow);

  const exportFlow = useCallback(async (flow: Flow) => {
    const json = exportFlowToJson(flow);
    const slug = slugifyFlowName(flow.name) || "flow";
    const filePath = await downloadJsonFile(json, `${slug}.json`);
    toast.success(IMPORT_EXPORT.EXPORT_SUCCESS, {
      description: filePath ?? undefined,
    });
  }, []);

  const importFlowFromFile = useCallback(
    async (file: File) => {
      let text: string;
      try {
        text = await file.text();
      } catch {
        toast.error(IMPORT_EXPORT.IMPORT_ERROR_READ_FAILED);
        return;
      }

      const result = importFlowFromJson(text);
      if (!result.success) {
        toast.error(IMPORT_EXPORT.IMPORT_ERROR_INVALID_FORMAT, {
          description: result.error,
        });
        return;
      }

      addFlow(result.flow);
      toast.success(IMPORT_EXPORT.IMPORT_SUCCESS, {
        description: result.flow.name,
      });
    },
    [addFlow],
  );

  return { exportFlow, importFlowFromFile };
}
