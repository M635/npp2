use tauri::{AppHandle, Emitter};
use tauri::menu::{Menu, MenuItem, Submenu};

fn tr<'a>(lang: &str, zh: &'a str, en: &'a str) -> &'a str {
    if lang == "en" { en } else { zh }
}

macro_rules! m {
    ($app:expr, $id:literal, $zh:expr, $en:expr, $lang:expr) => {
        MenuItem::with_id($app, $id, tr($lang, $zh, $en), true, None::<&str>)?
    };
}

pub fn build_menu(app_handle: &AppHandle, lang: &str) -> tauri::Result<()> {
    let file = Submenu::with_items(app_handle, tr(lang, "文件(&F)", "File(&F)"), true, &[
        &m!(app_handle, "new", "新建", "New", lang),
        &m!(app_handle, "open", "打开...", "Open...", lang),
        &m!(app_handle, "open_folder", "打开文件夹...", "Open Folder...", lang),
        &m!(app_handle, "open_with_encoding", "按编码打开...", "Open with Encoding...", lang),
        &m!(app_handle, "reload_from_disk", "从磁盘重载", "Reload from Disk", lang),
        &m!(app_handle, "save", "保存", "Save", lang),
        &m!(app_handle, "save_as", "另存为...", "Save As...", lang),
        &m!(app_handle, "save_all", "全部保存", "Save All", lang),
        &m!(app_handle, "close", "关闭标签页", "Close Tab", lang),
        &m!(app_handle, "close_all", "关闭所有标签页", "Close All Tabs", lang),
        &m!(app_handle, "copy_path", "复制文件路径", "Copy File Path", lang),
        &m!(app_handle, "file_props", "文件属性...", "File Properties...", lang),
        &m!(app_handle, "quit", "退出 NPP2", "Quit NPP2", lang),
    ])?;

    let edit = Submenu::with_items(app_handle, tr(lang, "编辑(&E)", "Edit(&E)"), true, &[
        &m!(app_handle, "edit_undo", "撤销", "Undo", lang),
        &m!(app_handle, "edit_redo", "重做", "Redo", lang),
        &m!(app_handle, "edit_cut", "剪切", "Cut", lang),
        &m!(app_handle, "edit_copy", "复制", "Copy", lang),
        &m!(app_handle, "edit_paste", "粘贴", "Paste", lang),
        &m!(app_handle, "edit_delete_line", "删除当前行", "Delete Current Line", lang),
        &m!(app_handle, "edit_duplicate_line", "复制当前行", "Duplicate Current Line", lang),
        &m!(app_handle, "edit_move_up", "上移行", "Move Line Up", lang),
        &m!(app_handle, "edit_move_down", "下移行", "Move Line Down", lang),
        &m!(app_handle, "edit_toggle_comment", "切换注释", "Toggle Comment", lang),
        &Submenu::with_items(app_handle, tr(lang, "大小写转换", "Change Case"), true, &[
            &m!(app_handle, "edit_upper", "转大写", "UPPERCASE", lang),
            &m!(app_handle, "edit_lower", "转小写", "lowercase", lang),
            &m!(app_handle, "edit_title_case", "首字母大写", "Title Case", lang),
        ])?,
        &Submenu::with_items(app_handle, tr(lang, "行排序", "Line Sort"), true, &[
            &m!(app_handle, "edit_sort_asc", "升序", "Sort Ascending", lang),
            &m!(app_handle, "edit_sort_desc", "降序", "Sort Descending", lang),
            &m!(app_handle, "edit_sort_length_asc", "按长度升序", "Sort by Length", lang),
        ])?,
        &Submenu::with_items(app_handle, tr(lang, "行操作", "Line Operations"), true, &[
            &m!(app_handle, "edit_delete_blank", "删除空行", "Delete Blank Lines", lang),
            &m!(app_handle, "edit_remove_dup", "去重复行", "Remove Duplicate Lines", lang),
            &m!(app_handle, "edit_trim_trailing", "去行尾空格", "Trim Trailing Spaces", lang),
        ])?,
        &m!(app_handle, "format_json", "格式化 JSON", "Format JSON", lang),
    ])?;

    let search = Submenu::with_items(app_handle, tr(lang, "查找(&S)", "Search(&S)"), true, &[
        &m!(app_handle, "find", "查找...", "Find...", lang),
        &m!(app_handle, "replace", "替换...", "Replace...", lang),
        &m!(app_handle, "find_in_files", "在文件中查找...", "Find in Files...", lang),
        &m!(app_handle, "goto", "转到行...", "Go to Line...", lang),
    ])?;

    let view = Submenu::with_items(app_handle, tr(lang, "视图(&V)", "View(&V)"), true, &[
        &m!(app_handle, "toggle_sidebar", "切换侧边栏", "Toggle Sidebar", lang),
        &m!(app_handle, "command_palette", "命令面板...", "Command Palette...", lang),
        &m!(app_handle, "toggle_word_wrap", "自动换行", "Word Wrap", lang),
        &m!(app_handle, "zoom_in", "放大", "Zoom In", lang),
        &m!(app_handle, "zoom_out", "缩小", "Zoom Out", lang),
        &m!(app_handle, "zoom_reset", "重置缩放", "Reset Zoom", lang),
        &m!(app_handle, "toggle_theme", "切换主题", "Toggle Theme", lang),
        &m!(app_handle, "full_screen", "全屏", "Full Screen", lang),
    ])?;

    let encoding = Submenu::with_items(app_handle, tr(lang, "编码(&C)", "Encoding(&C)"), true, &[
        &m!(app_handle, "encoding_utf8", "UTF-8", "UTF-8", lang),
        &m!(app_handle, "encoding_utf8_bom", "UTF-8-BOM", "UTF-8-BOM", lang),
        &m!(app_handle, "encoding_gbk", "GBK", "GBK", lang),
        &m!(app_handle, "encoding_utf16le", "UTF-16LE", "UTF-16LE", lang),
        &m!(app_handle, "encoding_utf16be", "UTF-16BE", "UTF-16BE", lang),
    ])?;

    let settings = Submenu::with_items(app_handle, tr(lang, "设置(&T)", "Settings(&T)"), true, &[
        &m!(app_handle, "settings", "首选项...", "Preferences...", lang),
        &m!(app_handle, "shortcuts", "快捷键...", "Keyboard Shortcuts...", lang),
    ])?;

    let help = Submenu::with_items(app_handle, tr(lang, "帮助(&H)", "Help(&H)"), true, &[
        &m!(app_handle, "about", "关于 NPP2", "About NPP2", lang),
    ])?;

    let menu = Menu::with_items(app_handle, &[&file, &edit, &search, &view, &encoding, &settings, &help])?;
    app_handle.set_menu(menu)?;
    Ok(())
}

#[tauri::command]
pub fn rebuild_menu(app: AppHandle, lang: String) {
    let _ = build_menu(&app, &lang);
    let _ = app.emit("menu-rebuilt", &lang);
}
