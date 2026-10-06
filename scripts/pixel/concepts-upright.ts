// Dev-only: concept pictures for the day screen with the tablet held upright (portrait), drawn with
// the game's own sketchbook art. Three ideas: A, the room above and the street below; B, a tall
// Gdańsk townhouse cut open, a dining room upstairs over the bar and kitchen; C, the same room close
// up, swiped sideways to see the bar or the kitchen.
//
//   npx tsx scripts/pixel/concepts-upright.ts [folder]      (default art/concepts/upright)
//   node scripts/pixel/shoot.mjs <folder>/html <folder> 800 1200

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { GROUP_IDS } from '../../src/data/groups';
import { lookFor, type SketchKind } from '../../src/ui/sketch/cast';
import { chefSpot, depthScale, frontLayout, waiterSpot, type FrontLayout } from '../../src/ui/sketch/frontRoom';
import { Painter, svgPicture } from '../../src/ui/sketch/painter';
import { figure, mewa, type Pose } from '../../src/ui/sketch/people';
import { chairsPicture, hatchCounterPicture, pageFramePicture, PLATE_CELL, platesPicture, roomPicture, TABLE_BOX, tablePicture, type RoomLook } from '../../src/ui/sketch/roomArt';
import { SEATED_HEIGHT, STANDING_HEIGHT } from '../../src/ui/sketch/sheets';
import { streetDepth, streetLayout, streetQueueSpot } from '../../src/ui/sketch/street';
import { streetPicture } from '../../src/ui/sketch/streetArt';

const folder = process.argv[2] ?? 'art/concepts/upright';
const W = 800;
const H = 1200;
const font = (file: string) => pathToFileURL(resolve('src/ui/sketch/fonts', file)).href;

const STAGES: Pose[][] = [
  [{ arms: 'menu', mouth: 'talk' }, { arms: 'rest', mouth: 'smile' }],
  [{ arms: 'rest', mouth: 'smile' }],
  [{ arms: 'cross', mouth: 'frown' }],
  [{ arms: 'fork', mouth: 'smile', eyes: 'happy' }, { arms: 'eat', mouth: 'smile' }],
];

const LOOK: RoomLook = { decor: ['tablecloths', 'lanterns'], equipment: [], weather: 'sunny', dusk: false, plaque: false, specials: [{ name: 'Żurek', price: 28 }, { name: 'Pierogi', price: 36 }] };

/** The room with a full house, as the game would show it (like sketch-preview.ts). */
function roomScene(L: FrontLayout, look: RoomLook, first = 0): string {
  const pt = new Painter();
  const layers = new Map<number, string>();
  const put = (z: number, svg: string) => layers.set(z, (layers.get(z) ?? '') + svg);
  put(0, roomPicture(pt, L, look));
  L.tables.forEach((t, n) => {
    const i = n + first;
    const kinds: SketchKind[] = [GROUP_IDS[i % 5], GROUP_IDS[i % 5], GROUP_IDS[i % 5], GROUP_IDS[i % 5]];
    const stage = STAGES[i % STAGES.length];
    const box = (svg: string) => `<g transform="translate(${t.x + TABLE_BOX.left * t.scale},${t.top + TABLE_BOX.top * t.scale}) scale(${t.scale})">${svg}</g>`;
    put(10 + t.row * 10, box(chairsPicture(pt)));
    put(12 + t.row * 10, box(tablePicture(pt, true, false)));
    for (let s = 0; s < 2 + (i % 3); s++) {
      const seat = t.seats[s];
      put(11 + t.row * 10, figure(pt, seat.x, seat.y, SEATED_HEIGHT * t.scale, lookFor(kinds[s], i * 3 + s), { ...stage[s % stage.length], sit: true, stool: seat.end, turn: seat.mirror ? -1 : 1 }));
      const px = t.x + (seat.end ? (seat.mirror ? 62 : -62) : seat.mirror ? 28 : -28) * t.scale;
      const kind = i % STAGES.length === 3 ? 1 + ((i + s) % 4) : 0;
      put(13 + t.row * 10, `<svg x="${px - PLATE_CELL.x * t.scale}" y="${t.top + 2 * t.scale - PLATE_CELL.y * t.scale}" width="${PLATE_CELL.width * t.scale}" height="${PLATE_CELL.height * t.scale}" viewBox="${kind * PLATE_CELL.width} 0 ${PLATE_CELL.width} ${PLATE_CELL.height}">${platesPicture(pt)}</svg>`);
    }
  });
  [0, 1].forEach((i) => {
    const spot = chefSpot(L, 2, i);
    put(6, figure(pt, spot.x, spot.y, STANDING_HEIGHT, lookFor('chef', i), { arms: i ? 'panDown' : 'pan', mouth: 'smile', turn: 1 }));
  });
  put(7, hatchCounterPicture(pt, L));
  (['waiter', 'tomek'] as const).forEach((kind, i) => {
    const spot = waiterSpot(L, i);
    put(spot.z, figure(pt, spot.x, spot.y, STANDING_HEIGHT * depthScale(L, spot.y), lookFor(kind, i), { arms: i ? 'rest' : 'tray', tray: 'full', mouth: 'smile', turn: 1 }));
  });
  return [...layers.entries()].sort((a, b) => a[0] - b[0]).map(([, svg]) => svg).join('');
}

