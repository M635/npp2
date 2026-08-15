import { create } from "zustand";
import type { FileTab } from "../types/file";
import { normalizePath } from "../utils/fileUtils";
import { useSettingStore } from "./settingStore";
import { toast } from "../utils/toast";

export function generateId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function buildTab(path: string, content: string, meta: FileTab["meta"], isLarge: boolean, encoding: string): FileTab {
  return {
    id: generateId(), path, name: path.split(/[\\/]/).pop() || path, content, meta,
    is_dirty: false, is_large_file: isLarge, readonly: !!meta?.readonly,
    encoding: (encoding as FileTab["encoding"]) || "UTF-8",
    language: "plaintext", cursor_position: { line: 1, column: 1 }, scroll_position: 0, is_new: false,
  };
}

interface FileStore {
  tabs: FileTab[];
  activeTabId: string | null;

  openTab: (tab: FileTab) => void;
  /** Open a file path from disk, reusing an existing tab when present. */
  openPath: (path: string) => Promise<void>;
  closeTab: (id: string) => void;
  closeOtherTabs: (id: string) => void;
  closeAllTabs: () => void;
  closeAllButCurrent: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, updates: Partial<FileTab>) => void;
  updateContent: (id: string, content: string) => void;
  markClean: (id: string) => void;
  markDirty: (id: string) => void;
  reorderTabs: (from: number, to: number) => void;
  sortTabs: (by: "name" | "path" | "size") => void;
  addRecentFile: (path: string) => void;
  getActiveTab: () => FileTab | null;
  getTabByPath: (path: string) => FileTab | null;
  getDirtyTabs: () => FileTab[];
}

export const useFileStore = create<FileStore>((set, get) => ({
  tabs: [],
  activeTabId: null,

  openTab: (tab) =>
    set((state) => {
      if (!tab.is_new) {
        const existing = state.tabs.find((t) => normalizePath(t.path) === normalizePath(tab.path));
        if (existing) return { activeTabId: existing.id };
      }
      return { tabs: [...state.tabs, tab], activeTabId: tab.id };
    }),

  openPath: async (path) => {
    const state = get();
    const existing = state.getTabByPath(path);
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }
    try {
      const { openFile } = await import("./../services/tauri/fileService");
      const resp = await openFile(path);
      if (resp.is_large_file && !resp.content) {
        // Large file: show a preview banner; open_large_file provides the first chunk.
        const { openLargeFile } = await import("./../services/tauri/fileService");
        try {
          const large = await openLargeFile(path);
          const tab = buildTab(path, large.chunk.content, {
            path, size: large.file_size, encoding: (large.encoding || "UTF-8") as FileTab["encoding"],
            is_binary: false, readonly: false, line_count: 0, has_bom: false, line_ending: "Lf",
          }, true, large.encoding);
          tab.readonly = true;
          tab.language = "plaintext";
          set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }));
          get().addRecentFile(path);
          toast("超大文件:已加载前 8MB 预览(只读)", "info");
          return;
        } catch {
          /* fall through to empty tab */
        }
      }
      const tab = buildTab(path, resp.content, resp.meta, resp.is_large_file, resp.meta.encoding);
      set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }));
      get().addRecentFile(path);
    } catch (e) {
      toast(`打开失败: ${(e as Error).message || e}`, "error");
    }
  },

  closeTab: (id) =>
    set((state) => {
      const idx = state.tabs.findIndex((t) => t.id === id);
      const newTabs = state.tabs.filter((t) => t.id !== id);
      let newActive = state.activeTabId;
      if (state.activeTabId === id) {
        if (newTabs.length === 0) newActive = null;
        else if (idx < newTabs.length) newActive = newTabs[idx].id;
        else newActive = newTabs[newTabs.length - 1].id;
      }
      return { tabs: newTabs, activeTabId: newActive };
    }),

  closeOtherTabs: (id) => set((state) => ({ tabs: state.tabs.filter((t) => t.id === id), activeTabId: id })),
  closeAllTabs: () => set({ tabs: [], activeTabId: null }),
  closeAllButCurrent: (id) => set((state) => ({ tabs: state.tabs.filter((t) => t.id === id), activeTabId: id })),
  setActiveTab: (id) => set({ activeTabId: id }),
  updateTab: (id, updates) => set((state) => ({ tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
  updateContent: (id, content) => set((state) => ({
    tabs: state.tabs.map((t) => (t.id === id ? { ...t, content, is_dirty: true } : t)),
  })),
  markClean: (id) => set((state) => ({ tabs: state.tabs.map((t) => (t.id === id ? { ...t, is_dirty: false } : t)) })),
  markDirty: (id) => set((state) => ({ tabs: state.tabs.map((t) => (t.id === id ? { ...t, is_dirty: true } : t)) })),
  reorderTabs: (from, to) => set((state) => {
    const newTabs = [...state.tabs];
    const [moved] = newTabs.splice(from, 1);
    newTabs.splice(to, 0, moved);
    return { tabs: newTabs };
  }),
  sortTabs: (by) => set((state) => {
    const sorted = [...state.tabs].sort((a, b) => {
      if (by === "name") return a.name.localeCompare(b.name);
      if (by === "path") return normalizePath(a.path).localeCompare(normalizePath(b.path));
      if (by === "size") return (b.meta?.size || 0) - (a.meta?.size || 0);
      return 0;
    });
    return { tabs: sorted };
  }),
  addRecentFile: (path) => useSettingStore.getState().addRecentFile(path),
  getActiveTab: () => {
    const state = get();
    return state.tabs.find((t) => t.id === state.activeTabId) || null;
  },
  getTabByPath: (path) => {
    const state = get();
    return state.tabs.find((t) => normalizePath(t.path) === normalizePath(path)) || null;
  },
  getDirtyTabs: () => get().tabs.filter((t) => t.is_dirty),
}));
