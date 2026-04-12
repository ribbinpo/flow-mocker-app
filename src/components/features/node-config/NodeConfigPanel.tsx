import { PanelSidebar } from "@/components/bases/PanelSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyValueEditor } from "./KeyValueEditor";
import { useFlowStore } from "@/store/flowStore";
import { useUiStore } from "@/store/uiStore";
import { NODE_CONFIG, HTTP_METHODS } from "@/utils/constants";
import { cn } from "@/lib/utils";
import type { HttpMethod, FlowNode } from "@/types";

function MethodButton({
  method,
  selected,
  onClick,
}: {
  method: HttpMethod;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2 py-1 text-xs font-bold transition-colors",
        selected
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      )}
    >
      {method}
    </button>
  );
}

export function NodeConfigPanel() {
  const selectedNodeId = useUiStore((s) => s.selectedNodeId);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const selectNode = useUiStore((s) => s.selectNode);

  const activeFlowId = useFlowStore((s) => s.activeFlowId);
  const flow = useFlowStore((s) =>
    s.flows.find((f) => f.id === s.activeFlowId),
  );
  const updateNode = useFlowStore((s) => s.updateNode);
  const removeNode = useFlowStore((s) => s.removeNode);

  const node: FlowNode | undefined = flow?.nodes.find(
    (n) => n.id === selectedNodeId,
  );

  const handleUpdate = (updates: Partial<FlowNode>) => {
    if (!activeFlowId || !selectedNodeId) return;
    updateNode(activeFlowId, selectedNodeId, updates);
  };

  const handleDelete = () => {
    if (!activeFlowId || !selectedNodeId) return;
    removeNode(activeFlowId, selectedNodeId);
    selectNode(null);
  };

  return (
    <PanelSidebar
      title={NODE_CONFIG.PANEL_TITLE}
      open={sidebarOpen && !!node}
      onClose={() => selectNode(null)}
    >
      {node && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {NODE_CONFIG.LABEL_FIELD}
            </label>
            <Input
              value={node.label}
              onChange={(e) => handleUpdate({ label: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {NODE_CONFIG.METHOD_FIELD}
            </label>
            <div className="flex flex-wrap gap-1">
              {HTTP_METHODS.map((m) => (
                <MethodButton
                  key={m}
                  method={m}
                  selected={node.method === m}
                  onClick={() => handleUpdate({ method: m })}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {NODE_CONFIG.URL_FIELD}
            </label>
            <Input
              value={node.url}
              onChange={(e) => handleUpdate({ url: e.target.value })}
              placeholder={NODE_CONFIG.URL_PLACEHOLDER}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {NODE_CONFIG.HEADERS_SECTION}
            </label>
            <KeyValueEditor
              entries={node.headers}
              onChange={(headers) => handleUpdate({ headers })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {NODE_CONFIG.QUERY_PARAMS_SECTION}
            </label>
            <KeyValueEditor
              entries={node.queryParams}
              onChange={(queryParams) => handleUpdate({ queryParams })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {NODE_CONFIG.BODY_SECTION}
            </label>
            <textarea
              className="min-h-24 rounded-md border bg-transparent px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={node.body}
              onChange={(e) => handleUpdate({ body: e.target.value })}
              placeholder={NODE_CONFIG.BODY_PLACEHOLDER}
            />
          </div>

          <Button variant="destructive" size="sm" onClick={handleDelete}>
            {NODE_CONFIG.DELETE_NODE_BUTTON}
          </Button>
        </div>
      )}
    </PanelSidebar>
  );
}

export default NodeConfigPanel;
