import { createPortal } from "react-dom";
import { useState, useEffect, useRef } from "react";
import { useFileStore } from "../../stores/fileStore";
import { useI18n } from "../../stores/i18nStore";

interface Props { onClose: () => void; }

export function GotoLineDialog({ onClose }: Props) {
  const { t } = useI18n();
  const activeTabId = useFileStore.getState().activeTabId;
  const activeTab = useFileStore.getState().tabs.find((t) => t.id === activeTabId);
  const [lineNum, setLineNum] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  const handleGoto = () => {
    const line = parseInt(lineNum);
    if (isNaN(line) || line < 1) { setError("请输入有效行号"); return; }
    const totalLines = activeTab?.meta?.line_count || 9999;
    if (line > totalLines) { setError(`文件只有 ${totalLines} 行`); return; }
    window.dispatchEvent(new CustomEvent("npp2:go-to-line", { detail: line }));
    onClose();
  };

  return createPortal(
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog fade-in" onClick={(e) => e.stopPropagation()} style={{ width: 360 }}>
        <div className="dialog-header">
          <span className="dialog-title">{t("action.goto")}</span>
          <button className="dialog-close" onClick={onClose}>×</button>
        </div>
        <div className="dialog-body">
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>跳转到指定行：</p>
          <input ref={inputRef} className="fi-input" value={lineNum} onChange={(e) => { setLineNum(e.target.value); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleGoto(); else if (e.key === "Escape") onClose(); }}
            placeholder={`1 - ${activeTab?.meta?.line_count || "?"} 行`} style={{ height: 36 }} />
          {error && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 6 }}>{error}</p>}
        </div>
        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={onClose}>{t("common.cancel")}</button>
          <button className="btn btn-primary" onClick={handleGoto}>{t("common.ok")}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
