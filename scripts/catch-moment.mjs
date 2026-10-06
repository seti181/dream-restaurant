// Dev-only: plays the first day in headless Edge at 1364x603 and pauses on the first moment that
// something matching a CSS selector is on screen, then saves a screenshot. Good for checking
// things that only show now and then (a waiting table's ring, the help button, a queue). Answers yes
// to any card that pauses the day, and prints errors from the page. Needs the build served:
//   npm run build && npx vite preview --port 4179 --strictPort
//   node scripts/catch-moment.mjs <url> <selector> <out.png> [speed button label] [max seconds]
//   e.g. node scripts/catch-moment.mjs "http://localhost:4179/dream-restaurant/" ".sk-ring" ring.png "Twice as fast" 90
// Each run uses a fresh browser profile, so the app's offline cache can't serve an old build.
import { execSync, spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, selector, out, speedLabel = 'Four times speed', maxSeconds = '120'] = process.argv.slice(2);
const profile = join(tmpdir(), `otk-catch-${Date.now()}`);
rmSync(profile, { recursive: true, force: true });
const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--remote-debugging-port=9337', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let t;
for (let i = 0; i < 40 && !t; i++) {
  try {
    t = await (await fetch('http://127.0.0.1:9337/json')).json();
  } catch {
    await sleep(250);
  }
}
const ws = new WebSocket(t.find((x) => x.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pend = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (pend.has(m.id)) {
    pend.get(m.id)(m);
    pend.delete(m.id);
  } else if (m.method === 'Runtime.exceptionThrown') console.log('ERROR', (m.params.exceptionDetails.exception?.description ?? '').slice(0, 400));
});
const send = (method, params = {}) => new Promise((r) => { const n = ++id; pend.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const run = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true })).result?.result?.value;
const click = (label) => run(`document.querySelector(${JSON.stringify(`button[aria-label="${label}"]`)})?.click()`);

await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1364, height: 603, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await sleep(3000);
await run(`[...document.querySelectorAll('button')].find((b) => b.textContent.includes('Open the restaurant'))?.click()`);
await sleep(1500);
await click(speedLabel);
let found = false;
for (let i = 0; i < Number(maxSeconds) * 2 && !found; i++) {
  found = await run(`Boolean(document.querySelector(${JSON.stringify(selector)}))`);
  if (!found) {
    // Say yes to any card that pauses the day.
    await run(`[...document.querySelectorAll('.moment-card button.primary, [role=dialog] button.primary')].find((b) => !b.disabled)?.click()`);
    await sleep(500);
  }
}
await click('Pause');
await sleep(500);
console.log(found ? `found ${selector}` : `no ${selector} within ${maxSeconds} s`);
const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
ws.close();
try {
  execSync(`taskkill /PID ${edge.pid} /T /F`, { stdio: 'ignore' });
} catch {}
process.exit(0);
