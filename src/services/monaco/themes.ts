import * as Monaco from "monaco-editor";

const LIGHT_RULES = [
  { token: "comment", foreground: "8a8a8a", fontStyle: "italic" },
  { token: "keyword", foreground: "b5004f" }, { token: "string", foreground: "1a7e3a" },
  { token: "number", foreground: "1a7e3a" }, { token: "type", foreground: "7a3e9d" },
  { token: "function", foreground: "1e5fb6" }, { token: "variable", foreground: "1d1d1f" },
  { token: "tag", foreground: "b5004f" }, { token: "delimiter", foreground: "636363" },
];
const DARK_RULES = [
  { token: "comment", foreground: "6a9955", fontStyle: "italic" },
  { token: "keyword", foreground: "569cd6" }, { token: "string", foreground: "ce9178" },
  { token: "number", foreground: "b5cea8" }, { token: "type", foreground: "4ec9b0" },
  { token: "function", foreground: "dcdcaa" }, { token: "variable", foreground: "9cdcfe" },
  { token: "tag", foreground: "808080" }, { token: "delimiter", foreground: "808080" },
];

export function defineThemes(monacoInstance: typeof Monaco): void {
  monacoInstance.editor.defineTheme("npp2-light", {
    base: "vs", inherit: true,
    rules: LIGHT_RULES,
    colors: {
      "editor.background": "#ffffff", "editor.foreground": "#1d1d1f",
      "editorLineNumber.foreground": "#b0b0b0", "editorLineNumber.activeForeground": "#1d1d1f",
      "editor.lineHighlightBackground": "#f5f5f7", "editor.selectionBackground": "#b3d4ff",
      "editorCursor.foreground": "#007aff", "editorWhitespace.foreground": "#d0d0d0",
      "editorIndentGuide.background": "#e0e0e0", "editorBracketMatch.background": "#b3d4ff80",
      "editorBracketMatch.border": "#007aff",
    },
  });
  monacoInstance.editor.defineTheme("npp2-dark", {
    base: "vs-dark", inherit: true,
    rules: DARK_RULES,
    colors: {
      "editor.background": "#1e1e2e", "editor.foreground": "#cdd6f4",
      "editorLineNumber.foreground": "#585b70", "editorLineNumber.activeForeground": "#cdd6f4",
      "editor.lineHighlightBackground": "#313244", "editor.selectionBackground": "#45475a",
      "editorCursor.foreground": "#f5e0dc", "editorWhitespace.foreground": "#313244",
      "editorIndentGuide.background": "#45475a", "editorBracketMatch.background": "#45475a80",
      "editorBracketMatch.border": "#89b4fa",
    },
  });
}

export function getThemeName(isDark: boolean): string {
  return isDark ? "npp2-dark" : "npp2-light";
}
