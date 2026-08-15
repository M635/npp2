use serde_json::Value;
use tauri::{AppHandle, Manager};

/// Load the persisted settings JSON (user config dir). Missing file -> empty object.
#[tauri::command]
pub fn load_settings(app: AppHandle) -> Result<Value, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let file = dir.join("settings.json");
    if !file.exists() {
        return Ok(serde_json::json!({}));
    }
    let text = std::fs::read_to_string(&file).map_err(|e| e.to_string())?;
    serde_json::from_str(&text).map_err(|e| e.to_string())
}

/// Persist the settings JSON (user config dir).
#[tauri::command]
pub fn save_settings(app: AppHandle, settings: Value) -> Result<(), String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let file = dir.join("settings.json");
    let text = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    std::fs::write(&file, text).map_err(|e| e.to_string())
}
