// Dev-only: concept pictures for "Bigger premises" (M7c, project.md section 6.14): a bar counter with
// stools, a toilet, and a cellar room (piwnica), drawn with the game's own sketchbook art. Three ideas
// for where the cellar shows: A, the room as now with the bar counter and the toilet door; B, the
// cellar below the room in one picture, cut open like a dollhouse; C, the cellar as a view of its own,
// down the stairs, switched like the street outside.
//
//   npx tsx scripts/pixel/concepts-premises.ts [folder]      (default art/concepts/premises)
//   node scripts/pixel/shoot.mjs <folder>/html <folder> 1364 603

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { GROUP_IDS } from '../../src/data/groups';
import { lookFor, type SketchKind } from '../../src/ui/sketch/cast';
import { chefSpot, depthScale, frontLayout, waiterSpot, type FrontLayout } from '../../src/ui/sketch/frontRoom';
import { hatch } from '../../src/ui/sketch/motifs';
import { Painter, svgPicture } from '../../src/ui/sketch/painter';
import { HAND, light } from '../../src/ui/sketch/palette';
import { figure, mewa, type Pose } from '../../src/ui/sketch/people';
import { chairsPicture, hatchCounterPicture, pageFramePicture, PLATE_CELL, platesPicture, roomPicture, TABLE_BOX, tablePicture, type RoomLook } from '../../src/ui/sketch/roomArt';
import { SEATED_HEIGHT, STANDING_HEIGHT } from '../../src/ui/sketch/sheets';

const folder = process.argv[2] ?? 'art/concepts/premises';
const W = 1364;
const H = 603;
const font = (file: string) => pathToFileURL(resolve('src/ui/sketch/fonts', file)).href;

const STAGES: Pose[][] = [
  [{ arms: 'menu', mouth: 'talk' }, { arms: 'rest', mouth: 'smile' }],
  [{ arms: 'rest', mouth: 'smile' }],
  [{ arms: 'glass', mouth: 'laugh' }, { arms: 'rest', mouth: 'smile' }],
  [{ arms: 'fork', mouth: 'smile', eyes: 'happy' }, { arms: 'eat', mouth: 'smile' }],
];

const LOOK: RoomLook = { decor: ['tablecloths', 'lanterns'], equipment: ['espresso'], weather: 'sunny', dusk: false, plaque: false, specials: [{ name: 'Żurek', price: 28 }, { name: 'Pierogi', price: 36 }] };

type Put = (z: number, svg: string) => void;

/** A table spot with its chairs, cloth, guests and plates (as the game draws them). */
function tableWithGuests(pt: Painter, put: Put, t: FrontLayout['tables'][number], i: number, zBase: number, embroidered = true, lit = true) {
  const kinds: SketchKind[] = [GROUP_IDS[i % 5], GROUP_IDS[i % 5], GROUP_IDS[(i + 2) % 5], GROUP_IDS[i % 5]];
  const stage = STAGES[i % STAGES.length];
  const box = (svg: string) => `<g transform="translate(${t.x + TABLE_BOX.left * t.scale},${t.top + TABLE_BOX.top * t.scale}) scale(${t.scale})">${svg}</g>`;
  put(zBase, box(chairsPicture(pt)));
  put(zBase + 2, box(tablePicture(pt, embroidered, false, lit)));
  for (let s = 0; s < 2 + (i % 3); s++) {
    const seat = t.seats[s];
    put(zBase + 1, figure(pt, seat.x, seat.y, SEATED_HEIGHT * t.scale, lookFor(kinds[s], i * 3 + s), { ...stage[s % stage.length], sit: true, stool: seat.end, turn: seat.mirror ? -1 : 1 }));
    const px = t.x + (seat.end ? (seat.mirror ? 62 : -62) : seat.mirror ? 28 : -28) * t.scale;
    const kind = i % STAGES.length === 3 ? 1 + ((i + s) % 4) : 0;
    put(zBase + 3, `<svg x="${px - PLATE_CELL.x * t.scale}" y="${t.top + 2 * t.scale - PLATE_CELL.y * t.scale}" width="${PLATE_CELL.width * t.scale}" height="${PLATE_CELL.height * t.scale}" viewBox="${kind * PLATE_CELL.width} 0 ${PLATE_CELL.width} ${PLATE_CELL.height}">${platesPicture(pt)}</svg>`);
  }
}

