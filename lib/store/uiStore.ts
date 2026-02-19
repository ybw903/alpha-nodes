import { create } from 'zustand';

type RightPanelMode = 'config' | 'run';

interface UIState {
  rightPanelMode: RightPanelMode;
  isSidebarOpen: boolean;

  setRightPanelMode: (mode: RightPanelMode) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  rightPanelMode: 'config',
  isSidebarOpen: true,

  setRightPanelMode: (mode) => set({ rightPanelMode: mode }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}));
