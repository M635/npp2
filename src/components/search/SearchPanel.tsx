import { useRef, useEffect, useState } from "react";
import { useSearchStore } from "../../stores/searchStore";
import { useI18n } from "../../stores/i18nStore";

export function SearchPanel() {
  const { t } = useI18n();
  const { searchQuery, setSearchQuery, isRegex, toggleRegex, caseSensitive, toggleCaseSensitive, wholeWord, toggleWholeWord, toggleReplacePanel, isReplacePanelOpen, setReplaceQuery, replaceQuery, toggleSearchPanel } = useSearchStore();
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const queryRef = useRef<HTMLInputElement>(null);

  useEffect(() => { queryRef.current?.focus(); queryRef.current?.select(); }, []);

  useEffect(() => {
    const onResult = (e: Event) => {
      const detail = (e as CustomEvent<{ count: number }>).detail;
      setMatchCount(detail.count);
    };
    window.addEventListener("npp2:find-result", onResult);
    return () => window.removeEventListener("npp2:find-result", onResult);
  }, []);

  const runFind = (forward = true) => {
    window.dispatchEvent(new CustomEvent("npp2:find", {
      detail: { query: searchQuery, isRegex, caseSensitive, wholeWord, forward },
    }));
  };

  const runReplace = (all: boolean) => {
    window.dispatchEvent(new CustomEvent("npp2:replace", {
      detail: { query: searchQuery, replace: replaceQuery, isRegex, caseSensitive, wholeWord, all },
    }));
  };

  return (
    <div className="search-panel">
      <div className="search-row">
        <span className="search-label">{t("search.find")}:</span>
        <input ref={queryRef} className="search-input" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setMatchCount(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") { if (e.shiftKey) runFind(false); else runFind(true); } }} />
        {matchCount !== null && <span className="search-counter">{matchCount} 匹配</span>}
        <button className="search-btn" onClick={() => runFind(false)} title={t("search.findPrev")}>▲</button>
        <button className="search-btn" onClick={() => runFind(true)} title={t("search.findNext")}>▼</button>
        <label className="search-option"><input type="checkbox" checked={isRegex} onChange={toggleRegex} />{t("search.regex")}</label>
        <label className="search-option"><input type="checkbox" checked={caseSensitive} onChange={toggleCaseSensitive} title="区分大小写" />Aa</label>
        <label className="search-option"><input type="checkbox" checked={wholeWord} onChange={toggleWholeWord} title="全词匹配" />W</label>
        <button className="search-btn" onClick={toggleReplacePanel} title={t("action.replace")}>⇄</button>
        <button className="search-close-btn" onClick={toggleSearchPanel}>×</button>
      </div>
      {isReplacePanelOpen && (
        <div className="replace-row">
          <span className="search-label">{t("search.replace")}:</span>
          <input className="search-input" value={replaceQuery} onChange={(e) => setReplaceQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runReplace(true); }} />
          <button className="search-btn" onClick={() => runReplace(false)}>替换</button>
          <button className="search-btn" onClick={() => runReplace(true)}>{t("search.replaceAll")}</button>
        </div>
      )}
    </div>
  );
}
