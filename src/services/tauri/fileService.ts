import { invoke } from "@tauri-apps/api/core";
import type { FileOpenResult, FileMeta, SearchSummary, LargeFileInitResult } from "../../types/file";

export async function openFile(path: string): Promise<FileOpenResult> {
  return invoke<FileOpenResult>("open_file", { path });
}

export async function saveFile(path: string, content: string, encoding: string): Promise<void> {
  await invoke("save_file", { path, content, encoding });
}

export async function saveFileAs(path: string, content: string, encoding: string): Promise<void> {
  await invoke("save_file_as", { path, content, encoding });
}

export async function createFile(path: string): Promise<void> {
  await invoke("create_file", { path });
}

export async function getSupportedEncodings(): Promise<string[]> {
  return invoke<string[]>("get_supported_encodings");
}

export async function detectEncoding(path: string): Promise<string> {
  return invoke<string>("detect_encoding", { path });
}

export async function convertEncoding(content: string, from: string, to: string): Promise<string> {
  return invoke<string>("convert_encoding", { content, fromEncoding: from, toEncoding: to });
}

export async function saveWithEncoding(path: string, content: string, encoding: string): Promise<void> {
  await invoke("save_with_encoding", { path, content, encoding });
}

export async function listDirectory(path: string): Promise<[string, boolean][]> {
  return invoke<[string, boolean][]>("list_directory", { path });
}

export async function getFileMeta(path: string): Promise<FileMeta> {
  return invoke<FileMeta>("get_file_meta", { path });
}

export async function findInFiles(directory: string, pattern: string, isRegex: boolean, caseSensitive: boolean, fileExtensions?: string[]) {
  return invoke<SearchSummary>("find_in_files", { directory, pattern, isRegex, caseSensitive, fileExtensions });
}

export async function searchInFile(path: string, pattern: string, isRegex: boolean, caseSensitive: boolean) {
  return invoke<SearchSummary>("search_in_file", { path, pattern, isRegex, caseSensitive });
}

export async function watchFile(path: string): Promise<void> {
  await invoke("watch_file", { path });
}

export async function unwatchFile(path: string): Promise<void> {
  await invoke("unwatch_file", { path });
}

export async function unwatchAll(): Promise<void> {
  await invoke("unwatch_all");
}

export async function loadSettings(): Promise<Record<string, unknown>> {
  return invoke<Record<string, unknown>>("load_settings");
}

export async function saveSettings(settings: Record<string, unknown>): Promise<void> {
  await invoke("save_settings", { settings });
}

export async function openLargeFile(path: string): Promise<LargeFileInitResult> {
  return invoke<LargeFileInitResult>("open_large_file", { path });
}

export async function readChunk(path: string, chunkIndex: number) {
  return invoke("read_chunk", { path, chunkIndex });
}
