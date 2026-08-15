import { create } from "zustand";
import type { SearchSummary, SearchResult } from "../types/file";

interface SearchStore {
  isSearchPanelOpen: boolean;
  isReplacePanelOpen: boolean;
  isFindInFilesOpen: boolean;
  searchQuery: string;
  replaceQuery: string;
  isRegex: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
  searchResults: SearchResult[];
  totalMatches: number;
  filesMatched: number;
  currentMatchIndex: number;
  searchHistory: string[];
  surroundMode: boolean;
  surroundChars: [string, string];

  toggleSearchPanel: () => void;
  toggleReplacePanel: () => void;
  toggleFindInFiles: () => void;
  closeAllPanels: () => void;
  setSearchQuery: (q: string) => void;
  setReplaceQuery: (q: string) => void;
  toggleRegex: () => void;
  toggleCaseSensitive: () => void;
  toggleWholeWord: () => void;
  setResults: (s: SearchSummary) => void;
  clearResults: () => void;
  nextMatch: () => void;
  prevMatch: () => void;
  addSearchHistory: (q: string) => void;
  setSurroundMode: (v: boolean) => void;
  setSurroundChars: (c: [string, string]) => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  isSearchPanelOpen: false, isReplacePanelOpen: false, isFindInFilesOpen: false,
  searchQuery: "", replaceQuery: "", isRegex: false, caseSensitive: false, wholeWord: false,
  searchResults: [], totalMatches: 0, filesMatched: 0, currentMatchIndex: 0,
  searchHistory: [], surroundMode: false, surroundChars: ["(", ")"],

  toggleSearchPanel: () => set((s) => ({ isSearchPanelOpen: !s.isSearchPanelOpen })),
  toggleReplacePanel: () => set((s) => ({ isReplacePanelOpen: !s.isReplacePanelOpen, isSearchPanelOpen: true })),
  toggleFindInFiles: () => set((s) => ({ isFindInFilesOpen: !s.isFindInFilesOpen })),
  closeAllPanels: () => set({ isSearchPanelOpen: false, isReplacePanelOpen: false, isFindInFilesOpen: false }),
  setSearchQuery: (q) => set({ searchQuery: q, currentMatchIndex: 0 }),
  setReplaceQuery: (q) => set({ replaceQuery: q }),
  toggleRegex: () => set((s) => ({ isRegex: !s.isRegex })),
  toggleCaseSensitive: () => set((s) => ({ caseSensitive: !s.caseSensitive })),
  toggleWholeWord: () => set((s) => ({ wholeWord: !s.wholeWord })),
  setResults: (s) => set({ searchResults: s.results, totalMatches: s.total_matches, filesMatched: s.files_matched, currentMatchIndex: 0 }),
  clearResults: () => set({ searchResults: [], totalMatches: 0, filesMatched: 0 }),
  nextMatch: () => set((s) => ({ currentMatchIndex: s.searchResults.length > 0 ? (s.currentMatchIndex + 1) % s.searchResults.length : 0 })),
  prevMatch: () => set((s) => ({ currentMatchIndex: s.searchResults.length > 0 ? (s.currentMatchIndex - 1 + s.searchResults.length) % s.searchResults.length : 0 })),
  addSearchHistory: (q) => set((s) => ({ searchHistory: [q, ...s.searchHistory.filter((x) => x !== q)].slice(0, 30) })),
  setSurroundMode: (v) => set({ surroundMode: v }),
  setSurroundChars: (c) => set({ surroundChars: c }),
}));
