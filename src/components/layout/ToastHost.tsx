import { useEffect, useState } from "react";
import type { ToastMessage } from "../../utils/toast";

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const msg = (e as CustomEvent<ToastMessage>).detail;
      setToasts((list) => [...list, msg]);
      setTimeout(() => setToasts((list) => list.filter((t) => t.id !== msg.id)), 3200);
    };
    window.addEventListener("npp2:toast", onToast);
    return () => window.removeEventListener("npp2:toast", onToast);
  }, []);

  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>{t.text}</div>
      ))}
    </div>
  );
}
