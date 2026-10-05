// Dev-only: plays days of the game in headless Microsoft Edge at the tablet's 1364x603 (or SIZE=WxH) and saves
// screenshots, so a screen can be checked without a person clicking through it.
//
//   npm run build && npx vite preview --port 4179 --strictPort     (in one terminal)
//   node scripts/play-day.mjs <folder> [days] [url]                 (in another)
//
// It opens the restaurant, sets 4x speed, answers every choice card with its first answer, and
// accepts every booking request, hurries someone in the first rush (rush-<n>.png), and screenshots the start (0-start.png), the day (1-during.png),
// the top of each day report (report-<n>-top.png), its "Tomorrow" box (report-<n>-tomorrow.png)
// and the next morning's Today tab at its bookings (plan-<n>.png) its Menu tab (menu-<n>.png) and its Mewa tab (mewa-<n>.png). The browser profile lives
// in <folder>/edge-profile, so a second run with the same folder carries on from the save.
// Uses Node's built-in WebSocket and fetch (Node 22+) and the Chrome DevTools Protocol: no dependencies.

import { execSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const [folder, days = '1', url = 'http://localhost:4179/dream-restaurant/'] = process.argv.slice(2);
// Another screen size to check, e.g. SIZE=850x530 (the smallest the layout must work at).
const [WIDTH, HEIGHT] = (process.env.SIZE ?? '1364x603').split('x').map(Number);
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
    `--window-size=${WIDTH},${HEIGHT}`,
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

await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
await send('Page.enable');
await send('Page.navigate', { url });
await sleep(3000);
await screenshot('0-start');
// THEME=accordion (or pierogi, kashubian, seafood) books that theme night for the first evening, and
// photographs the Marketing tab (theme-book.png) and the evening (theme-night.png).
if (process.env.THEME) {
  const click = (selector, text) =>
    `[...document.querySelectorAll('${selector}')].find((b) => b.textContent.includes('${text}'))?.click()`;
  await evaluate(click('button.tab', 'Marketing'));
  await sleep(500);
  const names = { accordion: 'Live accordion', pierogi: 'Pierogi night', kashubian: 'Kashubian evening', seafood: 'Seafood night' };
  await evaluate(click('button.theme-chip', names[process.env.THEME]));
  await sleep(300);
  await evaluate(`document.querySelector('.theme-nights')?.scrollIntoView({ block: 'start' })`);
  await screenshot('theme-book');
  await evaluate(click('.theme-detail button', 'Tonight'));
  await sleep(300);
  await evaluate(click('button.tab', 'Today'));
  await sleep(300);
}

// One step of a player who always says yes: returns what it did.
const step = `(() => {
  const buttons = [...document.querySelectorAll('button')].filter((b) => !b.disabled && b.offsetParent);
  if ([...document.querySelectorAll('h2')].some((h) => h.textContent.startsWith('Tomorrow:'))) return 'report';
  const card = document.querySelector('.moment-card, [role=dialog]');
  const answer = card && [...card.querySelectorAll('button.primary')].find((b) => !b.disabled);
  if (answer) { answer.click(); return 'answered: ' + answer.textContent.trim(); }
  const accept = [...document.querySelectorAll('.booking-request button')].find((b) => b.textContent.trim() === 'Accept');
  if (accept) { accept.click(); return 'accepted a booking'; }
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
  let rushShot = false;
  let themeShot = false;
  for (let i = 0; i < 300; i++) {
    const did = await evaluate(step);
    if (did !== last && did !== 'waiting') console.log(`day ${day}: ${did}`);
    last = did;
    if (day === 1 && i === 20) await screenshot('1-during');
    // The first ⚡ of the day (a rush): a picture of it, then hurry that chef or waiter.
    if (process.env.THEME && day === 1 && !themeShot && (await evaluate(`document.body.innerText.includes('tonight!') || document.body.innerText.includes('night!') || document.body.innerText.includes('evening!')`))) {
      themeShot = true;
      await sleep(1500);
      await screenshot('theme-night');
    }
    if (!rushShot && (await evaluate(`Boolean(document.querySelector('.staff-hurry'))`))) {
      rushShot = true;
      await screenshot(`rush-${day}`);
      await evaluate(`document.querySelector('.staff-hurry').click()`);
      console.log(`day ${day}: hurried someone in the rush`);
    }
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
    // The next morning's Today tab, with its bookings.
    await evaluate(`(document.querySelector('.ranking') ?? document.querySelector('.bookings'))?.scrollIntoView({ block: 'start' })`);
    await sleep(300);
    await screenshot(`plan-${day + 1}`);
    // ...its Menu and Mewa tabs, then back to Today.
    const tab = (label) => `[...document.querySelectorAll('button.tab')].find((b) => b.textContent.trim() === '${label}')?.click()`;
    await evaluate(tab('Menu'));
    await sleep(500);
    await screenshot(`menu-${day + 1}`);
    await evaluate(tab('Mewa'));
    await sleep(500);
    await screenshot(`mewa-${day + 1}`);
    await evaluate(tab('Today'));
    await sleep(300);
  }
}

ws.close();
stopEdge();
process.exit(0);
