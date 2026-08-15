import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "auto";

interface EditorStore {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  bookmarks: Record<string, Set<number>>;
  toggleBookmark: (tabId: string, line: number) => void;
  removeBookmark: (tabId: string, line: number) => void;
  getBookmarks: (tabId: string) => number[];
  clearBookmarks: (tabId: string) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  isDark: false,
  setIsDark: (v) => set({ isDark: v }),
  bookmarks: {},
  toggleBookmark: (tabId, line) => set((s) => {
    const map = new Set(s.bookmarks[tabId] || []);
    if (map.has(line)) map.delete(line); else map.add(line);
    return { bookmarks: { ...s.bookmarks, [tabId]: map } };
  }),
  removeBookmark: (tabId, line) => set((s) => {
    const map = new Set(s.bookmarks[tabId] || []);
    map.delete(line);
    return { bookmarks: { ...s.bookmarks, [tabId]: map } };
  }),
  getBookmarks: (tabId) => Array.from(get().bookmarks[tabId] || []),
  clearBookmarks: (tabId) => set((s) => ({ bookmarks: { ...s.bookmarks, [tabId]: new Set() } })),
}));
