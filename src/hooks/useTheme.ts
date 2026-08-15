import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { ThemeMode } from "../types/theme";

export function useTheme(mode: ThemeMode): { isDark: boolean } {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    if (mode !== "auto") { setIsDark(mode === "dark"); return; }
    (async () => {
      try {
        const win = getCurrentWindow();
        const theme = await win.theme();
        setIsDark(theme === "dark");
      } catch {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        setIsDark(mq.matches);
        const h = (e: MediaQueryListEvent) => setIsDark(e.matches);
        mq.addEventListener("change", h);
        return () => mq.removeEventListener("change", h);
      }
    })();
  }, [mode]);
  return { isDark };
}
