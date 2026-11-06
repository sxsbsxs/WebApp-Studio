# WebApp Studio

一个无需账号即可使用的在线前端应用制作工具。支持可视化拖拽、HTML/CSS/JavaScript 编辑、实时预览、浏览器本地保存、ZIP 导出和 Android 云端构建。

## 本地开发
```bash
npm install
npm run dev
```

## 构建
```bash
npm run build
```

## Android APK
在 GitHub 仓库的 Actions 中运行 **Build Android APK** 工作流，完成后从 Artifacts 下载 debug APK。此构建为未签名发布包之外的调试安装包；正式发布需要自行配置签名密钥。

## 隐私与存储
第一版不要求注册、不上传用户项目。项目保存在当前浏览器的 localStorage；可导出 ZIP 备份。清除浏览器站点数据会删除本地项目，请及时导出备份。

## 技术栈
React、TypeScript、Vite、GrapesJS、Monaco Editor、JSZip、Capacitor。

## License
MIT