use crate::models::file_meta::Encoding;
use crate::services::encoding_detect;

#[tauri::command]
pub fn detect_encoding(path: String) -> Result<String, String> {
    let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    let sample = if bytes.len() > 8192 { &bytes[..8192] } else { &bytes };
    Ok(encoding_detect::detect_encoding(sample).as_str().to_string())
}

#[tauri::command]
pub fn convert_encoding(content: String, from_encoding: String, to_encoding: String) -> Result<String, String> {
    let from = Encoding::from_str(&from_encoding);
    let to = Encoding::from_str(&to_encoding);
    let bytes = encoding_detect::encode_string(&content, &from);
    Ok(encoding_detect::decode_bytes(&bytes, &to))
}

#[tauri::command]
pub fn reload_with_encoding(path: String, encoding: String) -> Result<String, String> {
    let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    let enc = Encoding::from_str(&encoding);
    Ok(encoding_detect::decode_bytes(&bytes, &enc))
}

#[tauri::command]
pub fn save_with_encoding(path: String, content: String, encoding: String) -> Result<(), String> {
    let enc = Encoding::from_str(&encoding);
    let bytes = encoding_detect::encode_string(&content, &enc);
    std::fs::write(&path, bytes).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_supported_encodings() -> Vec<String> {
    vec!["UTF-8".into(), "UTF-8-BOM".into(), "GBK".into(), "GB2312".into(), "UTF-16LE".into(), "UTF-16BE".into(), "ASCII".into()]
}
