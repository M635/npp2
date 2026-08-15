export function getLanguageFromPath(path: string): string {
  const ext = path.toLowerCase().split(".").pop() || "";
  const map: Record<string, string> = {
    txt: "plaintext", text: "plaintext", log: "plaintext",
    md: "markdown", markdown: "markdown",
    js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
    ts: "typescript", tsx: "typescript",
    json: "json", jsonc: "json",
    html: "html", htm: "html",
    xml: "xml", svg: "xml",
    css: "css", scss: "scss", sass: "sass", less: "less",
    py: "python", pyw: "python",
    rb: "ruby",
    php: "php",
    java: "java",
    c: "c", cpp: "cpp", cc: "cpp", cxx: "cpp", h: "c", hpp: "cpp",
    cs: "csharp",
    go: "go",
    rs: "rust",
    swift: "swift",
    kt: "kotlin", kts: "kotlin",
    sh: "shell", bash: "shell", zsh: "shell", fish: "shell",
    bat: "bat", cmd: "bat", ps1: "powershell",
    sql: "sql",
    yaml: "yaml", yml: "yaml",
    toml: "ini", ini: "ini", conf: "ini", cfg: "ini",
    dockerfile: "dockerfile", makefile: "makefile",
    vue: "html", svelte: "html",
    rust: "rust", lua: "lua", r: "r", perl: "perl", scala: "scala",
  };
  return map[ext] || "plaintext";
}

export const LANGUAGES: { group: string; items: { label: string; language: string }[] }[] = [
  { group: "📄 通用", items: [{ label: "纯文本", language: "plaintext" }, { label: "Markdown", language: "markdown" }, { label: "JSON", language: "json" }, { label: "YAML", language: "yaml" }, { label: "INI", language: "ini" }] },
  { group: "🌐 Web", items: [{ label: "HTML", language: "html" }, { label: "CSS", language: "css" }, { label: "JavaScript", language: "javascript" }, { label: "TypeScript", language: "typescript" }, { label: "SCSS", language: "scss" }] },
  { group: "🔧 系统", items: [{ label: "Shell", language: "shell" }, { label: "PowerShell", language: "powershell" }, { label: "Dockerfile", language: "dockerfile" }, { label: "Makefile", language: "makefile" }] },
  { group: "🚀 后端", items: [{ label: "Python", language: "python" }, { label: "Rust", language: "rust" }, { label: "Go", language: "go" }, { label: "Java", language: "java" }, { label: "C", language: "c" }, { label: "C++", language: "cpp" }, { label: "C#", language: "csharp" }, { label: "PHP", language: "php" }, { label: "Ruby", language: "ruby" }, { label: "SQL", language: "sql" }] },
];
