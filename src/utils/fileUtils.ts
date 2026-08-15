/**
 * File path helpers shared across the frontend.
 */

/** Return the trailing file name of a path (handles both / and \ separators). */
export function getFileName(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

/** Normalize a path to forward slashes for consistent comparisons and display. */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

/** Strip a leading directory path, returning the relative remainder. */
export function getRelativePath(base: string, path: string): string {
  const b = normalizePath(base).replace(/\/+$/, "");
  const p = normalizePath(path);
  if (p === b) return getFileName(p);
  if (p.startsWith(b + "/")) return p.slice(b.length + 1);
  return p;
}

/** Truncate a string to `max` characters, keeping the head and tail. */
export function truncatePath(text: string, max = 24): string {
  if (text.length <= max) return text;
  if (max < 6) return text.slice(0, max);
  const head = Math.ceil(max * 0.6);
  const tail = max - head - 1;
  return `${text.slice(0, head)}…${text.slice(-tail)}`;
}

/** Human readable file size. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = "B";
  for (const u of units) {
    value /= 1024;
    unit = u;
    if (value < 1024) break;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${unit}`;
}
