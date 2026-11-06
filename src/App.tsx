import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import grapesjs, { type Editor as GrapesEditor } from 'grapesjs';
import JSZip from 'jszip';
import {
  Blocks, Code2, Eye, FileCode2, FolderOpen, Download, Smartphone, Tablet, Monitor,
  Save, Plus, ChevronDown, Play, RotateCcw, Layers, Image, Type, Square, Layout,
  Settings2, PanelLeftClose, PanelLeftOpen, Sparkles, Check, Upload, Trash2
} from 'lucide-react';

type Tab = 'design' | 'code' | 'preview';
type CodeTab = 'html' | 'css' | 'js';
type Project = { name: string; html: string; css: string; js: string; updatedAt: number };
type ArchiveEntry = { path: string; text: boolean };
const STORAGE_KEY = 'webapp-studio-project-v1';
const starterHtml = `<main class="page">
  <nav class="nav"><div class="brand">Your<span>App</span></div><a href="#features">功能</a><a href="#about">关于</a><button class="nav-btn">开始使用</button></nav>
  <section class="hero"><div class="eyebrow">✦ YOUR NEXT BIG IDEA</div><h1>把想法变成<br><span>真正的产品</span></h1><p>使用 WebApp Studio，快速设计、编写并预览你的下一个应用。</p><div class="actions"><button class="primary" onclick="document.querySelector('#features').scrollIntoView({behavior:'smooth'})">探索功能</button><button class="secondary">了解更多</button></div><div class="mock-card"><div class="mock-dot"></div><div class="mock-dot"></div><div class="mock-dot"></div><div class="mock-content">✨ 从这里开始创造</div></div></section>
  <section id="features" class="features"><div class="eyebrow">FEATURES</div><h2>简单工具，创造更多可能</h2><div class="cards"><article><b>01</b><h3>自由设计</h3><p>拖拽组件，快速搭建页面布局。</p></article><article><b>02</b><h3>编辑代码</h3><p>随时切换到代码，精细控制每个细节。</p></article><article><b>03</b><h3>即时预览</h3><p>在不同设备尺寸下检查你的作品。</p></article></div></section>
  <footer id="about">Made with WebApp Studio</footer>
</main>`;
const starterCss = `*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#17202b;background:#fff}.page{overflow:hidden}.nav{height:76px;display:flex;align-items:center;gap:34px;padding:0 max(7vw,24px);border-bottom:1px solid #edf0f3}.brand{font-size:21px;font-weight:800;margin-right:auto}.brand span,.hero h1 span{color:#6759e8}.nav a{color:#667085;text-decoration:none;font-size:14px}.nav-btn,.secondary{background:#fff;border:1px solid #dce1e8;border-radius:9px;padding:11px 17px}.hero{text-align:center;padding:95px 20px 80px;background:radial-gradient(ellipse at 50% 0%,#f0efff 0,transparent 58%)}.eyebrow{font-size:11px;letter-spacing:2px;font-weight:800;color:#7568df}.hero h1{font-size:clamp(42px,7vw,76px);line-height:1.12;letter-spacing:-3px;margin:20px 0}.hero p{color:#697386;font-size:17px;max-width:540px;margin:0 auto;line-height:1.8}.actions{display:flex;justify-content:center;gap:12px;margin:28px}.primary{background:#6759e8;color:white;border:0;border-radius:9px;padding:13px 22px;font-weight:700}.mock-card{height:180px;max-width:560px;margin:55px auto 0;border:1px solid #e6e7ef;border-radius:15px;background:#fff;box-shadow:0 18px 55px #31306b16;text-align:left;padding:14px}.mock-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#ddd;margin-right:6px}.mock-content{height:125px;display:grid;place-items:center;color:#8278d9;font-weight:700}.features{padding:70px max(7vw,24px);text-align:center}.features h2{font-size:32px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:35px;text-align:left}.cards article{padding:25px;border:1px solid #eceef2;border-radius:14px}.cards b{color:#7568df}.cards p,footer{color:#77808f;line-height:1.7}footer{text-align:center;padding:30px;border-top:1px solid #eee}@media(max-width:650px){.nav{gap:12px;padding:0 16px}.nav a{display:none}.cards{grid-template-columns:1fr}.hero{padding-top:65px}.hero h1{letter-spacing:-1.5px}}`;
const starterJs = `console.log('Welcome to WebApp Studio!');`;

