import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createAuthSlice, type AuthSlice } from './slices/authSlice';
import { createChatSlice, type ChatSlice } from './slices/chatSlice';
import { createInterviewSlice, type InterviewSlice } from './slices/interviewSlice';
import { createUiSlice, type ThemeName, type UiSlice } from './slices/uiSlice';

export type AppState = AuthSlice & UiSlice & InterviewSlice & ChatSlice;

type PersistedState = {
  theme: ThemeName;
  chatSessionId: string | null;
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
};

export const useAppStore = create<AppState>()(
  persist(
    (...args) => ({
      ...createAuthSlice(...args),
      ...createUiSlice(...args),
      ...createInterviewSlice(...args),
      ...createChatSlice(...args),
    }),
    {
      name: 'ziayada-store',
      partialize: (state): PersistedState => ({
        theme: state.theme,
        chatSessionId: state.chatSessionId,
        sidebarOpen: state.sidebarOpen,
        rightPanelOpen: state.rightPanelOpen,
      }),
    },
  ),
);