/** The street outside with its terrace taken, a queue and people walking past. */
function streetScene(): { svg: string; width: number; height: number } {
  const L = streetLayout(3, 1364 / 603, 'mariacka');
  const pt = new Painter();
  let body = streetPicture(pt, L, { weather: 'sunny', dusk: false, name: "Joana's Kitchen", special: 'Pierogi', terraceOpen: true });
  L.tables.forEach((t, n) => {
    const box = (svg: string) => `<g transform="translate(${t.x + TABLE_BOX.left * t.scale},${t.top + TABLE_BOX.top * t.scale}) scale(${t.scale})">${svg}</g>`;
    body += box(chairsPicture(pt));
    for (let s = 0; s < 2 + (n % 3); s++) {
      const seat = t.seats[s];
      body += figure(pt, seat.x, seat.y, SEATED_HEIGHT * t.scale, lookFor(GROUP_IDS[(n + s) % 5], n * 3 + s), { sit: true, stool: seat.end, turn: seat.mirror ? -1 : 1, arms: s % 2 ? 'fork' : 'rest', mouth: 'smile' });
    }
    body += box(tablePicture(pt, true, false));
  });
  for (let p = 0; p < 2; p++) {
    const q = streetQueueSpot(L, 0, p);
    body += figure(pt, q.x, q.y, STANDING_HEIGHT * streetDepth(L, q.y), lookFor('tourists', p), { arms: 'rest', mouth: 'smile', turn: 1 });
  }
  body += figure(pt, 300, L.frontLane, STANDING_HEIGHT * streetDepth(L, L.frontLane), lookFor('students', 1), { arms: 'swing', walk: 0, turn: 1, mouth: 'smile' });
  body += figure(pt, L.width - 260, L.frontLane, STANDING_HEIGHT * streetDepth(L, L.frontLane), lookFor('locals', 2), { arms: 'swing', walk: 1, turn: -1, mouth: 'smile' });
  return { svg: svgPicture(L.width, L.height, body), width: L.width, height: L.height };
}

/** A gable and roof on top of the townhouse, with its rosette and Mewa on the ridge. */
function gable(): string {
  const pt = new Painter();
  let g = pt.fill(`M40,170 L40,120 L110,120 L110,84 L180,84 L180,50 L260,50 L260,20 L540,20 L540,50 L620,50 L620,84 L690,84 L690,120 L760,120 L760,170 Z`, '#e7b7a2');
  g += pt.line('M40,170 L40,120 L110,120 L110,84 L180,84 L180,50 L260,50 L260,20 L540,20 L540,50 L620,50 L620,84 L690,84 L690,120 L760,120 L760,170', 'ink', 2.5);
  g += pt.circle(400, 100, 36, '#fbf6ea') + pt.circle(400, 100, 20, 'red') + pt.circle(400, 100, 8, 'yellow');
  for (const x of [200, 600]) g += pt.rect(x - 24, 92, 48, 62, '#cfe3ec', 20) + pt.line(`M${x},92 V154 M${x - 24},122 H${x + 24}`, 'white', 2);
  g += mewa(pt, 222, 50, 1.2);
  return svgPicture(800, 175, g);
}