/** The toilet door in the back wall: narrow, panelled, with the Polish signs (a circle for ladies, a triangle for gents). */
function toiletDoor(pt: Painter, x: number, floorY: number): string {
  const w = 58;
  const top = floorY - 150;
  let g = pt.rect(x - w / 2 - 6, top - 6, w + 12, floorY - top + 6, 'beam', 3);
  g += pt.rect(x - w / 2, top, w, floorY - top, 'panel2', 2);
  g += pt.rect(x - w / 2 + 8, top + 10, w - 16, 52, light('#a87754', 0.12), 2) + pt.rect(x - w / 2 + 8, top + 72, w - 16, 64, light('#a87754', 0.12), 2);
  g += pt.circle(x + w / 2 - 10, top + 80, 3.5, 'brass');
  // The sign above: ○ and ▽, on a little enamel plate.
  g += pt.rect(x - 26, top - 40, 52, 26, 'white', 4);
  g += `<circle cx="${x - 11}" cy="${top - 27}" r="7" fill="none" stroke="#3b2a24" stroke-width="2.4"/><path d="M${x + 4},${top - 34} h16 l-8,14 Z" fill="none" stroke="#3b2a24" stroke-width="2.4" stroke-linejoin="round"/>`;
  return g;
}

/** Stools along the front of the bar, and the guests sitting at the counter (singles and pairs). */
function barCounter(pt: Painter, put: Put, L: FrontLayout) {
  const seatY = L.floorY + 44;
  const k = depthScale(L, seatY + 30);
  const stools = [L.bar.x0 + 40, L.bar.x0 + 100, L.bar.x0 + 160, L.bar.x0 + 215];
  const sitters: (SketchKind | null)[] = ['students', 'locals', null, 'foodies'];
  stools.forEach((x, i) => {
    // A tall wooden stool with a brass footrest.
    const stool = pt.line(`M${x - 13},${seatY + 64} L${x - 9},${seatY + 4} M${x + 13},${seatY + 64} L${x + 9},${seatY + 4}`, 'bar2', 4) + pt.line(`M${x - 11},${seatY + 40} H${x + 11}`, 'brass', 3) + `<ellipse cx="${x}" cy="${seatY + 2}" rx="17" ry="6" fill="#c4574b" stroke="#3b2a24" stroke-width="1.3"/>` + pt.shadow(x, seatY + 65, 20, 4);
    put(30, stool);
    const kind = sitters[i];
    if (kind) put(31, figure(pt, x, seatY, SEATED_HEIGHT * k, lookFor(kind, i + 4), { sit: true, stool: true, turn: i % 2 ? -1 : 1, legs: 'out', arms: i === 1 ? 'glass' : 'rest', mouth: i === 0 ? 'laugh' : 'smile' }));
  });
}

