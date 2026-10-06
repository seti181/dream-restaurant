// Dev-only: renders HTML pages to PNGs in headless Microsoft Edge, at the tablet's 1364x603
// (or another size). Used for concept art drawn as SVG and CSS.
//
//   node scripts/pixel/shoot.mjs <page.html> <out.png> [width] [height]
//   node scripts/pixel/shoot.mjs <folder-of-pages> <out-folder> [width] [height]
//
// Uses Node's built-in WebSocket and fetch (Node 22+) and the Chrome DevTools Protocol: no dependencies.

import { execSync, spawn } from 'node:child_process';
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [input, output, width = '1364', height = '603'] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: node scripts/pixel/shoot.mjs <page.html|folder> <out.png|folder> [width] [height]');
  process.exit(1);
}
const pages = statSync(input).isDirectory()
  ? readdirSync(input).filter((f) => f.endsWith('.html')).map((f) => [join(input, f), join(output, basename(f, '.html') + '.png')])
  : [[input, output]];
if (statSync(input).isDirectory()) mkdirSync(output, { recursive: true });

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9334;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = join(tmpdir(), 'old-town-kitchen-shoot');
const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, `--window-size=${width},${height}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const stop = () => {
  try {
    execSync(`taskkill /PID ${edge.pid} /T /F`, { stdio: 'ignore' });
  } catch {
    edge.kill();
  }
};
let targets;
for (let i = 0; i < 40 && !targets; i++) {
  try {
    targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
  } catch {
    await sleep(250);
  }
}
if (!targets) {
  console.error('Edge did not start');
  stop();
  process.exit(1);
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
});
const send = (method, params = {}) =>
  new Promise((r) => {
    const n = ++id;
    pending.set(n, r);
    ws.send(JSON.stringify({ id: n, method, params }));
  });
await send('Emulation.setDeviceMetricsOverride', { width: Number(width), height: Number(height), deviceScaleFactor: 1, mobile: false });
await send('Page.enable');
for (const [page, png] of pages) {
  await send('Page.navigate', { url: pathToFileURL(resolve(page)).href });
  await sleep(1200);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(png, Buffer.from(shot.result.data, 'base64'));
  console.log(png);
}
ws.close();
stop();
process.exit(0);