const b64 = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

/** The day screen's panels and buttons, mocked up in HTML on top of each concept. */
const HUD = `
<div class="top"><div class="p clock"><b>13:20</b><span>Monday 8 July<br><i>Week 1 · Sunny</i></span></div><div class="p money">40,000 zł <em>2.4 ★</em></div></div>
<div class="top second"><div class="p s"><b>18</b>served</div><div class="p s"><b>670 zł</b>takings</div><div class="p s"><b>0</b>walked out</div><div class="p s"><b>0</b>no table</div><div class="p s"><b>0/16</b>goal</div></div>
<div class="bottom">${['Manage', 'Happy hour', 'Flyers', 'Who’s who'].map((l) => `<div class="rb"><span></span><b>${l}</b></div>`).join('')}<div class="p speed"><i>❚❚</i><i class="on">1×</i><i>2×</i><i>4×</i></div></div>`;

function page(title: string, note: string, body: string): string {
  return `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: Kalam; font-weight: 700; src: url('${font('kalam-latin-700.woff2')}'); }
@font-face { font-family: Kalam; font-weight: 700; src: url('${font('kalam-latin-ext-700.woff2')}'); unicode-range: U+0100-02BA; }
body { margin: 0; width: ${W}px; height: ${H}px; position: relative; overflow: hidden; background: #fbf6ea; font-family: 'Segoe UI', sans-serif; color: #3b2a22; }
.band { position: absolute; left: 0; width: ${W}px; overflow: hidden; }
.band img { display: block; width: 100%; height: 100%; object-fit: cover; }
.p { border: 3px solid #3b2433; background: #fbf3e4; box-shadow: inset 0 0 0 2px #e9c27a, 4px 4px 0 rgba(59,36,51,.35); }
.top { position: absolute; top: 10px; left: 12px; right: 12px; display: flex; justify-content: space-between; z-index: 5; }
.top.second { top: 76px; justify-content: center; gap: 6px; }
.clock { display: flex; gap: 10px; align-items: center; padding: 3px 12px; font-size: 14px; font-weight: 700; } .clock b { font-size: 30px; color: #b5452f; } .clock i { color: #2f6f8f; font-style: normal; font-weight: 400; }
.money { padding: 10px 14px; font-weight: 700; font-size: 18px; } .money em { color: #a8752a; font-style: normal; margin-left: 10px; }
.s { min-width: 70px; padding: 2px 6px; text-align: center; font-size: 12px; font-weight: 600; } .s b { display: block; font-size: 18px; }
.bottom { position: absolute; left: 12px; right: 12px; bottom: 12px; display: flex; gap: 8px; align-items: flex-end; z-index: 5; }
.rb { display: flex; flex-direction: column; align-items: center; gap: 3px; width: 76px; } .rb span { width: 52px; height: 52px; border: 3px solid #3b2433; border-radius: 50%; background: #fbf3e4; box-shadow: inset 0 0 0 2px #e9c27a; } .rb b { border: 2px solid #3b2433; background: #fbf3e4; font-size: 12px; padding: 0 5px; white-space: nowrap; }
.speed { margin-left: auto; display: flex; gap: 3px; padding: 3px; } .speed i { width: 40px; height: 44px; display: grid; place-items: center; border: 2px solid #3b2433; background: #f1e2c4; font-style: normal; font-weight: 700; } .speed i.on { background: #2f6f8f; color: #fff; }
.label { position: absolute; left: 0; right: 0; text-align: center; font: 700 26px Kalam, cursive; color: #b5452f; z-index: 6; }
.caption { position: absolute; right: 18px; bottom: 140px; width: 300px; padding: 10px 14px; background: #fbefc0; box-shadow: 2px 3px 0 rgba(59,36,51,.2); font: 700 16px/1.3 Kalam, cursive; transform: rotate(1.5deg); z-index: 6; }
.beam { position: absolute; left: 0; width: ${W}px; height: 18px; background: repeating-linear-gradient(90deg, #8a5a3a 0 30px, #7a4e32 30px 32px); border-top: 3px solid #3b2433; border-bottom: 3px solid #3b2433; z-index: 4; }
.arrow { position: absolute; top: 560px; z-index: 6; font: 700 20px Kalam, cursive; color: #3b2433; background: #fbf3e4; border: 3px solid #3b2433; padding: 6px 12px; box-shadow: 3px 3px 0 rgba(59,36,51,.3); }
.frame { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
</style><body>${body}<img class="frame" src="${b64(svgPicture(W, H, pageFramePicture(new Painter(), W, H)))}">${HUD}<div class="caption"><b>${title}</b><br>${note}</div></body>`;
}

