import { useState } from "react";
import { Plus, Trash2, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyValueEditor } from "@/components/features/node-config/KeyValueEditor";
import { useEnvironmentStore } from "@/store/environmentStore";
import { ENVIRONMENT } from "@/utils/constants";

interface EnvironmentManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnvironmentManager({
  open,
  onOpenChange,
}: EnvironmentManagerProps) {
  const environments = useEnvironmentStore((s) => s.environments);
  const activeEnvironmentId = useEnvironmentStore((s) => s.activeEnvironmentId);
  const createEnvironment = useEnvironmentStore((s) => s.createEnvironment);
  const updateEnvironment = useEnvironmentStore((s) => s.updateEnvironment);
  const deleteEnvironment = useEnvironmentStore((s) => s.deleteEnvironment);
  const setActiveEnvironment = useEnvironmentStore((s) => s.setActiveEnvironment);
  const duplicateEnvironment = useEnvironmentStore((s) => s.duplicateEnvironment);

  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
  const [newEnvName, setNewEnvName] = useState("");

  const selectedEnv = environments.find((e) => e.id === selectedEnvId);

  const handleCreate = () => {
    const name = newEnvName.trim();
    if (!name) return;
    const env = createEnvironment(name);
    setSelectedEnvId(env.id);
    setNewEnvName("");
  };

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreate();
    }
  };

  const handleDelete = (id: string) => {
    deleteEnvironment(id);
    if (selectedEnvId === id) {
      setSelectedEnvId(null);
    }
  };

  const handleDuplicate = (id: string) => {
    const dup = duplicateEnvironment(id);
    if (dup) {
      setSelectedEnvId(dup.id);
    }
  };

  const handleNameChange = (name: string) => {
    if (!selectedEnvId) return;
    updateEnvironment(selectedEnvId, { name });
  };

  const handleVariablesChange = (variables: Record<string, string>) => {
    if (!selectedEnvId) return;
    updateEnvironment(selectedEnvId, { variables });
  };

  const handleSetActive = (id: string) => {
    setActiveEnvironment(activeEnvironmentId === id ? null : id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-2xl">
        <DialogHeader>
          <DialogTitle>{ENVIRONMENT.MANAGER_TITLE}</DialogTitle>
          <DialogDescription>{ENVIRONMENT.MANAGER_DESCRIPTION}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-4" style={{ minHeight: 360 }}>
          {/* Left panel: environment list */}
          <div className="flex w-48 shrink-0 flex-col gap-2 border-r pr-4">
            <div className="flex gap-1">
              <Input
                className="h-8 text-xs"
                placeholder={ENVIRONMENT.CREATE_PLACEHOLDER}
                value={newEnvName}
                onChange={(e) => setNewEnvName(e.target.value)}
                onKeyDown={handleCreateKeyDown}
              />
              <Button
                size="icon-xs"
                variant="outline"
                onClick={handleCreate}
                disabled={!newEnvName.trim()}
              >
                <Plus />
              </Button>
            </div>

            <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
              {environments.length === 0 && (
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  {ENVIRONMENT.EMPTY_DESCRIPTION}
                </p>
              )}

              {environments.map((env) => (
                <button
                  key={env.id}
                  type="button"
                  className={`group flex items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm transition-colors ${
                    env.id === selectedEnvId
                      ? "bg-accent font-medium"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => setSelectedEnvId(env.id)}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {env.id === activeEnvironmentId && (
                      <span className="size-1.5 shrink-0 rounded-full bg-green-500" />
                    )}
                    <span className="truncate">{env.name}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {Object.keys(env.variables).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right panel: environment detail */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
            {selectedEnv ? (
              <>
                <div className="flex items-center gap-2">
                  <Input
                    className="h-8 flex-1 text-sm font-medium"
                    value={selectedEnv.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder={ENVIRONMENT.RENAME_PLACEHOLDER}
                  />
                  <Button
                    size="sm"
                    variant={
                      selectedEnv.id === activeEnvironmentId
                        ? "default"
                        : "outline"
                    }
                    onClick={() => handleSetActive(selectedEnv.id)}
                    className="shrink-0 text-xs"
                  >
                    {selectedEnv.id === activeEnvironmentId
                      ? "Active"
                      : "Set Active"}
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => handleDuplicate(selectedEnv.id)}
                    title="Duplicate"
                  >
                    <Copy />
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(selectedEnv.id)}
                    title="Delete"
                  >
                    <Trash2 />
                  </Button>
                </div>

                <div>
                  <h3 className="mb-1 text-xs font-medium text-muted-foreground">
                    {ENVIRONMENT.VARIABLES_SECTION}
                  </h3>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {ENVIRONMENT.VARIABLES_DESCRIPTION}
                  </p>
                  <KeyValueEditor
                    entries={selectedEnv.variables}
                    onChange={handleVariablesChange}
                    keyPlaceholder={ENVIRONMENT.VARIABLE_KEY_PLACEHOLDER}
                    valuePlaceholder={ENVIRONMENT.VARIABLE_VALUE_PLACEHOLDER}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  {environments.length === 0
                    ? ENVIRONMENT.EMPTY_TITLE
                    : "Select an environment to edit"}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EnvironmentManager;
