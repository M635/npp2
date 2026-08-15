use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum Encoding {
    #[serde(rename = "UTF-8")]
    Utf8,
    #[serde(rename = "UTF-8-BOM")]
    Utf8Bom,
    #[serde(rename = "GBK")]
    Gbk,
    #[serde(rename = "GB2312")]
    Gb2312,
    #[serde(rename = "UTF-16LE")]
    Utf16Le,
    #[serde(rename = "UTF-16BE")]
    Utf16Be,
    #[serde(rename = "UTF-32LE")]
    Utf32Le,
    #[serde(rename = "ASCII")]
    Ascii,
    #[serde(rename = "Unknown")]
    Unknown,
}

impl Encoding {
    pub fn as_str(&self) -> &'static str {
        match self {
            Encoding::Utf8 => "UTF-8",
            Encoding::Utf8Bom => "UTF-8-BOM",
            Encoding::Gbk => "GBK",
            Encoding::Gb2312 => "GB2312",
            Encoding::Utf16Le => "UTF-16LE",
            Encoding::Utf16Be => "UTF-16BE",
            Encoding::Utf32Le => "UTF-32LE",
            Encoding::Ascii => "ASCII",
            Encoding::Unknown => "Unknown",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s.to_uppercase().as_str() {
            "UTF-8" => Encoding::Utf8,
            "UTF-8-BOM" => Encoding::Utf8Bom,
            "GBK" => Encoding::Gbk,
            "GB2312" => Encoding::Gb2312,
            "UTF-16LE" => Encoding::Utf16Le,
            "UTF-16BE" => Encoding::Utf16Be,
            "UTF-32LE" => Encoding::Utf32Le,
            "ASCII" => Encoding::Ascii,
            _ => Encoding::Unknown,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMeta {
    pub path: String,
    pub size: u64,
    pub encoding: Encoding,
    pub is_binary: bool,
    pub readonly: bool,
    pub line_count: u64,
    pub has_bom: bool,
    pub line_ending: LineEnding,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LineEnding {
    Lf,
    Crlf,
    Mixed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub path: String,
    pub line_number: u64,
    pub line_content: String,
    pub match_start: usize,
    pub match_end: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchSummary {
    pub total_matches: u64,
    pub files_matched: u64,
    pub results: Vec<SearchResult>,
    pub truncated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChunkInfo {
    pub chunk_index: u64,
    pub total_chunks: u64,
    pub start_offset: u64,
    pub end_offset: u64,
    pub line_start: u64,
    pub line_end: u64,
    pub content: String,
    pub has_more: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LargeFileInitResult {
    pub chunk: ChunkInfo,
    pub file_size: u64,
    pub encoding: String,
    pub total_chunks: u64,
}
