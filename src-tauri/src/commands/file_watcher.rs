use crate::services::watcher::FileWatcher;
use std::sync::Mutex as StdMutex;
use tauri::AppHandle;

pub struct WatcherState(pub StdMutex<FileWatcher>);

#[tauri::command]
pub fn watch_file(state: tauri::State<WatcherState>, app: AppHandle, path: String) -> Result<(), String> {
    let mut watcher = state.0.lock().unwrap();
    watcher.watch(path, app).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn unwatch_file(state: tauri::State<WatcherState>, path: String) -> Result<(), String> {
    let mut watcher = state.0.lock().unwrap();
    watcher.unwatch(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn unwatch_all(state: tauri::State<WatcherState>) -> Result<(), String> {
    let mut watcher = state.0.lock().unwrap();
    watcher.unwatch_all();
    Ok(())
}
