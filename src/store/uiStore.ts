import { create } from "zustand";

interface UiState {
  selectedNodeId: string | null;
  sidebarOpen: boolean;

  selectNode: (nodeId: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedNodeId: null,
  sidebarOpen: false,

  selectNode: (nodeId) =>
    set({
      selectedNodeId: nodeId,
      sidebarOpen: nodeId !== null,
    }),

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
