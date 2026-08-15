import type { FileTab } from "../../types/file";
import { getFileName, truncatePath } from "../../utils/fileUtils";

interface Props {
  tab: FileTab; active: boolean; dragOver?: boolean;
  onClick: () => void; onClose: () => void;
  onDragStart: (e: React.DragEvent) => void; onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void; onDragEnd: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function TabItem({ tab, active, dragOver, onClick, onClose, onDragStart, onDragOver, onDrop, onDragEnd, onContextMenu }: Props) {
  const name = tab.is_new ? "新标签页" : getFileName(tab.path);
  return (
    <div className={`tab-item ${active ? "active" : ""} ${dragOver ? "drag-over" : ""}`}
      onClick={onClick} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}
      onContextMenu={onContextMenu} draggable={!tab.is_new}>
      <span className="tab-icon">{getFileIcon(tab.name)}</span>
      <span className="tab-name">{truncatePath(name, 16)}</span>
      {tab.is_dirty && <span className="tab-dirty">●</span>}
      <button className="tab-close" onClick={(e) => { e.stopPropagation(); onClose(); }} title="关闭">×</button>
    </div>
  );
}

function getFileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const icons: Record<string, string> = { ts: "📘", jsx: "📙", json: "📋", html: "🌐", css: "🎨", md: "📝", rs: "🦀", py: "🐍", go: "🐹", java: "☕", txt: "📄", js: "📙", tsx: "📙" };
  return icons[ext] || "📄";
}
