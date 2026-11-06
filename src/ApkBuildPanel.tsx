import { useEffect, useRef, useState } from 'react';
import { X, Upload, PackageCheck, Download, LoaderCircle, AlertTriangle } from 'lucide-react';

type BuildState = { id: string; status: 'queued'|'building'|'succeeded'|'failed'; log: string; downloadUrl?: string|null };
const API = (import.meta.env.VITE_APK_API_URL || '').replace(/\/$/, '');

export default function ApkBuildPanel({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File|null>(null);
  const [job, setJob] = useState<BuildState|null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!job || job.status === 'succeeded' || job.status === 'failed') return;
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`${API}/api/builds/${job.id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '无法读取构建状态');
        setJob(data);
      } catch (e) { setError(e instanceof Error ? e.message : '连接编译服务失败'); }
    }, 2500);
    return () => window.clearInterval(timer);
  }, [job?.id, job?.status]);

  const start = async () => {
    if (!API) { setError('APK 编译服务尚未配置上线。'); return; }
    if (!file) { setError('请先选择 Android 项目 ZIP。'); return; }
    setBusy(true); setError(''); setJob(null);
    try {
      const body = new FormData(); body.append('project', file);
      const response = await fetch(`${API}/api/builds`, { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '提交构建失败');
      setJob({ id: data.id, status: data.status, log: '已上传，正在排队…' });
    } catch (e) { setError(e instanceof Error ? e.message : '上传失败'); }
    finally { setBusy(false); }
  };
  const download = () => {
    if (!job?.id) return;
    const a = document.createElement('a'); a.href = `${API}/api/builds/${job.id}/apk`; a.download = 'app-debug.apk'; a.click();
  };

  return <div className="apk-overlay" role="dialog" aria-modal="true" aria-label="APK 打包">
    <section className="apk-panel">
      <header><div><b>Android APK 打包</b><small>上传完整 Android Studio 项目，自动编译 APK</small></div><button onClick={onClose} aria-label="关闭"><X size={19}/></button></header>
      {!job && <div className="apk-upload">
        <input ref={input} type="file" accept=".zip,application/zip" hidden onChange={e=>{setFile(e.target.files?.[0]||null);setError('');}}/>
        <button className="apk-drop" onClick={()=>input.current?.click()}><Upload size={26}/><b>{file?.name || '选择 Android 项目 ZIP'}</b><span>最大 200 MB · 必须包含 gradlew 和 settings.gradle</span></button>
        <button className="apk-start" disabled={busy || !file} onClick={start}>{busy?<LoaderCircle className="spin"/>:<PackageCheck size={17}/>}开始打包 APK</button>
      </div>}
      {job && <div className="apk-progress">
        <div className="apk-state">{job.status==='succeeded'?<PackageCheck/>:job.status==='failed'?<AlertTriangle/>:<LoaderCircle className="spin"/>}<b>{job.status==='queued'?'等待编译':job.status==='building'?'正在编译 Android 项目':job.status==='succeeded'?'APK 编译成功':'编译失败'}</b></div>
        <pre>{job.log || '正在准备构建环境…'}</pre>
        {job.status==='succeeded' && <button className="apk-start" onClick={download}><Download size={17}/>下载 APK</button>}
        {(job.status==='failed'||job.status==='succeeded') && <button className="apk-again" onClick={()=>{setJob(null);setFile(null);}}>打包另一个项目</button>}
      </div>}
      {error && <p className="apk-error">{error}</p>}
      <footer>支持带 Gradle Wrapper 的 Android 项目（Kotlin / Java）。编译结果为 Debug APK。</footer>
    </section>
  </div>;
}
