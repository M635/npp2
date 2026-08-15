import { useEffect, useState } from "react";
import { useI18n } from "../../stores/i18nStore";
import { getFileName, truncatePath, formatFileSize } from "../../utils/fileUtils";
import { useFileStore } from "../../stores/fileStore";
import { getSupportedEncodings } from "../../services/tauri/fileService";
import { toast } from "../../utils/toast";
import type { EncodingType } from "../../types/file";

interface Props {
  onOpenSettings: () => void;
  selectionInfo: { chars: number; lines: number } | null;
}

export function StatusBar({ onOpenSettings, selectionInfo }: Props) {
  const { t } = useI18n();
  const activeTab = useFileStore((s) => s.tabs.find((x) => x.id === s.activeTabId));
  const setEncoding = useFileStore((s) => s.updateTab);
  const [showEncodingMenu, setShowEncodingMenu] = useState(false);
  const [encodings, setEncodings] = useState<string[]>([]);

  useEffect(() => {
    getSupportedEncodings().then(setEncodings).catch(() => setEncodings(["UTF-8", "UTF-8-BOM", "GBK", "UTF-16LE", "UTF-16BE", "ASCII"]));
  }, []);

  useEffect(() => {
    const close = () => setShowEncodingMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  if (!activeTab) return (
    <div className="status-bar">
      <div className="status-left"><span className="status-item">NPP2 v1.0.0</span></div>
      <div className="status-right"><span className="status-item">就绪</span></div>
    </div>
  );

  const encoding = activeTab.encoding || "UTF-8";
  const langName = activeTab.language || "纯文本";
  const lineCount = activeTab.meta?.line_count || 0;
  const { line, column } = activeTab.cursor_position || { line: 1, column: 1 };

  const pickEncoding = (enc: string) => {
    setEncoding(activeTab.id, { encoding: enc as EncodingType });
    toast(`编码已切换为 ${enc}(保存时生效)`, "success");
  };

  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-item" title={activeTab.path}>{truncatePath(getFileName(activeTab.path) || activeTab.name, 30)}</span>
        {activeTab.is_dirty && <span className="status-item dirty">●</span>}
        {activeTab.readonly && <span className="status-item readonly">{t("status.readonly")}</span>}
        {selectionInfo && selectionInfo.chars > 0 && <span className="status-item">{selectionInfo.lines}L × {selectionInfo.chars}C</span>}
        <span className="status-item">{langName}</span>
      </div>
      <div className="status-right">
        <span className="status-item">行 {line}, 列 {column}</span>
        <span className="status-item">{t("status.lines")} {lineCount}</span>
        <span className="status-item">{formatFileSize(activeTab.meta?.size || 0)}</span>
        <span className="status-item encoding-badge" onClick={(e) => { e.stopPropagation(); setShowEncodingMenu((v) => !v); }}>
          {encoding}
          {showEncodingMenu && (
            <span className="encoding-menu" onClick={(e) => e.stopPropagation()}>
              {encodings.map((enc) => (
                <span key={enc} className={`encoding-menu-item ${enc === encoding ? "selected" : ""}`} onClick={() => { pickEncoding(enc); setShowEncodingMenu(false); }}>{enc}</span>
              ))}
            </span>
          )}
        </span>
        <span className="status-item" onClick={onOpenSettings}>⚙</span>
      </div>
    </div>
  );
}