/** The room as the game shows it, with what bigger premises add: the bar counter's stools and the toilet door. */
function roomScene(L: FrontLayout, look: RoomLook, extras: { counter?: boolean; toilet?: boolean; stairs?: boolean }): string {
  const pt = new Painter();
  const layers = new Map<number, string>();
  const put: Put = (z, svg) => layers.set(z, (layers.get(z) ?? '') + svg);
  put(0, roomPicture(pt, L, look));
  if (extras.toilet) put(1, toiletDoor(pt, L.bar.x1 + 56, L.floorY));
  if (extras.stairs) put(1, stairsDown(pt, L.door.x - 150, L.floorY));
  L.tables.forEach((t, n) => tableWithGuests(pt, put, t, n, 10 + t.row * 10));
  [0, 1].forEach((i) => {
    const spot = chefSpot(L, 2, i);
    put(6, figure(pt, spot.x, spot.y, STANDING_HEIGHT, lookFor('chef', i), { arms: i ? 'panDown' : 'pan', mouth: 'smile', turn: 1 }));
  });
  put(7, hatchCounterPicture(pt, L));
  if (extras.counter) {
    barCounter(pt, put, L);
    // Behind the bar, the barman pours.
    put(2, figure(pt, L.bar.x0 + 130, L.floorY - 6, STANDING_HEIGHT * 0.86, lookFor('waiter', 5), { arms: 'pour', mouth: 'smile', turn: -1 }));
    put(3, mewa(pt, L.bar.x0 + 200, L.floorY - 40, 1));
  } else {
    (['waiter', 'tomek'] as const).forEach((kind, i) => {
      const spot = waiterSpot(L, i);
      put(spot.z, figure(pt, spot.x, spot.y, STANDING_HEIGHT * depthScale(L, spot.y), lookFor(kind, i), { arms: i ? 'rest' : 'tray', tray: 'full', mouth: 'smile', turn: 1 }));
    });
  }
  return [...layers.entries()].sort((a, b) => a[0] - b[0]).map(([, svg]) => svg).join('');
}

/** A stairway down in the room's floor, by the back wall: a railing, steps going down into warm light. */
function stairsDown(pt: Painter, x: number, floorY: number): string {
  let g = pt.fill(`M${x - 70},${floorY + 6} h140 l20,34 h-180 Z`, '#3b2a24');
  for (let s = 0; s < 4; s++) g += pt.rect(x - 60 + s * 6, floorY + 10 + s * 7, 120 - s * 12, 5, s ? '#e9b96a' : '#d6a26a', 1);
  g += `<ellipse cx="${x}" cy="${floorY + 30}" rx="70" ry="12" fill="#ffd27a" opacity="0.35"/>`;
  g += pt.line(`M${x - 80},${floorY + 2} V${floorY - 46} H${x + 80} V${floorY + 2} M${x - 40},${floorY - 46} V${floorY + 2} M${x},${floorY - 46} V${floorY + 2} M${x + 40},${floorY - 46} V${floorY + 2}`, 'bar2', 4);
  g += pt.rect(x - 34, floorY - 78, 68, 24, 'white', 4) + `<text x="${x}" y="${floorY - 61}" text-anchor="middle" font-family="${HAND}" font-size="13" font-weight="700" fill="#3b2a24">Piwnica ↓</text>`;
  return g;
}

// ---------- The cellar ----------

