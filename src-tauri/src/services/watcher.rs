use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::mpsc::channel;
use tauri::{AppHandle, Emitter};

/// A minimal multi-path file watcher. One OS watcher instance is reused for
/// every watched path; change events are forwarded to the frontend as
/// `file-changed` events carrying `{ path }`.
pub struct FileWatcher {
    watcher: Option<RecommendedWatcher>,
    paths: HashSet<PathBuf>,
}

impl FileWatcher {
    pub fn new() -> Self {
        Self { watcher: None, paths: HashSet::new() }
    }

    pub fn watch(&mut self, path: String, app: AppHandle) -> Result<(), String> {
        let path_buf = PathBuf::from(&path);
        if self.paths.contains(&path_buf) {
            return Ok(());
        }
        if self.watcher.is_none() {
            let (tx, rx) = channel();
            let watcher = RecommendedWatcher::new(tx, Config::default()).map_err(|e| e.to_string())?;
            std::thread::spawn(move || {
                for event in rx {
                    if let Ok(notify::Event { paths, .. }) = event {
                        for p in paths {
                            let _ = app.emit("file-changed", serde_json::json!({ "path": p.to_string_lossy() }));
                        }
                    }
                }
            });
            self.watcher = Some(watcher);
        }
        self.watcher.as_ref().unwrap().watch(&path_buf, RecursiveMode::NonRecursive).map_err(|e| e.to_string())?;
        self.paths.insert(path_buf);
        Ok(())
    }

    pub fn unwatch(&mut self, path: String) -> Result<(), String> {
        let path_buf = PathBuf::from(path);
        if let Some(watcher) = self.watcher.as_ref() {
            let _ = watcher.unwatch(&path_buf);
        }
        self.paths.remove(&path_buf);
        Ok(())
    }

    pub fn unwatch_all(&mut self) {
        if let Some(watcher) = self.watcher.as_ref() {
            for p in &self.paths {
                let _ = watcher.unwatch(p);
            }
        }
        self.paths.clear();
        self.watcher = None;
    }
}
