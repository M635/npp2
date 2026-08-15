import { useState, useCallback, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useFileStore } from "../../stores/fileStore";
import { useI18n } from "../../stores/i18nStore";
import { getFileName, normalizePath } from "../../utils/fileUtils";

interface TreeNode {
  name: string; path: string; is_dir: boolean;
  children?: TreeNode[]; expanded?: boolean;
}

export function SideBar() {
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { tabs, activeTabId } = useFileStore();
  const { t } = useI18n();

  const loadDir = useCallback(async (dirPath: string): Promise<TreeNode[]> => {
    try {
      const { listDirectory } = await import("../../services/tauri/fileService");
      const entries = await listDirectory(dirPath);
      return entries
        .sort((a, b) => { if (a[1] !== b[1]) return a[1] ? -1 : 1; return a[0].localeCompare(b[0]); })
        .map(([name, isDir]) => ({ name, path: normalizePath(dirPath + "/" + name), is_dir: isDir, children: isDir ? [] : undefined, expanded: false }));
    } catch { return []; }
  }, []);

  const openFolder = useCallback(async () => {
    const selected = await open({ directory: true });
    if (!selected) return;
    const path = normalizePath(String(selected));
    setRootPath(path); setLoading(true);
    setTree(await loadDir(path)); setLoading(false);
    setCollapsed(false);
  }, [loadDir]);

  /* events from native menu / command palette */
  useEffect(() => {
    const onOpenFolder = () => void openFolder();
    const onToggle = () => setCollapsed((v) => !v);
    window.addEventListener("npp2:open-folder", onOpenFolder);
    window.addEventListener("npp2:toggle-sidebar", onToggle);
    return () => {
      window.removeEventListener("npp2:open-folder", onOpenFolder);
      window.removeEventListener("npp2:toggle-sidebar", onToggle);
    };
  }, [openFolder]);

  const toggleNode = useCallback(async (node: TreeNode, path: number[]) => {
    if (!node.is_dir) { void useFileStore.getState().openPath(node.path); return; }
    if (node.expanded) {
      const collapse = (nodes: TreeNode[], idxs: number[]): TreeNode[] => {
        if (idxs.length === 0) return nodes;
        const [i, ...rest] = idxs;
        return nodes.map((n, idx) => idx !== i ? n : rest.length === 0 ? { ...n, expanded: false } : { ...n, children: collapse(n.children || [], rest) });
      };
      setTree((prev) => collapse(prev, path));
      return;
    }
    let children = node.children || [];
    if (children.length === 0) children = await loadDir(node.path);
    const expand = (nodes: TreeNode[], idxs: number[]): TreeNode[] => {
      if (idxs.length === 0) return nodes;
      const [i, ...rest] = idxs;
      return nodes.map((n, idx) => idx !== i ? n : rest.length === 0 ? { ...n, expanded: true, children } : { ...n, children: expand(n.children || [], rest) });
    };
    setTree((prev) => expand(prev, path));
  }, [loadDir]);

  const renderTree = (nodes: TreeNode[], idxs: number[] = []): React.ReactNode =>
    nodes.map((node, idx) => {
      const p = [...idxs, idx];
      const isActive = tabs.some((tb) => tb.path === node.path && tb.id === activeTabId);
      return (
        <div key={node.path}>
          <div className={`file-tree-item ${node.is_dir ? "dir" : "file"} ${isActive ? "active" : ""}`}
            onClick={() => void toggleNode(node, p)}>
            <span className="tree-icon">{node.is_dir ? (node.expanded ? "📂" : "📁") : "📄"}</span>
            <span className="tree-name">{node.name}</span>
          </div>
          {node.is_dir && node.expanded && node.children && <div className="file-tree-children">{renderTree(node.children, p)}</div>}
        </div>
      );
    });

  if (collapsed) {
    return (
      <div className="sidebar sidebar-collapsed" onClick={() => setCollapsed(false)} title={t("sidebar.explorer")}>
        <span className="sidebar-rail-icon">🗂</span>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">{t("sidebar.explorer")}</span>
        <button className="sidebar-btn" onClick={() => void openFolder()} title={t("sidebar.openFolder")}>📂</button>
        <button className="sidebar-btn" onClick={() => setCollapsed(true)} title="收起">«</button>
      </div>
      <div className="sidebar-content">
        {loading ? <div className="sidebar-loading">{t("common.loading")}</div>
          : tree.length > 0 ? <div className="file-tree">{renderTree(tree)}</div>
          : <div className="sidebar-empty"><p>{t("sidebar.noFolder")}</p><button className="btn btn-primary" onClick={() => void openFolder()}>{t("sidebar.openFolder")}</button></div>}
      </div>
      {rootPath && <div className="sidebar-footer" title={rootPath}>{getFileName(rootPath)}</div>}
    </div>
  );
}
