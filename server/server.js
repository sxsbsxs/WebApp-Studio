import express from 'express';
import multer from 'multer';
import { randomBytes } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const app = express();
const PORT = Number(process.env.PORT || 8787);
const MAX_UPLOAD = Number(process.env.MAX_UPLOAD_BYTES || 200 * 1024 * 1024);
const MAX_CONCURRENT = Math.max(1, Number(process.env.MAX_CONCURRENT_BUILDS || 1));
const TIMEOUT_MS = Math.max(60_000, Number(process.env.BUILD_TIMEOUT_MS || 25 * 60_000));
const jobs = new Map();
const queue = [];
let active = 0;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD, files: 1 } });

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.get('/health', (_req, res) => res.json({ ok: true, service: 'webapp-studio-apk-builder' }));

function pump() {
  while (active < MAX_CONCURRENT && queue.length) {
    const job = queue.shift();
    active++;
    build(job).finally(() => { active--; pump(); });
  }
}
async function build(job) {
  job.status = 'building'; job.updatedAt = Date.now();
  const root = await mkdtemp(path.join(tmpdir(), 'webapp-studio-'));
  const input = path.join(root, 'input.zip');
  const output = path.join(root, 'output');
  await mkdir(output);
  try {
    await writeFile(input, job.buffer);
    delete job.buffer;
    const args = [
      'run', '--rm', '--name', 'was-' + job.id,
      '--memory=4g', '--memory-swap=4g', '--cpus=2', '--pids-limit=256',
      '--network=bridge', '--security-opt=no-new-privileges', '--cap-drop=ALL',
      '--tmpfs=/tmp:rw,noexec,nosuid,size=1g',
      '-v', input + ':/work/input.zip:ro',
      '-v', output + ':/work/output:rw',
      'webapp-studio-android-builder:latest'
    ];
    const child = spawn('docker', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    job.process = child;
    let log = '';
    const append = chunk => {
      log += chunk.toString();
      if (log.length > 120_000) log = log.slice(-100_000);
      job.log = log; job.updatedAt = Date.now();
    };
    child.stdout.on('data', append);
    child.stderr.on('data', append);
    const timer = setTimeout(() => child.kill('SIGKILL'), TIMEOUT_MS);
    const code = await new Promise(resolve => {
      child.on('error', err => { append('\n启动 Docker 失败：' + err.message); resolve(127); });
      child.on('close', resolve);
    });
    clearTimeout(timer);
    if (code !== 0) throw new Error('构建失败，退出码：' + code);
    const apkPath = path.join(output, 'app-debug.apk');
    const apk = await readFile(apkPath);
    job.apk = apk;
    job.status = 'succeeded';
    job.log += '\n构建成功。APK 已准备下载。';
  } catch (error) {
    job.status = 'failed';
    job.log += '\n' + (error?.message || String(error));
  } finally {
    job.updatedAt = Date.now();
    await rm(root, { recursive: true, force: true }).catch(() => {});
    setTimeout(() => jobs.delete(job.id), 60 * 60_000).unref();
  }
}
app.post('/api/builds', upload.single('project'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请上传 Android 项目 ZIP 文件。' });
  if (!req.file.originalname.toLowerCase().endsWith('.zip')) return res.status(400).json({ error: '仅支持 ZIP 文件。' });
  if (queue.length + active >= 8) return res.status(429).json({ error: '当前打包任务较多，请稍后重试。' });
  const id = randomBytes(18).toString('hex');
  const job = { id, status: 'queued', log: '已接收项目，正在等待编译资源。', buffer: req.file.buffer, createdAt: Date.now(), updatedAt: Date.now() };
  jobs.set(id, job); queue.push(job); pump();
  res.status(202).json({ id, status: job.status });
});
app.get('/api/builds/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: '任务不存在或已过期。' });
  res.json({ id: job.id, status: job.status, log: job.log, downloadUrl: job.status === 'succeeded' ? '/api/builds/' + job.id + '/apk' : null });
});
app.get('/api/builds/:id/apk', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job?.apk) return res.status(404).json({ error: 'APK 尚未生成或任务已过期。' });
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="app-debug.apk"');
  res.send(job.apk);
});
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'ZIP 最大支持 200 MB。' });
  res.status(500).json({ error: '服务器处理上传时发生错误。' });
});
app.listen(PORT, () => console.log('APK build API listening on :' + PORT));
