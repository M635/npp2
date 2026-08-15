import { useState, useEffect, useRef, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ask, message } from "@tauri-apps/plugin-dialog";
import { useFileStore, generateId } from "./stores/fileStore";
import { useSettingStore } from "./stores/settingStore";
import { useSearchStore } from "./stores/searchStore";
import { useEditorStore } from "./stores/editorStore";
import { useI18n } from "./stores/i18nStore";
import { getEditor } from "./stores/editorRefStore";
import { EditorView } from "./components/editor/EditorView";
import { MainLayout } from "./components/layout/MainLayout";
import { SideBar } from "./components/layout/SideBar";
import { ToastHost } from "./components/layout/ToastHost";
import { SettingsDialog } from "./components/dialog/SettingsDialog";
import { GotoLineDialog } from "./components/dialog/GotoLineDialog";
import { CommandPalette } from "./components/dialog/CommandPalette";
import { useTheme } from "./hooks/useTheme";
import { toast } from "./utils/toast";
import { loadSettings, saveSettings } from "./services/tauri/fileService";
import type { EncodingType } from "./types/file";

function runEditorAction(actionId: string): void {
  const tab = useFileStore.getState().getActiveTab();
  const editor = getEditor(tab?.id);
  if (!editor) return;
  editor.focus();
  const action = editor.getAction(actionId);
  if (action) {
    void action.run();
  } else {
    toast(`未找到编辑器动作: ${actionId}`, "error");
  }
}

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showGotoLine, setShowGotoLine] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [selectionInfo, setSelectionInfo] = useState<{ chars: number; lines: number } | null>(null);
  const [settingsBooted, setSettingsBooted] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const themeMode = useSettingStore((s) => s.themeMode);
  const { isDark } = useTheme(themeMode);

  /* ---------- theme ---------- */
  useEffect(() => {
    useEditorStore.setState({ isDark });
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }, [isDark]);

  /* ---------- settings persistence ---------- */
  useEffect(() => {
    loadSettings().then((saved) => {
      if (saved && typeof saved === "object") {
        const prev = useSettingStore.getState();
        const next: Record<string, unknown> = { ...prev };
        for (const [k, v] of Object.entries(saved)) {
          if (k in prev && typeof v === typeof prev[k as keyof typeof prev]) next[k] = v;
        }
        useSettingStore.setState(next as unknown as typeof prev);
        if (typeof saved.language === "string") {
          useI18n.getState().setLanguage(saved.language === "en" ? "en" : "zh");
        }
      }
      setSettingsBooted(true);
    }).catch(() => setSettingsBooted(true));
  }, []);

  const settingsFingerprint = useSettingStore((s) => JSON.stringify({
    fontSize: s.fontSize, tabSize: s.tabSize, insertSpaces: s.insertSpaces, wordWrap: s.wordWrap,
    showLineNumbers: s.showLineNumbers, showWhitespace: s.showWhitespace, showMinimap: s.showMinimap,
    autoIndent: s.autoIndent, bracketPairColorization: s.bracketPairColorization, folding: s.folding,
    showIndentGuides: s.showIndentGuides, autoSaveInterval: s.autoSaveInterval,
  }));

  useEffect(() => {
    if (!settingsBooted) return;
    const timer = setTimeout(() => {
      const state = useSettingStore.getState();
      const persisted: Record<string, unknown> = {
        fontSize: state.fontSize, fontFamily: state.fontFamily, tabSize: state.tabSize,
        insertSpaces: state.insertSpaces, wordWrap: state.wordWrap, showLineNumbers: state.showLineNumbers,
        showWhitespace: state.showWhitespace, showMinimap: state.showMinimap, themeMode: state.themeMode,
        autoIndent: state.autoIndent, bracketPairColorization: state.bracketPairColorization,
        folding: state.folding, showIndentGuides: state.showIndentGuides,
        recentFiles: state.recentFiles, autoSaveInterval: state.autoSaveInterval,
        wrapLongLines: state.wrapLongLines, showPrintMargin: state.showPrintMargin,
        printMarginColumn: state.printMarginColumn, language: useI18n.getState().language,
      };
      saveSettings(persisted).catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [settingsBooted, themeMode, settingsFingerprint]);

  /* ---------- auto save ---------- */
  const autoSaveInterval = useSettingStore((s) => s.autoSaveInterval);
  useEffect(() => {
    if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    const interval = autoSaveInterval * 1000;
    if (interval > 0) {
      autoSaveRef.current = setInterval(async () => {
        const dirtyTabs = useFileStore.getState().getDirtyTabs();
        for (const tab of dirtyTabs) {
          if (!tab.path || tab.readonly) continue;
          try {
            const { saveFile } = await import("./services/tauri/fileService");
            await saveFile(tab.path, tab.content, tab.encoding);
            useFileStore.getState().markClean(tab.id);
          } catch { /* keep dirty on failure */ }
        }
      }, interval);
    }
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [autoSaveInterval]);

  /* ---------- file actions ---------- */
  const handleNew = useCallback(() => {
    const tab = {
      id: generateId(), path: "", name: "untitled", content: "", meta: null,
      is_dirty: false, is_large_file: false, readonly: false, encoding: "UTF-8" as EncodingType,
      language: "plaintext", cursor_position: { line: 1, column: 1 }, scroll_position: 0, is_new: true,
    };
    useFileStore.getState().openTab(tab);
  }, []);

  const handleOpen = useCallback(async () => {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({ multiple: true });
    if (!selected) return;
    const paths = (Array.isArray(selected) ? selected.map(String) : [String(selected)]);
    for (const path of paths) await useFileStore.getState().openPath(path);
  }, []);

  const handleOpenFolder = useCallback(() => {
    window.dispatchEvent(new CustomEvent("npp2:open-folder"));
  }, []);

  const handleSaveAs = useCallback(async (tabId?: string) => {
    const state = useFileStore.getState();
    const tab = tabId ? state.tabs.find((t) => t.id === tabId) : state.getActiveTab();
    if (!tab) return;
    const { save } = await import("@tauri-apps/plugin-dialog");
    const selected = await save({ defaultPath: tab.path || tab.name });
    if (!selected) return;
    const newPath = String(selected);
    try {
      const { saveFile } = await import("./services/tauri/fileService");
      await saveFile(newPath, tab.content, tab.encoding);
      state.updateTab(tab.id, { path: newPath, name: newPath.split(/[\\/]/).pop() || newPath, is_dirty: false, is_new: false });
      state.addRecentFile(newPath);
      toast("已另存为", "success");
    } catch (e) { toast(`保存失败: ${(e as Error).message}`, "error"); }
  }, []);

  const handleSave = useCallback(async () => {
    const tab = useFileStore.getState().getActiveTab();
    if (!tab) return;
    if (!tab.path || tab.is_new) { await handleSaveAs(); return; }
    if (tab.readonly) { toast("文件为只读，无法保存", "error"); return; }
    try {
      const { saveFile } = await import("./services/tauri/fileService");
      await saveFile(tab.path, tab.content, tab.encoding);
      useFileStore.getState().markClean(tab.id);
      toast("已保存", "success");
    } catch (e) { toast(`保存失败: ${(e as Error).message}`, "error"); }
  }, [handleSaveAs]);

  const handleSaveAll = useCallback(async () => {
    const dirtyTabs = useFileStore.getState().getDirtyTabs();
    let saved = 0;
    for (const tab of dirtyTabs) {
      if (!tab.path || tab.is_new) { await handleSaveAs(tab.id); continue; }
      if (tab.readonly) continue;
      try {
        const { saveFile } = await import("./services/tauri/fileService");
        await saveFile(tab.path, tab.content, tab.encoding);
        useFileStore.getState().markClean(tab.id);
        saved++;
      } catch { /* keep dirty */ }
    }
    if (saved > 0) toast(`已保存 ${saved} 个文件`, "success");
  }, [handleSaveAs]);

  const handleReload = useCallback(async () => {
    const tab = useFileStore.getState().getActiveTab();
    if (!tab || !tab.path || tab.is_new) return;
    if (tab.is_dirty) {
      const yes = await ask("当前文件有未保存的更改，确定从磁盘重新加载并丢弃更改吗？", { title: "从磁盘重载", kind: "warning" });
      if (!yes) return;
    }
    await useFileStore.getState().openPath(tab.path);
  }, []);

  const closeTabSafe = useCallback(async (id: string) => {
    const tab = useFileStore.getState().tabs.find((t) => t.id === id);
    if (!tab) return;
    if (tab.is_dirty) {
      const yes = await ask("该文件有未保存的更改，关闭将丢失更改。确定关闭吗？", { title: "关闭标签页", kind: "warning" });
      if (!yes) return;
    }
    useFileStore.getState().closeTab(id);
  }, []);

  const closeAllTabsSafe = useCallback(async () => {
    const dirty = useFileStore.getState().getDirtyTabs();
    if (dirty.length > 0) {
      const yes = await ask(`有 ${dirty.length} 个文件未保存，关闭全部将丢失更改。确定吗？`, { title: "关闭所有标签页", kind: "warning" });
      if (!yes) return;
    }
    useFileStore.getState().closeAllTabs();
  }, []);

  /* ---------- find/replace helpers (Monaco based) ---------- */
  const findInActive = useCallback((query: string, isRegex: boolean, caseSensitive: boolean, wholeWord: boolean, forward = true) => {
    const tab = useFileStore.getState().getActiveTab();
    const editor = getEditor(tab?.id);
    if (!editor || !query) return 0;
    const model = editor.getModel();
    if (!model) return 0;
    const searchText = wholeWord && !isRegex ? `\\b${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b` : query;
    const searchRegex = isRegex || wholeWord;
    const matches = model.findMatches(searchText, false, searchRegex, caseSensitive, null, true);
    window.dispatchEvent(new CustomEvent("npp2:find-result", { detail: { count: matches.length } }));
    if (matches.length === 0) { toast("未找到匹配", "info"); return 0; }
    const current = editor.getSelection();
    let idx = 0;
    if (current) {
      const anchor = current.getStartPosition();
      for (let i = 0; i < matches.length; i++) {
        const r = matches[i].range;
        const cmp = (r.getStartPosition().lineNumber - anchor.lineNumber) || (r.getStartPosition().column - anchor.column);
        if (forward ? cmp >= 0 : cmp <= 0) { idx = i; break; }
      }
    }
    const target = matches[idx].range;
    editor.revealRangeInCenter(target);
    editor.setSelection(target);
    return matches.length;
  }, []);

  const replaceInActive = useCallback((query: string, replace: string, isRegex: boolean, caseSensitive: boolean, wholeWord: boolean, all: boolean) => {
    const tab = useFileStore.getState().getActiveTab();
    const editor = getEditor(tab?.id);
    if (!editor || !query) return;
    const model = editor.getModel();
    if (!model) return;
    const searchText = wholeWord && !isRegex ? `\\b${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b` : query;
    const searchRegex = isRegex || wholeWord;
    const matches = model.findMatches(searchText, false, searchRegex, caseSensitive, null, true);
    if (matches.length === 0) { toast("未找到匹配", "info"); return; }
    if (!all) {
      const current = editor.getSelection();
      const hit = matches.find((m) => current && m.range.equalsRange(current));
      if (!hit) { findInActive(query, isRegex, caseSensitive, wholeWord); return; }
      editor.executeEdits("npp2-replace", [{ range: hit.range, text: replace }]);
      findInActive(query, isRegex, caseSensitive, wholeWord);
      return;
    }
    editor.executeEdits("npp2-replace-all", matches.map((m) => ({ range: m.range, text: replace })));
    toast(`已替换 ${matches.length} 处`, "success");
  }, [findInActive]);

  /* ---------- global events: markpt:* (command palette / panels) ---------- */
  useEffect(() => {
    const handlers: Record<string, () => void> = {
      "markpt:new-file": handleNew,
      "markpt:open-file": () => void handleOpen(),
      "markpt:open-folder": handleOpenFolder,
      "markpt:save": () => void handleSave(),
      "markpt:save-as": () => void handleSaveAs(),
      "markpt:save-all": () => void handleSaveAll(),
      "markpt:reload": () => void handleReload(),
      "markpt:goto-line": () => setShowGotoLine(true),
      "markpt:open-settings": () => setShowSettings(true),
      "markpt:toggle-sidebar": () => window.dispatchEvent(new CustomEvent("npp2:toggle-sidebar")),
      "markpt:toggle-word-wrap": () => { const s = useSettingStore.getState(); useSettingStore.setState({ wordWrap: !s.wordWrap }); },
      "markpt:toggle-minimap": () => { const s = useSettingStore.getState(); useSettingStore.setState({ showMinimap: !s.showMinimap }); },
      "markpt:zoom-in": () => useSettingStore.setState((s) => ({ fontSize: Math.min(72, s.fontSize + 1) })),
      "markpt:zoom-out": () => useSettingStore.setState((s) => ({ fontSize: Math.max(8, s.fontSize - 1) })),
      "markpt:zoom-reset": () => useSettingStore.setState({ fontSize: 14 }),
      "markpt:toggle-theme": () => { const s = useSettingStore.getState(); useSettingStore.setState({ themeMode: s.themeMode === "dark" ? "light" : "dark" }); },
      "markpt:full-screen": () => { void getCurrentWindow().setFullscreen(!document.fullscreenElement).catch(() => {}); },
      "markpt:about": () => { void message("NPP2 v1.0.0 — Notepad++ 跨平台复刻\n基于 Tauri 2 · React · Monaco Editor", { title: "关于 NPP2" }); },
    };
    const onEvent = (e: Event) => {
      const name = e.type;
      handlers[name]?.();
    };
    for (const name of Object.keys(handlers)) window.addEventListener(name, onEvent);
    return () => { for (const name of Object.keys(handlers)) window.removeEventListener(name, onEvent); };
  }, [handleNew, handleOpen, handleOpenFolder, handleSave, handleSaveAs, handleSaveAll, handleReload]);

  /* ---------- menu events from native menu ---------- */
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    (async () => {
      unlisten = await listen<string>("menu-event", (e) => {
        const id = e.payload;
        const findStore = useSearchStore.getState();
        switch (id) {
          case "new": handleNew(); break;
          case "open": void handleOpen(); break;
          case "open_folder": handleOpenFolder(); break;
          case "reload_from_disk": void handleReload(); break;
          case "save": void handleSave(); break;
          case "save_as": void handleSaveAs(); break;
          case "save_all": void handleSaveAll(); break;
          case "close": { const t = useFileStore.getState().getActiveTab(); if (t) void closeTabSafe(t.id); break; }
          case "close_all": void closeAllTabsSafe(); break;
          case "copy_path": {
            const t = useFileStore.getState().getActiveTab();
            if (t?.path) { void import("@tauri-apps/plugin-clipboard-manager").then((m) => m.writeText(t.path)); toast("已复制路径", "success"); }
            break;
          }
          case "file_props": {
            const t = useFileStore.getState().getActiveTab();
            if (t) void message(`路径: ${t.path || "(未保存)"}\n大小: ${t.meta?.size ?? 0} 字节\n编码: ${t.encoding}\n行数: ${t.meta?.line_count ?? 0}\n只读: ${t.readonly ? "是" : "否"}`, { title: "文件属性" });
            break;
          }
          case "quit": void getCurrentWindow().close(); break;
          case "edit_undo": runEditorAction("undo"); break;
          case "edit_redo": runEditorAction("redo"); break;
          case "edit_cut": runEditorAction("editor.action.clipboardCutAction"); break;
          case "edit_copy": runEditorAction("editor.action.clipboardCopyAction"); break;
          case "edit_paste": runEditorAction("editor.action.clipboardPasteAction"); break;
          case "edit_delete_line": runEditorAction("editor.action.deleteLines"); break;
          case "edit_duplicate_line": runEditorAction("editor.action.duplicateSelection"); break;
          case "edit_move_up": runEditorAction("editor.action.moveLinesUpAction"); break;
          case "edit_move_down": runEditorAction("editor.action.moveLinesDownAction"); break;
          case "edit_toggle_comment": runEditorAction("editor.action.toggleLineComment"); break;
          case "edit_upper": runEditorAction("editor.action.transformToUppercase"); break;
          case "edit_lower": runEditorAction("editor.action.transformToLowercase"); break;
          case "edit_title_case": runEditorAction("editor.action.transformToTitlecase"); break;
          case "edit_sort_asc": window.dispatchEvent(new CustomEvent("npp2:sort-lines", { detail: "asc" })); break;
          case "edit_sort_desc": window.dispatchEvent(new CustomEvent("npp2:sort-lines", { detail: "desc" })); break;
          case "edit_sort_length_asc": window.dispatchEvent(new CustomEvent("npp2:sort-lines", { detail: "length" })); break;
          case "edit_delete_blank": window.dispatchEvent(new CustomEvent("npp2:line-op", { detail: "delete-blank" })); break;
          case "edit_remove_dup": window.dispatchEvent(new CustomEvent("npp2:line-op", { detail: "remove-dup" })); break;
          case "edit_trim_trailing": window.dispatchEvent(new CustomEvent("npp2:line-op", { detail: "trim" })); break;
          case "format_json": window.dispatchEvent(new CustomEvent("npp2:format-json")); break;
          case "find": findStore.toggleSearchPanel(); break;
          case "replace": findStore.toggleReplacePanel(); break;
          case "find_in_files": findStore.toggleFindInFiles(); break;
          case "goto": setShowGotoLine(true); break;
          case "toggle_sidebar": window.dispatchEvent(new CustomEvent("npp2:toggle-sidebar")); break;
          case "command_palette": setShowCommandPalette(true); break;
          case "toggle_word_wrap": { const s = useSettingStore.getState(); useSettingStore.setState({ wordWrap: !s.wordWrap }); break; }
          case "zoom_in": useSettingStore.setState((s) => ({ fontSize: Math.min(72, s.fontSize + 1) })); break;
          case "zoom_out": useSettingStore.setState((s) => ({ fontSize: Math.max(8, s.fontSize - 1) })); break;
          case "zoom_reset": useSettingStore.setState({ fontSize: 14 }); break;
          case "toggle_theme": { const s = useSettingStore.getState(); useSettingStore.setState({ themeMode: s.themeMode === "dark" ? "light" : "dark" }); break; }
          case "full_screen": void getCurrentWindow().setFullscreen(!document.fullscreenElement).catch(() => {}); break;
          case "encoding_utf8": setActiveEncoding("UTF-8"); break;
          case "encoding_utf8_bom": setActiveEncoding("UTF-8-BOM"); break;
          case "encoding_gbk": setActiveEncoding("GBK"); break;
          case "encoding_utf16le": setActiveEncoding("UTF-16LE"); break;
          case "encoding_utf16be": setActiveEncoding("UTF-16BE"); break;
          case "settings": setShowSettings(true); break;
          case "shortcuts": void message("Ctrl+N 新建 · Ctrl+O 打开 · Ctrl+S 保存 · Ctrl+Shift+S 全部保存\nCtrl+F 查找 · Ctrl+H 替换 · Ctrl+Shift+F 在文件中查找 · Ctrl+G 跳转行\nCtrl+P 命令面板 · Ctrl+W 关闭标签页 · Ctrl+滚轮 缩放", { title: "快捷键" }); break;
          case "about": void message("NPP2 v1.0.0 — Notepad++ 跨平台复刻\n基于 Tauri 2 · React · Monaco Editor", { title: "关于 NPP2" }); break;
          default: break;
        }
      });
    })();
    return () => { if (unlisten) unlisten(); };
  }, [handleNew, handleOpen, handleOpenFolder, handleSave, handleSaveAs, handleSaveAll, handleReload, closeTabSafe, closeAllTabsSafe]);

  /* ---------- OS drag & drop ---------- */
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    (async () => {
      try {
        unlisten = await getCurrentWebview().onDragDropEvent((e) => {
          if (e.payload.type === "drop") {
            for (const p of e.payload.paths) void useFileStore.getState().openPath(p);
          }
        });
      } catch { /* drag-drop unavailable */ }
    })();
    return () => { if (unlisten) unlisten(); };
  }, []);

  /* ---------- keyboard shortcuts ---------- */
  useEffect(() => {
    const handlers: Record<string, () => void> = {
      "ctrl+n": handleNew,
      "ctrl+o": () => void handleOpen(),
      "ctrl+s": () => void handleSave(),
      "ctrl+shift+s": () => void handleSaveAll(),
      "ctrl+w": () => { const id = useFileStore.getState().activeTabId; if (id) void closeTabSafe(id); },
      "ctrl+f": () => useSearchStore.getState().toggleSearchPanel(),
      "ctrl+h": () => useSearchStore.getState().toggleReplacePanel(),
      "ctrl+g": () => setShowGotoLine(true),
      "ctrl+shift+f": () => useSearchStore.getState().toggleFindInFiles(),
      "ctrl+p": () => setShowCommandPalette(true),
      "ctrl+shift+t": () => {
        const recent = useSettingStore.getState().recentFiles;
        if (recent.length > 0) void useFileStore.getState().openPath(recent[0]);
      },
      "escape": () => useSearchStore.getState().closeAllPanels(),
    };
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const key = `${mod ? "ctrl+" : ""}${e.shiftKey ? "shift+" : ""}${e.key.toLowerCase()}`;
      const fn = handlers[key];
      if (fn) { e.preventDefault(); fn(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNew, handleOpen, handleSave, handleSaveAll, closeTabSafe]);

  /* ---------- find/replace events from SearchPanel ---------- */
  useEffect(() => {
    const onFind = (e: Event) => {
      const detail = (e as CustomEvent).detail as { query: string; isRegex: boolean; caseSensitive: boolean; wholeWord: boolean; forward: boolean };
      findInActive(detail.query, detail.isRegex, detail.caseSensitive, detail.wholeWord, detail.forward);
    };
    const onReplace = (e: Event) => {
      const detail = (e as CustomEvent).detail as { query: string; replace: string; isRegex: boolean; caseSensitive: boolean; wholeWord: boolean; all: boolean };
      replaceInActive(detail.query, detail.replace, detail.isRegex, detail.caseSensitive, detail.wholeWord, detail.all);
    };
    window.addEventListener("npp2:find", onFind);
    window.addEventListener("npp2:replace", onReplace);
    return () => {
      window.removeEventListener("npp2:find", onFind);
      window.removeEventListener("npp2:replace", onReplace);
    };
  }, [findInActive, replaceInActive]);

  const setActiveEncoding = useCallback((enc: EncodingType) => {
    const tab = useFileStore.getState().getActiveTab();
    if (!tab) return;
    useFileStore.getState().updateTab(tab.id, { encoding: enc });
    toast(`编码已切换为 ${enc}(保存时生效)`, "success");
  }, []);

  return (
    <div className="app">
      <div className="app-shell">
        <SideBar />
        <MainLayout
          onNewTab={handleNew}
          onCloseTab={(id: string) => void closeTabSafe(id)}
          onOpenSettings={() => setShowSettings(true)}
          selectionInfo={selectionInfo}
        >
          <EditorView onSelectionChange={setSelectionInfo} />
        </MainLayout>
      </div>
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
      {showGotoLine && <GotoLineDialog onClose={() => setShowGotoLine(false)} />}
      {showCommandPalette && <CommandPalette onClose={() => setShowCommandPalette(false)} />}
      <ToastHost />
    </div>
  );
}
