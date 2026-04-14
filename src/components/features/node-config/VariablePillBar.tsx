interface VariableInfo {
  storeLabel: string;
  variableName: string;
}

interface VariablePillBarProps {
  variables: VariableInfo[];
  onInsert: (template: string) => void;
}

export function VariablePillBar({ variables, onInsert }: VariablePillBarProps) {
  if (variables.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        Available Variables
      </label>
      <div className="flex flex-wrap gap-1">
        {variables.map((v) => (
          <button
            key={`${v.storeLabel}.${v.variableName}`}
            type="button"
            onClick={() => onInsert(`{{${v.variableName}}}`)}
            className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-200 active:bg-violet-300"
            title={`Click to copy {{${v.variableName}}} from ${v.storeLabel}`}
          >
            {v.variableName}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Click to copy, then paste into any field
      </p>
    </div>
  );
}

export default VariablePillBar;
