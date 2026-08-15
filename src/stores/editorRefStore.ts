import type * as Monaco from "monaco-editor";

/**
 * Registry of live Monaco editor instances keyed by tab id, so panels and
 * dialogs (find/replace, goto-line, menus) can drive the active editor
 * without prop drilling through React.
 */
const editors = new Map<string, Monaco.editor.IStandaloneCodeEditor>();

export function registerEditor(tabId: string, editor: Monaco.editor.IStandaloneCodeEditor): void {
  editors.set(tabId, editor);
}

export function unregisterEditor(tabId: string): void {
  editors.delete(tabId);
}

export function getEditor(tabId: string | undefined | null): Monaco.editor.IStandaloneCodeEditor | undefined {
  if (!tabId) return undefined;
  return editors.get(tabId);
}

export function getActiveEditor(): Monaco.editor.IStandaloneCodeEditor | undefined {
  // Callers pass the tab id explicitly; fall back to the only registered editor.
  if (editors.size === 1) return [...editors.values()][0];
  return undefined;
}
