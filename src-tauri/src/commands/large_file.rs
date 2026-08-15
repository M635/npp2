use crate::models::file_meta::{ChunkInfo, LargeFileInitResult};
use crate::services::chunk_reader;
use crate::services::encoding_detect;

const LARGE_FILE_THRESHOLD: u64 = 64 * 1024 * 1024;

#[tauri::command]
pub fn open_large_file(path: String) -> Result<LargeFileInitResult, String> {
    let reader = chunk_reader::ChunkReader::new(&path, None).map_err(|e| e.to_string())?;
    let file_size = reader.file_size();
    let total_chunks = reader.total_chunks();
    let first_chunk_bytes = reader.read_chunk(0).map_err(|e| e.to_string())?;
    let encoding = encoding_detect::detect_encoding(&first_chunk_bytes);
    let content = encoding_detect::decode_bytes(&first_chunk_bytes, &encoding);
    let line_start = content.lines().count() as u64;
    Ok(LargeFileInitResult {
        chunk: ChunkInfo { chunk_index: 0, total_chunks, start_offset: 0, end_offset: first_chunk_bytes.len() as u64, line_start: 1, line_end: line_start, content, has_more: total_chunks > 1 },
        file_size, encoding: encoding.as_str().to_string(), total_chunks,
    })
}

#[tauri::command]
pub fn read_chunk(path: String, chunk_index: u64) -> Result<ChunkInfo, String> {
    let reader = chunk_reader::ChunkReader::new(&path, None).map_err(|e| e.to_string())?;
    let total_chunks = reader.total_chunks();
    let chunk_bytes = reader.read_chunk(chunk_index).map_err(|e| e.to_string())?;
    let encoding = encoding_detect::detect_encoding(&chunk_bytes);
    let content = encoding_detect::decode_bytes(&chunk_bytes, &encoding);
    let start_offset = chunk_index * (8 * 1024 * 1024) as u64;
    let line_count = content.matches('\n').count() as u64;
    Ok(ChunkInfo { chunk_index, total_chunks, start_offset, end_offset: start_offset + chunk_bytes.len() as u64, line_start: 0, line_end: line_count, content, has_more: chunk_index + 1 < total_chunks })
}

#[tauri::command]
pub fn read_tail(path: String, tail_bytes: u64) -> Result<String, String> {
    let reader = chunk_reader::ChunkReader::new(&path, None).map_err(|e| e.to_string())?;
    let bytes = reader.read_tail(tail_bytes).map_err(|e| e.to_string())?;
    let encoding = encoding_detect::detect_encoding(&bytes);
    Ok(encoding_detect::decode_bytes(&bytes, &encoding))
}

#[tauri::command]
pub fn read_line_at(path: String, line_number: u64) -> Result<(u64, String), String> {
    chunk_reader::ChunkReader::new(&path, None)?.read_line_at(line_number).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn is_large_file(path: String) -> Result<bool, String> {
    let size = std::fs::metadata(&path).map_err(|e| e.to_string())?.len();
    Ok(size > LARGE_FILE_THRESHOLD)
}

#[tauri::command]
pub fn count_lines(path: String) -> Result<u64, String> {
    chunk_reader::ChunkReader::new(&path, None)?.count_lines().map_err(|e| e.to_string())
}
