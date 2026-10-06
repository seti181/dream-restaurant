// The restaurant from the front, as in the concept picture (art/concepts/v8/sketchbook-page.png):
// the bar on the left, two tables under three arched windows onto Długi Targ, the kitchen hatch
// on the right, and the pavement along the bottom. This is M8's first still; the next items lay
// the room out from the game's own tables and fill it with its own people.

import { bunting, folkBand, hatch, rosette, tulip } from './motifs';
import type { Painter } from './painter';
import { dark, HAND, light, PAGE_H as H, PAGE_W as W } from './palette';
import { CAST, figure, mewa, type Pose } from './people';

/** Where the back wall meets the floor. */
export const FLOOR_Y = 440;

/** The back wall: wallpaper of tulips and rosettes, beams, panelling with an embroidered band, and shade in the corners. */
function backWall(pt: Painter): string {
  let g = pt.rect(80, 30, W - 160, FLOOR_Y - 30, 'wall');
  for (let x = 120; x < W - 120; x += 90)
    for (let y = 70; y < 320; y += 90)
      g += ((x + y) / 90) % 2 ? tulip(pt, x, y + 16, 30, ['red', 'blue'][((x / 90) | 0) % 2]) : rosette(pt, x, y, 10, ['red', 'blue', 'green'][((x + y) / 90) % 3 | 0]);
  g += pt.rect(80, 26, W - 160, 22, 'beam');
  for (let x = 140; x < W - 120; x += 180) g += pt.rect(x, 26, 26, 34, 'beam');
  return g;
}

/** Three tall arched windows onto Długi Targ: sky, clouds and gulls, St Mary's, the Town Hall, gables and Neptune. */
function windows(pt: Painter): string {
  const p = pt.p;
  let g = '';
  for (const [i, wx] of [470, 650, 830].entries()) {
    const ww = 150;
    const arch = `M${wx},300 L${wx},130 Q${wx},70 ${wx + ww / 2},66 Q${wx + ww},70 ${wx + ww},130 L${wx + ww},300 Z`;
    g += pt.fill(arch, 'window');
    g += `<g filter="url(#wash)" opacity="0.95"><ellipse cx="${wx + 40 + i * 22}" cy="${104 + i * 8}" rx="22" ry="9" fill="#fffaf0"/><ellipse cx="${wx + 58 + i * 22}" cy="${98 + i * 8}" rx="16" ry="10" fill="#fffaf0"/></g>`;
    g += pt.line(`M${wx + 96 - i * 30},${92 + i * 14} q5,-5 10,0 q5,-5 10,0`, 'ink', 1.2);
    if (i === 0)
      g +=
        pt.rect(wx + 84, 112, 52, 190, '#c27a5c') +
        [0, 1, 2, 3].map((k) => pt.rect(wx + 86 + k * 13, 104, 8, 10, '#c27a5c')).join('') +
        [0, 1].map((k) => `<rect x="${wx + 96 + k * 18}" y="132" width="8" height="34" rx="4" fill="${dark(p.window, 0.3)}"/>`).join('');
    if (i === 2) g += pt.rect(wx + 64, 120, 24, 180, '#d9a079') + pt.fill(`M${wx + 62},122 L${wx + 76},74 L${wx + 90},122 Z`, '#4f7f6a') + pt.circle(wx + 76, 72, 3.5, 'yellow');
    const facades = ['facadeA', 'facadeB', 'facadeC', 'facadeD', 'facadeE'];
    for (let k = 0; k < 3; k++) {
      const fx = wx + 4 + k * 49;
      const top = 150 + ((i * 3 + k) % 3) * 18;
      g += pt.fill(`M${fx},300 L${fx},${top + 20} L${fx + 12},${top + 20} L${fx + 12},${top + 8} L${fx + 23},${top} L${fx + 34},${top + 8} L${fx + 34},${top + 20} L${fx + 46},${top + 20} L${fx + 46},300 Z`, facades[(i * 3 + k) % 5]);
      for (let r = 0; r < 3; r++) g += `<rect x="${fx + 8}" y="${top + 32 + r * 30}" width="10" height="16" rx="5" fill="${dark(p.window, 0.25)}"/><rect x="${fx + 28}" y="${top + 32 + r * 30}" width="10" height="16" rx="5" fill="${dark(p.window, 0.25)}"/>`;
    }
    if (i === 1) {
      g += pt.rect(wx + 50, 250, 50, 30, 'steel') + pt.fill(`M${wx + 75},250 l-6,-46 l6,-10 l6,10 l-6,46 Z`, '#3f8a7a') + pt.line(`M${wx + 87},205 l0,-34 M${wx + 82},171 l5,-8 l5,8`, '#3f8a7a', 2.5);
      g += `<path d="M${wx + 55},252 q20,-14 40,0" stroke="#bfe6f5" stroke-width="3" fill="none" opacity="0.9"/>`;
    }
    // Frame and mullions, curtains tied back, and geraniums on the sill.
    g += pt.line(arch, 'white', 7) + pt.line(`M${wx + ww / 2},70 L${wx + ww / 2},300 M${wx},185 L${wx + ww},185`, 'white', 5);
    g +=
      pt.fill(`M${wx - 18},62 Q${wx + 6},120 ${wx - 4},200 Q${wx - 14},250 ${wx - 22},300 L${wx - 30},300 L${wx - 30},62 Z`, 'red') +
      pt.fill(`M${wx + ww + 18},62 Q${wx + ww - 6},120 ${wx + ww + 4},200 Q${wx + ww + 14},250 ${wx + ww + 22},300 L${wx + ww + 30},300 L${wx + ww + 30},62 Z`, 'red');
    g += pt.rect(wx - 10, 296, ww + 20, 10, 'white') + hatch(pt, wx - 10, 306, ww + 20, 7, 5);
    for (let k = 0; k < 4; k++)
      g += pt.rect(wx + 6 + k * 36, 278, 22, 18, 'copper', 3) + pt.circle(wx + 12 + k * 36, 272, 7, 'green') + pt.circle(wx + 24 + k * 36, 270, 6, 'green') + pt.circle(wx + 18 + k * 36, 264, 5, k % 2 ? 'red' : '#f07a8a');
  }
  return g;
}

