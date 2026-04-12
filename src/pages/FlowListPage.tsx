import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/bases/EmptyState";
import { FlowCard } from "@/components/features/flow-list/FlowCard";
import { CreateFlowDialog } from "@/components/features/flow-list/CreateFlowDialog";
import { useFlowStore } from "@/store/flowStore";
import { FLOW_LIST, APP_NAME } from "@/utils/constants";

export function FlowListPage() {
  const navigate = useNavigate();
  const flows = useFlowStore((s) => s.flows);
  const createFlow = useFlowStore((s) => s.createFlow);
  const renameFlow = useFlowStore((s) => s.renameFlow);
  const deleteFlow = useFlowStore((s) => s.deleteFlow);

  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const renameFlowObj = flows.find((f) => f.id === renameTarget);
  const deleteFlowObj = flows.find((f) => f.id === deleteTarget);

  const handleCreate = (name: string) => {
    const flow = createFlow(name);
    navigate(`/flow/${flow.id}`);
  };

  const handleRename = (name: string) => {
    if (renameTarget) renameFlow(renameTarget, name);
    setRenameTarget(null);
  };

  const handleDelete = () => {
    if (deleteTarget) deleteFlow(deleteTarget);
    setDeleteTarget(null);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{FLOW_LIST.PAGE_TITLE}</h1>
          <p className="text-sm text-muted-foreground">{APP_NAME}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          {FLOW_LIST.CREATE_BUTTON}
        </Button>
      </div>

      {flows.length === 0 ? (
        <EmptyState
          icon={<Workflow />}
          title={FLOW_LIST.EMPTY_TITLE}
          description={FLOW_LIST.EMPTY_DESCRIPTION}
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus />
              {FLOW_LIST.CREATE_BUTTON}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {flows.map((flow) => (
            <FlowCard
              key={flow.id}
              flow={flow}
              onRename={setRenameTarget}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <CreateFlowDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onConfirm={handleCreate}
      />

      <CreateFlowDialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        onConfirm={handleRename}
        title={FLOW_LIST.RENAME_DIALOG_TITLE}
        defaultValue={renameFlowObj?.name ?? ""}
      />

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{FLOW_LIST.DELETE_CONFIRM_TITLE}</DialogTitle>
            <DialogDescription>
              {FLOW_LIST.DELETE_CONFIRM_DESCRIPTION}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm font-medium">{deleteFlowObj?.name}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {FLOW_LIST.CREATE_DIALOG_CANCEL}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {FLOW_LIST.DELETE_CONFIRM_BUTTON}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FlowListPage;
