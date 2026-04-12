import { useEffect } from "react";

interface ShortcutActions {
  onRun: () => void;
  onStop: () => void;
  onStepNext: () => void;
  onAddNode: () => void;
  onDeselect: () => void;
  isRunning: boolean;
}

export function useKeyboardShortcuts({
  onRun,
  onStop,
  onStepNext,
  onAddNode,
  onDeselect,
  isRunning,
}: ShortcutActions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + Enter → Run or Step Next
      if (mod && e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          onStepNext();
        } else if (!isRunning) {
          onRun();
        }
        return;
      }

      // Cmd/Ctrl + . → Stop
      if (mod && e.key === ".") {
        e.preventDefault();
        if (isRunning) {
          onStop();
        }
        return;
      }

      // Cmd/Ctrl + N → Add node
      if (mod && e.key === "n") {
        e.preventDefault();
        if (!isRunning) {
          onAddNode();
        }
        return;
      }

      // Escape → Deselect
      if (e.key === "Escape") {
        onDeselect();
        return;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onRun, onStop, onStepNext, onAddNode, onDeselect, isRunning]);
}