/** The vaulted brick cellar, as a stage like the room: arches, candle niches, barrels, the stairs down and a little window onto the street. */
function cellarPicture(pt: Painter, w: number, h: number, floorY: number, opts: { window?: boolean; stairs?: boolean } = {}): string {
  const brick = '#c98d6a';
  const plaster = '#f1e4cf';
  let g = pt.rect(0, 0, w, h, plaster);
  // Brick vaults: piers between the bays, and a brick arch over each bay.
  const bays = 4;
  const left = opts.stairs ? 250 : 40;
  const bayW = (w - left - 40) / bays;
  g += pt.rect(0, 0, w, 40, brick);
  for (let b = 0; b <= bays; b++) {
    const x = left + b * bayW;
    g += pt.rect(x - 22, 30, 44, floorY - 30, brick, 2);
    for (let y = 46; y < floorY; y += 18) g += pt.line(`M${x - 22},${y} H${x + 22} M${x + ((y / 18) % 2 ? -6 : 8)},${y} V${y + 18}`, '#a86f50', 1, 'opacity="0.7"');
  }
  for (let b = 0; b < bays; b++) {
    const x0 = left + b * bayW + 22;
    const x1 = left + (b + 1) * bayW - 22;
    const rise = 70;
    const top = 120;
    // The spandrels above the arch in brick, the arch's ring of bricks, and whitewash inside.
    g += pt.fill(`M${x0},${top + rise} Q${(x0 + x1) / 2},${top - rise} ${x1},${top + rise} L${x1},30 L${x0},30 Z`, brick);
    g += pt.line(`M${x0},${top + rise} Q${(x0 + x1) / 2},${top - rise} ${x1},${top + rise}`, '#8a5534', 10);
    for (let k = 1; k < 12; k++) {
      const t = k / 12;
      const ax = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * ((x0 + x1) / 2) + t * t * x1;
      const ay = (1 - t) * (1 - t) * (top + rise) + 2 * (1 - t) * t * (top - rise) + t * t * (top + rise);
      g += pt.line(`M${ax},${ay - 6} L${ax},${ay + 6}`, '#f1e4cf', 1.2, 'opacity="0.8"');
    }
    // A candle niche in the back wall of every other bay, a painted plate in the rest.
    const cx = (x0 + x1) / 2;
    if (b % 2 === 0) {
      g += pt.fill(`M${cx - 22},${floorY - 120} v-40 q22,-26 44,0 v40 Z`, '#8a5534') + pt.rect(cx - 3, floorY - 150, 6, 24, 'white', 2) + `<path d="M${cx},${floorY - 152} q-4,-8 0,-14 q4,6 0,14 Z" fill="#f2b54a"/>` + `<circle cx="${cx}" cy="${floorY - 150}" r="30" fill="#ffd27a" opacity="0.25"/>`;
    } else {
      g += pt.circle(cx, floorY - 150, 22, 'white') + pt.circle(cx, floorY - 150, 15, light('#4c78ab', 0.6)) + pt.circle(cx, floorY - 150, 6, 'red');
    }
  }
  // An iron chandelier with candles hanging from the middle vault.
  const mx = left + bayW * 2;
  g += pt.line(`M${mx},40 V96`, 'black', 2) + pt.line(`M${mx - 60},100 Q${mx},124 ${mx + 60},100`, 'black', 3);
  for (const dx of [-60, -20, 20, 60]) g += pt.rect(mx + dx - 3, 84 + Math.abs(dx) / 6, 6, 16, 'white', 2) + `<path d="M${mx + dx},${82 + Math.abs(dx) / 6} q-3,-6 0,-11 q3,5 0,11 Z" fill="#f2b54a"/>` + `<circle cx="${mx + dx}" cy="${80 + Math.abs(dx) / 6}" r="22" fill="#ffd27a" opacity="0.22"/>`;
  // The little window high up onto the street: cobbles, and the feet of someone walking past.
  if (opts.window) {
    const wx = left + bayW * 3 + bayW / 2 - 70;
    g += pt.rect(wx - 8, 52, 156, 66, '#8a5534', 3) + pt.rect(wx, 60, 140, 50, '#cfe3ec', 2);
    g += pt.rect(wx, 94, 140, 16, 'street', 0);
    g += pt.fill(`M${wx + 40},${94} v-30 h8 v26 h10 v6 Z`, '#4c78ab') + pt.fill(`M${wx + 62},${94} v-28 h8 v22 h12 v6 Z`, '#4c78ab');
    g += pt.line(`M${wx + 70},60 V110 M${wx},85 H${wx + 140}`, 'white', 3);
  }
  // The floor: old stone flags.
  g += pt.rect(0, floorY, w, h - floorY, '#cdb79c');
  for (let y = floorY + 26; y < h; y += 34) g += pt.line(`M0,${y} H${w}`, '#a8927a', 1.2, 'opacity="0.7"');
  for (let y = floorY; y < h; y += 34) for (let x = ((y / 34) % 2) * 60; x < w; x += 120) g += pt.line(`M${x},${y} V${y + 26}`, '#a8927a', 1.2, 'opacity="0.6"');
  g += hatch(pt, 0, floorY, w, 16, 6, 0.3);
  // Barrels in the corner.
  const r = 34;
  for (const [bx, by] of [[w - 120, floorY + 6], [w - 196, floorY + 6], [w - 158, floorY + 6 - r * 1.8]] as const) {
    g += pt.shadow(bx, by + 2, r, 6);
    g += pt.circle(bx, by - r, r, '#a8743a') + `<circle cx="${bx}" cy="${by - r}" r="${r * 0.78}" fill="none" stroke="#3b2a24" stroke-width="3"/>` + pt.circle(bx, by - r, r * 0.5, '#c9884a') + pt.circle(bx, by - r, 4, 'black');
  }
  g += pt.rect(w - 236, floorY + 6, 160, 8, 'bar2', 2);
  // The stairs coming down on the left, with light from the room above.
  if (opts.stairs) {
    g += pt.fill(`M0,0 H200 L${200},${floorY} H0 Z`, '#e9d7b8');
    for (let s = 0; s < 9; s++) {
      const sx = 10 + s * 22;
      const sy = 40 + s * ((floorY - 40) / 9);
      g += pt.rect(sx, sy, 200 - sx + 30, (floorY - 40) / 9, s % 2 ? '#d6a26a' : '#c38c55', 1);
    }
    g += pt.line(`M0,30 L230,${floorY - 30}`, 'bar2', 5) + pt.line(`M20,40 V10 M80,82 V52 M140,124 V94 M200,166 V136`, 'bar2', 3);
    g += `<path d="M0,0 L220,0 L120,${floorY} L0,${floorY} Z" fill="#fff4d6" opacity="0.35"/>`;
  }
  g += `<rect width="${w}" height="${h}" filter="url(#grain)"/>`;
  return g;
}

