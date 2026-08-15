import { useState, useRef, useEffect, type DragEvent } from "react";
import { useFileStore } from "../../stores/fileStore";
import { useI18n } from "../../stores/i18nStore";
import { TabItem } from "./TabItem";
import { TabContextMenu } from "./TabContextMenu";
import type { FileTab } from "../../types/file";

interface Props { onNewTab: () => void; onCloseTab: (id: string) => void; }

export function TabBar({ onNewTab, onCloseTab }: Props) {
  const { tabs, activeTabId, setActiveTab, reorderTabs, sortTabs } = useFileStore();
  const { t } = useI18n();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (showSortMenu && sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showSortMenu]);

  const handleDragStart = (e: DragEvent, index: number) => { setDragIndex(index); e.dataTransfer.effectAllowed = "move"; };
  const handleDrop = (e: DragEvent, index: number) => { e.preventDefault(); if (dragIndex !== null && dragIndex !== index) reorderTabs(dragIndex, index); setDragIndex(null); };

  return (
    <div className="tab-bar">
      <div className="tabs-container">
        {tabs.map((tab: FileTab, index: number) => (
          <TabItem key={tab.id} tab={tab} active={tab.id === activeTabId}
            onClick={() => setActiveTab(tab.id)} onClose={() => onCloseTab(tab.id)}
            onDragStart={(e) => handleDragStart(e, index)} onDragOver={() => {}}
            onDrop={(e) => handleDrop(e, index)} onDragEnd={() => { setDragIndex(null); }}
            onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, tabId: tab.id }); }}
          />
        ))}
      </div>
      <div className="tab-actions">
        <button className="tab-action-btn" onClick={onNewTab} title={t("tab.newTab")}>+</button>
        <div ref={sortRef} style={{ position: "relative" }}>
          <button className="tab-action-btn" onClick={() => setShowSortMenu((v) => !v)} title="排序">⇅</button>
          {showSortMenu && (
            <div className="tab-dropdown-menu" style={{ right: 0 }}>
              <div className="tab-dropdown-item" onClick={() => { sortTabs("name"); setShowSortMenu(false); }}>{t("tab.sortByName")}</div>
              <div className="tab-dropdown-item" onClick={() => { sortTabs("path"); setShowSortMenu(false); }}>{t("tab.sortByPath")}</div>
              <div className="tab-dropdown-item" onClick={() => { sortTabs("size"); setShowSortMenu(false); }}>{t("tab.sortBySize")}</div>
            </div>
          )}
        </div>
      </div>
      {contextMenu && <TabContextMenu x={contextMenu.x} y={contextMenu.y} tabId={contextMenu.tabId} onClose={() => setContextMenu(null)} />}
    </div>
  );
}
