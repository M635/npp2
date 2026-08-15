import { useEffect } from "react";
import { useFileStore } from "../../stores/fileStore";
import { useI18n } from "../../stores/i18nStore";

interface Props { x: number; y: number; tabId: string; onClose: () => void; }

export function TabContextMenu({ x, y, tabId, onClose }: Props) {
  const { closeOtherTabs, closeTab, closeAllTabs, closeAllButCurrent, setActiveTab } = useFileStore();
  const { t } = useI18n();
  const tab = useFileStore.getState().tabs.find((t) => t.id === tabId);
  if (!tab) return null;

  useEffect(() => {
    const h = () => onClose();
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, [onClose]);

  return (
    <div className="context-menu" style={{ left: x, top: y, position: "fixed" }}>
      <div className="context-menu-header">{tab.name}</div>
      <div className="context-menu-item" onClick={() => { setActiveTab(tabId); onClose(); }}>打开</div>
      <div className="context-menu-item" onClick={() => { closeOtherTabs(tabId); onClose(); }}>{t("tab.closeOthers")}</div>
      <div className="context-menu-item" onClick={() => { closeAllButCurrent(tabId); onClose(); }}>{t("tab.closeAllButCurrent")}</div>
      <div className="context-menu-item" onClick={() => { closeAllTabs(); onClose(); }}>{t("tab.closeAll")}</div>
      <div className="context-menu-divider" />
      <div className="context-menu-item danger" onClick={() => { closeTab(tabId); onClose(); }}>{t("tab.close")}</div>
    </div>
  );
}