/** Cellar tables along one or two rows, laid out like the room's (the same seats and scales). */
function cellarTables(w: number, floorY: number, rows: number, perRow: number, left: number): FrontLayout['tables'] {
  const tables: FrontLayout['tables'] = [];
  for (let r = 0; r < rows; r++) {
    const scale = 1 + 0.06 * r;
    const top = floorY + 60 + r * 110;
    for (let c = 0; c < perRow; c++) {
      const x = left + 150 + c * 250 + (r % 2 ? 125 : 0);
      if (x > w - 230) continue;
      const y = top + 24 * scale;
      tables.push({ x, row: r, top, scale, seats: [
        { x: x - 36 * scale, y, end: false, mirror: false },
        { x: x + 36 * scale, y, end: false, mirror: true },
        { x: x - 84 * scale, y, end: true, mirror: false },
        { x: x + 84 * scale, y, end: true, mirror: true },
      ] });
    }
  }
  return tables;
}

/** The cellar with its tables taken, candles lit, by candlelight (a little dusky). */
function cellarScene(w: number, h: number, floorY: number, opts: { window?: boolean; stairs?: boolean; rows: number; perRow: number }): string {
  const pt = new Painter();
  const layers = new Map<number, string>();
  const put: Put = (z, svg) => layers.set(z, (layers.get(z) ?? '') + svg);
  put(0, cellarPicture(pt, w, h, floorY, opts));
  cellarTables(w, floorY, opts.rows, opts.perRow, opts.stairs ? 230 : 20).forEach((t, n) => tableWithGuests(pt, put, t, n + 2, 10 + t.row * 10, true, true));
  if (opts.stairs) put(5, figure(pt, 150, floorY - 30, STANDING_HEIGHT * 0.88, lookFor('waiter', 2), { arms: 'tray', tray: 'full', mouth: 'smile', turn: 1, walk: 0 }));
  put(90, `<rect width="${w}" height="${h}" fill="#5a3a2a" opacity="0.10"/>`);
  return [...layers.entries()].sort((a, b) => a[0] - b[0]).map(([, svg]) => svg).join('');
}

// ---------- The pages ----------

const b64 = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

function hud(buttons: string[], extra = ''): string {
  return `
<div class="top"><div class="p clock"><b>19:40</b><span>Friday 19 July<br><i>Week 2 · Sunny</i></span></div><div class="mid">${[['24', 'served'], ['1,180 zł', 'takings'], ['0', 'walked out'], ['0', 'no table']].map(([b, l]) => `<div class="p s"><b>${b}</b>${l}</div>`).join('')}</div><div class="p money">52,400 zł <em>3.6 ★</em></div></div>
<div class="bottom">${buttons.map((l) => `<div class="rb${l.startsWith('*') ? ' hl' : ''}"><span></span><b>${l.replace('*', '')}</b></div>`).join('')}${extra}<div class="p speed"><i>❚❚</i><i class="on">1×</i><i>2×</i><i>4×</i></div></div>`;
}

