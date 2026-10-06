// Dev-only: draws the restaurant in the sketchbook look (project.md section 9.5) with a full house,
// so the art can be checked without playing: every table taken, guests ordering, waiting, cross and
// eating, people walking in, a queue at the door, waiters and chefs. Three rooms: a small one, a
// middle one with all the decor and equipment, and the biggest at dusk.
//
//   npx tsx scripts/pixel/sketch-preview.ts <folder>
//   node scripts/pixel/shoot.mjs <folder>/html <folder>
//
// The game itself places baked pictures of the same drawings (src/ui/SketchRoomView.tsx).

import { mkdirSync, writeFileSync } from 'node:fs';
import { DECOR_IDS } from '../../src/data/decor';
import { EQUIPMENT_IDS } from '../../src/data/equipment';
import { GROUP_IDS } from '../../src/data/groups';
import { lookFor, type SketchKind } from '../../src/ui/sketch/cast';
import { chefSpot, depthScale, frontLayout, queueSpot, waiterSpot, walkIn, type FrontLayout } from '../../src/ui/sketch/frontRoom';
import { Painter, svgPicture } from '../../src/ui/sketch/painter';
import { figure, type Pose } from '../../src/ui/sketch/people';
import { chairsPicture, hatchCounterPicture, pageFramePicture, PLATE_CELL, platesPicture, roomPicture, TABLE_BOX, tablePicture, type RoomLook } from '../../src/ui/sketch/roomArt';
import { SEATED_HEIGHT, STANDING_HEIGHT } from '../../src/ui/sketch/sheets';

const folder = process.argv[2] ?? 'art/sketch-preview';
const W = 1364;
const H = 603;

const STAGES: Pose[][] = [
  [{ arms: 'menu', mouth: 'talk' }, { arms: 'rest', mouth: 'smile' }],
  [{ arms: 'rest', mouth: 'smile' }],
  [{ arms: 'cross', mouth: 'frown' }],
  [{ arms: 'fork', mouth: 'smile', eyes: 'happy' }, { arms: 'eat', mouth: 'smile' }],
];

