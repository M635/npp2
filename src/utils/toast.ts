/** Minimal app-wide toast bus (no dependencies). */
export interface ToastMessage {
  id: number;
  text: string;
  kind: "info" | "error" | "success";
}

let toastSeq = 0;

export function toast(text: string, kind: ToastMessage["kind"] = "info"): void {
  window.dispatchEvent(new CustomEvent<ToastMessage>("npp2:toast", {
    detail: { id: ++toastSeq, text, kind },
  }));
}
