// Dev-only: walks through the game's screens in headless Edge and lists any emoji still shown as
// text (every icon should be a drawn one; project.md section 9.5, "All the icons"), saving a
// screenshot of each screen. Needs the build served:
//   npm run build && npx vite preview --port 4179 --strictPort
//   node scripts/emoji-check.mjs <folder> [url]
import { execSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [folder, url = 'http://localhost:4179/dream-restaurant/'] = process.argv.slice(2);
if (!folder) {
  console.error('Usage: node scripts/emoji-check.mjs <folder> [url]');
  process.exit(1);
}
mkdirSync(folder, { recursive: true });
const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--remote-debugging-port=9338', `--user-data-dir=${join(tmpdir(), `otk-emoji-${Date.now()}`)}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 40 && !targets; i++) {
  try {
    targets = await (await fetch('http://127.0.0.1:9338/json')).json();
  } catch {
    await sleep(250);
  }
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  } else if (m.method === 'Runtime.exceptionThrown') console.log('ERROR', (m.params.exceptionDetails.exception?.description ?? '').slice(0, 300));
});
const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const run = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true })).result?.result?.value;
const clickText = (selector, text) => run(`[...document.querySelectorAll(${JSON.stringify(selector)})].find((b) => b.textContent.trim().startsWith(${JSON.stringify(text)}))?.click()`);

/** Text on screen that still has an emoji in it. */
const leftovers = `(() => {
  const found = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.nodeValue;
    if (/\\p{Extended_Pictographic}|\\p{Regional_Indicator}|[★☆]/u.test(t) && n.parentElement && n.parentElement.offsetParent !== null) found.add(t.trim().slice(0, 60));
  }
  return [...found];
})()`;
let total = 0;
const check = async (name) => {
  await sleep(700);
  const found = await run(leftovers);
  total += found.length;
  console.log(`${name}: ${found.length ? found.join(' | ') : 'no emojis'}`);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(folder, `${name}.png`), Buffer.from(shot.result.data, 'base64'));
};

await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1364, height: 603, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await sleep(3500);
for (const tab of ['Today', 'Menu', 'Kitchen', 'Interior', 'Staff', 'Marketing', 'Restaurant', 'Map', 'Mewa', 'Settings']) {
  await clickText('button.tab', tab);
  await check(`plan-${tab.toLowerCase()}`);
}
await clickText('button.tab', 'Today');
await clickText('button', 'Open the restaurant');
await sleep(2500);
await check('day');
await run(`document.querySelector('button[aria-label="Who’s who"]')?.click() ?? [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Who'))?.click()`);
await check('day-legend');
await run(`[...document.querySelectorAll('button')].find((b) => b.textContent.includes('Who'))?.click()`);
await run(`document.querySelector('button[aria-label="Four times speed"]')?.click()`);
// Play to the report, answering any card with its first answer; look at the first card and the notes on the way.
let card = false;
for (let i = 0; i < 160; i++) {
  if (!card && (await run(`Boolean(document.querySelector('.moment-card'))`))) {
    card = true;
    await check('day-card');
  }
  await run(`[...document.querySelectorAll('.moment-card button.primary, [role=dialog] button.primary')].find((b) => !b.disabled)?.click()`);
  if (await run(`[...document.querySelectorAll('h2')].some((h) => h.textContent.startsWith('Tomorrow:'))`)) break;
  if (i === 30) await check('day-later');
  await sleep(500);
}
await check('report-top');
await run(`[...document.querySelectorAll('h2')].find((h) => h.textContent.startsWith('Tomorrow:'))?.closest('section')?.scrollIntoView({ block: 'end' })`);
await check('report-bottom');
console.log(total ? `${total} bits of text still have emojis` : 'All clear: no emojis on any screen');
ws.close();
try {
  execSync(`taskkill /PID ${edge.pid} /T /F`, { stdio: 'ignore' });
} catch {}
process.exit(0);
