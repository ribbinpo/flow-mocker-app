import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ApiNode, StoreVariable } from "@/types";
import { STORE_NODE } from "@/utils/constants";

interface StoreVariableEditorProps {
  variables: StoreVariable[];
  apiNodes: ApiNode[];
  upstreamNodeIds: Set<string>;
  onChange: (variables: StoreVariable[]) => void;
}

export function StoreVariableEditor({
  variables,
  apiNodes,
  upstreamNodeIds,
  onChange,
}: StoreVariableEditorProps) {
  const handleAdd = () => {
    const newVariable: StoreVariable = {
      id: crypto.randomUUID(),
      name: "",
      sourceNodeId: "",
      sourcePath: "",
    };
    onChange([...variables, newVariable]);
  };

  const handleRemove = (id: string) => {
    onChange(variables.filter((v) => v.id !== id));
  };

  const handleUpdate = (id: string, updates: Partial<StoreVariable>) => {
    onChange(
      variables.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">
          {STORE_NODE.VARIABLES_SECTION}
        </label>
        <Button variant="ghost" size="sm" onClick={handleAdd} className="h-6 px-2 text-xs">
          <Plus className="mr-1 h-3 w-3" />
          {STORE_NODE.ADD_VARIABLE_BUTTON}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {STORE_NODE.PANEL_DESCRIPTION}
      </p>

      {variables.length === 0 && (
        <p className="py-2 text-center text-xs text-muted-foreground">
          {STORE_NODE.NO_VARIABLES}
        </p>
      )}

      {variables.map((variable) => (
        <div key={variable.id} className="flex flex-col gap-1.5 rounded-md border bg-muted/30 p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {STORE_NODE.VARIABLE_NAME_LABEL}
            </span>
            <button
              type="button"
              onClick={() => handleRemove(variable.id)}
              className="rounded p-0.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <Input
            value={variable.name}
            onChange={(e) => handleUpdate(variable.id, { name: e.target.value })}
            placeholder={STORE_NODE.VARIABLE_NAME_PLACEHOLDER}
            className="h-7 text-xs"
          />

          <span className="text-xs font-medium text-muted-foreground">
            {STORE_NODE.SOURCE_NODE_LABEL}
          </span>
          <select
            value={variable.sourceNodeId}
            onChange={(e) => handleUpdate(variable.id, { sourceNodeId: e.target.value })}
            className="h-7 rounded-md border bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">{STORE_NODE.SOURCE_NODE_PLACEHOLDER}</option>
            {apiNodes.map((n) => {
              const isUpstream = upstreamNodeIds.has(n.id);
              return (
                <option key={n.id} value={n.id} disabled={!isUpstream}>
                  {n.label} ({n.method} {n.url || "..."}){!isUpstream ? " — executes after" : ""}
                </option>
              );
            })}
          </select>

          <span className="text-xs font-medium text-muted-foreground">
            {STORE_NODE.SOURCE_PATH_LABEL}
          </span>
          <Input
            value={variable.sourcePath}
            onChange={(e) => handleUpdate(variable.id, { sourcePath: e.target.value })}
            placeholder={STORE_NODE.SOURCE_PATH_PLACEHOLDER}
            className="h-7 font-mono text-xs"
          />
        </div>
      ))}
    </div>
  );
}

export default StoreVariableEditor;
