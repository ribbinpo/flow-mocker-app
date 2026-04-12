import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Flow } from "@/types";
import { FLOW_LIST } from "@/utils/constants";

interface FlowCardProps {
  flow: Flow;
  onRename: (flowId: string) => void;
  onDelete: (flowId: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function FlowCard({ flow, onRename, onDelete }: FlowCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => navigate(`/flow/${flow.id}`)}
    >
      <CardHeader>
        <CardTitle className="text-base">{flow.name}</CardTitle>
        <CardDescription>
          {flow.nodes.length} {FLOW_LIST.CARD_NODES_LABEL}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {FLOW_LIST.CARD_UPDATED_LABEL} {formatDate(flow.updatedAt)}
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              onRename(flow.id);
            }}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(flow.id);
            }}
          >
            <Trash2 />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default FlowCard;
