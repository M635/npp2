import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchStore } from "../../stores/searchStore";
import { useFileStore } from "../../stores/fileStore";
import { useI18n } from "../../stores/i18nStore";
import { findInFiles } from "../../services/tauri/fileService";
import { getFileName } from "../../utils/fileUtils";

export function FindInFilesPanel() {
  const { t } = useI18n();
  const { closeAllPanels } = useSearchStore();
  const [directory, setDirectory] = useState("");
  const [pattern, setPattern] = useState("");
  const [isRegex, setIsRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [extensions, setExtensions] = useState("");
  const [loading, setLoading] = useState(false);
  const [localResults, setLocalResults] = useState<{ total_matches: number; files_matched: number; results: { path: string; line_number: number; line_content: string }[]; truncated: boolean } | null>(null);

  const handleSearch = useCallback(async () => {
    if (!directory || !pattern) return;
    setLoading(true);
    try {
      const extArr = extensions.trim() ? extensions.split(",").map((e) => e.trim()).filter(Boolean) : undefined;
      const res = await findInFiles(directory, pattern, isRegex, caseSensitive, extArr);
      useSearchStore.getState().setResults(res as any);
      setLocalResults(res as any);
    } catch (e) { void import("../../utils/toast").then((m) => m.toast(`搜索失败: ${(e as Error).message}`, "error")); }
    finally { setLoading(false); }
  }, [directory, pattern, isRegex, caseSensitive, extensions]);

  const handleOpenResult = useCallback(async (result: { path: string; line_number: number }) => {
    closeAllPanels();
    await useFileStore.getState().openPath(result.path);
    setTimeout(() => window.dispatchEvent(new CustomEvent("npp2:go-to-line", { detail: result.line_number })), 250);
  }, [closeAllPanels]);

  return createPortal(
    <div className="find-in-files-panel">
      <div className="find-in-files-body">
        <div className="find-in-files-header">
          <span>{t("findInFiles.title")}</span>
          <button className="search-close-btn" onClick={closeAllPanels}>×</button>
        </div>
        <div className="find-in-files-body-content">
          <div className="fi-group">
            <label>{t("findInFiles.directory")}</label>
            <input className="fi-input" value={directory} onChange={(e) => setDirectory(e.target.value)} placeholder={t("findInFiles.dirPlaceholder")} />
          </div>
          <div className="fi-group">
            <label>{t("findInFiles.pattern")}</label>
            <div className="fi-row">
              <input className="fi-input flex-1" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder={t("findInFiles.patternPlaceholder")} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
              <label className="fi-option"><input type="checkbox" checked={isRegex} onChange={(e) => setIsRegex(e.target.checked)} />{t("search.regex")}</label>
              <label className="fi-option"><input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />Aa</label>
            </div>
          </div>
          <div className="fi-group">
            <label>{t("findInFiles.extensions")}</label>
            <input className="fi-input" value={extensions} onChange={(e) => setExtensions(e.target.value)} placeholder=".js,.ts,.py" />
          </div>
          <button className="btn btn-primary" onClick={handleSearch} disabled={loading || !directory || !pattern}>
            {loading ? t("findInFiles.searching") : t("findInFiles.search")}
          </button>
          {localResults && (
            <div className="fi-results">
              <div className="fi-summary">{localResults.files_matched} {t("findInFiles.filesMatched")} · {localResults.total_matches} {t("findInFiles.matches")}</div>
              <div className="fi-results-list">
                {localResults.results.slice(0, 200).map((r, i) => (
                  <div key={i} className="fi-result-item" onClick={() => handleOpenResult(r)}>
                    <span className="fi-path">{getFileName(r.path)}</span>
                    <span className="fi-line">{r.line_number}</span>
                    <span className="fi-line-content">{r.line_content.trim()}</span>
                  </div>
                ))}
                {localResults.truncated && <div className="fi-truncated">... {t("findInFiles.truncated")}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
