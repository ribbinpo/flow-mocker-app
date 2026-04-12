import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { KeyValueEditor } from "@/components/features/node-config/KeyValueEditor";
import { useFlowStore } from "@/store/flowStore";
import { ENV_EDITOR } from "@/utils/constants";

interface EnvVariablesDialogProps {
  flowId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnvVariablesDialog({
  flowId,
  open,
  onOpenChange,
}: EnvVariablesDialogProps) {
  const flow = useFlowStore((s) => s.flows.find((f) => f.id === flowId));
  const updateEnvVariables = useFlowStore((s) => s.updateEnvVariables);

  const envVars = flow?.envVariables ?? {};

  const handleChange = (entries: Record<string, string>) => {
    updateEnvVariables(flowId, entries);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{ENV_EDITOR.DIALOG_TITLE}</DialogTitle>
          <DialogDescription>{ENV_EDITOR.DIALOG_DESCRIPTION}</DialogDescription>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto">
          <KeyValueEditor
            entries={envVars}
            onChange={handleChange}
            keyPlaceholder="VARIABLE_NAME"
            valuePlaceholder="value"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EnvVariablesDialog;
