import { createPortal } from "react-dom";
import { useSettingStore } from "../../stores/settingStore";
import { useI18n } from "../../stores/i18nStore";
import type { ThemeMode } from "../../types/theme";

interface Props { onClose: () => void; }

export function SettingsDialog({ onClose }: Props) {
  const { t } = useI18n();
  const {
    fontSize, setFontSize, fontFamily, setFontFamily, tabSize, setTabSize, insertSpaces, setInsertSpaces,
    wordWrap, setWordWrap, showLineNumbers, setShowLineNumbers, showWhitespace, setShowWhitespace,
    showMinimap, setShowMinimap, themeMode, setThemeMode, autoIndent, setAutoIndent,
    bracketPairColorization, setBracketPairColorization, folding, setFolding,
    showIndentGuides, setShowIndentGuides, autoSaveInterval, setAutoSaveInterval,
  } = useSettingStore();

  return createPortal(
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <span className="dialog-title">{t("dialog.settings")}</span>
          <button className="dialog-close" onClick={onClose}>×</button>
        </div>
        <div className="dialog-body">
          <div className="setting-group">
            <div className="setting-group-title">{t("dialog.settings.font")}</div>
            <div className="setting-row">
              <span className="setting-label">{t("dialog.settings.fontSize")}</span>
              <div className="setting-control">
                <input type="range" min={8} max={32} value={fontSize} onChange={(e) => setFontSize(+e.target.value)} />
                <input type="number" min={8} max={32} value={fontSize} onChange={(e) => setFontSize(+e.target.value)} style={{ width: 50 }} />
              </div>
            </div>
            <div className="setting-row">
              <span className="setting-label">字体族</span>
              <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} style={{ width: 200, padding: '4px 8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                <option value="'SF Mono', monospace">SF Mono</option>
                <option value="Consolas, monospace">Consolas</option>
                <option value="Menlo, monospace">Menlo</option>
                <option value="monospace">系统等宽字体</option>
              </select>
            </div>
            <div className="setting-row">
              <span className="setting-label">Tab 大小</span>
              <div className="setting-control">
                <input type="range" min={2} max={8} value={tabSize} onChange={(e) => setTabSize(+e.target.value)} />
                <span style={{ fontSize: 12, color: "var(--text-muted)", width: 20 }}>{tabSize}</span>
              </div>
            </div>
            <div className="setting-row">
              <span className="setting-label">空格缩进</span>
              <label className="toggle"><input type="checkbox" checked={insertSpaces} onChange={(e) => setInsertSpaces(e.target.checked)} /><span className="toggle-slider"></span></label>
            </div>
          </div>

          <div className="setting-group">
            <div className="setting-group-title">编辑器外观</div>
            <div className="setting-row">
              <span className="setting-label">主题</span>
              <select value={themeMode} onChange={(e) => setThemeMode(e.target.value as ThemeMode)}>
                <option value="auto">跟随系统</option>
                <option value="light">浅色</option>
                <option value="dark">深色</option>
              </select>
            </div>
            <div className="setting-row">
              <span className="setting-label">自动换行</span>
              <label className="toggle"><input type="checkbox" checked={wordWrap} onChange={(e) => setWordWrap(e.target.checked)} /><span className="toggle-slider"></span></label>
            </div>
            <div className="setting-row">
              <span className="setting-label">显示行号</span>
              <label className="toggle"><input type="checkbox" checked={showLineNumbers} onChange={(e) => setShowLineNumbers(e.target.checked)} /><span className="toggle-slider"></span></label>
            </div>
            <div className="setting-row">
              <span className="setting-label">显示空白字符</span>
              <label className="toggle"><input type="checkbox" checked={showWhitespace} onChange={(e) => setShowWhitespace(e.target.checked)} /><span className="toggle-slider"></span></label>
            </div>
            <div className="setting-row">
              <span className="setting-label">小地图</span>
              <label className="toggle"><input type="checkbox" checked={showMinimap} onChange={(e) => setShowMinimap(e.target.checked)} /><span className="toggle-slider"></span></label>
            </div>
            <div className="setting-row">
              <span className="setting-label">代码折叠</span>
              <label className="toggle"><input type="checkbox" checked={folding} onChange={(e) => setFolding(e.target.checked)} /><span className="toggle-slider"></span></label>
            </div>
            <div className="setting-row">
              <span className="setting-label">缩进线</span>
              <label className="toggle"><input type="checkbox" checked={showIndentGuides} onChange={(e) => setShowIndentGuides(e.target.checked)} /><span className="toggle-slider"></span></label>
            </div>
            <div className="setting-row">
              <span className="setting-label">括号配对高亮</span>
              <label className="toggle"><input type="checkbox" checked={bracketPairColorization} onChange={(e) => setBracketPairColorization(e.target.checked)} /><span className="toggle-slider"></span></label>
            </div>
          </div>

          <div className="setting-group">
            <div className="setting-group-title">编辑行为</div>
            <div className="setting-row">
              <span className="setting-label">自动缩进</span>
              <label className="toggle"><input type="checkbox" checked={autoIndent} onChange={(e) => setAutoIndent(e.target.checked)} /><span className="toggle-slider"></span></label>
            </div>
            <div className="setting-row">
              <span className="setting-label">自动保存间隔(秒)</span>
              <input type="number" min={0} max={300} value={autoSaveInterval} onChange={(e) => setAutoSaveInterval(+e.target.value)} style={{ width: 80, padding: '4px 8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
            </div>
          </div>
        </div>
        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={onClose}>{t("common.ok")}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
