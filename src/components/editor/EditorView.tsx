import { useEffect, useCallback } from "react";
import { MonacoEditor } from "./MonacoEditor";
import { useFileStore } from "../../stores/fileStore";
import { getEditor } from "../../stores/editorRefStore";
import { useFileWatcher } from "../../hooks/useFileWatcher";
import { toast } from "../../utils/toast";

interface Props {
  onSelectionChange: (info: { chars: number; lines: number }) => void;
}

export function EditorView({ onSelectionChange }: Props) {
  const { tabs, activeTabId, updateContent, updateTab } = useFileStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const handleContentChange = (v: string) => {
    if (!activeTabId) return;
    updateContent(activeTabId, v);
  };

  const handleCursorChange = (line: number, col: number) => {
    if (!activeTabId) return;
    updateTab(activeTabId, { cursor_position: { line, column: col } });
  };

  /* goto-line event (GotoLineDialog / find-in-files results) */
  useEffect(() => {
    const handler = (e: Event) => {
      const line = (e as CustomEvent<number>).detail;
      if (typeof line === "number" && activeTabId) {
        const editor = getEditor(activeTabId);
        if (!editor) return;
        const model = editor.getModel();
        const total = model?.getLineCount() ?? line;
        const target = Math.max(1, Math.min(line, total));
        editor.revealLineInCenter(target);
        editor.setPosition({ lineNumber: target, column: 1 });
        editor.focus();
      }
    };
    window.addEventListener("npp2:go-to-line", handler);
    return () => window.removeEventListener("npp2:go-to-line", handler);
  }, [activeTabId]);

  /* sort lines / line ops / format-json events (native menu) */
  useEffect(() => {
    const onSort = (e: Event) => {
      const mode = (e as CustomEvent<string>).detail;
      const editor = activeTabId ? getEditor(activeTabId) : undefined;
      if (!editor) return;
      const model = editor.getModel();
      if (!model) return;
      const sel = editor.getSelection();
      const start = sel?.startLineNumber ?? 1;
      const end = sel?.endLineNumber ?? model.getLineCount();
      const lines: string[] = [];
      for (let i = start; i <= end; i++) lines.push(model.getLineContent(i));
      const sorted = [...lines];
      if (mode === "asc") sorted.sort((a, b) => a.localeCompare(b));
      else if (mode === "desc") sorted.sort((a, b) => b.localeCompare(a));
      else if (mode === "length") sorted.sort((a, b) => a.length - b.length);
      if (sorted.join("\n") === lines.join("\n")) return;
      editor.executeEdits("npp2-sort", [{ range: { startLineNumber: start, startColumn: 1, endLineNumber: end, endColumn: model.getLineMaxColumn(end) }, text: sorted.join("\n") }]);
    };
    const onLineOp = (e: Event) => {
      const op = (e as CustomEvent<string>).detail;
      const editor = activeTabId ? getEditor(activeTabId) : undefined;
      if (!editor) return;
      const model = editor.getModel();
      if (!model) return;
      const count = model.getLineCount();
      if (op === "trim") {
        const edits: { range: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number }; text: string | null }[] = [];
        for (let i = 1; i <= count; i++) {
          const line = model.getLineContent(i);
          const trimmed = line.replace(/[ \t]+$/, "");
          if (trimmed !== line) edits.push({ range: { startLineNumber: i, startColumn: 1, endLineNumber: i, endColumn: model.getLineMaxColumn(i) }, text: trimmed });
        }
        if (edits.length) { editor.executeEdits("npp2-trim", edits); toast(`已清理 ${edits.length} 行行尾空格`, "success"); }
        return;
      }
      if (op === "delete-blank") {
        const edits: { range: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number }; text: string | null }[] = [];
        for (let i = count; i >= 1; i--) {
          if (model.getLineContent(i).trim() === "") {
            const isLast = i === count;
            edits.push({ range: { startLineNumber: i, startColumn: 1, endLineNumber: i, endColumn: model.getLineMaxColumn(i) }, text: isLast ? "" : null });
          }
        }
        if (edits.length) { editor.executeEdits("npp2-del-blank", edits); toast(`已删除 ${edits.length} 个空行`, "success"); }
        return;
      }
      if (op === "remove-dup") {
        const seen = new Set<string>();
        const edits: { range: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number }; text: string | null }[] = [];
        for (let i = count; i >= 1; i--) {
          const line = model.getLineContent(i);
          if (seen.has(line)) {
            const isLast = i === count;
            edits.push({ range: { startLineNumber: i, startColumn: 1, endLineNumber: i, endColumn: model.getLineMaxColumn(i) }, text: isLast ? "" : null });
          } else {
            seen.add(line);
          }
        }
        if (edits.length) { editor.executeEdits("npp2-del-dup", edits); toast(`已删除 ${edits.length} 个重复行`, "success"); }
      }
    };
    const onFormatJson = () => {
      const editor = activeTabId ? getEditor(activeTabId) : undefined;
      if (!editor) return;
      editor.focus();
      const action = editor.getAction("editor.action.formatDocument");
      if (action) void action.run();
      else toast("格式化不可用", "info");
    };
    window.addEventListener("npp2:sort-lines", onSort);
    window.addEventListener("npp2:line-op", onLineOp);
    window.addEventListener("npp2:format-json", onFormatJson);
    return () => {
      window.removeEventListener("npp2:sort-lines", onSort);
      window.removeEventListener("npp2:line-op", onLineOp);
      window.removeEventListener("npp2:format-json", onFormatJson);
    };
  }, [activeTabId]);

  /* file watcher: reload when the file changed on disk and we are clean */
  const onFileChanged = useCallback((p: string) => {
    const tab = useFileStore.getState().getTabByPath(p);
    if (!tab || tab.is_dirty || tab.is_new) return;
    void useFileStore.getState().openPath(p);
    toast("文件已在外部修改，已重新加载", "info");
  }, []);
  useFileWatcher(activeTab?.path ?? null, onFileChanged);

  if (!activeTab) {
    return <div className="editor-empty">
      <div className="editor-empty-content">
        <div className="editor-logo">NPP2</div>
        <div className="editor-hint">拖拽文件打开 · Ctrl+P 命令面板</div>
        <div className="editor-shortcuts">
          <div><kbd>Ctrl+N</kbd><span>新建</span></div>
          <div><kbd>Ctrl+O</kbd><span>打开</span></div>
          <div><kbd>Ctrl+S</kbd><span>保存</span></div>
          <div><kbd>Ctrl+F</kbd><span>查找</span></div>
          <div><kbd>Ctrl+H</kbd><span>替换</span></div>
        </div>
      </div>
    </div>;
  }

  return (
    <div className="editor-wrapper">
      {activeTab.is_large_file && (
        <div className="large-file-banner">超大文件预览模式:仅加载前 8MB(只读)。完整编辑大文件属于路线图功能。</div>
      )}
      <MonacoEditor
        key={activeTab.id}
        tabId={activeTab.id}
        modelPath={activeTab.path ? `file://${activeTab.path}` : `untitled://${activeTab.id}`}
        path={activeTab.path} content={activeTab.content}
        readonly={activeTab.readonly || activeTab.is_large_file}
        onContentChange={handleContentChange} onCursorChange={handleCursorChange}
        onSelectionChange={(chars, lines) => onSelectionChange({ chars, lines })}
      />
    </div>
  );
}
