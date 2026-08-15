import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { watchFile, unwatchFile } from "../services/tauri/fileService";

export function useFileWatcher(path: string | null, onChanged: (p: string) => void) {
  useEffect(() => {
    if (!path) return;
    let unlisten: (() => void) | null = null;
    let active = true;
    (async () => {
      try {
        unlisten = await listen<{ path: string }>("file-changed", (e) => {
          if (e.payload.path === path && active) onChanged(path);
        });
      } catch {}
      if (active) await watchFile(path).catch(() => {});
    })();
    return () => {
      active = false;
      if (unlisten) unlisten();
      unwatchFile(path).catch(() => {});
    };
  }, [path, onChanged]);
}
