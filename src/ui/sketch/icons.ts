// Little hand-drawn icons for the sketchbook look (project.md section 9.5), in ink and watercolour,
// replacing the emojis over the tables: what guests want, how they feel, who they are, and the
// buttons to help them. All drawn in one sheet of cells and baked once (bake.ts).

import type { Painter } from './painter';
import { dark, light } from './palette';

export const ICON_IDS = [
  'menu', 'plate', 'hourglass', 'angry', 'yum', 'happy', 'meh', 'sad', 'heart', 'missed',
  'leaf', 'dill', 'fish', 'soup', 'cake', 'pierogi', 'coffee', 'chili', 'flag', 'mushroom',
  'lemon', 'shot', 'ball', 'victory', 'clapper', 'pen', 'laptop', 'book', 'anchor', 'pencil',
  'lightning', 'help', 'wave',
] as const;
export type IconId = (typeof ICON_IDS)[number];

/** Each icon's cell in the sheet, in page units; the icon is drawn around its middle. */
export const ICON_CELL = 64;

/** Which icon stands for each of the game's emojis (the game's data still speaks in emojis). */
const FROM_EMOJI: Record<string, IconId> = {
  '💬': 'menu', '🍽️': 'plate', '⏳': 'hourglass', '😤': 'angry', '😠': 'angry', '😋': 'yum', '🙂': 'happy', '😐': 'meh', '😞': 'sad',
  '❤️': 'heart', '♥': 'heart', '🤷': 'missed', '🌱': 'leaf', '🌿': 'dill', '🐟': 'fish', '🥣': 'soup', '🍰': 'cake', '🥟': 'pierogi', '☕': 'coffee',
  '🌶️': 'chili', '🇵🇱': 'flag', '🍄': 'mushroom', '🍋': 'lemon', '🥃': 'shot', '⚽': 'ball', '✌️': 'victory', '🎬': 'clapper', '🖋️': 'pen',
  '💻': 'laptop', '📖': 'book', '⚓': 'anchor', '✏️': 'pencil', '⚡': 'lightning', '👋': 'wave',
};

/** A bubble's emoji text ("🌱?", "😋") as an icon and what's written after it, or null for something with no icon. */
export function iconOf(text: string): { icon: IconId; after: string } | null {
  for (const [emoji, icon] of Object.entries(FROM_EMOJI)) if (text.startsWith(emoji)) return { icon, after: text.slice(emoji.length).trim() };
  return null;
}