/** Panelling under the dado rail, ceiling shade, bunting, plates, preserves, the picture with Mewa, the chalkboard and the clock. */
function wallDetails(pt: Painter): string {
  const p = pt.p;
  let g = pt.rect(80, 320, W - 160, FLOOR_Y - 320, 'panel');
  for (let x = 96; x < W - 110; x += 74) g += pt.rect(x, 336, 60, 88, 'panel2', 4);
  g += pt.rect(80, 312, W - 160, 12, 'beam');
  g += folkBand(pt, 80, 324, W - 160, 14, ['yellow', 'red', 'blue']);
  g += hatch(pt, 80, 48, W - 160, 12, 6, 0.25) + hatch(pt, 80, 48, 16, 392, 5, 0.3) + hatch(pt, W - 96, 48, 16, 392, 5, 0.3);
  g += bunting(pt, 330, 650, 52, 10) + bunting(pt, 650, 990, 52, 10);
  for (const [k, px] of [310, 350, 390].entries()) g += pt.circle(px, 214, 17, 'white') + pt.circle(px, 214, 13, light(p.blue, 0.7)) + rosette(pt, px, 214, 8, ['red', 'blue', 'red'][k]);
  g += pt.rect(292, 284, 120, 6, 'bar') + hatch(pt, 292, 290, 120, 5, 4);
  for (const [k, jar] of ['red', 'yellow', 'green', 'purple', '#e08a3a'].entries())
    g += pt.rect(298 + k * 23, 260, 17, 24, jar, 3) + pt.rect(297 + k * 23, 256, 19, 6, k % 2 ? 'red' : 'white', 2) + `<rect x="${301 + k * 23}" y="268" width="11" height="7" fill="#fffaf0" opacity="0.9"/>`;
  g += pt.rect(290, 92, 120, 92, 'brass') + pt.rect(298, 100, 104, 76, '#9cc3d6') + pt.fill('M310,170 L330,140 L350,170 Z', 'facadeA') + pt.fill('M340,150 L340,118 L362,150 Z', 'white') + pt.line('M300,166 q50,-10 100,0', 'blue', 3);
  g += pt.rect(1000, 80, 150, 104, '#6a3d26') + pt.rect(1008, 88, 134, 88, '#2f4a3c');
  ['DZIŚ POLECAMY', 'żurek · 28', 'pierogi · 36', 'szarlotka · 18'].forEach(
    (t, i) => (g += `<text x="1018" y="${108 + i * 20}" font-family="${HAND}" font-size="${i ? 14 : 13}" fill="#f4efe2">${t}</text>`),
  );
  g += pt.circle(1220, 120, 24, 'white') + pt.line('M1220,120 l0,-14 M1220,120 l10,4', 'ink', 2.5);
  g += mewa(pt, 384, 92, 1.25);
  return g;
}

