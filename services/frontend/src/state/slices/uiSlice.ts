import type { StateCreator } from 'zustand';

export type ThemeName = 'parchment' | 'obsidian';

export type UiSlice = {
  theme: ThemeName;
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  setTheme: (theme: ThemeName) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setRightPanelOpen: (open: boolean) => void;
  toggleRightPanel: () => void;
};

function applyTheme(theme: ThemeName): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem('ziayada-theme', theme);
  } catch {
    // ignore storage errors
  }
}

function getInitialTheme(): ThemeName {
  if (typeof window === 'undefined') return 'parchment';
  try {
    const saved = localStorage.getItem('ziayada-theme');
    if (saved === 'parchment' || saved === 'obsidian') return saved;
  } catch {
    // ignore storage errors
  }
  return 'parchment';
}

export const createUiSlice: StateCreator<UiSlice, [], [], UiSlice> = (set, get) => {
  const initialTheme = getInitialTheme();
  applyTheme(initialTheme);

  return {
    theme: initialTheme,
    sidebarOpen: false,
    rightPanelOpen: false,
    setTheme: (theme) => {
      applyTheme(theme);
      set({ theme });
    },
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
    setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
    toggleRightPanel: () => set({ rightPanelOpen: !get().rightPanelOpen }),
  };
};