/** One icon, drawn around (x, y) at about 52 units across. */
function icon(pt: Painter, id: IconId, x: number, y: number): string {
  const p = pt.p;
  const face = (mouth: string, extra = '', skin = '#f6d58a') =>
    pt.circle(x, y, 22, skin) + `<circle cx="${x - 8}" cy="${y - 5}" r="2.6" fill="${p.ink}"/><circle cx="${x + 8}" cy="${y - 5}" r="2.6" fill="${p.ink}"/>` + mouth + extra;
  switch (id) {
    case 'menu':
      return pt.rect(x - 15, y - 21, 30, 40, 'white', 3) + pt.line(`M${x - 9},${y - 11} h18 M${x - 9},${y - 3} h14 M${x - 9},${y + 5} h17 M${x - 9},${y + 13} h10`, 'red', 2) + pt.rect(x - 15, y - 21, 30, 6, 'red', 2);
    case 'plate':
      return pt.circle(x, y + 2, 20, 'white') + pt.circle(x, y + 2, 12, light(p.blue, 0.75)) + pt.line(`M${x - 27},${y - 14} v32 M${x - 30},${y - 14} v9 M${x - 24},${y - 14} v9 M${x + 27},${y - 14} q6,12 0,18 v14`, '#8a9096', 2.4);
    case 'hourglass':
      return pt.rect(x - 15, y - 22, 30, 5, 'bar', 2) + pt.rect(x - 15, y + 17, 30, 5, 'bar', 2) + pt.fill(`M${x - 11},${y - 17} h22 q0,12 -9,17 q9,5 9,17 h-22 q0,-12 9,-17 q-9,-5 -9,-17 Z`, '#e8f2f6') + pt.fill(`M${x - 7},${y + 15} q7,-10 14,0 Z M${x - 5},${y - 12} h10 l-5,8 Z`, 'yellow');
    case 'angry':
      return face(`<path d="M${x - 9},${y + 11} q9,-7 18,0" fill="none" stroke="${p.ink}" stroke-width="2.4"/>`, pt.line(`M${x - 14},${y - 13} l9,4 M${x + 14},${y - 13} l-9,4`, 'ink', 2.4) + pt.line(`M${x + 20},${y - 22} q6,-4 4,-10 M${x + 26},${y - 18} q6,-4 4,-10`, 'ink', 1.8), '#ee9a7c');
    case 'yum':
      return face(`<path d="M${x - 10},${y + 6} q10,10 20,0 Z" fill="#7a2f35"/>`, pt.fill(`M${x + 2},${y + 9} q4,8 8,0 Z`, '#e46a6f'));
    case 'happy':
      return face(pt.line(`M${x - 9},${y + 7} q9,8 18,0`, 'ink', 2.4));
    case 'meh':
      return face(pt.line(`M${x - 8},${y + 9} h16`, 'ink', 2.4));
    case 'sad':
      return face(pt.line(`M${x - 9},${y + 12} q9,-7 18,0`, 'ink', 2.4), '', '#cfe0ee');
    case 'heart':
      return pt.fill(`M${x},${y + 20} C${x - 30},${y} ${x - 20},${y - 24} ${x},${y - 10} C${x + 20},${y - 24} ${x + 30},${y} ${x},${y + 20} Z`, 'red') + `<path d="M${x - 12},${y - 8} q-4,4 -2,9" stroke="#fffaf0" stroke-width="2.5" fill="none"/>`;
    case 'missed':
      return pt.circle(x, y + 4, 19, 'white') + pt.circle(x, y + 4, 11, light(p.blue, 0.75)) + `<text x="${x}" y="${y + 12}" text-anchor="middle" font-family="Georgia, serif" font-size="22" font-weight="700" fill="${p.red}">?</text>`;
    case 'leaf':
      return pt.line(`M${x},${y + 22} q-2,-14 0,-24`, 'green', 3) + pt.fill(`M${x},${y - 2} q-22,-2 -20,-20 q18,0 20,20 Z`, 'green') + pt.fill(`M${x},${y + 4} q20,-2 20,-18 q-18,0 -20,18 Z`, light(p.green, 0.25));
    case 'dill': {
      let g = pt.line(`M${x},${y + 22} L${x},${y - 18}`, 'green', 2.4);
      for (let k = 0; k < 4; k++) g += pt.line(`M${x},${y + 10 - k * 9} l-12,-8 M${x},${y + 10 - k * 9} l12,-8 M${x - 7},${y + 5 - k * 9} l-4,6 M${x + 7},${y + 5 - k * 9} l4,6`, 'green', 1.6);
      return g;
    }
    case 'fish':
      return pt.fill(`M${x - 22},${y} q18,-18 36,0 q-18,18 -36,0 Z`, '#9cc3d6') + pt.fill(`M${x + 12},${y} l12,-10 v20 Z`, '#7fb0cc') + `<circle cx="${x - 12}" cy="${y - 3}" r="2.5" fill="${p.ink}"/>` + pt.line(`M${x - 2},${y - 8} q4,8 0,16`, 'ink', 1.2);
    case 'soup':
      return pt.fill(`M${x - 22},${y - 2} h44 q-2,22 -22,22 q-20,0 -22,-22 Z`, 'red') + pt.fill(`M${x - 22},${y - 2} q22,-8 44,0 q-22,8 -44,0 Z`, '#e7c87a') + pt.line(`M${x - 6},${y - 12} q-4,-6 0,-12 M${x + 6},${y - 12} q-4,-6 0,-12`, 'ink', 1.6, 'opacity="0.6"');
    case 'cake':
      return pt.fill(`M${x - 20},${y + 16} v-18 l20,-12 l20,12 v18 Z`, '#f1d79a') + pt.fill(`M${x - 20},${y - 2} l20,-12 l20,12 Z`, '#fbe9ee') + pt.line(`M${x - 20},${y + 6} h40`, '#e6b0b4', 3) + pt.circle(x, y - 17, 4, 'red');
    case 'pierogi':
      return pt.fill(`M${x - 22},${y + 10} q22,-36 44,0 Z`, '#f1d79a') + pt.line(`M${x - 18},${y + 6} q2,-4 4,0 q2,-4 4,0 q2,-4 4,0 q2,-4 4,0 q2,-4 4,0 q2,-4 4,0 q2,-4 4,0 q2,-4 4,0 q2,-4 4,0`, dark('#f1d79a', 0.3), 1.4);
    case 'coffee':
      return pt.fill(`M${x - 16},${y - 8} h28 v14 q0,14 -14,14 q-14,0 -14,-14 Z`, 'white') + pt.line(`M${x + 12},${y - 4} q10,0 8,8 q-2,6 -8,6`, 'ink', 2.4) + pt.fill(`M${x - 14},${y - 8} h24 v4 h-24 Z`, '#6e4128') + pt.line(`M${x - 6},${y - 14} q-4,-6 0,-12 M${x + 4},${y - 14} q-4,-6 0,-12`, 'ink', 1.6, 'opacity="0.6"');
    case 'chili':
      return pt.fill(`M${x - 16},${y - 12} q30,0 32,26 q-20,-8 -32,-26 Z`, 'red') + pt.line(`M${x - 16},${y - 12} q-4,-6 2,-10`, 'green', 3);
    case 'flag':
      return pt.line(`M${x - 18},${y + 22} V${y - 22}`, 'bar2', 3) + pt.rect(x - 16, y - 20, 34, 13, 'white') + pt.rect(x - 16, y - 7, 34, 13, '#d6392e');
    case 'mushroom':
      return pt.rect(x - 7, y - 2, 14, 22, '#f4ecd6', 5) + pt.fill(`M${x - 22},${y} q22,-34 44,0 Z`, '#b8643a') + `<circle cx="${x - 7}" cy="${y - 10}" r="3" fill="#f4ecd6"/><circle cx="${x + 8}" cy="${y - 7}" r="2.5" fill="#f4ecd6"/>`;
    case 'lemon':
      return pt.fill(`M${x - 22},${y} q0,-18 22,-18 q22,0 22,18 q0,18 -22,18 q-22,0 -22,-18 Z`, 'yellow') + pt.line(`M${x - 6},${y - 10} q-4,4 -4,10`, '#fffaf0', 2.5) + pt.fill(`M${x + 16},${y - 14} q8,-6 10,-2 q-4,6 -10,2 Z`, 'green');
    case 'shot':
      return pt.fill(`M${x - 14},${y - 18} h28 l-4,38 h-20 Z`, '#e8f2f6') + pt.fill(`M${x - 12},${y - 4} h24 l-2,22 h-20 Z`, '#e3b24a');
    case 'ball':
      return pt.circle(x, y, 21, 'white') + pt.fill(`M${x},${y - 8} l8,6 l-3,9 h-10 l-3,-9 Z`, 'ink') + pt.line(`M${x},${y - 8} v-12 M${x + 8},${y - 2} l12,-4 M${x + 5},${y + 7} l7,10 M${x - 5},${y + 7} l-7,10 M${x - 8},${y - 2} l-12,-4`, 'ink', 1.6);
    case 'victory':
      return pt.fill(`M${x - 12},${y + 22} v-18 q0,-6 6,-6 h12 q6,0 6,6 v18 Z`, 'skin') + pt.fill(`M${x - 10},${y - 2} l-8,-22 q4,-4 8,0 l6,18 Z`, 'skin') + pt.fill(`M${x + 2},${y - 4} l6,-20 q4,-3 8,1 l-6,22 Z`, 'skin') + pt.line(`M${x - 8},${y + 8} h12`, dark('#f3cfb0', 0.3), 1.4);
    case 'clapper':
      return pt.rect(x - 20, y - 6, 40, 28, '#2a2328', 2) + pt.fill(`M${x - 20},${y - 8} l40,-8 l2,8 l-40,8 Z`, 'white') + pt.line(`M${x - 12},${y - 10} l4,7 M${x},${y - 12} l4,7 M${x + 12},${y - 14} l4,7`, 'ink', 3) + pt.line(`M${x - 12},${y + 8} h24`, 'white', 2);
    case 'pen':
      return pt.fill(`M${x - 18},${y + 18} l6,-16 l20,-20 l10,10 l-20,20 Z`, '#2a2328') + pt.fill(`M${x - 18},${y + 18} l6,-16 l10,10 Z`, 'brass');
    case 'laptop':
      return pt.rect(x - 18, y - 18, 36, 26, '#4a4a55', 3) + pt.rect(x - 14, y - 14, 28, 18, '#9cc3d6', 2) + pt.fill(`M${x - 24},${y + 10} h48 l-4,8 h-40 Z`, 'steel');
    case 'book':
      return pt.fill(`M${x},${y - 14} q-12,-6 -22,-2 v30 q10,-4 22,2 Z`, 'white') + pt.fill(`M${x},${y - 14} q12,-6 22,-2 v30 q-10,-4 -22,2 Z`, 'white') + pt.line(`M${x - 18},${y - 6} h12 M${x - 18},${y + 2} h12 M${x + 6},${y - 6} h12 M${x + 6},${y + 2} h12`, 'blue', 1.4);
    case 'anchor':
      return pt.line(`M${x},${y - 16} V${y + 20} M${x - 10},${y - 8} h20 M${x - 18},${y + 6} q0,14 18,14 q18,0 18,-14`, '#2f4a6b', 3.4) + pt.circle(x, y - 19, 4, 'white');
    case 'pencil':
      return pt.fill(`M${x - 18},${y + 18} l4,-12 l22,-22 l8,8 l-22,22 Z`, 'yellow') + pt.fill(`M${x - 18},${y + 18} l4,-12 l8,8 Z`, '#f3cfb0') + pt.fill(`M${x + 8},${y - 16} l4,-4 l8,8 l-4,4 Z`, '#e6b0b4');
    case 'lightning':
      return pt.fill(`M${x + 4},${y - 24} l-16,26 h12 l-6,22 l18,-28 h-12 Z`, 'yellow');
    case 'help':
      // A glass of kompot with a heart: something to cheer them up.
      return pt.fill(`M${x - 14},${y - 16} h28 l-3,34 h-22 Z`, '#e8f2f6') + pt.fill(`M${x - 12},${y - 4} h24 l-2,20 h-20 Z`, '#d56a8a') + pt.fill(`M${x + 14},${y - 26} c-6,-6 -14,0 -6,7 l6,5 l6,-5 c8,-7 0,-13 -6,-7 Z`, 'red');
    case 'wave':
      return pt.fill(`M${x - 12},${y + 22} v-16 l-4,-14 q2,-4 6,0 l4,10 v-20 q4,-4 6,0 v18 v-22 q4,-4 6,0 v22 v-18 q4,-4 6,0 v26 q0,14 -14,14 Z`, 'skin');
  }
}

/** All the icons side by side, one per cell. */
export function iconSheet(pt: Painter): string {
  return ICON_IDS.map((id, i) => icon(pt, id, i * ICON_CELL + ICON_CELL / 2, ICON_CELL / 2)).join('');
}
