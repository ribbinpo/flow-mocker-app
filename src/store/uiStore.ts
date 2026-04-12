import { create } from "zustand";

interface UiState {
  selectedNodeId: string | null;
  sidebarOpen: boolean;
  logPanelOpen: boolean;

  selectNode: (nodeId: string | null) => void;
  setLogPanelOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedNodeId: null,
  sidebarOpen: false,
  logPanelOpen: false,

  selectNode: (nodeId) =>
    set({
      selectedNodeId: nodeId,
      sidebarOpen: nodeId !== null,
    }),

  setLogPanelOpen: (open) => set({ logPanelOpen: open }),
}));
