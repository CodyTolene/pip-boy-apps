import { createServer } from 'node:http';
import { access, stat, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(process.cwd());
const port = Number(process.env.PORT) || 8080;
const shouldOpenBrowser = !['1', 'true', 'yes'].includes(
  String(process.env.NO_OPEN || '').toLowerCase(),
);

const appsJsonPath = path.join(root, 'apps.local.json');
const generateScriptPath = path.join(
  root,
  '.scripts',
  'generate-apps-local.js',
);

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.ico', 'image/x-icon'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.ttf', 'font/ttf'],
  ['.eot', 'application/vnd.ms-fontobject'],
  ['.map', 'application/json; charset=utf-8'],
]);

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(body);
}

function toFsPath(requestUrl) {
  const url = new URL(requestUrl, 'http://localhost');
  const decodedPath = decodeURIComponent(url.pathname);
  const safePath = path.resolve(root, '.' + decodedPath);
  if (!safePath.startsWith(root)) {
    return null;
  }
  return safePath;
}

const server = createServer(async (req, res) => {
  if (!req.url || (req.method !== 'GET' && req.method !== 'HEAD')) {
    send(res, 405, 'Method Not Allowed');
    return;
  }

  const fsPath = toFsPath(req.url);
  if (!fsPath) {
    send(res, 403, 'Forbidden');
    return;
  }

  let filePath = fsPath;
  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch {
    send(res, 404, 'Not Found');
    return;
  }

  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type = contentTypes.get(ext) || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    if (req.method === 'HEAD') {
      res.end();
    } else {
      res.end(data);
    }
  } catch {
    send(res, 404, 'Not Found');
  }
});

server.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`Pip-Boy Apps server running at ${url}`);

  if (!shouldOpenBrowser) return;

  let command = 'xdg-open';
  let args = [url];
  if (process.platform === 'win32') {
    command = 'cmd';
    args = ['/c', 'start', '', url];
  } else if (process.platform === 'darwin') {
    command = 'open';
    args = [url];
  }

  const child = spawn(command, args, { stdio: 'ignore', detached: true });
  child.unref();
});

async function ensureAppsJson() {
  try {
    await access(appsJsonPath);
    return;
  } catch {}

  console.log('Generating apps.local.json from apps folder...');
  const nodeExec = process.execPath;
  const child = spawn(nodeExec, [generateScriptPath], {
    stdio: 'inherit',
  });
  await new Promise((resolve, reject) => {
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else
        reject(new Error(`apps.local.json generation failed (code ${code})`));
    });
    child.on('error', reject);
  });
}

await ensureAppsJson();