export default function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<GrapesEditor | null>(null);
  const [tab, setTab] = useState<Tab>('design');
  const [codeTab, setCodeTab] = useState<CodeTab>('html');
  const [projectName, setProjectName] = useState('我的第一个应用');
  const [html, setHtml] = useState(starterHtml);
  const [css, setCss] = useState(starterCss);
  const [js, setJs] = useState(starterJs);
  const [device, setDevice] = useState<'desktop'|'tablet'|'mobile'>('desktop');
  const [saved, setSaved] = useState(true);
  const [leftOpen, setLeftOpen] = useState(true);
  const [notice, setNotice] = useState('');
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [showProjects, setShowProjects] = useState(false);
  const archiveRef = useRef<JSZip | null>(null);
  const [archiveEntries, setArchiveEntries] = useState<ArchiveEntry[]>([]);
  const [archiveText, setArchiveText] = useState<Record<string, string>>({});
  const [selectedArchivePath, setSelectedArchivePath] = useState('');

  const srcDoc = useMemo(() => `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${html}<script>${js.split('</script').join('<\\/script')}<\/script></body></html>`, [html, css, js]);

  const notify = useCallback((message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2600); }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setProjectList(JSON.parse(raw) as Project[]);
    } catch { /* ignore invalid local data */ }
  }, []);

  useEffect(() => {
    if (!canvasRef.current || tab !== 'design' || editorRef.current) return;
    const editor = grapesjs.init({
      container: canvasRef.current, height: '100%', width: '100%', fromElement: false,
      storageManager: false, noticeOnUnload: false, panels: { defaults: [] },
      blockManager: { appendTo: '#blocks' },
      deviceManager: { devices: [
        { name: 'Desktop', width: '' }, { name: 'Tablet', width: '768px', widthMedia: '992px' },
        { name: 'Mobile', width: '375px', widthMedia: '480px' }
      ] }
    });
    editorRef.current = editor;
    editor.BlockManager.add('text-block', { label: '文本', category: '基础组件', content: '<div class="content-block"><h2>添加标题</h2><p>在这里输入内容</p></div>', attributes: { class: 'gjs-fonts gjs-f-h1' } });
    editor.BlockManager.add('button-block', { label: '按钮', category: '基础组件', content: '<button class="primary">点击按钮</button>' });
    editor.BlockManager.add('image-block', { label: '图片', category: '基础组件', content: { type: 'image', style: { width: '100%', 'max-width': '420px' }, activeOnRender: 1 } });
    editor.BlockManager.add('section-block', { label: '区块', category: '布局', content: '<section style="padding:48px 24px"><h2>新建区块</h2><p>编辑这段内容</p></section>' });
    editor.BlockManager.add('columns-block', { label: '双栏布局', category: '布局', content: '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:24px"><div>左侧内容</div><div>右侧内容</div></div>' });
    editor.setComponents(html);
    editor.setStyle(css);
    editor.on('update', () => { setHtml(editor.getHtml() ?? ''); setCss(editor.getCss() ?? ''); setSaved(false); });
    editor.on('component:update', () => { setHtml(editor.getHtml() ?? ''); setCss(editor.getCss() ?? ''); setSaved(false); });
    return () => { editor.destroy(); editorRef.current = null; };
  }, [tab]);

  const saveProject = useCallback(() => {
    const project: Project = { name: projectName, html, css, js, updatedAt: Date.now() };
    const next = [project, ...projectList.filter(p => p.name !== projectName)].slice(0, 30);
    setProjectList(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(true); notify('项目已保存在此浏览器');
  }, [projectName, html, css, js, projectList, notify]);

  const loadProject = (p: Project) => {
    setProjectName(p.name); setHtml(p.html); setCss(p.css); setJs(p.js);
    if (editorRef.current) { editorRef.current.setComponents(p.html); editorRef.current.setStyle(p.css); }
    setShowProjects(false); setSaved(true); notify('项目已打开');
  };

  const applyCode = () => {
    if (editorRef.current) { editorRef.current.setComponents(html); editorRef.current.setStyle(css); }
    setTab('preview'); setSaved(false); notify('代码已应用到预览');
  };

  const exportZip = async () => {
    if (archiveRef.current && archiveEntries.length) {
      const archive = archiveRef.current;
      for (const [path, content] of Object.entries(archiveText)) archive.file(path, content);
      const archiveBlob = await archive.generateAsync({ type: 'blob' });
      const archiveUrl = URL.createObjectURL(archiveBlob);
      const archiveLink = document.createElement('a');
      archiveLink.href = archiveUrl; archiveLink.download = (projectName || 'source-project') + '.zip'; archiveLink.click();
      URL.revokeObjectURL(archiveUrl); notify('完整项目 ZIP 已导出'); return;
    }
    const zip = new JSZip();
    zip.file('index.html', `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${projectName}</title><link rel="stylesheet" href="style.css"></head><body>${html}<script src="script.js"><\/script></body></html>`);
    zip.file('style.css', css); zip.file('script.js', js);
    zip.file('README.md', `# ${projectName}\n\n由 WebApp Studio 导出。直接打开 index.html 即可预览。\n`);
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `${projectName.replace(/[^\\w\\u4e00-\\u9fa5-]/g, '-') || 'webapp'}.zip`; a.click();
    URL.revokeObjectURL(url); notify('项目 ZIP 已导出');
  };

  const importProject = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const zip = await JSZip.loadAsync(reader.result as ArrayBuffer);
        const entries = Object.values(zip.files).filter(entry => !entry.dir);
        const nextEntries: ArchiveEntry[] = [];
        const nextText: Record<string, string> = {};
        for (const entry of entries) {
          const bytes = await entry.async('uint8array');
          let decoded: string | null = null;
          try {
            if (!bytes.includes(0)) decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
          } catch { decoded = null; }
          const isText = decoded !== null;
          nextEntries.push({ path: entry.name, text: isText });
          if (isText) nextText[entry.name] = decoded;
        }
        archiveRef.current = zip;
        setArchiveEntries(nextEntries); setArchiveText(nextText);
        setSelectedArchivePath(nextEntries.find(entry => entry.text)?.path ?? '');
        const h = zip.file('index.html') ?? zip.file(/(^|\/)index\.html$/i)?.[0];
        const c = zip.file('style.css') ?? zip.file(/(^|\/)style\.css$/i)?.[0];
        const j = zip.file('script.js') ?? zip.file(/(^|\/)script\.js$/i)?.[0];
        if (h) {
          const content = await h.async('string');
          const body = content.match(/<body[^>]*>([\s\S]*?)<script/i)?.[1] ?? content;
          setHtml(body); if (c) setCss(await c.async('string')); if (j) setJs(await j.async('string'));
        }
        setProjectName(file.name.replace(/\.zip$/i, '')); setTab('code');
        notify('已导入 ' + entries.length + ' 个文件，可查看和编辑文本源码');
      } catch { notify('无法读取此 ZIP 文件'); }
    };
    reader.readAsArrayBuffer(file);
  };

  const editorValue = selectedArchivePath && archiveEntries.length ? (archiveText[selectedArchivePath] ?? '') : codeTab === 'html' ? html : codeTab === 'css' ? css : js;
  const languageForPath = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase() ?? '';
    const map: Record<string, string> = { kt: 'kotlin', kts: 'kotlin', java: 'java', py: 'python', pyw: 'python', js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', html: 'html', htm: 'html', css: 'css', scss: 'scss', less: 'less', json: 'json', jsonc: 'json', xml: 'xml', gradle: 'groovy', properties: 'ini', yaml: 'yaml', yml: 'yaml', toml: 'ini', md: 'markdown', sh: 'shell', bash: 'shell', sql: 'sql', go: 'go', rs: 'rust', c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', hpp: 'cpp', cs: 'csharp', swift: 'swift', dart: 'dart', php: 'php', rb: 'ruby', lua: 'lua', vue: 'html', svelte: 'html', svg: 'xml' };
    return map[ext] ?? 'plaintext';
  };
  const setEditorValue = (value?: string) => {
    const v = value ?? '';
    if (selectedArchivePath && archiveEntries.length) setArchiveText(current => ({ ...current, [selectedArchivePath]: v }));
    else if (codeTab === 'html') setHtml(v); else if (codeTab === 'css') setCss(v); else setJs(v);
    setSaved(false);
  };

  return <div className="studio">
    <header className="topbar">
      <div className="brand-lockup"><div className="brand-mark"><Layers size={19}/></div><div><strong>WebApp Studio</strong><small>前端应用制作工作台</small></div></div>
      <div className="project-title"><span className="status-dot"/><input value={projectName} onChange={e => {setProjectName(e.target.value);setSaved(false);}} aria-label="项目名称"/><ChevronDown size={14}/></div>
      <div className="top-actions">
        <button className="top-btn subtle" onClick={() => setShowProjects(!showProjects)}><FolderOpen size={16}/>项目</button>
        <button className="top-btn subtle" onClick={() => saveProject()}><Save size={16}/>{saved ? '已保存' : '保存'}</button>
        <button className="top-btn export-btn" onClick={exportZip}><Download size={16}/>导出 ZIP</button>
      </div>
    </header>

    {showProjects && <div className="project-popover"><div className="popover-head"><b>本地项目</b><label className="import-label"><Upload size={14}/>导入 ZIP<input type="file" accept=".zip" onChange={e => importProject(e.target.files?.[0])}/></label></div>{projectList.length ? projectList.map((p,i)=><div className="project-row" key={p.name+i}><button onClick={()=>loadProject(p)}><FileCode2 size={16}/><span>{p.name}<small>{new Date(p.updatedAt).toLocaleString()}</small></span></button><button className="icon-btn" onClick={()=>{const next=projectList.filter(x=>x!==p);setProjectList(next);localStorage.setItem(STORAGE_KEY,JSON.stringify(next));}}><Trash2 size={15}/></button></div>) : <p className="empty-state">还没有保存的项目</p>}</div>}

    <div className="toolbar">
      <div className="mode-tabs">
        <button className={tab==='design'?'active':''} onClick={()=>setTab('design')}><Blocks size={16}/>可视化设计</button>
        <button className={tab==='code'?'active':''} onClick={()=>setTab('code')}><Code2 size={16}/>代码编辑</button>
        <button className={tab==='preview'?'active':''} onClick={()=>setTab('preview')}><Eye size={16}/>实时预览</button>
      </div>
      <div className="toolbar-right">
        {tab==='design' && <div className="device-switch"><button className={device==='desktop'?'selected':''} onClick={()=>setDevice('desktop')} title="电脑"><Monitor size={16}/></button><button className={device==='tablet'?'selected':''} onClick={()=>setDevice('tablet')} title="平板"><Tablet size={16}/></button><button className={device==='mobile'?'selected':''} onClick={()=>setDevice('mobile')} title="手机"><Smartphone size={16}/></button></div>}
        {tab==='code' && <button className="apply-btn" onClick={applyCode}><Play size={14}/>应用并预览</button>}
        {tab==='preview' && <span className="preview-label"><span className="live-dot"/>预览模式</span>}
      </div>
    </div>

    <main className="workspace">
      {tab==='design' && <>
        <aside className={leftOpen?'left-panel':'left-panel collapsed'}>
          <div className="panel-heading"><span>组件库</span><button className="icon-btn" onClick={()=>setLeftOpen(false)}><PanelLeftClose size={16}/></button></div>
          <div className="panel-hint">将组件拖入画布即可添加</div>
          <div id="blocks" className="blocks-host"><div className="block-fallback"><div><Type/>文本</div><div><Square/>按钮</div><div><Image/>图片</div><div><Layout/>区块</div></div></div>
          <div className="panel-foot"><Sparkles size={14}/> 拖拽组件开始创作</div>
        </aside>
        {!leftOpen && <button className="reopen-panel" onClick={()=>setLeftOpen(true)}><PanelLeftOpen size={17}/></button>}
        <section className="canvas-area"><div className="canvas-caption"><span>画布</span><span>100%</span></div><div className={`canvas-shell ${device}`}><div ref={canvasRef} className="gjs-mount"/></div></section>
        <aside className="right-panel"><div className="panel-heading"><span>设计提示</span><Settings2 size={16}/></div><div className="inspector-empty"><div className="inspector-icon"><Sparkles size={21}/></div><b>选择画布中的元素</b><p>选中元素后，可以在这里调整内容、样式和布局。</p></div><div className="quick-tips"><b>快捷提示</b><p>双击文字可以直接编辑。</p><p>拖动组件可以调整页面结构。</p><p>切换到代码编辑可以精细修改。</p></div></aside>
      </>}
      {tab==='code' && <section className="code-workspace"><div className="code-sidebar"><div className="code-sidebar-title">项目文件</div>{archiveEntries.length ? <>{archiveEntries.map(entry=><button key={entry.path} className={selectedArchivePath===entry.path?'file-active':''} disabled={!entry.text} title={entry.text?entry.path:'二进制文件：保留原文件，不在文本编辑器中打开'} onClick={()=>{if(entry.text)setSelectedArchivePath(entry.path);}}><FileCode2 size={15}/><span className="archive-file-name">{entry.path}</span></button>)}<small className="archive-summary">{archiveEntries.length} 个文件 · {archiveEntries.filter(e=>e.text).length} 个可编辑文本文件</small></> : (['html','css','js'] as CodeTab[]).map((t)=><button key={t} className={codeTab===t?'file-active':''} onClick={()=>setCodeTab(t)}><FileCode2 size={15}/>{t==='html'?'index.html':t==='css'?'style.css':'script.js'}</button>)}</div><div className="monaco-area"><div className="editor-filebar"><span>{selectedArchivePath && archiveEntries.length ? selectedArchivePath : codeTab==='html'?'index.html':codeTab==='css'?'style.css':'script.js'}</span><span>{archiveEntries.length ? '源码文件编辑' : '已启用自动补全'}</span></div><Editor height="100%" language={selectedArchivePath && archiveEntries.length ? languageForPath(selectedArchivePath) : codeTab==='html'?'html':codeTab==='css'?'css':'javascript'} theme="vs-dark" value={editorValue} onChange={setEditorValue} options={{minimap:{enabled:false},fontSize:14,wordWrap:'on',automaticLayout:true,scrollBeyondLastLine:false,padding:{top:18},tabSize:2}}/></div></section>}
      {tab==='preview' && <section className="preview-workspace"><div className="preview-top"><span><span className="live-dot"/>本地实时预览</span><button onClick={()=>setTab('code')}><Code2 size={14}/>返回编辑</button></div><iframe title="应用实时预览" srcDoc={srcDoc} sandbox="allow-scripts allow-forms allow-modals" /></section>}
    </main>
    <footer className="statusbar"><div><span className="status-light"/>{saved?'所有更改已保存':'有未保存的更改'}<span className="status-sep"/>WebApp Studio v0.1.0</div><div>本地运行 · 无需账号</div></footer>
    {notice && <div className="toast"><Check size={16}/>{notice}</div>}
  </div>;
}