mkdirSync(`${folder}/html`, { recursive: true });

// A: the room above, the street below; no switch needed upright.
{
  const L = frontLayout(6, 1364 / 603);
  const room = svgPicture(L.width, L.height, roomScene(L, LOOK));
  const street = streetScene();
  writeFileSync(
    `${folder}/html/a-room-above-street-below.html`,
    page(
      'A · Inside above, outside below',
      'Both views at once: guests walk out of the room’s door and appear on the street below. No switch.',
      `<div class="band" style="top:130px;height:455px"><img src="${b64(room)}"></div><div class="beam" style="top:582px"></div><div class="band" style="top:600px;height:440px"><img src="${b64(street.svg)}" style="object-position:40% 100%"></div>`,
    ),
  );
}

// B: a tall Gdańsk townhouse cut open: the dining room upstairs, the bar, kitchen and door below.
{
  const upper = frontLayout(6, 1364 / 603);
  const lower = frontLayout(4, 1364 / 603);
  const up = svgPicture(upper.width, upper.height, roomScene(upper, { ...LOOK, specials: [] }, 2));
  const down = svgPicture(lower.width, lower.height, roomScene(lower, LOOK));
  writeFileSync(
    `${folder}/html/b-townhouse-two-floors.html`,
    page(
      'B · A tall townhouse, cut open',
      'Upstairs only tables and windows; the bar, kitchen and door on the ground floor, guests going up the stairs. Mewa on the gable.',
      `<img src="${b64(gable())}" style="position:absolute;top:128px;left:0;width:800px;z-index:2"><div class="band" style="top:300px;height:360px"><img src="${b64(up)}" style="position:absolute;width:1270px;height:auto;left:-250px;bottom:0"></div><div class="beam" style="top:657px"></div><div class="band" style="top:675px;height:365px"><img src="${b64(down)}" style="object-position:50% 100%"></div>`,
    ),
  );
}

// C: the same room close up, filling the height; swipe sideways to the bar or the kitchen.
{
  const L = frontLayout(8, 1364 / 603);
  const room = svgPicture(L.width, L.height, roomScene(L, LOOK));
  writeFileSync(
    `${folder}/html/c-room-close-up.html`,
    page(
      'C · The same room, close up',
      'People drawn big; swipe sideways to see the bar or the kitchen hatch. Inside / Outside switch as now.',
      `<div class="band" style="top:130px;height:910px"><img src="${b64(room)}" style="object-position:45% 100%"></div><div class="arrow" style="left:22px">‹ the bar</div><div class="arrow" style="right:22px">the kitchen ›</div>`,
    ),
  );
}
console.log(`written ${folder}/html; now: node scripts/pixel/shoot.mjs ${folder}/html ${folder} ${W} ${H}`);
