use std::fs;

fn rtf_escape(content: &str) -> String {
    let mut out = String::new();
    for ch in content.chars() {
        match ch {
            '\n' => out.push_str("\\par\n"),
            '\r' => {}
            '\t' => out.push_str("\\tab "),
            '\\' => out.push_str("\\\\"),
            '{' => out.push_str("\\{"),
            '}' => out.push_str("\\}"),
            c if (c as u32) < 128 => out.push(c),
            c => {
                let code = c as u32;
                out.push_str(&format!("\\u{}{}", code, if code > 32767 { -65536i64 + code as i64 } else { code as i64 }));
                out.push(' ');
            }
        }
    }
    out
}

#[tauri::command]
pub fn export_as_txt(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content.as_bytes()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_as_html(path: String, content: String, language: String) -> Result<(), String> {
    let _ = language;
    let highlighted = content
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\n", "<br>\n");
    let title = path.split(['/', '\\']).last().unwrap_or("export");
    let html = format!(r#"<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>{}</title>
<style>body{{font-family:Consolas,Monaco,monospace;font-size:13px;padding:20px;background:#fff;color:#333;}}
pre{{white-space:pre-wrap;}}</style>
</head><body><pre>{}</pre></body></html>"#, title, highlighted);
    fs::write(&path, html).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_as_rtf(path: String, content: String) -> Result<(), String> {
    let escaped = rtf_escape(&content);
    let rtf = format!(
        r#"{{\rtf1\ansi\deff0{{\fonttbl{{{{\f0\fmodern Consolas;}}}}}}\viewkind4\uc1\pard\f0\fs24 {}
}}"#,
        escaped
    );
    fs::write(&path, rtf).map_err(|e| e.to_string())
}
