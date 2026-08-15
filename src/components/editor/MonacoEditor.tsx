import { useEffect, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import * as Monaco from "monaco-editor";
import { useEditorStore } from "../../stores/editorStore";
import { useSettingStore } from "../../stores/settingStore";
import { getLanguageFromPath } from "../../services/monaco/languages";
import { registerEditor, unregisterEditor } from "../../stores/editorRefStore";

interface Props {
  tabId: string;
  modelPath: string;
  path: string; content: string; readonly?: boolean;
  onContentChange?: (v: string) => void;
  onCursorChange?: (line: number, col: number) => void;
  onSelectionChange?: (chars: number, lines: number) => void;
}

export function MonacoEditor({ tabId, modelPath, path, content, readonly = false, onContentChange, onCursorChange, onSelectionChange }: Props) {
  const { isDark } = useEditorStore();
  const { fontSize, fontFamily, tabSize, insertSpaces, wordWrap, showLineNumbers, showWhitespace, showMinimap, folding, bracketPairColorization, autoIndent, showIndentGuides } = useSettingStore();
  const resolvedLang = getLanguageFromPath(path);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    registerEditor(tabId, editor);
    editor.onDidChangeCursorPosition((e) => onCursorChange?.(e.position.lineNumber, e.position.column));
    editor.onDidChangeCursorSelection((e) => {
      const s = e.selection;
      if (s.startLineNumber === s.endLineNumber && s.startColumn === s.endColumn) onSelectionChange?.(0, 0);
      else {
        const text = editor.getModel()?.getValueInRange(s) || "";
        onSelectionChange?.(text.length, Math.abs(s.endLineNumber - s.startLineNumber) + 1);
      }
    });
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      const model = editor.getModel();
      if (model) Monaco.editor.setModelLanguage(model, resolvedLang);
    }
  }, [resolvedLang]);

  useEffect(() => () => unregisterEditor(tabId), [tabId]);

  const handleChange = (v: string | undefined) => { if (v !== undefined) onContentChange?.(v); };

  const options: Monaco.editor.IStandaloneEditorConstructionOptions = {
    value: content, language: resolvedLang, theme: isDark ? "npp2-dark" : "npp2-light",
    fontSize, fontFamily, tabSize, insertSpaces,
    wordWrap: wordWrap ? "on" : "off",
    lineNumbers: showLineNumbers ? "on" : "off",
    renderWhitespace: showWhitespace ? "all" : "boundary",
    minimap: { enabled: showMinimap }, folding, bracketPairColorization: { enabled: bracketPairColorization },
    guides: { bracketPairs: bracketPairColorization, indentation: showIndentGuides },
    autoIndent: autoIndent ? "advanced" : "none",
    cursorBlinking: "smooth", cursorSmoothCaretAnimation: "on",
    selectOnLineNumbers: true, roundedSelection: true, scrollBeyondLastLine: false,
    automaticLayout: true, smoothScrolling: true, mouseWheelZoom: true,
    multiCursorModifier: "ctrlCmd", columnSelection: true,
    trimAutoWhitespace: true, renderLineHighlight: "all", glyphMargin: true,
    quickSuggestions: { other: true, comments: false, strings: false },
    suggestOnTriggerCharacters: true, acceptSuggestionOnEnter: "on", tabCompletion: "on",
    autoClosingBrackets: "always", autoClosingQuotes: "always", matchBrackets: "always",
    formatOnPaste: true, readOnly: readonly,
  };

  return (
    <div className="monaco-wrapper">
      <Editor height="100%" width="100%" path={modelPath} theme={isDark ? "npp2-dark" : "npp2-light"} options={options}
        onMount={handleMount} onChange={handleChange}
        loading={<div className="editor-loading"><span>加载编辑器中...</span></div>}
      />
    </div>
  );
}