/** The bar on the left: shelves of bottles and a mirror, the bartender, the counter with taps and glasses. */
function bar(pt: Painter): string {
  const p = pt.p;
  let g = pt.rect(100, 90, 170, 220, 'bar2') + pt.rect(112, 100, 146, 66, '#cfe3ec');
  for (const sy of [176, 236]) {
    g += pt.rect(104, sy + 46, 162, 8, 'bar');
    for (let i = 0; i < 9; i++) {
      const bottle = ['glassG', 'glassR', 'glassY', 'glassG', 'white', 'glassR', 'glassG', 'glassY', 'glassR'][i];
      g += pt.fill(`M${112 + i * 17},${sy + 46} v-26 q0,-6 4,-8 v-8 h4 v8 q4,2 4,8 v26 Z`, bottle) + `<rect x="${113 + i * 17}" y="${sy + 30}" width="10" height="7" fill="#fffaf0" opacity="0.85"/>`;
    }
  }
  g += figure(pt, 185, 392, 170, CAST.bartender, { turn: 1, arms: 'pour', mouth: 'talk' });
  g += pt.rect(90, 330, 250, 116, 'bar') + pt.rect(84, 322, 262, 14, 'bar2');
  for (let x = 100; x < 330; x += 58) g += pt.rect(x, 346, 46, 84, light(p.bar, 0.08), 3);
  g += folkBand(pt, 90, 430, 250, 12, ['red', 'yellow', 'green']);
  g += pt.line('M90,438 L340,438', 'brass', 4);
  for (const tx of [150, 175, 200]) g += pt.rect(tx, 290, 9, 32, 'brass', 3) + pt.rect(tx - 2, 282, 13, 12, 'black', 3);
  for (const gx of [240, 268, 296]) g += pt.fill(`M${gx},322 l2,-26 h16 l2,26 Z`, 'yellow') + `<rect x="${gx + 2}" y="294" width="16" height="6" fill="#fffaf0"/>`;
  return g;
}

/** The kitchen hatch on the right: Delft tiles, copper pans, the range with a steaming pot, the chef and the pass. */
function kitchenHatch(pt: Painter): string {
  const p = pt.p;
  let g = pt.rect(1000, 196, 270, 140, 'tile');
  for (let x = 1004; x < 1268; x += 22) for (let y = 200; y < 334; y += 22) g += `<path d="M${x + 11},${y + 4} l7,7 l-7,7 l-7,-7 Z" fill="${p.tileBlue}" opacity="0.8"/>`;
  g += pt.rect(1020, 206, 160, 10, 'ink') + [1040, 1080, 1125, 1160].map((px, i) => pt.line(`M${px},216 l0,10`, 'ink', 2) + pt.circle(px, 236 + i * 2, 11 + i * 2, 'copper')).join('');
  g += pt.rect(1180, 270, 80, 66, 'steel') + pt.rect(1192, 246, 50, 26, 'steel', 4) + pt.line('M1205,240 q-8,-20 4,-40 M1225,240 q8,-22 -4,-44', 'white', 4) + pt.fill('M1196,272 q8,-14 16,0 q8,-14 16,0 q8,-14 16,0 Z', '#ff9a2e');
  g += figure(pt, 1090, 400, 175, CAST.chef, { turn: -1, arms: 'pan', mouth: 'smile', eyes: 'happy' });
  g += pt.line('M1000,196 h270 v140 h-270 Z', 'beam', 10);
  g += pt.rect(990, 330, 290, 14, 'bar2') + pt.rect(1000, 344, 270, 96, 'bar');
  for (let x = 1012; x < 1260; x += 64) g += pt.rect(x, 356, 52, 74, light(p.bar, 0.08), 3);
  for (const [px, food] of [[1030, 'yellow'], [1100, '#c9893a'], [1170, 'green']] as [number, string][]) g += pt.fill(`M${px - 22},330 q22,-12 44,0 Z`, 'plate') + pt.fill(`M${px - 12},328 q12,-10 24,0 Z`, food);
  g += folkBand(pt, 1000, 428, 270, 12, ['blue', 'yellow', 'red']);
  return g;
}

