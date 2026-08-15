export interface SearchSummary {
  total_matches: number;
  files_matched: number;
  results: SearchResult[];
  truncated: boolean;
}

export interface SearchResult {
  path: string;
  line_number: number;
  line_content: string;
  match_start: number;
  match_end: number;
}
