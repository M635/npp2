import { useEffect } from "react";

export function useKeyboardShortcuts(handlers: Record<string, () => void>) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const key = e.ctrlKey || e.metaKey ? `ctrl+${e.key.toLowerCase()}` : e.key.toLowerCase();
      const handler = handlers[key];
      if (handler) { e.preventDefault(); handler(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handlers]);
}