function page(title: string, note: string, body: string, buttons = ['Manage', 'Happy hour', 'Samples', 'Flyers', 'Who’s who', 'Top five', 'Outside'], at = ''): string {
  return `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: Kalam; font-weight: 700; src: url('${font('kalam-latin-700.woff2')}'); }
@font-face { font-family: Kalam; font-weight: 700; src: url('${font('kalam-latin-ext-700.woff2')}'); unicode-range: U+0100-02BA; }
body { margin: 0; width: ${W}px; height: ${H}px; position: relative; overflow: hidden; background: #fbf6ea; font-family: 'Segoe UI', sans-serif; color: #3b2a22; }
.band { position: absolute; left: 0; width: ${W}px; overflow: hidden; }
.band img { display: block; width: 100%; height: 100%; object-fit: cover; }
.p { border: 2px solid #3b2433; background: #fbf3e4; box-shadow: 3px 3px 0 rgba(59,36,51,.25); }
.top { position: absolute; top: 8px; left: 14px; right: 14px; display: flex; justify-content: space-between; align-items: flex-start; z-index: 5; }
.mid { display: flex; gap: 6px; }
.clock { display: flex; gap: 10px; align-items: center; padding: 3px 12px; font-size: 13px; font-weight: 700; } .clock b { font: 700 30px Kalam, cursive; color: #b5452f; } .clock i { color: #2f6f8f; font-style: normal; font-weight: 400; }
.money { padding: 8px 14px; font: 700 18px Kalam, cursive; } .money em { color: #a8752a; font-style: normal; margin-left: 10px; }
.s { min-width: 66px; padding: 2px 6px; text-align: center; font-size: 11px; font-weight: 600; } .s b { display: block; font: 700 18px Kalam, cursive; }
.bottom { position: absolute; left: 14px; right: 14px; bottom: 10px; display: flex; gap: 6px; align-items: flex-end; z-index: 5; }
.rb { display: flex; flex-direction: column; align-items: center; gap: 3px; width: 82px; } .rb span { width: 46px; height: 46px; border: 2px solid #3b2433; border-radius: 50%; background: #fbf3e4; box-shadow: inset 0 0 0 4px #fbf3e4, inset 0 0 0 6px #c4574b; } .rb b { border: 2px solid #3b2433; background: #fbf3e4; font-size: 12px; padding: 0 5px; white-space: nowrap; }
.rb.hl span { background: #f2b54a; } .rb.hl b { background: #f2b54a; }
.speed { margin-left: auto; display: flex; gap: 3px; padding: 3px; } .speed i { width: 40px; height: 40px; display: grid; place-items: center; border: 2px solid #3b2433; background: #f1e2c4; font-style: normal; font-weight: 700; } .speed i.on { background: #b5452f; color: #fff; }
.caption { position: absolute; left: 22px; top: 92px; width: 330px; padding: 10px 14px; background: #fbefc0; box-shadow: 2px 3px 0 rgba(59,36,51,.2); font: 700 16px/1.3 Kalam, cursive; transform: rotate(-1.2deg); z-index: 6; }
.caption b { color: #b5452f; font-size: 20px; }
.tag { position: absolute; z-index: 6; font: 700 15px/1.2 Kalam, cursive; color: #3b2433; background: #fffaf0; border: 2px solid #3b2433; padding: 4px 10px; box-shadow: 2px 2px 0 rgba(59,36,51,.3); }
.beam { position: absolute; left: 0; width: ${W}px; height: 14px; background: repeating-linear-gradient(90deg, #8a5a3a 0 30px, #7a4e32 30px 32px); border-top: 3px solid #3b2433; border-bottom: 3px solid #3b2433; z-index: 4; }
.frame { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
</style><body>${body}<img class="frame" src="${b64(svgPicture(W, H, pageFramePicture(new Painter(), W, H)))}">${hud(buttons)}<div class="caption" style="${at}"><b>${title}</b><br>${note}</div></body>`;
}

