import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NODE_CONFIG } from "@/utils/constants";

interface KeyValuePair {
  key: string;
  value: string;
}

interface KeyValueEditorProps {
  entries: Record<string, string>;
  onChange: (entries: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

function toArray(entries: Record<string, string>): KeyValuePair[] {
  return Object.entries(entries).map(([key, value]) => ({ key, value }));
}

function toRecord(pairs: KeyValuePair[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const { key, value } of pairs) {
    if (key) record[key] = value;
  }
  return record;
}

export function KeyValueEditor({
  entries,
  onChange,
  keyPlaceholder = NODE_CONFIG.KEY_PLACEHOLDER,
  valuePlaceholder = NODE_CONFIG.VALUE_PLACEHOLDER,
}: KeyValueEditorProps) {
  const [pairs, setPairs] = useState<KeyValuePair[]>(() => toArray(entries));
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    setPairs(toArray(entries));
  }, [entries]);

  const emitChange = (updated: KeyValuePair[]) => {
    isInternalChange.current = true;
    setPairs(updated);
    onChange(toRecord(updated));
  };

  const updatePair = (index: number, field: "key" | "value", val: string) => {
    const updated = [...pairs];
    updated[index] = { ...updated[index], [field]: val };
    emitChange(updated);
  };

  const removePair = (index: number) => {
    const updated = pairs.filter((_, i) => i !== index);
    emitChange(updated);
  };

  const addPair = () => {
    emitChange([...pairs, { key: "", value: "" }]);
  };

  return (
    <div className="flex flex-col gap-2">
      {pairs.map((pair, index) => (
        <div key={index} className="flex items-center gap-1">
          <Input
            className="h-8 text-xs"
            value={pair.key}
            onChange={(e) => updatePair(index, "key", e.target.value)}
            placeholder={keyPlaceholder}
          />
          <Input
            className="h-8 text-xs"
            value={pair.value}
            onChange={(e) => updatePair(index, "value", e.target.value)}
            placeholder={valuePlaceholder}
          />
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => removePair(index)}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addPair} className="w-fit">
        <Plus />
        {NODE_CONFIG.ADD_PAIR_BUTTON}
      </Button>
    </div>
  );
}

export default KeyValueEditor;
