use crate::models::file_meta::{Encoding, FileMeta, LineEnding};
use crate::services::encoding_detect;
use std::fs;
use std::path::Path;

#[tauri::command]
pub fn open_file(path: String) -> Result<FileOpenResult, String> {
    let path_ref = Path::new(&path);
    if !path_ref.exists() { return Err("文件不存在".to_string()); }

    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
    let file_size = metadata.len();
    let readonly = metadata.permissions().readonly();

    let read_size = std::cmp::min(file_size as usize, 8192);
    let mut sample = vec![0u8; read_size];
    if read_size > 0 {
        use std::io::Read;
        let mut file = fs::File::open(&path).map_err(|e| e.to_string())?;
        file.read_exact(&mut sample).map_err(|e| e.to_string())?;
    }

    let is_binary = encoding_detect::is_binary(&sample);
    let encoding = if is_binary { Encoding::Unknown } else { encoding_detect::detect_encoding(&sample) };
    let has_bom = sample.starts_with(&[0xEF, 0xBB, 0xBF]);

    let content = if file_size <= 64 * 1024 * 1024 && !is_binary {
        let bytes = fs::read(&path).map_err(|e| e.to_string())?;
        encoding_detect::decode_bytes(&bytes, &encoding)
    } else { String::new() };

    let line_ending = detect_line_ending(&content);
    let line_count = content.matches('\n').count() as u64 + 1;

    Ok(FileOpenResult {
        content,
        meta: FileMeta { path: path.clone(), size: file_size, encoding, is_binary, readonly, line_count, has_bom, line_ending },
        is_large_file: file_size > 64 * 1024 * 1024,
    })
}

#[derive(serde::Serialize)]
pub struct FileOpenResult {
    pub content: String,
    pub meta: FileMeta,
    pub is_large_file: bool,
}

#[tauri::command]
pub fn save_file(path: String, content: String, encoding: String) -> Result<(), String> {
    let enc = Encoding::from_str(&encoding);
    let bytes = encoding_detect::encode_string(&content, &enc);
    fs::write(&path, bytes).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn save_file_as(path: String, content: String, encoding: String) -> Result<(), String> {
    save_file(path, content, encoding)
}

#[tauri::command]
pub fn create_file(path: String) -> Result<(), String> {
    let path_ref = Path::new(&path);
    if let Some(parent) = path_ref.parent() {
        if !parent.exists() { fs::create_dir_all(parent).map_err(|e| e.to_string())?; }
    }
    fs::write(&path, "").map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_file_meta(path: String) -> Result<FileMeta, String> {
    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
    let file_size = metadata.len();
    let readonly = metadata.permissions().readonly();
    let read_size = std::cmp::min(file_size as usize, 8192);
    let sample = if read_size > 0 {
        let mut s = vec![0u8; read_size];
        use std::io::Read;
        let mut file = fs::File::open(&path).map_err(|e| e.to_string())?;
        file.read_exact(&mut s).map_err(|e| e.to_string())?;
        s
    } else { Vec::new() };
    let is_binary = encoding_detect::is_binary(&sample);
    let encoding = encoding_detect::detect_encoding(&sample);
    let has_bom = sample.starts_with(&[0xEF, 0xBB, 0xBF]);
    Ok(FileMeta { path, size: file_size, encoding, is_binary, readonly, line_count: 0, has_bom, line_ending: LineEnding::Lf })
}

#[tauri::command]
pub fn list_directory(path: String) -> Result<Vec<(String, bool)>, String> {
    let mut entries: Vec<(String, bool)> = Vec::new();
    let dir = fs::read_dir(&path).map_err(|e| e.to_string())?;
    for entry in dir {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') && name != ".env" { continue; }
        let is_dir = entry.file_type().map_err(|e| e.to_string())?.is_dir();
        entries.push((name, is_dir));
    }
    Ok(entries)
}

#[tauri::command]
pub fn get_file_info(path: String) -> Result<FileInfo, String> {
    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
    Ok(FileInfo { size: metadata.len(), is_dir: metadata.is_dir(), is_readonly: metadata.permissions().readonly(), modified: metadata.modified().ok().and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok()).map(|d| d.as_secs()).unwrap_or(0) })
}

#[derive(serde::Serialize)]
pub struct FileInfo { pub size: u64, pub is_dir: bool, pub is_readonly: bool, pub modified: u64 }

fn detect_line_ending(content: &str) -> LineEnding {
    let has_crlf = content.contains("\r\n");
    let has_lf = content.contains('\n') && !has_crlf;
    let has_bare_lf = content.replace("\r\n", "").contains('\n');
    if has_crlf && has_bare_lf { LineEnding::Mixed }
    else if has_crlf { LineEnding::Crlf }
    else { LineEnding::Lf }
}
