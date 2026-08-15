import type { ReactNode } from "react";
import { TabBar } from "../tabs/TabBar";
import { StatusBar } from "./StatusBar";
import { useSearchStore } from "../../stores/searchStore";
import { SearchPanel } from "../search/SearchPanel";
import { FindInFilesPanel } from "../search/FindInFilesPanel";

interface Props {
  children: ReactNode;
  onNewTab: () => void;
  onCloseTab: (id: string) => void;
  onOpenSettings: () => void;
  selectionInfo: { chars: number; lines: number } | null;
}

export function MainLayout({ children, onNewTab, onCloseTab, onOpenSettings, selectionInfo }: Props) {
  const { isSearchPanelOpen, isFindInFilesOpen } = useSearchStore();
  return (
    <div className="main-layout">
      <TabBar onNewTab={onNewTab} onCloseTab={onCloseTab} />
      <div className="editor-area">
        {isSearchPanelOpen && <SearchPanel />}
        {isFindInFilesOpen && <FindInFilesPanel />}
        <div className="editor-content">{children}</div>
      </div>
      <StatusBar selectionInfo={selectionInfo} onOpenSettings={onOpenSettings} />
    </div>
  );
}
