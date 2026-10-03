// Dev-only: plays days of the game in headless Microsoft Edge at the tablet's 1364x603 and saves
// screenshots, so a screen can be checked without a person clicking through it.
//
//   npm run build && npx vite preview --port 4179 --strictPort     (in one terminal)
//   node scripts/play-day.mjs <folder> [days] [url]                 (in another)
//
// It opens the restaurant, sets 4x speed, answers every choice card with its first answer, and
// screenshots the start (0-start.png), the day (1-during.png), the top of each day report
// (report-<n>-top.png) and its "Tomorrow" box (report-<n>-tomorrow.png). The browser profile lives
// in <folder>/edge-profile, so a second run with the same folder carries on from the save.
// Uses Node's built-in WebSocket and fetch (Node 22+) and the Chrome DevTools Protocol: no dependencies.

import { execSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const [folder, days = '1', url = 'http://localhost:4179/dream-restaurant/'] = process.argv.slice(2);
if (!folder) {
  console.error('Usage: node scripts/play-day.mjs <folder> [days] [url]');
  process.exit(1);
}
mkdirSync(folder, { recursive: true });
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9333;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const edge = spawn(
  EDGE,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${folder}/edge-profile`,
    '--window-size=1364,603',
    '--hide-scrollbars',
    'about:blank',
  ],
  { stdio: 'ignore' },
);
// Edge starts several processes: stop them all, or a later run talks to this old browser (and its old cached game).
const stopEdge = () => {
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
  console.error(`Edge did not start (is another browser already using port ${PORT}?)`);
  stopEdge();
  process.exit(1);
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener('open', resolve));
let nextId = 0;
const pending = new Map();
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++nextId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, returnByValue: true })).result?.result?.value;
const screenshot = async (name) => {
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${folder}/${name}.png`, Buffer.from(shot.result.data, 'base64'));
};

await send('Emulation.setDeviceMetricsOverride', { width: 1364, height: 603, deviceScaleFactor: 1, mobile: false });
await send('Page.enable');
await send('Page.navigate', { url });
await sleep(3000);
await screenshot('0-start');

// One step of a player who always says yes: returns what it did.
const step = `(() => {
  const buttons = [...document.querySelectorAll('button')].filter((b) => !b.disabled && b.offsetParent);
  if ([...document.querySelectorAll('h2')].some((h) => h.textContent.startsWith('Tomorrow:'))) return 'report';
  const card = document.querySelector('.moment-card, [role=dialog]');
  const answer = card && [...card.querySelectorAll('button.primary')].find((b) => !b.disabled);
  if (answer) { answer.click(); return 'answered: ' + answer.textContent.trim(); }
  const open = buttons.find((b) => b.textContent.trim().startsWith('Open the restaurant'));
  if (open) { open.click(); return 'opened the restaurant'; }
  const fast = buttons.find((b) => b.getAttribute('aria-label') === 'Four times speed' && b.getAttribute('aria-pressed') !== 'true');
  if (fast) { fast.click(); return '4x speed'; }
  return 'waiting';
})()`;
const showTomorrow = `(() => {
  const heading = [...document.querySelectorAll('h2')].find((h) => h.textContent.startsWith('Tomorrow:'));
  heading?.closest('section')?.scrollIntoView({ block: 'end' });
  return heading?.closest('section')?.innerText ?? null;
})()`;
const nextDay = `(() => {
  const button = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Plan tomorrow');
  button?.click();
  return Boolean(button);
})()`;

for (let day = 1; day <= Number(days); day++) {
  let last = '';
  let reached = false;
  for (let i = 0; i < 300; i++) {
    const did = await evaluate(step);
    if (did !== last && did !== 'waiting') console.log(`day ${day}: ${did}`);
    last = did;
    if (day === 1 && i === 20) await screenshot('1-during');
    if (did === 'report') {
      reached = true;
      break;
    }
    await sleep(500);
  }
  if (!reached) {
    console.error(`day ${day}: no day report after 150 seconds; see the screenshot`);
    await screenshot(`stuck-${day}`);
    break;
  }
  await sleep(1500);
  await screenshot(`report-${day}-top`);
  console.log(await evaluate(showTomorrow));
  await sleep(500);
  await screenshot(`report-${day}-tomorrow`);
  if (day < Number(days)) {
    await evaluate(nextDay);
    await sleep(1500);
  }
}

ws.close();
stopEdge();
process.exit(0);
