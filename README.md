# WebApp Studio

**WebApp Studio** 是一个公开、免注册的网页应用制作工作台。打开网站即可使用，不需要账号，也不需要把项目上传到服务器。

## 当前功能

- 可视化页面设计：基于 GrapesJS，支持拖拽文本、按钮、图片、区块和双栏布局
- 代码编辑：Monaco Editor，支持 HTML、CSS、JavaScript
- 实时预览：独立预览窗口，支持桌面、平板和手机画布尺寸
- 项目管理：浏览器本地保存、打开和删除项目
- 通用源码 ZIP：导入任意 UTF-8 文本源码/配置文件项目（Kotlin、Java、Python、JS/TS、C/C++、Go、Rust、Swift、Dart、PHP、Shell、HTML/CSS 等），保留原目录结构与二进制资源；在文件列表中逐个查看、编辑源码并完整导出 ZIP
- PWA：支持安装到桌面/主屏幕，并缓存应用外壳以便再次打开
- Android：通过 Capacitor 和 GitHub Actions 构建 APK

## 在线使用

GitHub Pages 部署工作流位于 `.github/workflows/deploy-web.yml`。推送到 `main` 后会自动安装依赖、构建网站并发布到 GitHub Pages。

默认项目地址：<https://sxsbsxs.github.io/WebApp-Studio/>

如果首次部署提示 Pages 尚未启用，请在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**，然后重新运行 **Deploy WebApp Studio** 工作流。

## 本地开发

```bash
npm install
npm run dev
```

## 网页生产构建

```bash
npm run build
npm run preview
```

构建产物位于 `dist/`，可部署到 GitHub Pages、Cloudflare Pages、Netlify 或任意静态网站托管服务。

## Android APK 打包服务

网页已加入「打包 APK」入口：选择 Android Studio 项目 ZIP 后提交编译任务，可查看队列状态、构建日志并下载 Debug APK。服务端实现位于 `server/`，使用独立 Docker 构建容器执行用户项目。

**重要：** GitHub Pages 只托管前端。要让在线打包真正可用，必须先在一台启用 Docker 的 Linux 主机部署 API 服务，并在前端构建时设置 `VITE_APK_API_URL` 指向该 API。当前仓库代码已包含服务端和 Docker Compose 配置，但不能在 GitHub Pages 上直接运行服务端。

部署示例（Linux 主机已安装 Docker 和 Docker Compose）：

```bash
docker compose build
docker compose up -d
```

前端构建时设置环境变量：

```bash
VITE_APK_API_URL=https://你的编译服务域名 npm run build
```

API 默认监听 8787 端口。建议通过 HTTPS 反向代理公开，并设置 `ALLOWED_ORIGIN` 为 Pages 站点域名。构建容器对 CPU、内存、进程数和运行时长有限制；公开部署前仍应配置网关级限流、磁盘配额和监控。该服务只生成 Debug APK；正式签名发布需要单独配置签名密钥。

## 隐私与数据

- 无需注册或登录
- 不要求上传项目
- 项目默认保存在当前浏览器的 localStorage
- 清理浏览器站点数据会删除本地项目，请使用 ZIP 导出备份
- 预览代码运行在受限 iframe 中；请勿导入不可信来源的项目

## 技术栈

React、TypeScript、Vite、GrapesJS、Monaco Editor、JSZip、Capacitor。

## License

MIT
