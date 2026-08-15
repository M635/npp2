mod commands;
mod models;
mod services;

use commands::file_watcher::WatcherState;
use services::watcher::FileWatcher;
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(WatcherState(FileWatcher::new()))
        .setup(|app| {
            let _ = commands::menu::build_menu(app.handle(), "zh");
            Ok(())
        })
        .on_menu_event(|app, event| {
            let _ = app.emit("menu-event", event.id().as_ref());
        })
        .invoke_handler(tauri::generate_handler![
            commands::file_io::open_file,
            commands::file_io::save_file,
            commands::file_io::save_file_as,
            commands::file_io::create_file,
            commands::file_io::get_file_meta,
            commands::file_io::list_directory,
            commands::file_io::get_file_info,
            commands::large_file::open_large_file,
            commands::large_file::read_chunk,
            commands::large_file::read_tail,
            commands::large_file::read_line_at,
            commands::large_file::is_large_file,
            commands::large_file::count_lines,
            commands::encoding::detect_encoding,
            commands::encoding::convert_encoding,
            commands::encoding::reload_with_encoding,
            commands::encoding::save_with_encoding,
            commands::encoding::get_supported_encodings,
            commands::search::find_in_files,
            commands::search::search_in_file,
            commands::export::export_as_txt,
            commands::export::export_as_html,
            commands::export::export_as_rtf,
            commands::menu::rebuild_menu,
            commands::settings::load_settings,
            commands::settings::save_settings,
            commands::file_watcher::watch_file,
            commands::file_watcher::unwatch_file,
            commands::file_watcher::unwatch_all,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
