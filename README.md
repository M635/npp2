# NPP2 — Notepad++ 跨平台复刻版

对标 Notepad++ 的跨平台代码/文本编辑器,基于 **Tauri 2 · Rust · React 18 · TypeScript · Monaco Editor** 构建,原生体积小、启动快。

## 特性

- **多标签编辑**:标签拖拽排序、右键菜单(关闭其他/全部/仅保留当前)、未保存关闭确认
- **语法高亮**:Monaco Editor 内置 50+ 语言(JS/TS/Python/Go/Rust/C/C++/C#/Java/HTML/CSS/JSON…),按扩展名自动识别
- **查找/替换**:正则、区分大小写、全词匹配、全部替换、匹配计数
- **在文件中查找**:Rayon 并行扫描目录,结果点击跳转
- **编码支持**:UTF-8 / UTF-8-BOM / GBK / GB2312 / UTF-16LE / UTF-16BE / UTF-32LE / ASCII,自动检测 + BOM 处理 + 一键切换
- **大文件**:>64MB 文件自动进入"前 8MB 只读预览"模式(分块读取后端已就绪)
- **文件浏览器**:侧边栏目录树、折叠/展开、从文件管理器拖拽文件到窗口打开
- **外部修改监听**:文件在外部被修改且本地无未保存更改时自动重载
- **原生菜单**:文件/编辑/查找/视图/编码/设置/帮助(中英双语,重建随语言切换)
- **命令面板**(Ctrl+P):快速执行 20+ 命令
- **编辑增强**:行操作(删除空行/去重/去行尾空格)、行排序、大小写转换、JSON 格式化、列选择、多光标、代码折叠、括号配对高亮
- **主题**:浅色/深色/跟随系统;编辑器字体、字号、Tab 宽度等全量可配置并持久化
- **自动保存**:可配置间隔,脏标签定时写盘
- **状态栏**:行/列、选中统计、行数、文件大小、编码切换、语言
- **i18n**:简体中文 / English

## 技术栈

Tauri 2.x · Rust · React 18 · TypeScript · Zustand · Monaco Editor · Vite

## 本地开发

```bash
pnpm install
pnpm tauri dev        # 开发模式
pnpm build            # 仅构建前端 (tsc + vite build)
pnpm tauri build      # 构建当前平台安装包
```

## 平台构建

| 平台 | 命令 | 产物 |
|---|---|---|
| macOS (Universal Intel+Apple Silicon) | `pnpm tauri build --target universal-apple-darwin --bundles app,dmg` | `.dmg` / `.app` |
| Windows x64 | `pnpm tauri build --bundles nsis` | NSIS 安装器 `.exe` |

GitHub Actions 已配置:push 到 `main` 自动构建 Windows 与 macOS 产物(Artifacts);推送 `v*` tag 自动发布到 GitHub Releases。

> 注:未签名构建,Windows SmartScreen 与 macOS Gatekeeper 可能提示未知开发者,选择"仍要打开"即可。

## 目录结构

```
src/                  # React 前端
  components/         # 布局/编辑器/标签/搜索/对话框
  stores/             # zustand 状态(文件/设置/搜索/编辑器)
  services/tauri/     # Tauri invoke 封装
  services/monaco/    # Monaco 本地化与主题
src-tauri/            # Rust 后端
  src/commands/       # 文件 IO/编码/大文件/搜索/导出/菜单/设置/文件监听
  src/services/       # 编码检测/分块读取/文件监听
  src/models/         # 数据模型
```

## 路线图

- 宏录制/回放
- 列编辑增强与矩形选择工具栏
- 多窗口/分屏对比
- 插件机制
- 大文件完整(可写)编辑
- 文件差异对比(对标 Compare 插件)
