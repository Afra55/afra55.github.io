# Afra55's DevTools

一个纯前端实用小工具集合站点，数据尽量在浏览器本地处理，不上传第三方。默认入口即工具页：

在线地址：**https://afra55.github.io/tools/**

## 站点说明

- **入口即工具**：打开 `afra55.github.io` 自动进入 `/tools/` 工具页，不再显示博客首页。历史文章保留在仓库中，但不再作为主入口。
- **纯前端 · 本地处理**：大部分功能在浏览器本地完成；需要系统能力的走本机桥（一次性启动 `http://127.0.0.1:17888`），不上传云端。
- **PWA 可安装**：可在 Chrome / Edge 加到桌面，在线打开自动拉新版，离线用上次缓存。

## 使用方式

- **单工具工作台**：同一时间只显示一个工具；用 hash 深链分享，例如 `#json`、`#vbb`
- **手机**：点顶栏「工具」打开抽屉；支持搜索与最近使用
- **桌面**：左侧分组导航；可拖拽排序（保存在本地），可恢复默认排序
- **分类导航**：GIF、视频、黑盒等独立侧栏分类；多工具分类在「仅显示分类」时顶栏有横向滚动条快速切换

## 已实现

- 时间戳转换 / 时间差计算 / Cron
- AHEX 颜色调节、HEX / RGB / HSL 互转、屏幕取色、密码生成
- Base64、图片转 Base64（预览）
- JSON 格式化、YAML ⇄ JSON、代码卡片分享图
- 正则测试、文本 Diff、文本处理、命名转换
- URL 编解码、Query / JWT 解析
- UUID 生成、MD5 / SHA-256
- 二维码生成/识别、进制转换、Markdown 预览、单位换算、坐标系互转（WGS84 / GCJ02 / BD09 / CGCS2000）
- **媒体**：GIF 合成/压缩/合并、拆帧 ZIP、转 WebM、视频转 GIF、视频切分、一键黑盒切片
- 图片工具：压缩/目标体积、改尺寸、WebP·JPEG·PNG·AVIF、高质量档（mozjpeg/oxipng/AVIF WASM）、裁剪、旋转翻转、批量 ZIP、文字/图片水印、圆角边框、EXIF 查看清除、九宫格、App 图标多尺寸、拼接
- ADB 工具：本机桥连接、多设备信息/状态快照、文件管理、APK 安装与信息分析、应用管理、HTTP 代理与端口转发、开发者选项、性能监控、进程列表与结束、交互 Shell、布局 dump、Logcat、输入自动化、剪贴板、截图录屏与任务中心（需本机 `adb`）
- **统一本机桥（17888）**：ADB / FFmpeg(`/ff`) / yt-dlp(`/ytdlp`) / Git(`/git`) 共用一座桥；完整包与环境管家一键装/更
- **FFmpeg 本机桥**：浏览本机目录、批量抽音频（MP3/M4A/WAV）、常用转码预设与任务队列（需本机 `ffmpeg`；默认走统一桥）
- **Git 可视化**：小白模式（更新/提交/amend/推送/Gerrit 送审/对齐线上/补丁/冲突）；默认统一桥 `/git`

分组大致为：时间 / 颜色 / 编码与安全 / 数据与文本 / 媒体 / 图片 / 换算 / 设备。

## 本机桥（一次启动，四能力共用）

网页不能直接调用系统工具。使用前确认本机已装 Node.js 与对应工具（`adb devices` / `ffmpeg -version` 可用），然后在对应工具页下载**完整 ZIP 包**（内含 `server.js` 与启动脚本），解压到同一目录后运行脚本；或执行：

```bash
node tools/adb-bridge/server.js
node tools/ffmpeg-bridge/server.js
```

> 注意：不要只下载启动脚本。缺少同目录的 `server.js` 会导致无法启动。

网页内也有独立指南：打开工具页 → **安装本机工具**（`#setup`），含 Node.js / ADB / FFmpeg 下载链接与分系统步骤。

## 本地预览

```bash
python3 -m http.server 8080 --directory .
```

打开 `http://localhost:8080/tools/`。

## 开发（新增/改工具）

1. 编辑 `tools/registry/tools.json`（groups / meta / about）
2. 生成运行时脚本：`node tools/scripts/build-tool-registry.cjs`
3. 同步 lazy-scripts、面板等后校验：`node tools/scripts/verify-registry.cjs`
4. 功能改动记得 `node tools/bump-version.cjs` 递增版本

详细约定见仓库 `AGENTS.md`。