/** The floor: boards, the Kashubian rug, shade under the counters, the market crate, the fig tree and the regular on his stool. */
function floor(pt: Painter): string {
  const p = pt.p;
  let g = pt.fill(`M80,${FLOOR_Y} L${W - 80},${FLOOR_Y} L${W},${H - 40} L0,${H - 40} Z`, 'floor');
  for (let i = -12; i <= 12; i++) g += pt.line(`M${W / 2 + i * 50},${FLOOR_Y} L${W / 2 + i * 62},${H - 40}`, 'floor2', 1.4, 'opacity="0.6"');
  for (let k = 1; k < 4; k++) g += pt.line(`M${80 - k * 25},${FLOOR_Y + k * 30} L${W - 80 + k * 25},${FLOOR_Y + k * 30}`, 'floor2', 1.2, 'opacity="0.5"');
  g += pt.fill('M430,452 L940,452 L990,520 L380,520 Z', 'red') + pt.fill('M445,458 L925,458 L968,514 L402,514 Z', 'yellow') + pt.fill('M462,464 L908,464 L944,508 L426,508 Z', 'blue');
  for (let k = 0; k < 5; k++) g += rosette(pt, 520 + k * 90, 486, 9, k % 2 ? 'yellow' : 'red');
  g += hatch(pt, 90, 446, 250, 12, 5) + hatch(pt, 1000, 440, 270, 12, 5);
  // A crate from the morning market: cabbages, beetroot and carrots.
  g += pt.shadow(240, 556, 70, 7, 0.15);
  for (const [cx, cy, c, r] of [[204, 512, 'green', 16], [232, 506, 'purple', 11], [252, 512, '#9a2f4a', 12], [276, 508, 'green', 15]] as [number, number, string, number][]) g += pt.circle(cx, cy, r, c);
  for (const cx of [222, 244, 262]) g += pt.fill(`M${cx},508 l5,-18 l5,18 Z`, '#e8873a') + pt.line(`M${cx + 5},490 l-3,-7 M${cx + 5},490 l3,-7`, 'green', 1.6);
  g += pt.rect(186, 514, 108, 42, 'bar', 3) + pt.line('M188,528 h104 M188,542 h104', dark(p.bar, 0.3), 1.2) + `<text x="240" y="551" text-anchor="middle" font-family="${HAND}" font-size="11" font-weight="700" fill="#fffaf0">TARG</text>`;
  // The fig tree in its pot.
  g += pt.shadow(130, 560, 38, 6, 0.15) + pt.line('M130,514 L130,470 M130,490 L112,462 M130,482 L150,456', 'bar2', 3.5);
  for (const [k, [lx, ly]] of [[104, 470], [116, 452], [132, 440], [150, 448], [160, 466], [146, 478], [120, 480], [100, 456], [138, 458], [126, 464], [156, 488], [108, 492]].entries())
    g += pt.fill(`M${lx},${ly + 10} q-11,-9 0,-20 q11,11 0,20 Z`, k % 3 ? 'green' : light(p.green, 0.3));
  g += pt.rect(102, 512, 56, 48, 'copper', 6) + rosette(pt, 130, 536, 11, 'red');
  // The regular on a bar stool, with a beer.
  g += pt.line('M324,414 L308,484 M356,414 L372,484 M340,414 L340,486', 'ink', 3.2) + pt.line('M314,460 Q340,468 366,460', 'brass', 3) + pt.shadow(340, 486, 40, 5, 0.15);
  g += pt.rect(310, 402, 60, 14, 'red', 7);
  g += figure(pt, 340, 404, 190, CAST.dad, { sit: true, stool: true, turn: -1, arms: 'glass', mouth: 'laugh' });
  return g;
}

