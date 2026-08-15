import { createPortal } from "react-dom";
import { useState, useEffect, useRef } from "react";
import { useI18n } from "../../stores/i18nStore";
import { useSearchStore } from "../../stores/searchStore";

interface Command { id: string; label: string; shortcut?: string; action: () => void; }

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    { id: "new", label: t("action.new"), shortcut: "Ctrl+N", action: () => { window.dispatchEvent(new CustomEvent("markpt:new-file")); onClose(); } },
    { id: "open", label: t("action.open"), shortcut: "Ctrl+O", action: () => { window.dispatchEvent(new CustomEvent("markpt:open-file")); onClose(); } },
    { id: "save", label: t("action.save"), shortcut: "Ctrl+S", action: () => { window.dispatchEvent(new CustomEvent("markpt:save")); onClose(); } },
    { id: "save-all", label: t("action.saveAll"), shortcut: "Ctrl+Shift+S", action: () => { window.dispatchEvent(new CustomEvent("markpt:save-all")); onClose(); } },
    { id: "find", label: t("action.find"), shortcut: "Ctrl+F", action: () => { useSearchStore.getState().toggleSearchPanel(); onClose(); } },
    { id: "replace", label: t("action.replace"), shortcut: "Ctrl+H", action: () => { useSearchStore.getState().toggleReplacePanel(); onClose(); } },
    { id: "goto-line", label: t("action.goto"), shortcut: "Ctrl+G", action: () => { window.dispatchEvent(new CustomEvent("markpt:goto-line")); onClose(); } },
    { id: "toggle-sidebar", label: "切换侧边栏", action: () => { window.dispatchEvent(new CustomEvent("markpt:toggle-sidebar")); onClose(); } },
    { id: "find-in-files", label: "在文件中查找...", shortcut: "Ctrl+Shift+F", action: () => { useSearchStore.getState().toggleFindInFiles(); onClose(); } },
    { id: "settings", label: t("action.settings"), action: () => { window.dispatchEvent(new CustomEvent("markpt:open-settings")); onClose(); } },
    { id: "toggle-word-wrap", label: "自动换行", action: () => { window.dispatchEvent(new CustomEvent("markpt:toggle-word-wrap")); onClose(); } },
    { id: "toggle-minimap", label: "切换小地图", action: () => { window.dispatchEvent(new CustomEvent("markpt:toggle-minimap")); onClose(); } },
    { id: "zoom-in", label: "放大", shortcut: "Ctrl++", action: () => { window.dispatchEvent(new CustomEvent("markpt:zoom-in")); onClose(); } },
    { id: "zoom-out", label: "缩小", shortcut: "Ctrl+-", action: () => { window.dispatchEvent(new CustomEvent("markpt:zoom-out")); onClose(); } },
    { id: "zoom-reset", label: "重置缩放", shortcut: "Ctrl+0", action: () => { window.dispatchEvent(new CustomEvent("markpt:zoom-reset")); onClose(); } },
  ];

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()) || c.id.includes(query.toLowerCase()));

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(filtered.length - 1, i + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(0, i - 1)); }
      else if (e.key === "Enter" && filtered[selectedIndex]) { filtered[selectedIndex].action(); }
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [filtered, selectedIndex, onClose]);

  return createPortal(
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="command-input-wrap">
          <span style={{ fontSize: 18, marginRight: 8, color: "var(--text-muted)" }}>⌕</span>
          <input ref={inputRef} className="command-input" value={query} onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={(e) => { if (e.key === "Enter" && filtered[selectedIndex]) filtered[selectedIndex].action(); }}
            placeholder="输入命令或关键词..." />
        </div>
        <div className="command-list">
          {filtered.length === 0 && <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>无匹配命令</div>}
          {filtered.map((cmd, idx) => (
            <div key={cmd.id} className={`command-item ${idx === selectedIndex ? "selected" : ""}`}
              onClick={() => cmd.action()} onMouseEnter={() => setSelectedIndex(idx)}>
              <span className="command-item-label">{cmd.label}</span>
              {cmd.shortcut && <span className="command-item-key">{cmd.shortcut}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