function room(L: FrontLayout, look: RoomLook): string {
  const pt = new Painter();
  // Each layer in turn, as the view stacks them (see LAYER and zOf in frontRoom.ts).
  const layers = new Map<number, string>();
  const put = (z: number, svg: string) => layers.set(z, (layers.get(z) ?? '') + svg);
  put(0, roomPicture(pt, L, look));
  L.tables.forEach((t, i) => {
    const kinds: SketchKind[] = i % 5 === 4 ? ['critic', 'foodies', 'foodies', 'foodies'] : [GROUP_IDS[i % 5], GROUP_IDS[i % 5], GROUP_IDS[i % 5], GROUP_IDS[i % 5]];
    const stage = STAGES[i % STAGES.length];
    const seated = 2 + (i % 3);
    const box = (svg: string) => `<g transform="translate(${t.x + TABLE_BOX.left * t.scale},${t.top + TABLE_BOX.top * t.scale}) scale(${t.scale})">${svg}</g>`;
    put(10 + t.row * 10, box(chairsPicture(pt)));
    put(12 + t.row * 10, box(tablePicture(pt, look.decor.includes('tablecloths'), look.decor.includes('communalTable'))));
    for (let s = 0; s < seated; s++) {
      const seat = t.seats[s];
      const pose = { ...stage[s % stage.length], sit: true, stool: seat.end, turn: seat.mirror ? -1 : 1 };
      put(10 + t.row * 10 + 1, figure(pt, seat.x, seat.y, SEATED_HEIGHT * t.scale, lookFor(kinds[s], i * 3 + s), pose));
      const px = t.x + (seat.end ? (seat.mirror ? 62 : -62) : seat.mirror ? 28 : -28) * t.scale;
      const kind = i % STAGES.length === 3 ? 1 + ((i + s) % 4) : 0;
      put(13 + t.row * 10, `<svg x="${px - PLATE_CELL.x * t.scale}" y="${t.top + 2 * t.scale - PLATE_CELL.y * t.scale}" width="${PLATE_CELL.width * t.scale}" height="${PLATE_CELL.height * t.scale}" viewBox="${kind * PLATE_CELL.width} 0 ${PLATE_CELL.width} ${PLATE_CELL.height}">${platesPicture(pt)}</svg>`);
    }
  });
  // Chefs behind the hatch, the counter in front of them, waiters at the bar and the queue.
  [0, 1].forEach((i) => {
    const spot = chefSpot(L, 2, i);
    put(6, figure(pt, spot.x, spot.y, STANDING_HEIGHT, lookFor('chef', i), { arms: i ? 'panDown' : 'pan', mouth: 'smile', turn: 1 }));
  });
  put(7, hatchCounterPicture(pt, L));
  const standing = (x: number, y: number, kind: SketchKind, variant: number, pose: Pose) => figure(pt, x, y, STANDING_HEIGHT * depthScale(L, y), lookFor(kind, variant), pose);
  (['waiter', 'tomek'] as const).forEach((kind, i) => {
    const spot = waiterSpot(L, i);
    put(spot.z, standing(spot.x, spot.y, kind, i, { arms: 'rest', mouth: 'smile', turn: 1 }));
  });
  for (let p = 0; p < 2; p++)
    for (let i = 0; i < 2; i++) {
      const spot = queueSpot(L, p, i);
      put(spot.z + p, standing(spot.x, spot.y, GROUP_IDS[(p + 2) % 5], p * 3 + i, { arms: 'rest', mouth: 'smile', turn: i ? -1 : 1 }));
    }
  // A party walking in along the front aisle, and a waiter carrying plates.
  const path = walkIn(L, L.tables.length - 1, 0);
  const front = path[2];
  put(front.z, standing(front.x + 120, front.y, 'tourists', 2, { arms: 'swing', walk: 0, mouth: 'smile', turn: -1 }) + standing(front.x + 170, front.y, 'tourists', 5, { arms: 'swing', walk: 1, mouth: 'smile', turn: -1 }));
  // A party on its way out, walking up to the door: we see their backs.
  const door = L.door.x;
  const way = (L.floorY + L.rows[0].lane) / 2;
  put(15, standing(door - 26, way, 'students', 1, { back: true, walk: 0 }) + standing(door + 22, way + 26, 'tourists', 0, { back: true, walk: 1 }));
  const lane0 = L.rows[0].lane;
  put(15, standing(L.tables[0].x + 30, lane0, 'adrian', 0, { arms: 'tray', tray: 'full', walk: 1, mouth: 'smile', turn: 1 }));
  put(900, pageFramePicture(pt, L.width, L.height));
  return [...layers.entries()].sort((a, b) => a[0] - b[0]).map(([, svg]) => svg).join('');
}

const rooms: [string, number, RoomLook][] = [
  ['1-small', 6, { decor: [], equipment: [], weather: 'sunny', dusk: false, plaque: false, specials: [{ name: 'Żurek', price: 28 }, { name: 'Pierogi', price: 36 }, { name: 'Szarlotka', price: 18 }] }],
  ['2-all-decor', 8, { decor: DECOR_IDS, equipment: EQUIPMENT_IDS, weather: 'cloudy', dusk: false, plaque: true, specials: [{ name: 'Gołąbki', price: 34 }, { name: 'Fish soup', price: 30 }] }],
  ['3-biggest-dusk', 12, { decor: ['tablecloths', 'lanterns', 'clayPots'], equipment: ['pizzaOven'], weather: 'rain', dusk: true, plaque: false, specials: [{ name: 'Pizza', price: 39 }] }],
];

mkdirSync(`${folder}/html`, { recursive: true });
for (const [name, slots, look] of rooms) {
  const L = frontLayout(slots, W / H);
  const scale = Math.min(W / L.width, H / L.height);
  const svg = svgPicture(L.width, L.height, room(L, look));
  writeFileSync(
    `${folder}/html/${name}.html`,
    `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#fbf6ea"><div style="width:${W}px;height:${H}px;display:flex;align-items:center;justify-content:center"><img style="width:${L.width * scale}px" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"></div></body>`,
  );
}
console.log(`written ${folder}/html; now: node scripts/pixel/shoot.mjs ${folder}/html ${folder}`);
