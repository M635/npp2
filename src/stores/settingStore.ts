import { create } from "zustand";
import type { ThemeMode } from "../types/theme";

interface SettingStore {
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: boolean;
  showLineNumbers: boolean;
  showWhitespace: boolean;
  showMinimap: boolean;
  themeMode: ThemeMode;
  autoIndent: boolean;
  bracketPairColorization: boolean;
  folding: boolean;
  showIndentGuides: boolean;
  recentFiles: string[];
  autoSaveInterval: number;
  wrapLongLines: boolean;
  showPrintMargin: boolean;
  printMarginColumn: number;

  setFontSize: (v: number) => void;
  setFontFamily: (v: string) => void;
  setTabSize: (v: number) => void;
  setInsertSpaces: (v: boolean) => void;
  setWordWrap: (v: boolean) => void;
  setShowLineNumbers: (v: boolean) => void;
  setShowWhitespace: (v: boolean) => void;
  setShowMinimap: (v: boolean) => void;
  setThemeMode: (v: ThemeMode) => void;
  setAutoIndent: (v: boolean) => void;
  setBracketPairColorization: (v: boolean) => void;
  setFolding: (v: boolean) => void;
  setShowIndentGuides: (v: boolean) => void;
  addRecentFile: (path: string) => void;
  setAutoSaveInterval: (v: number) => void;
  setWrapLongLines: (v: boolean) => void;
  setShowPrintMargin: (v: boolean) => void;
  setPrintMarginColumn: (v: number) => void;
  resetToDefaults: () => void;
}

const defaults = {
  fontSize: 14, fontFamily: "'JetBrains Mono', 'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace",
  tabSize: 4, insertSpaces: true, wordWrap: false, showLineNumbers: true,
  showWhitespace: false, showMinimap: false, themeMode: "auto" as ThemeMode,
  autoIndent: true, bracketPairColorization: true, folding: true, showIndentGuides: true,
  recentFiles: [] as string[], autoSaveInterval: 30, wrapLongLines: false,
  showPrintMargin: true, printMarginColumn: 80,
};

export const useSettingStore = create<SettingStore>((set) => ({
  ...defaults,
  setFontSize: (v) => set({ fontSize: v }),
  setFontFamily: (v) => set({ fontFamily: v }),
  setTabSize: (v) => set({ tabSize: v }),
  setInsertSpaces: (v) => set({ insertSpaces: v }),
  setWordWrap: (v) => set({ wordWrap: v }),
  setShowLineNumbers: (v) => set({ showLineNumbers: v }),
  setShowWhitespace: (v) => set({ showWhitespace: v }),
  setShowMinimap: (v) => set({ showMinimap: v }),
  setThemeMode: (v) => set({ themeMode: v }),
  setAutoIndent: (v) => set({ autoIndent: v }),
  setBracketPairColorization: (v) => set({ bracketPairColorization: v }),
  setFolding: (v) => set({ folding: v }),
  setShowIndentGuides: (v) => set({ showIndentGuides: v }),
  addRecentFile: (path) => set((s) => ({ recentFiles: [path, ...s.recentFiles.filter((p) => p !== path)].slice(0, 20) })),
  setAutoSaveInterval: (v) => set({ autoSaveInterval: v }),
  setWrapLongLines: (v) => set({ wrapLongLines: v }),
  setShowPrintMargin: (v) => set({ showPrintMargin: v }),
  setPrintMarginColumn: (v) => set({ printMarginColumn: v }),
  resetToDefaults: () => set({ ...defaults }),
}));
