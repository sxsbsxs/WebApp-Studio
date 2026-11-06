# WebApp Studio

**WebApp Studio** 是一个公开、免注册的网页应用制作工作台。打开网站即可使用，不需要账号，也不需要把项目上传到服务器。

## 当前功能

- 可视化页面设计：基于 GrapesJS，支持拖拽文本、按钮、图片、区块和双栏布局
- 代码编辑：Monaco Editor，支持 HTML、CSS、JavaScript
- 实时预览：独立预览窗口，支持桌面、平板和手机画布尺寸
- 项目管理：浏览器本地保存、打开和删除项目
- 项目迁移：导入 ZIP，导出包含 HTML/CSS/JS 的 ZIP
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

## Android APK

在 GitHub 仓库的 **Actions** 中运行 **Build Android APK** 工作流。完成后从工作流 Artifacts 下载 `WebApp-Studio-debug-apk`。这是调试 APK；正式发布版本需要配置应用签名。

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
