use crate::models::file_meta::{SearchResult, SearchSummary};
use regex::Regex;
use std::fs;
use std::sync::Arc;
use walkdir::WalkDir;
use rayon::iter::{IntoParallelRefIterator, ParallelIterator};

const MAX_RESULTS: usize = 5000;
const MAX_LINE_LENGTH: usize = 500;
const MAX_FILE_SIZE: u64 = 10 * 1024 * 1024;

struct FileSearchResult { path: String, matches: Vec<SearchResult>, match_count: u64 }

fn read_text_lossy(path: &std::path::Path) -> Option<String> {
    let meta = fs::metadata(path).ok()?;
    if meta.len() > MAX_FILE_SIZE { return None; }
    let bytes = fs::read(path).ok()?;
    if bytes.iter().any(|&b| b == 0) { return None; } // binary
    Some(String::from_utf8_lossy(&bytes).into_owned())
}

#[tauri::command]
pub fn find_in_files(directory: String, pattern: String, is_regex: bool, case_sensitive: bool, file_extensions: Option<Vec<String>>) -> Result<SearchSummary, String> {
    let regex_pattern = if is_regex { pattern.clone() } else { regex::escape(&pattern) };
    let flags = if case_sensitive { "" } else { "(?i)" };
    let full_pattern = format!("{}{}", flags, regex_pattern);
    let re = Arc::new(Regex::new(&full_pattern).map_err(|e| format!("正则错误: {}", e))?);

    let ext_filter = file_extensions.map(|exts| {
        exts.iter().map(|e| {
            let lower = e.to_lowercase();
            if lower.starts_with('.') { lower } else { format!(".{}", lower) }
        }).collect::<Vec<_>>()
    });

    let entries: Vec<_> = WalkDir::new(&directory)
        .into_iter().filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .filter(|e| !e.path().to_string_lossy().contains("/.git/"))
        .collect();

    let results: Vec<FileSearchResult> = entries.par_iter()
        .map(|entry| {
            let path = entry.path();
            let path_str = path.to_string_lossy().to_string();
            if let Some(ref filter) = ext_filter {
                let ext = path.extension().map(|e| format!(".{}", e.to_string_lossy().to_lowercase())).unwrap_or_default();
                if !filter.contains(&ext) { return None; }
            }
            let content = read_text_lossy(path)?;
            let mut matches = Vec::new();
            let mut match_count = 0u64;
            for (line_idx, line) in content.lines().enumerate() {
                if line.chars().count() > MAX_LINE_LENGTH * 2 { continue; }
                for mat in re.find_iter(line) {
                    match_count += 1;
                    if matches.len() < MAX_RESULTS {
                        let line_content = if line.chars().count() > MAX_LINE_LENGTH {
                            let truncated: String = line.chars().take(MAX_LINE_LENGTH).collect();
                            format!("{}...", truncated)
                        } else {
                            line.to_string()
                        };
                        matches.push(SearchResult { path: path_str.clone(), line_number: (line_idx + 1) as u64, line_content, match_start: mat.start(), match_end: mat.end() });
                    }
                }
            }
            Some(FileSearchResult { path: path_str, matches, match_count })
        }).filter_map(|r| r).collect();

    let mut all_matches = Vec::with_capacity(MAX_RESULTS);
    let mut total_matches = 0u64;
    let mut files_matched = 0u64;
    let mut truncated = false;

    for file_result in results {
        if file_result.match_count == 0 { continue; }
        files_matched += 1;
        total_matches += file_result.match_count;
        let remaining = MAX_RESULTS - all_matches.len();
        if remaining == 0 { truncated = true; break; }
        let take = file_result.matches.len().min(remaining);
        all_matches.extend_from_slice(&file_result.matches[..take]);
        if file_result.matches.len() > remaining { truncated = true; }
    }
    if all_matches.len() >= MAX_RESULTS { truncated = true; }

    Ok(SearchSummary { total_matches, files_matched, results: all_matches, truncated })
}

#[tauri::command]
pub fn search_in_file(path: String, pattern: String, is_regex: bool, case_sensitive: bool) -> Result<SearchSummary, String> {
    let regex_pattern = if is_regex { pattern.clone() } else { regex::escape(&pattern) };
    let flags = if case_sensitive { "" } else { "(?i)" };
    let re = Regex::new(&format!("{}{}", flags, regex_pattern)).map_err(|e| format!("正则错误: {}", e))?;
    let content = read_text_lossy(std::path::Path::new(&path)).ok_or_else(|| "无法读取文件".to_string())?;
    let mut results = Vec::new();
    let mut total_matches = 0u64;

    for (line_idx, line) in content.lines().enumerate() {
        for mat in re.find_iter(line) {
            if results.len() >= MAX_RESULTS { break; }
            results.push(SearchResult { path: path.clone(), line_number: (line_idx + 1) as u64, line_content: line.to_string(), match_start: mat.start(), match_end: mat.end() });
            total_matches += 1;
        }
        if results.len() >= MAX_RESULTS { break; }
    }
    let results_len = results.len();
    Ok(SearchSummary { total_matches, files_matched: if total_matches > 0 { 1 } else { 0 }, results, truncated: results_len >= MAX_RESULTS })
}
