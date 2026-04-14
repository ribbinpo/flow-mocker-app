import { PanelSidebar } from "@/components/bases/PanelSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyValueEditor } from "./KeyValueEditor";
import { StoreVariableEditor } from "./StoreVariableEditor";
import { toast } from "sonner";
import { useFlowStore } from "@/store/flowStore";
import { useUiStore } from "@/store/uiStore";
import { NODE_CONFIG, HTTP_METHODS, START_NODE } from "@/utils/constants";
import type { RetryConfig, ApiNode, StoreVariable } from "@/types";
import { cn } from "@/lib/utils";
import type { HttpMethod, FlowNode } from "@/types";
import { isApiNode, isStartNode, isStoreNode } from "@/types";
import { getMethodStyle } from "@/utils/methodColors";
import { getUpstreamNodeIds } from "@/services/variableResolver";

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
          ? cn(getMethodStyle(method), "ring-2 ring-offset-1 ring-current")
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
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
    s.flows.find((f) => f.id === s.activeFlowId)
  );
  const updateNode = useFlowStore((s) => s.updateNode);
  const removeNode = useFlowStore((s) => s.removeNode);

  const node: FlowNode | undefined = flow?.nodes.find(
    (n) => n.id === selectedNodeId
  );

  const handleUpdate = (updates: Partial<ApiNode>) => {
    if (!activeFlowId || !selectedNodeId) return;
    updateNode(activeFlowId, selectedNodeId, updates as Partial<FlowNode>);
  };

  const handleDelete = () => {
    if (!activeFlowId || !selectedNodeId) return;
    if (node && isStartNode(node)) {
      toast.error(START_NODE.CANNOT_DELETE);
      return;
    }
    removeNode(activeFlowId, selectedNodeId);
    selectNode(null);
  };

  return (
    <PanelSidebar
      title={NODE_CONFIG.PANEL_TITLE}
      open={sidebarOpen && !!node}
      onClose={() => selectNode(null)}
    >
      {node && isStartNode(node) && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            The Start node is the entry point of the flow. All execution begins here.
          </p>
        </div>
      )}

      {node && isStoreNode(node) && (
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

          <StoreVariableEditor
            variables={node.variables}
            apiNodes={flow?.nodes.filter(isApiNode) ?? []}
            upstreamNodeIds={flow ? getUpstreamNodeIds(node.id, flow.nodes, flow.edges) : new Set()}
            onChange={(variables: StoreVariable[]) => {
              if (!activeFlowId || !selectedNodeId) return;
              updateNode(activeFlowId, selectedNodeId, { variables } as Partial<FlowNode>);
            }}
          />

          <Button variant="destructive" size="sm" onClick={handleDelete}>
            {NODE_CONFIG.DELETE_NODE_BUTTON}
          </Button>
        </div>
      )}

      {node && isApiNode(node) && (
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

          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <input
                type="checkbox"
                checked={!!node.retryConfig}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleUpdate({
                      retryConfig: { maxRetries: 2, delayMs: 1000 },
                    });
                  } else {
                    handleUpdate({ retryConfig: undefined });
                  }
                }}
                className="accent-primary"
              />
              {NODE_CONFIG.RETRY_SECTION}
            </label>
            {node.retryConfig && (
              <div className="flex gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    {NODE_CONFIG.RETRY_MAX_LABEL}
                  </span>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={node.retryConfig.maxRetries}
                    onChange={(e) => {
                      const val = Math.min(
                        5,
                        Math.max(1, Number(e.target.value))
                      );
                      handleUpdate({
                        retryConfig: {
                          ...(node.retryConfig as RetryConfig),
                          maxRetries: val,
                        },
                      });
                    }}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    {NODE_CONFIG.RETRY_DELAY_LABEL}
                  </span>
                  <Input
                    type="number"
                    min={100}
                    max={5000}
                    step={100}
                    value={node.retryConfig.delayMs}
                    onChange={(e) => {
                      const val = Math.min(
                        5000,
                        Math.max(100, Number(e.target.value))
                      );
                      handleUpdate({
                        retryConfig: {
                          ...(node.retryConfig as RetryConfig),
                          delayMs: val,
                        },
                      });
                    }}
                  />
                </div>
              </div>
            )}
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
