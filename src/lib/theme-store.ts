///////////////////////////////////////////////////////////
//                                                       //
//                 THEME STORE (ZUSTAND)                 //
//                                                       //
///////////////////////////////////////////////////////////

import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'sfm_theme';
let mediaListenerAttached = false;

function resolveThemeMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function applyThemeToDocument(mode: ThemeMode): 'light' | 'dark' {
  const resolved = resolveThemeMode(mode);
  if (typeof document !== 'undefined') {
    const isDark = resolved === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = resolved;
  }
  return resolved;
}

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  isInitialized: boolean;
  initTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  resolvedTheme: 'light',
  isInitialized: false,

  initTheme: () => {
    if (typeof window === 'undefined') return;

    let savedMode: ThemeMode = 'light';
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        savedMode = stored;
      }
    } catch {
      // Ignore storage access errors in restricted contexts
    }

    const resolved = applyThemeToDocument(savedMode);
    set({
      theme: savedMode,
      resolvedTheme: resolved,
      isInitialized: true,
    });

    if (!mediaListenerAttached) {
      mediaListenerAttached = true;
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        const currentTheme = get().theme;
        if (currentTheme === 'system') {
          const nextResolved = applyThemeToDocument('system');
          set({ resolvedTheme: nextResolved });
        }
      });
    }
  },

  setTheme: (theme: ThemeMode) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      }
    } catch {
      // Ignore storage write errors
    }

    const resolved = applyThemeToDocument(theme);
    set({
      theme,
      resolvedTheme: resolved,
      isInitialized: true,
    });
  },
}));
