import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export type Language = "zh" | "en";

const translations: Record<string, Record<Language, string>> = {
  "app.title": { zh: "NPP2", en: "NPP2" },
  "app.hint": { zh: "拖拽文件打开 · Ctrl+P 命令面板", en: "Drop files to open · Ctrl+P Command Palette" },
  "menu.file": { zh: "文件", en: "File" },
  "menu.edit": { zh: "编辑", en: "Edit" },
  "menu.search": { zh: "查找", en: "Search" },
  "menu.view": { zh: "视图", en: "View" },
  "action.new": { zh: "新建", en: "New" },
  "action.open": { zh: "打开...", en: "Open..." },
  "action.save": { zh: "保存", en: "Save" },
  "action.saveAll": { zh: "全部保存", en: "Save All" },
  "action.close": { zh: "关闭", en: "Close" },
  "action.quit": { zh: "退出", en: "Quit" },
  "action.undo": { zh: "撤销", en: "Undo" },
  "action.redo": { zh: "重做", en: "Redo" },
  "action.cut": { zh: "剪切", en: "Cut" },
  "action.copy": { zh: "复制", en: "Copy" },
  "action.paste": { zh: "粘贴", en: "Paste" },
  "action.find": { zh: "查找...", en: "Find..." },
  "action.replace": { zh: "替换...", en: "Replace..." },
  "action.goto": { zh: "转到行...", en: "Go to Line..." },
  "action.settings": { zh: "设置...", en: "Settings..." },
  "action.about": { zh: "关于 NPP2", en: "About NPP2" },
  "action.commandPalette": { zh: "命令面板", en: "Command Palette" },
  "tab.newTab": { zh: "新标签页", en: "New Tab" },
  "tab.close": { zh: "关闭", en: "Close" },
  "tab.closeOthers": { zh: "关闭其他", en: "Close Others" },
  "tab.closeAll": { zh: "关闭全部", en: "Close All" },
  "tab.closeAllButCurrent": { zh: "关闭所有但当前", en: "Close All but Current" },
  "tab.sortByName": { zh: "按名称排序", en: "Sort by Name" },
  "tab.sortByPath": { zh: "按路径排序", en: "Sort by Path" },
  "tab.sortBySize": { zh: "按大小排序", en: "Sort by Size" },
  "status.lines": { zh: "行", en: "Lines" },
  "status.cols": { zh: "列", en: "Cols" },
  "status.selected": { zh: "已选中", en: "Selected" },
  "status.readonly": { zh: "只读", en: "READ ONLY" },
  "dialog.settings": { zh: "编辑器设置", en: "Editor Settings" },
  "dialog.settings.font": { zh: "字体", en: "Font" },
  "dialog.settings.fontSize": { zh: "字号", en: "Font Size" },
  "dialog.settings.theme": { zh: "主题", en: "Theme" },
  "dialog.settings.tabSize": { zh: "Tab 大小", en: "Tab Size" },
  "dialog.settings.wordWrap": { zh: "自动换行", en: "Word Wrap" },
  "dialog.settings.lineNumbers": { zh: "行号", en: "Line Numbers" },
  "dialog.settings.minimap": { zh: "小地图", en: "Minimap" },
  "dialog.settings.done": { zh: "完成", en: "Done" },
  "search.find": { zh: "查找", en: "Find" },
  "search.replace": { zh: "替换", en: "Replace" },
  "search.regex": { zh: "正则", en: "Regex" },
  "search.caseSensitive": { zh: "区分大小写", en: "Case Sensitive" },
  "search.wholeWord": { zh: "全词匹配", en: "Whole Word" },
  "search.findNext": { zh: "下一个", en: "Next" },
  "search.findPrev": { zh: "上一个", en: "Prev" },
  "search.replaceAll": { zh: "全部替换", en: "Replace All" },
  "findInFiles.title": { zh: "在文件中查找", en: "Find in Files" },
  "findInFiles.directory": { zh: "目录", en: "Directory" },
  "findInFiles.dirPlaceholder": { zh: "选择要搜索的文件夹", en: "Select folder to search" },
  "findInFiles.pattern": { zh: "搜索内容", en: "Pattern" },
  "findInFiles.patternPlaceholder": { zh: "输入搜索关键词", en: "Enter search term" },
  "findInFiles.extensions": { zh: "文件扩展名（逗号分隔）", en: "File extensions (comma separated)" },
  "findInFiles.search": { zh: "搜索", en: "Search" },
  "findInFiles.searching": { zh: "搜索中...", en: "Searching..." },
  "findInFiles.filesMatched": { zh: "个文件匹配", en: "files matched" },
  "findInFiles.matches": { zh: "处匹配", en: "matches" },
  "findInFiles.truncated": { zh: "结果被截断，请缩小搜索范围", en: "Results truncated, try narrowing your search" },
  "common.loading": { zh: "加载中...", en: "Loading..." },
  "common.cancel": { zh: "取消", en: "Cancel" },
  "common.ok": { zh: "确定", en: "OK" },
  "sidebar.explorer": { zh: "资源管理器", en: "Explorer" },
  "sidebar.openFolder": { zh: "打开文件夹", en: "Open Folder" },
  "sidebar.noFolder": { zh: "未打开文件夹", en: "No folder opened" },
  "editor.loading": { zh: "加载编辑器中...", en: "Loading editor..." },
  "statusbar.encoding": { zh: "编码", en: "Encoding" },
  "statusbar.lineCount": { zh: "行数", en: "Line count" },
  "statusbar.fileSize": { zh: "文件大小", en: "File size" },
};

interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const useI18n = create<I18nStore>((set, get) => ({
  language: "zh",
  setLanguage: (lang) => {
    set({ language: lang });
    invoke("rebuild_menu", { lang }).catch(() => {});
  },
  t: (key) => {
    const { language } = get();
    const entry = translations[key];
    if (!entry) return key;
    return entry[language] || entry.zh || key;
  },
}));
