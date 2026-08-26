# Typography

<p align="center"><strong>在 Obsidian 中完成公众号排版、AI 创作、图片处理与微信草稿发布</strong></p>

<p align="center">
  <img alt="Obsidian" src="https://img.shields.io/badge/Obsidian-1.11.4%2B-7C3AED?logo=obsidian&logoColor=white">
  <img alt="Version" src="https://img.shields.io/badge/version-1.1.0-2563EB">
  <img alt="Platform" src="https://img.shields.io/badge/platform-desktop-334155">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-16A34A">
</p>

Typography 是一个本地优先的 Obsidian 桌面端插件。它可以把 Markdown 转换为适合微信公众号的富文本 HTML，并提供实时预览、主题排版、AI 写作、图片生成、文章检查和微信草稿发布能力。


<!-- 截图后删除占位框，并取消注释：
![Typography 工作台](docs/images/01-workbench.png)
-->
<table><tr><td align="center"><strong>📷 主界面截图位置</strong><br>截取工具栏、操作区和文章预览全景<br><code>docs/images/01-workbench.png</code> · 建议 1600×900</td></tr></table>

## ✨ 功能亮点

- **本地 Markdown 排版**：实时转换、预览、复制富文本和导出 HTML。
- **丰富主题**：官网主题、可能吧主题、AI 主题与先锋模板。
- **高级布局**：支持提示卡、对话、步骤、时间线、指标和画廊等 `:::module` 语法。
- **公众号兼容**：展开字体与颜色，清理空段落并提供发布安全样式。
- **本地图片处理**：兼容 Wiki 图片、相对路径、中文和空格文件名。
- **AI 创作**：写文章、自然化、生成标题、封面和信息图。
- **多模型连接**：OpenAI-compatible、Anthropic、OpenRouter、DeepSeek、Codex Runtime 和自定义网关。
- **微信草稿发布**：上传封面与正文图片并创建公众号草稿。
- **隐私优先**：API Key 使用 Obsidian SecretStorage 保存。

## 🎨 排版与主题

主题、字号和背景可在工作台顶部即时切换。先锋模板提供更强的视觉层级，并为微信公众号提供兼容回退。

<!-- ![主题与排版预览](docs/images/02-theme-preview.png) -->
<table><tr><td align="center"><strong>📷 主题预览截图位置</strong><br>展开主题选择器，同时展示标题、正文、引用和图片<br><code>docs/images/02-theme-preview.png</code> · 建议 1400×900</td></tr></table>

### Liquid Glass 代码块

Obsidian 预览使用背景模糊增强玻璃质感；复制或发布到微信公众号时自动切换为兼容的渐变、圆角和阴影样式。

<!-- ![Liquid Glass 代码块](docs/images/03-liquid-glass-code.png) -->
<table><tr><td align="center"><strong>📷 玻璃代码块截图位置</strong><br>展示代码图标、语言名称、圆角卡片和完整代码内容<br><code>docs/images/03-liquid-glass-code.png</code> · 建议 1200×700</td></tr></table>

## 🤖 AI 模型控制中心

每个提供商拥有独立的协议、Base URL、认证方式、模型、超时、Token、Temperature 和自定义请求头。文本任务与图片任务可以分别路由。

支持检测 `.claude/settings.json`、`.codex/config.toml`、Claude API 配置和 Codex 本地登录会话。

<!-- ![模型控制中心](docs/images/04-model-center.png) -->
<table><tr><td align="center"><strong>📷 模型控制中心截图位置</strong><br>展示提供商列表、连接状态和任务路由；务必遮挡密钥和本机路径<br><code>docs/images/04-model-center.png</code> · 建议 1500×900</td></tr></table>

<!-- ![AI 任务面板](docs/images/05-ai-task.png) -->
<table><tr><td align="center"><strong>📷 AI 任务面板截图位置</strong><br>运行标题生成或自然化任务，展示步骤时间线与实时输出<br><code>docs/images/05-ai-task.png</code> · 建议 1400×900</td></tr></table>

## 📮 发布到微信公众号

1. 在插件设置中填写微信公众号 `AppID` 和 `AppSecret`。
2. 将当前出口 IP 加入公众号后台白名单。
3. 在文章 frontmatter 中设置 `cover`，或选择默认封面。
4. 执行 **微信：创建当前文章草稿**。
5. 登录微信公众号后台，在草稿箱中预览、编辑或发布。

```yaml
---
title: 示例文章标题
author: 作者名称
digest: 文章摘要
cover: assets/cover.png
---
```

<!-- ![微信草稿创建成功](docs/images/06-wechat-draft.png) -->
<table><tr><td align="center"><strong>📷 微信草稿截图位置</strong><br>截取“草稿已创建”提示或后台草稿卡片；遮挡账号和素材 ID<br><code>docs/images/06-wechat-draft.png</code> · 建议 1200×700</td></tr></table>

## 📦 安装

### 手动安装

1. 下载 Release 中的 `main.js`、`manifest.json` 和 `styles.css`。
2. 将三个文件放入：

   ```text
   <你的仓库>/.obsidian/plugins/typography/
   ```

3. 重启 Obsidian，在 **设置 → 第三方插件** 中启用 **Typography**。

### 从源码构建

需要 Node.js 18 或更高版本。

```bash
git clone <YOUR_REPOSITORY_URL>
cd typography
npm ci
npm run build
```

## 🚀 快速使用

1. 打开一篇 Markdown 文章。
2. 点击左侧排版图标，或在命令面板运行 **本地排版并预览**。
3. 选择主题、字号和背景。
4. 点击复制，将富文本粘贴到微信公众号编辑器。

有编辑器选区时只排版选区；没有选区时排版全文。源文件修改后，工作台会自动刷新。

## 🧩 Markdown 扩展示例

````markdown
## 章节标题

==重点高亮==、++下划线++

:::tip
这里是一段提示内容。
:::

:::metrics
访问量 | 12,800
转化率 | 18.6%
:::

```bash
npm run build
```
````

## 🔐 隐私与安全

- 本地排版、预览、检查和导出不需要任何 Key。
- 模型密钥保存在 Obsidian SecretStorage 中。
- `data.json` 是设备运行时配置，已加入 `.gitignore`，请勿提交。
- Codex 登录会话通过本机运行时复用，不复制 OAuth 凭证。
- 截图前请遮挡 API Key、AppSecret、账号 ID、本机路径和素材 ID。

## 🗂️ Release 文件

用户安装所需的最小发布包：

```text
main.js
manifest.json
styles.css
```

## 🛠️ 开发

```bash
npm ci
npm run dev
npm run build
```

## 📄 License

[MIT](LICENSE) © 2026 Alucard

