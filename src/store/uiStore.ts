import { create } from "zustand";

export type SidePanelTab = "config" | "logs";

interface UiState {
  selectedNodeId: string | null;
  sidebarOpen: boolean;
  logPanelOpen: boolean;
  sidePanelTab: SidePanelTab;

  selectNode: (nodeId: string | null) => void;
  setLogPanelOpen: (open: boolean) => void;
  setSidePanelTab: (tab: SidePanelTab) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedNodeId: null,
  sidebarOpen: false,
  logPanelOpen: false,
  sidePanelTab: "config",

  selectNode: (nodeId) =>
    set({
      selectedNodeId: nodeId,
      sidebarOpen: nodeId !== null,
      sidePanelTab: "config",
    }),

  setLogPanelOpen: (open) =>
    set((state) => ({
      logPanelOpen: open,
      sidePanelTab: open ? "logs" : state.sidePanelTab,
      sidebarOpen: open ? true : state.sidebarOpen,
    })),

  setSidePanelTab: (tab) => set({ sidePanelTab: tab }),
}));
