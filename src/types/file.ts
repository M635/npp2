export type EncodingType = "UTF-8" | "UTF-8-BOM" | "GBK" | "GB2312" | "UTF-16LE" | "UTF-16BE" | "ASCII" | "Unknown";
export type LineEnding = "Lf" | "Crlf" | "Mixed";

export interface FileMeta {
  path: string; size: number; encoding: EncodingType; is_binary: boolean; readonly: boolean;
  line_count: number; has_bom: boolean; line_ending: LineEnding;
}

export interface FileTab {
  id: string; path: string; name: string; content: string; meta: FileMeta | null;
  is_dirty: boolean; is_large_file: boolean; readonly: boolean;
  encoding: EncodingType; language: string;
  cursor_position: { line: number; column: number }; scroll_position: number; is_new: boolean;
}

export interface FileOpenResult {
  content: string; meta: FileMeta; is_large_file: boolean;
}

export interface SearchSummary {
  total_matches: number; files_matched: number; results: SearchResult[]; truncated: boolean;
}

export interface SearchResult {
  path: string; line_number: number; line_content: string; match_start: number; match_end: number;
}

export interface ChunkInfo {
  chunk_index: number; total_chunks: number; start_offset: number; end_offset: number;
  line_start: number; line_end: number; content: string; has_more: boolean;
}

export interface LargeFileInitResult {
  chunk: ChunkInfo; file_size: number; encoding: string; total_chunks: number;
}