/** A table for two: chairs, the guests, a long embroidered cloth, plates of pierogi and steaming soup, a glass, a candle and a lamp. */
function table(pt: Painter, tx: number, left: string, leftPose: Pose, right: string, rightPose: Pose): string {
  const p = pt.p;
  let g = '';
  for (const cx of [tx - 78, tx + 78]) g += pt.rect(cx - 26, 330, 52, 90, 'beam', 10) + pt.rect(cx - 18, 340, 36, 30, light(p.beam, 0.15), 6);
  g += figure(pt, tx - 80, 436, 195, CAST[left], leftPose);
  g += figure(pt, tx + 80, 436, 195, CAST[right], rightPose);
  g += pt.shadow(tx, 508, 124, 9, 0.18);
  g += pt.fill(`M${tx - 92},412 Q${tx - 98},470 ${tx - 104},508 L${tx + 104},508 Q${tx + 98},470 ${tx + 92},412 Z`, 'cloth');
  for (let k = -3; k <= 3; k++) g += pt.line(`M${tx + k * 26},420 q3,40 ${k * 3},86`, '#d9cfbf', 1.2, 'opacity="0.7"');
  g += folkBand(pt, tx - 100, 478, 200, 16, ['red', 'yellow', 'blue']);
  g += pt.fill(`M${tx - 96},412 Q${tx},396 ${tx + 96},412 Q${tx},428 ${tx - 96},412 Z`, 'cloth');
  for (const [px, food] of [[tx - 44, 'pierogi'], [tx + 44, 'soup']] as [number, string][]) {
    g += pt.fill(`M${px - 24},410 q24,-12 48,0 q-24,10 -48,0 Z`, 'plate');
    if (food === 'pierogi') for (const d of [-9, 0, 9]) g += pt.fill(`M${px + d - 7},408 q7,-11 14,0 Z`, '#f1d79a');
    else g += pt.fill(`M${px - 14},408 q14,-8 28,0 q-14,6 -28,0 Z`, '#e7c87a') + pt.circle(px - 4, 405, 3, 'white') + pt.line(`M${px - 4},398 q-5,-7 0,-14 q5,-7 0,-14 M${px + 6},399 q-5,-7 0,-14 q5,-7 0,-12`, 'ink', 1, 'opacity="0.45"');
    g += pt.line(`M${px - 30},404 l-2,12 M${px + 30},404 l2,12`, '#8a9096', 1.6);
  }
  g += pt.fill(`M${tx - 8},404 l2,-24 h12 l2,24 Z`, 'red');
  g += pt.rect(tx + 12, 388, 6, 18, 'white', 2) + `<path d="M${tx + 15},378 q4,5 0,10 q-4,-5 0,-10 Z" fill="#ffc94a"/>`;
  g += pt.line(`M${tx},48 L${tx},128`, 'ink', 1.6) + pt.fill(`M${tx - 30},150 Q${tx - 26},126 ${tx},124 Q${tx + 26},126 ${tx + 30},150 Z`, 'green') + `<ellipse cx="${tx}" cy="152" rx="12" ry="4" fill="#fff1c0"/>` + pt.line(`M${tx - 18},132 q18,-6 36,0`, light(p.green, 0.5), 1.4);
  return g;
}

/** By the door: the waiter coming in with a tray, the coat stand, and a foodie waving hello. */
function byTheDoor(pt: Painter): string {
  let g = figure(pt, 950, 572, 215, CAST.waiter, { turn: -1, arms: 'tray', mouth: 'smile' });
  g += pt.shadow(1262, 560, 26, 5, 0.15) + pt.line('M1262,558 L1262,378 M1244,560 L1262,540 L1280,560 M1250,388 L1274,388', 'bar2', 4);
  g += pt.fill('M1244,382 q18,-22 36,0 Z', 'facadeE') + pt.rect(1240, 380, 44, 6, 'facadeE', 3);
  g += pt.fill('M1256,394 l-6,70 l9,0 l3,-62 l3,62 l9,0 l-6,-70 Z', 'yellow') + pt.line('M1251,446 h9 M1265,446 h9 M1250,456 h9 M1265,456 h9', 'red', 2);
  g += figure(pt, 1190, 572, 205, CAST.foodie, { turn: -1, arms: 'wave', mouth: 'talk' });
  return g;
}

/** The pavement and cobbles along the bottom. */
function pavement(pt: Painter): string {
  let g = pt.rect(0, H - 40, W, 40, 'street');
  for (let x = 0; x < W; x += 30) g += pt.rect(x + 2, H - 36, 26, 14, 'street2', 5) + pt.rect(x + 17, H - 18, 26, 14, 'street2', 5);
  return g;
}

/** Sunbeams through the windows and pools of lamplight over the tables. */
function sunAndLamps(): string {
  let g = '';
  for (const wx of [470, 650, 830]) g += `<path d="M${wx},90 L${wx + 150},90 L${wx + 230},520 L${wx + 40},520 Z" fill="url(#sunbeam)" style="mix-blend-mode:screen"/>`;
  for (const tx of [560, 790]) g += `<ellipse cx="${tx}" cy="250" rx="140" ry="160" fill="url(#lampglow)" style="mix-blend-mode:screen"/>`;
  return g;
}

/** The whole room of the concept picture, in page units. */
export function conceptRoom(pt: Painter): string {
  return (
    backWall(pt) +
    windows(pt) +
    wallDetails(pt) +
    bar(pt) +
    kitchenHatch(pt) +
    floor(pt) +
    table(pt, 560, 'tourist', { sit: true, turn: 1, arms: 'fork', mouth: 'smile' }, 'granny', { sit: true, turn: -1, arms: 'rest', mouth: 'laugh', eyes: 'happy' }) +
    table(pt, 790, 'student', { sit: true, turn: 1, arms: 'wave', mouth: 'laugh' }, 'office', { sit: true, turn: -1, arms: 'glass', mouth: 'smile' }) +
    byTheDoor(pt) +
    pavement(pt) +
    sunAndLamps()
  );
}