mkdirSync(`${folder}/html`, { recursive: true });

// A: the room as now (Ogarna, 6 tables), with a bar counter's stools and the toilet door.
{
  const L = frontLayout(6, W / H);
  const room = svgPicture(L.width, L.height, roomScene(L, LOOK, { counter: true, toilet: true }));
  writeFileSync(
    `${folder}/html/a-bar-counter-and-toilet.html`,
    page(
      'A · Bar counter and toilet',
      'Stools along the bar: singles and pairs sit there, quick drinks and coffee. A narrow door with the Polish ○ ▽ signs: the toilet.',
      `<div class="band" style="top:0;height:${H}px"><img src="${b64(room)}" style="object-position:0% 100%"></div><div class="tag" style="left:40px;top:96px">The bar counter: 4 stools for 1–2</div><div class="tag" style="left:262px;top:136px">○ ▽ the toilet</div>`,
      undefined,
      'right:24px;left:auto;top:auto;bottom:74px',
    ),
  );
}

// B: the cellar below the room, in one picture, cut open like a dollhouse.
{
  const L = frontLayout(6, 1515 / 520);
  const room = svgPicture(L.width, L.height, roomScene(L, LOOK, { counter: true, toilet: true, stairs: true }));
  const cw = L.width;
  const ch = 420;
  const cellar = svgPicture(cw, ch, cellarScene(cw, ch, 220, { window: false, stairs: false, rows: 1, perRow: 5 }));
  // Room and cellar stacked, scaled to fit between the top panels and the buttons.
  const stackW = Math.round(((H - 62 - 70) / (L.height + ch + 16)) * cw);
  writeFileSync(
    `${folder}/html/b-cellar-below-cut-open.html`,
    page(
      'B · The cellar below, in one picture',
      'Like a dollhouse cut open: the room above, the vaulted cellar under the floor. Everything at a glance, but everyone drawn smaller.',
      `<div style="position:absolute;left:${(W - stackW) / 2}px;top:62px;width:${stackW}px"><img src="${b64(room)}" style="display:block;width:100%"><div style="height:10px;background:repeating-linear-gradient(90deg,#8a5a3a 0 30px,#7a4e32 30px 32px);border-top:3px solid #3b2433;border-bottom:3px solid #3b2433"></div><img src="${b64(cellar)}" style="display:block;width:100%"></div><div class="tag" style="right:30px;top:180px;width:150px">Seated guests about half the size they are now</div>`,
      undefined,
      'left:20px;top:250px;width:250px',
    ),
  );
}

// C: the cellar as a view of its own: down the stairs, by candlelight; the switch goes Inside → Cellar → Outside.
{
  const cw = 1515;
  const ch = 670;
  const cellar = svgPicture(cw, ch, cellarScene(cw, ch, 380, { window: true, stairs: true, rows: 2, perRow: 4 }));
  writeFileSync(
    `${folder}/html/c-cellar-own-view.html`,
    page(
      'C · The cellar, a view of its own',
      'Down the stairs: brick vaults, candles, barrels, the street’s feet through a little window. A round button switches Room / Cellar / Outside, with a badge as now.',
      `<div class="band" style="top:0;height:${H}px"><img src="${b64(cellar)}" style="object-position:0% 100%"></div><div class="tag" style="left:40px;top:80px">down from the room</div><div class="tag" style="left:950px;top:120px">feet on the cobbles</div>`,
      ['Manage', 'Happy hour', 'Samples', 'Flyers', 'Who’s who', 'Top five', '*Upstairs', 'Outside'],
      'left:auto;right:24px;top:180px;width:300px',
    ),
  );
}
console.log(`written ${folder}/html; now: node scripts/pixel/shoot.mjs ${folder}/html ${folder} ${W} ${H}`);
