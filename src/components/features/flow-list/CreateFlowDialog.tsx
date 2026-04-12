import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FLOW_LIST } from "@/utils/constants";

interface CreateFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string) => void;
  title?: string;
  defaultValue?: string;
}

export function CreateFlowDialog({
  open,
  onOpenChange,
  onConfirm,
  title = FLOW_LIST.CREATE_DIALOG_TITLE,
  defaultValue = "",
}: CreateFlowDialogProps) {
  const [name, setName] = useState(defaultValue);

  const handleOpenChange = (next: boolean) => {
    if (!next) setName(defaultValue);
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
    setName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={FLOW_LIST.CREATE_DIALOG_PLACEHOLDER}
            autoFocus
          />
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {FLOW_LIST.CREATE_DIALOG_CANCEL}
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {FLOW_LIST.CREATE_DIALOG_CONFIRM}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateFlowDialog;
