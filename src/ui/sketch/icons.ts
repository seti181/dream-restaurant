// Hand-drawn icons for the sketchbook look (project.md section 9.5), in ink and watercolour: every
// icon in the game, drawn once in a sheet and baked. They stand in for the game's emojis wherever
// those appear (the game's texts and data still speak in emojis; see iconOf and IconText), and
// replace the pixel-art icons: coins, stars, the weather, dishes, Mewa, the streets and the guests.

import type { TemplateId } from '../../data/dishes';
import type { GroupId } from '../../data/groups';
import type { LocationId } from '../../data/locations';
import type { Weather } from '../../data/weather';
import { lookFor } from './cast';
import type { Painter } from './painter';
import { dark, light } from './palette';
import { figure, mewa } from './people';

const ROOM = [
  'menu', 'plate', 'hourglass', 'angry', 'yum', 'happy', 'meh', 'sad', 'heart', 'missed',
  'leaf', 'dill', 'fish', 'soup', 'cake', 'pierogi', 'coffee', 'chili', 'flag', 'mushroom',
  'lemon', 'shot', 'ball', 'victory', 'clapper', 'pen', 'laptop', 'book', 'anchor', 'pencil',
  'lightning', 'help', 'wave',
] as const;

const MORE = [
  // Faces and people.
  'smile', 'thinking', 'weary', 'sick', 'sleepy', 'monocle', 'people', 'runner', 'eyes', 'handshake', 'crossedFingers', 'chefHat', 'gradCap',
  // Food and drink.
  'cocktail', 'pan', 'drink', 'pot', 'pasta', 'salad', 'meat', 'icecream', 'pizza', 'wine', 'cheers', 'bento', 'birthday', 'wheat', 'log', 'heartYellow',
  'potato', 'cabbage', 'cheese', 'strawberry', 'basket',
  // Things.
  'star', 'starEmpty', 'chair', 'party', 'target', 'scroll', 'trophy', 'medal', 'swords', 'pause', 'sound', 'mute', 'chartUp', 'books', 'warning',
  'accordion', 'mailbox', 'sparkles', 'speech', 'thought', 'card', 'fire', 'clipboard', 'candle', 'lock', 'newspaper', 'trident', 'note',
  'bell', 'bed', 'gear', 'wedding', 'bus', 'church', 'moon', 'moneyBag', 'ship', 'briefcase', 'camera', 'beach', 'train', 'violin', 'yarn',
  'tent', 'flagPT', 'coin',
  // The weather.
  'sun', 'heatwave', 'cloud', 'cloudSun', 'rain', 'thermometer',
  // Mewa.
  'mewa',
] as const;

const DISHES: readonly TemplateId[] = [
  'zurek', 'barszcz', 'fishSoup', 'tomatoSoup', 'pierogi', 'pizza', 'pasta', 'burger', 'friedCod', 'schabowy', 'golabki',
  'arrozDeVitela', 'cabritoAssado', 'saladBowl', 'szarlotka', 'sernik', 'iceCream', 'coffee', 'kompot', 'lemonade', 'cytrynowka',
];
const GROUPS: readonly GroupId[] = ['tourists', 'students', 'locals', 'office', 'foodies'];
const STREETS: readonly LocationId[] = ['ogarna', 'piwna', 'mariacka', 'dluga', 'pobrzeze', 'spichrzow'];

export type DishIcon = `dish:${TemplateId}`;
export type GroupIcon = `group:${GroupId}`;
export type StreetIcon = `street:${LocationId}`;
export type IconId = (typeof ROOM)[number] | (typeof MORE)[number] | DishIcon | GroupIcon | StreetIcon;

export const ICON_IDS: readonly IconId[] = [
  ...ROOM,
  ...MORE,
  ...DISHES.map((d) => `dish:${d}` as const),
  ...GROUPS.map((g) => `group:${g}` as const),
  ...STREETS.map((s) => `street:${s}` as const),
];

/** Each icon's cell in the sheet, in page units; the icon is drawn around its middle. */
export const ICON_CELL = 64;
/** The sheet is a grid this many cells wide. */
export const ICON_COLUMNS = 16;
export const ICON_ROWS = Math.ceil(ICON_IDS.length / ICON_COLUMNS);

/** Where an icon sits in the sheet: its column and row. */
export function iconCell(id: IconId): { column: number; row: number } {
  const i = ICON_IDS.indexOf(id);
  return { column: i % ICON_COLUMNS, row: Math.floor(i / ICON_COLUMNS) };
}

export const WEATHER_ICON: Record<Weather, IconId> = { sunny: 'sun', heatwave: 'heatwave', cloudy: 'cloud', rain: 'rain' };

/** Which icon stands for each of the game's emojis (written without the variation selector U+FE0F). */
const FROM_EMOJI: Record<string, IconId> = {
  '💬': 'speech', '🍽': 'plate', '⏳': 'hourglass', '😤': 'angry', '😠': 'angry', '😋': 'yum', '🙂': 'happy', '😐': 'meh', '😞': 'sad',
  '❤': 'heart', '♥': 'heart', '💛': 'heartYellow', '🤷': 'missed', '🌱': 'leaf', '🌿': 'dill', '🐟': 'fish', '🥣': 'soup', '🍰': 'cake', '🥟': 'pierogi', '☕': 'coffee',
  '🌶': 'chili', '🇵🇱': 'flag', '🇵🇹': 'flagPT', '🍄': 'mushroom', '🍋': 'lemon', '🥃': 'shot', '⚽': 'ball', '✌': 'victory', '🎬': 'clapper', '🖋': 'pen',
  '💻': 'laptop', '📖': 'book', '⚓': 'anchor', '✏': 'pencil', '⚡': 'lightning', '👋': 'wave',
  '😊': 'smile', '🤔': 'thinking', '😩': 'weary', '🤒': 'sick', '😴': 'sleepy', '🧐': 'monocle', '👥': 'people', '🏃': 'runner', '👀': 'eyes', '🤝': 'handshake', '🤞': 'crossedFingers',
  '👨‍🍳': 'chefHat', '🧑‍🍳': 'chefHat', '🎓': 'gradCap',
  '🍹': 'cocktail', '🍳': 'pan', '🥤': 'drink', '🍲': 'pot', '🍝': 'pasta', '🥗': 'salad', '🍖': 'meat', '🍦': 'icecream', '🍕': 'pizza', '🍷': 'wine', '🥂': 'cheers', '🍱': 'bento', '🎂': 'birthday', '🌾': 'wheat', '🪵': 'log',
  '🥔': 'potato', '🥬': 'cabbage', '🧀': 'cheese', '🍓': 'strawberry', '🧺': 'basket',
  '⭐': 'star', '★': 'star', '☆': 'starEmpty', '🪑': 'chair', '🎉': 'party', '🎯': 'target', '📜': 'scroll', '🏆': 'trophy', '🏅': 'medal', '⚔': 'swords', '⏸': 'pause', '🔊': 'sound', '🔇': 'mute', '📈': 'chartUp', '📚': 'books', '⚠': 'warning',
  '🪗': 'accordion', '📬': 'mailbox', '✨': 'sparkles', '💭': 'thought', '🃏': 'card', '🔥': 'fire', '📋': 'clipboard', '🕯': 'candle', '🔒': 'lock', '📰': 'newspaper', '🔱': 'trident', '🎵': 'note',
  '🔔': 'bell', '🛌': 'bed', '⚙': 'gear', '💒': 'wedding', '🚌': 'bus', '⛪': 'church', '🌙': 'moon', '💰': 'moneyBag', '🚢': 'ship', '💼': 'briefcase', '📸': 'camera', '🏖': 'beach', '🚆': 'train', '🎻': 'violin', '🧶': 'yarn',
  '🎪': 'tent', '🪙': 'coin', '☀': 'sun', '⛅': 'cloudSun', '🌧': 'rain', '🌡': 'thermometer',
};

/** The icon for one emoji (a single grapheme, with or without U+FE0F), or null if it has none. */
export function iconForEmoji(emoji: string): IconId | null {
  return FROM_EMOJI[emoji.replace(/️/g, '')] ?? null;
}

/** A bubble's emoji text ("🌱?", "😋") as an icon and what's written after it, or null for something with no icon. */
export function iconOf(text: string): { icon: IconId; after: string } | null {
  const clean = text.replace(/️/g, '');
  for (const [emoji, icon] of Object.entries(FROM_EMOJI)) if (clean.startsWith(emoji)) return { icon, after: clean.slice(emoji.length).trim() };
  return null;
}

// ---------- Drawing ----------

const DISH_COLOURS: Partial<Record<TemplateId, [string, string]>> = {
  zurek: ['#e8d5a8', '#fffaf0'],
  barszcz: ['#b5203a', '#e8d5a8'],
  fishSoup: ['#f1e2c4', '#e9a23b'],
  tomatoSoup: ['#d9502f', '#f1d9a0'],
};

/** One icon, drawn around (x, y) at about 52 units across. */
function icon(pt: Painter, id: IconId, x: number, y: number): string {
  const p = pt.p;
  const eyes = (dy = -5) => `<circle cx="${x - 8}" cy="${y + dy}" r="2.6" fill="${p.ink}"/><circle cx="${x + 8}" cy="${y + dy}" r="2.6" fill="${p.ink}"/>`;
  const face = (mouth: string, extra = '', skin = '#f6d58a', withEyes = true) => pt.circle(x, y, 22, skin) + (withEyes ? eyes() : '') + mouth + extra;
  const blush = `<circle cx="${x - 13}" cy="${y + 4}" r="4" fill="${p.red}" opacity="0.45"/><circle cx="${x + 13}" cy="${y + 4}" r="4" fill="${p.red}" opacity="0.45"/>`;
  const bowl = (soup: string, garnish: string) =>
    pt.fill(`M${x - 22},${y - 2} h44 q-2,22 -22,22 q-20,0 -22,-22 Z`, 'white') + pt.fill(`M${x - 22},${y - 2} q22,-8 44,0 q-22,8 -44,0 Z`, soup) + garnish;
  const plateWith = (food: string) => pt.fill(`M${x - 26},${y + 8} q26,-12 52,0 q-26,12 -52,0 Z`, 'white') + food;
  const glass = (liquid: string, extra = '') => pt.fill(`M${x - 13},${y - 18} h26 l-3,38 h-20 Z`, '#e8f2f6') + pt.fill(`M${x - 11},${y - 6} h22 l-2,24 h-18 Z`, liquid) + extra;
  if (id.startsWith('dish:')) return dish(pt, id.slice(5) as TemplateId, x, y, bowl, plateWith, glass);
  if (id.startsWith('group:')) {
    // A guest of that group, head and shoulders.
    const v = { tourists: 0, students: 1, locals: 1, office: 0, foodies: 0 }[id.slice(6) as GroupId];
    return figure(pt, x, y + 50, 112, lookFor(id.slice(6) as GroupId, v), { sit: true, turn: 0, arms: 'rest', mouth: 'smile' });
  }
  if (id.startsWith('street:')) return street(pt, id.slice(7) as LocationId, x, y);
  switch (id) {
    // ----- The room's icons -----
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
    case 'heartYellow':
      return pt.fill(`M${x},${y + 20} C${x - 30},${y} ${x - 20},${y - 24} ${x},${y - 10} C${x + 20},${y - 24} ${x + 30},${y} ${x},${y + 20} Z`, id === 'heart' ? 'red' : 'yellow') + `<path d="M${x - 12},${y - 8} q-4,4 -2,9" stroke="#fffaf0" stroke-width="2.5" fill="none"/>`;
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
      return bowl('#e7c87a', pt.line(`M${x - 6},${y - 12} q-4,-6 0,-12 M${x + 6},${y - 12} q-4,-6 0,-12`, 'ink', 1.6, 'opacity="0.6"')).replace('fill="#fffaf0"', `fill="${p.red}"`);
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
    case 'flagPT':
      return pt.line(`M${x - 18},${y + 22} V${y - 22}`, 'bar2', 3) + pt.rect(x - 16, y - 20, 13, 26, '#2e7a3a') + pt.rect(x - 3, y - 20, 21, 26, '#d6392e') + pt.circle(x - 3, y - 7, 5, 'yellow');
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
      return glass('#d56a8a') + pt.fill(`M${x + 14},${y - 26} c-6,-6 -14,0 -6,7 l6,5 l6,-5 c8,-7 0,-13 -6,-7 Z`, 'red');
    case 'wave':
      return pt.fill(`M${x - 12},${y + 22} v-16 l-4,-14 q2,-4 6,0 l4,10 v-20 q4,-4 6,0 v18 v-22 q4,-4 6,0 v22 v-18 q4,-4 6,0 v26 q0,14 -14,14 Z`, 'skin');

    // ----- Faces and people -----
    case 'smile':
      return face(pt.line(`M${x - 9},${y + 6} q9,9 18,0`, 'ink', 2.4), blush, '#f6d58a', false) + pt.line(`M${x - 11},${y - 5} q3,-4 6,0 M${x + 5},${y - 5} q3,-4 6,0`, 'ink', 2.2);
    case 'thinking':
      return face(pt.line(`M${x - 6},${y + 10} h10`, 'ink', 2.4), pt.line(`M${x - 13},${y - 13} q5,-3 9,0`, 'ink', 2) + pt.fill(`M${x + 2},${y + 22} q-2,-10 6,-12 q6,0 4,6 Z`, '#f6d58a'));
    case 'weary':
      return face(`<path d="M${x - 8},${y + 12} q8,-8 16,0 Z" fill="#7a2f35"/>`, pt.line(`M${x - 13},${y - 6} l8,2 M${x + 13},${y - 6} l-8,2`, 'ink', 2.4), '#f6d58a', false);
    case 'sick':
      return face(pt.line(`M${x - 8},${y + 10} q8,-5 16,0`, 'ink', 2.2), pt.line(`M${x + 6},${y + 14} l12,10`, 'white', 4) + `<path d="M${x - 18},${y - 18} h36" stroke="${p.red}" stroke-width="4" opacity="0.5"/>`, '#d8e6c8');
    case 'sleepy':
      return face(pt.line(`M${x - 6},${y + 9} h12`, 'ink', 2.2), `<text x="${x + 14}" y="${y - 12}" font-family="Georgia, serif" font-size="13" fill="${p.blue}">z</text>`, '#f6d58a', false) + pt.line(`M${x - 12},${y - 4} q4,3 8,0 M${x + 4},${y - 4} q4,3 8,0`, 'ink', 2.2);
    case 'monocle':
      return face(pt.line(`M${x - 8},${y + 9} h16`, 'ink', 2.2), `<circle cx="${x + 8}" cy="${y - 5}" r="7" fill="none" stroke="${p.brass}" stroke-width="2"/>` + pt.line(`M${x + 14},${y} q4,10 0,18`, 'brass', 1.4));
    case 'people':
      return figure(pt, x - 13, y + 40, 78, lookFor('locals', 0), { sit: true, mouth: 'smile', turn: 1 }) + figure(pt, x + 14, y + 44, 78, lookFor('tourists', 3), { sit: true, mouth: 'smile', turn: -1 });
    case 'runner':
      return pt.circle(x + 6, y - 18, 7, 'skin') + pt.line(`M${x + 4},${y - 10} L${x - 2},${y + 6} M${x},${y - 6} l12,6 M${x},${y - 6} l-12,2 M${x - 2},${y + 6} l10,12 M${x - 2},${y + 6} l-12,8`, 'blue', 5);
    case 'eyes':
      return [-11, 11].map((dx) => `<ellipse cx="${x + dx}" cy="${y}" rx="10" ry="15" fill="#fffaf0" stroke="${p.ink}" stroke-width="1.6"/><circle cx="${x + dx + 4}" cy="${y + 2}" r="5" fill="${p.ink}"/>`).join('');
    case 'handshake':
      return pt.fill(`M${x - 26},${y - 4} l14,-6 l12,8 l-6,10 Z`, 'blue') + pt.fill(`M${x + 26},${y - 4} l-14,-6 l-12,8 l6,10 Z`, 'red') + pt.fill(`M${x - 12},${y - 8} q12,-6 24,0 l-2,14 q-10,8 -20,0 Z`, 'skin');
    case 'crossedFingers':
      return pt.fill(`M${x - 12},${y + 22} v-16 q0,-6 6,-6 h12 q6,0 6,6 v16 Z`, 'skin') + pt.fill(`M${x - 6},${y} l-4,-24 q4,-3 7,0 l3,24 Z`, 'skin') + pt.fill(`M${x + 6},${y} l-8,-22 q3,-4 7,0 l7,20 Z`, 'skin');
    case 'chefHat':
      return pt.fill(`M${x - 14},${y + 18} v-14 q-14,-4 -8,-16 q6,-10 16,-4 q6,-10 14,0 q10,-4 14,6 q2,10 -8,14 v14 Z`, 'white') + pt.line(`M${x - 14},${y + 10} h28`, 'ink', 1.4);
    case 'gradCap':
      return pt.fill(`M${x - 26},${y - 4} l26,-12 l26,12 l-26,12 Z`, '#2a2328') + pt.fill(`M${x - 14},${y + 2} v10 q14,8 28,0 v-10 l-14,6 Z`, '#3a3236') + pt.line(`M${x + 18},${y - 1} v16`, 'yellow', 2);

    // ----- Food and drink -----
    case 'cocktail':
      return pt.fill(`M${x - 18},${y - 14} h36 l-18,20 Z`, '#f2a65a') + pt.line(`M${x},${y + 6} v14 M${x - 10},${y + 20} h20`, 'ink', 2.4) + pt.line(`M${x + 6},${y - 14} l10,-12`, 'ink', 1.6) + pt.fill(`M${x + 6},${y - 22} q10,-10 20,0 Z`, 'red') + pt.circle(x - 8, y - 16, 4, 'green');
    case 'pan':
      return pt.circle(x - 4, y + 2, 18, '#3a3236') + pt.line(`M${x + 12},${y - 6} l16,-10`, 'bar2', 5) + pt.fill(`M${x - 14},${y + 2} q4,-12 14,-8 q10,6 2,12 q-8,6 -16,-4 Z`, 'white') + pt.circle(x - 4, y + 1, 5, 'yellow');
    case 'drink':
      return pt.fill(`M${x - 13},${y - 14} h26 l-4,36 h-18 Z`, 'red') + pt.rect(x - 15, y - 18, 30, 6, 'white', 2) + pt.line(`M${x + 2},${y - 18} l6,-10 h8`, 'ink', 2.2);
    case 'pot':
      return pt.fill(`M${x - 22},${y - 6} h44 v16 q0,12 -12,12 h-20 q-12,0 -12,-12 Z`, 'copper') + pt.fill(`M${x - 22},${y - 6} q22,-6 44,0 q-22,6 -44,0 Z`, '#c97a3a') + pt.line(`M${x - 26},${y - 2} h4 M${x + 22},${y - 2} h4 M${x - 6},${y - 14} q-4,-6 0,-12 M${x + 6},${y - 14} q-4,-6 0,-12`, 'ink', 2);
    case 'pasta':
      return plateWith(pt.fill(`M${x - 16},${y + 4} q16,-22 32,0 Z`, '#f1d79a') + pt.line(`M${x - 10},${y} q4,-6 8,0 q4,-6 8,0 q4,-6 8,0`, '#d9b97a', 1.6) + pt.circle(x, y - 6, 5, '#d9502f'));
    case 'salad':
      return bowl('#7fb05a', pt.circle(x - 8, y - 6, 6, 'green') + pt.circle(x + 6, y - 7, 5, '#d9502f') + pt.circle(x + 12, y - 3, 4, 'yellow'));
    case 'meat':
      return pt.fill(`M${x - 18},${y + 10} q-6,-24 14,-26 q20,0 18,18 q-4,14 -22,12 Z`, '#a8643a') + pt.line(`M${x + 8},${y + 6} l14,14`, 'white', 5) + pt.circle(x + 22, y + 20, 4, 'white');
    case 'icecream':
      return pt.fill(`M${x - 12},${y} l12,24 l12,-24 Z`, '#d9a066') + pt.circle(x - 6, y - 6, 9, '#f6e6c8') + pt.circle(x + 6, y - 8, 9, '#e6b0b4') + pt.circle(x, y - 18, 8, '#8a5534');
    case 'pizza':
      return pt.fill(`M${x - 22},${y - 16} q22,-8 44,0 l-22,38 Z`, '#f1c25a') + pt.fill(`M${x - 22},${y - 16} q22,-8 44,0 l-3,5 q-19,-6 -38,0 Z`, '#d9a066') + pt.circle(x - 5, y - 4, 4, 'red') + pt.circle(x + 6, y - 6, 3.5, 'red') + pt.circle(x, y + 6, 3.5, 'red');
    case 'wine':
      return pt.fill(`M${x - 13},${y - 20} h26 q2,22 -13,24 q-15,-2 -13,-24 Z`, '#e8f2f6') + pt.fill(`M${x - 12},${y - 10} h24 q0,13 -12,14 q-12,-1 -12,-14 Z`, '#8a2f45') + pt.line(`M${x},${y + 4} v16 M${x - 9},${y + 20} h18`, 'ink', 2.2);
    case 'cheers':
      return `<g transform="rotate(-14 ${x - 8} ${y})">${pt.fill(`M${x - 20},${y - 18} h14 v16 q0,8 -7,8 q-7,0 -7,-8 Z`, '#f2d27a')}${pt.line(`M${x - 13},${y + 6} v14`, 'ink', 2)}</g><g transform="rotate(14 ${x + 8} ${y})">${pt.fill(`M${x + 6},${y - 18} h14 v16 q0,8 -7,8 q-7,0 -7,-8 Z`, '#f2d27a')}${pt.line(`M${x + 13},${y + 6} v14`, 'ink', 2)}</g>` + pt.line(`M${x - 4},${y - 24} l2,-4 M${x + 4},${y - 24} l-2,-4`, 'yellow', 2);
    case 'bento':
      return pt.rect(x - 22, y - 16, 44, 34, 'red', 4) + pt.rect(x - 18, y - 12, 18, 26, 'white', 2) + pt.rect(x + 2, y - 12, 16, 12, '#7fb05a', 2) + pt.rect(x + 2, y + 2, 16, 12, '#f1d79a', 2);
    case 'birthday':
      return pt.rect(x - 20, y - 4, 40, 24, '#fbe9ee', 3) + pt.line(`M${x - 20},${y + 6} h40`, '#e6b0b4', 3) + [-10, 0, 10].map((dx) => pt.rect(x + dx - 2, y - 16, 4, 12, ['blue', 'yellow', 'red'][(dx + 10) / 10], 1) + `<path d="M${x + dx},${y - 24} q3,4 0,7 q-3,-3 0,-7 Z" fill="#ffc94a"/>`).join('');
    case 'wheat':
      return pt.line(`M${x},${y + 24} V${y - 20}`, '#c9963a', 2.4) + [0, 1, 2, 3].map((k) => `<ellipse cx="${x - 6}" cy="${y - 14 + k * 9}" rx="5" ry="3" transform="rotate(-30 ${x - 6} ${y - 14 + k * 9})" fill="#e3b24a" stroke="${p.ink}" stroke-width="0.8"/><ellipse cx="${x + 6}" cy="${y - 14 + k * 9}" rx="5" ry="3" transform="rotate(30 ${x + 6} ${y - 14 + k * 9})" fill="#e3b24a" stroke="${p.ink}" stroke-width="0.8"/>`).join('');
    case 'log':
      return pt.rect(x - 22, y - 10, 40, 22, '#8a5534', 10) + pt.circle(x + 18, y + 1, 10, '#d9a066') + `<circle cx="${x + 18}" cy="${y + 1}" r="5" fill="none" stroke="#8a5534" stroke-width="1.4"/>`;
    case 'potato':
      return pt.fill(`M${x - 22},${y + 2} q-2,-16 16,-18 q12,-2 22,4 q10,8 4,18 q-8,12 -26,10 q-14,-2 -16,-14 Z`, '#c9a46a') + `<circle cx="${x - 8}" cy="${y - 4}" r="1.8" fill="${dark('#c9a46a', 0.45)}"/><circle cx="${x + 8}" cy="${y + 4}" r="1.8" fill="${dark('#c9a46a', 0.45)}"/><circle cx="${x + 2}" cy="${y - 9}" r="1.5" fill="${dark('#c9a46a', 0.45)}"/>`;
    case 'cabbage':
      return pt.fill(`M${x - 24},${y + 6} q-4,-22 14,-26 q-6,10 -2,20 Z M${x + 24},${y + 6} q4,-22 -14,-26 q6,10 2,20 Z`, '#7fb05a') + pt.circle(x, y + 2, 19, '#b8d88a') + pt.line(`M${x},${y + 20} q-6,-12 0,-34 M${x - 8},${y + 4} q4,-4 8,-2 M${x + 8},${y + 8} q-4,-4 -8,-2 M${x - 10},${y - 8} q6,0 10,4`, dark('#7fb05a', 0.25), 1.4);
    case 'cheese':
      return pt.fill(`M${x - 24},${y + 14} l6,-26 l40,10 l2,16 Z`, '#f2cf5a') + pt.fill(`M${x - 18},${y - 12} l40,10 l-46,10 Z`, '#f8e08a') + `<circle cx="${x - 8}" cy="${y + 8}" r="3" fill="${dark('#f2cf5a', 0.2)}"/><circle cx="${x + 10}" cy="${y + 10}" r="2.4" fill="${dark('#f2cf5a', 0.2)}"/><circle cx="${x + 2}" cy="${y + 4}" r="1.8" fill="${dark('#f2cf5a', 0.2)}"/>`;
    case 'strawberry':
      return pt.fill(`M${x - 18},${y - 8} q18,-8 36,0 q0,18 -18,32 q-18,-14 -18,-32 Z`, 'red') + pt.fill(`M${x - 14},${y - 10} l6,-6 l4,4 l4,-8 l4,8 l4,-4 l6,6 q-14,6 -28,0 Z`, 'green') + [[-8, -2], [6, -1], [-2, 6], [8, 9], [-7, 11], [0, 16]].map(([dx, dy]) => `<ellipse cx="${x + dx}" cy="${y + dy}" rx="1.1" ry="1.8" fill="#f8e08a"/>`).join('');
    case 'basket':
      return pt.line(`M${x - 18},${y - 2} q18,-34 36,0`, '#a8743a', 3.4) + pt.circle(x - 9, y - 4, 8, 'red') + pt.circle(x + 7, y - 5, 8, '#b8d88a') + pt.fill(`M${x - 24},${y - 2} h48 l-6,24 h-36 Z`, '#d9a95a') + pt.line(`M${x - 22},${y + 6} h44 M${x - 20},${y + 14} h40 M${x - 10},${y - 2} l-2,24 M${x},${y - 2} v24 M${x + 10},${y - 2} l2,24`, dark('#d9a95a', 0.3), 1.2);

    // ----- Things -----
    case 'star':
      return pt.fill(starPath(x, y + 2, 24, 11), 'yellow');
    case 'starEmpty':
      return pt.fill(starPath(x, y + 2, 24, 11), '#f7eedc');
    case 'chair':
      return pt.line(`M${x - 12},${y + 22} V${y - 22} Q${x - 12},${y - 26} ${x - 6},${y - 26} H${x + 4}`, '#8a5534', 4.5) + pt.line(`M${x + 14},${y + 22} V${y + 2} M${x - 12},${y + 2} H${x + 16}`, '#8a5534', 4.5) + pt.fill(`M${x - 10},${y - 2} h26 l-2,6 h-24 Z`, '#e9cf98');
    case 'party':
      return pt.fill(`M${x - 20},${y + 22} l10,-34 l24,24 Z`, 'yellow') + pt.line(`M${x - 14},${y + 2} l14,10 M${x - 10},${y - 8} l14,10`, 'red', 2) + pt.line(`M${x + 2},${y - 14} q6,-10 14,-6 M${x + 8},${y - 4} q10,-4 16,2`, 'blue', 2) + pt.circle(x + 18, y - 18, 3, 'red') + pt.circle(x + 22, y - 2, 2.5, 'green');
    case 'target':
      return pt.circle(x, y, 22, 'white') + pt.circle(x, y, 15, 'red') + pt.circle(x, y, 8, 'white') + pt.circle(x, y, 3.5, 'red') + pt.line(`M${x + 2},${y - 2} l20,-20 M${x + 18},${y - 22} l4,0 l0,4`, 'ink', 2.4);
    case 'scroll':
      return pt.rect(x - 16, y - 18, 32, 36, '#f4ecd6', 2) + pt.rect(x - 20, y - 22, 40, 8, '#e3d2a6', 4) + pt.rect(x - 20, y + 14, 40, 8, '#e3d2a6', 4) + pt.line(`M${x - 10},${y - 6} h20 M${x - 10},${y} h16 M${x - 10},${y + 6} h18`, 'ink', 1.4);
    case 'trophy':
      return pt.fill(`M${x - 14},${y - 20} h28 v8 q0,14 -14,16 q-14,-2 -14,-16 Z`, 'brass') + pt.line(`M${x - 14},${y - 14} q-10,0 -8,8 q2,6 9,6 M${x + 14},${y - 14} q10,0 8,8 q-2,6 -9,6`, 'brass', 2.6) + pt.rect(x - 4, y + 4, 8, 10, 'brass') + pt.rect(x - 12, y + 14, 24, 7, 'bar2', 2);
    case 'medal':
      return pt.fill(`M${x - 12},${y - 24} l8,18 h8 l8,-18 h-8 l-4,10 l-4,-10 Z`, 'blue') + pt.circle(x, y + 6, 13, 'brass') + pt.fill(starPath(x, y + 7, 8, 4), 'yellow');
    case 'swords':
      return pt.line(`M${x - 20},${y + 20} L${x + 18},${y - 18} M${x + 20},${y + 20} L${x - 18},${y - 18}`, 'steel', 4) + pt.line(`M${x - 22},${y + 12} l10,10 M${x + 22},${y + 12} l-10,10`, 'bar2', 4);
    case 'pause':
      return pt.rect(x - 14, y - 18, 10, 36, 'blue', 3) + pt.rect(x + 4, y - 18, 10, 36, 'blue', 3);
    case 'sound':
    case 'mute':
      return (
        pt.fill(`M${x - 22},${y - 8} h10 l12,-12 v40 l-12,-12 h-10 Z`, '#4a4a55') +
        (id === 'sound' ? pt.line(`M${x + 6},${y - 8} q6,8 0,16 M${x + 12},${y - 14} q12,14 0,28`, 'ink', 2.2) : pt.line(`M${x + 6},${y - 8} l14,16 M${x + 20},${y - 8} l-14,16`, 'red', 2.6))
      );
    case 'chartUp':
      return pt.rect(x - 22, y - 20, 44, 40, 'white', 3) + pt.line(`M${x - 16},${y + 12} l10,-10 l8,6 l14,-16`, 'green', 3) + pt.line(`M${x + 10},${y - 10} h7 v7`, 'green', 3);
    case 'books':
      return pt.rect(x - 20, y - 18, 10, 38, 'red', 2) + pt.rect(x - 9, y - 22, 10, 42, 'blue', 2) + `<g transform="rotate(14 ${x + 10} ${y + 20})">${pt.rect(x + 3, y - 16, 10, 36, 'green', 2)}</g>`;
    case 'warning':
      return pt.fill(`M${x},${y - 22} l24,40 h-48 Z`, 'yellow') + pt.line(`M${x},${y - 8} v14`, 'ink', 3.6) + pt.circle(x, y + 12, 2.6, 'ink');
    case 'accordion':
      return pt.rect(x - 24, y - 14, 12, 28, 'red', 3) + pt.rect(x + 12, y - 14, 12, 28, 'red', 3) + pt.fill(`M${x - 12},${y - 12} l4,24 l4,-24 l4,24 l4,-24 l4,24 l4,-24 v24 h-24 Z`, '#f4ecd6') + pt.line(`M${x - 20},${y - 6} v12 M${x + 18},${y - 6} v12`, 'white', 2);
    case 'mailbox':
      return pt.fill(`M${x - 20},${y + 4} v-14 q0,-12 12,-12 h20 q12,0 12,12 v14 Z`, 'blue') + pt.line(`M${x - 2},${y + 4} v18`, 'bar2', 4) + pt.rect(x - 14, y - 12, 18, 6, 'white', 2) + pt.line(`M${x + 14},${y - 2} v-16 h10 v6 h-10`, 'red', 2.4);
    case 'sparkles':
      return pt.fill(starPath(x - 6, y + 4, 18, 5, 4), 'yellow') + pt.fill(starPath(x + 14, y - 14, 9, 3, 4), 'yellow') + pt.fill(starPath(x + 16, y + 14, 6, 2, 4), 'yellow');
    case 'speech':
      return pt.fill(`M${x - 22},${y - 16} h44 q4,0 4,4 v20 q0,4 -4,4 h-26 l-12,10 v-10 h-6 q-4,0 -4,-4 v-20 q0,-4 4,-4 Z`, 'white') + pt.line(`M${x - 14},${y - 6} h28 M${x - 14},${y + 2} h18`, 'ink', 1.6);
    case 'thought':
      return pt.fill(`M${x - 18},${y + 4} q-8,-12 4,-18 q6,-10 18,-4 q12,-4 14,8 q8,10 -4,16 q-6,8 -18,2 q-10,4 -14,-4 Z`, 'white') + pt.circle(x - 16, y + 14, 4, 'white') + pt.circle(x - 22, y + 22, 2.5, 'white');
    case 'card':
      return `<g transform="rotate(-10 ${x} ${y})">${pt.rect(x - 15, y - 21, 30, 42, 'white', 3)}${pt.fill(starPath(x, y, 10, 4), 'red')}<text x="${x - 10}" y="${y - 10}" font-family="Georgia, serif" font-size="10" fill="${p.ink}">J</text></g>`;
    case 'fire':
      return pt.fill(`M${x},${y + 22} q-20,0 -18,-18 q2,-12 12,-20 q0,10 6,12 q2,-12 8,-20 q14,14 10,30 q-2,16 -18,16 Z`, '#e8873a') + pt.fill(`M${x},${y + 20} q-8,0 -8,-8 q0,-6 6,-10 q0,6 4,6 q4,-6 4,-8 q6,8 4,14 q-2,6 -10,6 Z`, 'yellow');
    case 'clipboard':
      return pt.rect(x - 17, y - 18, 34, 42, '#c9963a', 3) + pt.rect(x - 13, y - 12, 26, 32, 'white', 2) + pt.rect(x - 8, y - 22, 16, 8, 'steel', 2) + pt.line(`M${x - 8},${y - 4} h16 M${x - 8},${y + 3} h12 M${x - 8},${y + 10} h14`, 'ink', 1.4);
    case 'candle':
      return pt.rect(x - 7, y - 6, 14, 28, '#fbf3e1', 3) + pt.line(`M${x},${y - 6} v-5`, 'ink', 1.4) + `<path d="M${x},${y - 24} q6,7 0,13 q-6,-6 0,-13 Z" fill="#ffc94a"/>` + `<ellipse cx="${x}" cy="${y - 16}" rx="12" ry="12" fill="#ffe6a8" opacity="0.35"/>`;
    case 'lock':
      return pt.line(`M${x - 10},${y - 2} v-8 q0,-12 10,-12 q10,0 10,12 v8`, 'steel', 4) + pt.rect(x - 16, y - 4, 32, 26, 'brass', 4) + pt.circle(x, y + 7, 3, 'ink');
    case 'newspaper':
      return pt.rect(x - 22, y - 18, 44, 36, 'white', 2) + pt.rect(x - 18, y - 14, 36, 7, '#4a4a55', 1) + pt.rect(x - 18, y - 3, 16, 14, light(p.blue, 0.5), 1) + pt.line(`M${x + 2},${y - 2} h16 M${x + 2},${y + 4} h16 M${x + 2},${y + 10} h12`, 'ink', 1.2);
    case 'trident':
      return pt.line(`M${x},${y + 24} V${y - 12} M${x - 14},${y - 20} v10 q0,6 14,6 q14,0 14,-6 v-10 M${x},${y - 24} v12`, '#3f8a7a', 3.4) + pt.fill(`M${x - 17},${y - 20} l3,-6 l3,6 Z M${x + 11},${y - 20} l3,-6 l3,6 Z M${x - 3},${y - 24} l3,-6 l3,6 Z`, '#3f8a7a');
    case 'note':
      return pt.line(`M${x + 8},${y + 12} V${y - 20} l12,6`, 'ink', 3) + `<ellipse cx="${x}" cy="${y + 14}" rx="10" ry="7" fill="${p.ink}" transform="rotate(-20 ${x} ${y + 14})"/>`;
    case 'bell':
      return pt.fill(`M${x - 20},${y + 12} q4,-4 4,-14 q0,-18 16,-18 q16,0 16,18 q0,10 4,14 Z`, 'brass') + pt.circle(x, y + 16, 5, 'brass') + pt.line(`M${x},${y - 20} v-4`, 'ink', 2.4);
    case 'bed':
      return pt.rect(x - 24, y, 48, 12, 'blue', 3) + pt.rect(x - 24, y - 4, 16, 8, 'white', 3) + pt.line(`M${x - 26},${y - 14} v34 M${x + 26},${y + 4} v16`, '#8a5534', 4) + pt.fill(`M${x - 6},${y} q12,-10 30,0 Z`, light(p.blue, 0.3));
    case 'gear': {
      let teeth = '';
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        teeth += `<rect x="${x - 4}" y="${y - 24}" width="8" height="10" rx="1.5" transform="rotate(${(a * 180) / Math.PI} ${x} ${y})" fill="${p.steel}" stroke="${p.ink}" stroke-width="1"/>`;
      }
      return teeth + pt.circle(x, y, 16, 'steel') + pt.circle(x, y, 6, 'white');
    }
    case 'wedding':
      return pt.rect(x - 16, y - 6, 32, 28, 'white', 2) + pt.fill(`M${x - 20},${y - 4} l20,-16 l20,16 Z`, 'red') + pt.rect(x - 5, y + 6, 10, 16, '#8a5534', 4) + pt.fill(`M${x},${y - 14} c-3,-3 -7,0 -3,3 l3,3 l3,-3 c4,-3 0,-6 -3,-3 Z`, 'yellow');
    case 'bus':
      return pt.rect(x - 24, y - 16, 48, 30, 'yellow', 5) + pt.rect(x - 20, y - 12, 12, 10, light(p.blue, 0.4), 2) + pt.rect(x - 4, y - 12, 12, 10, light(p.blue, 0.4), 2) + pt.rect(x + 12, y - 12, 8, 10, light(p.blue, 0.4), 2) + pt.circle(x - 14, y + 16, 5, 'ink') + pt.circle(x + 14, y + 16, 5, 'ink');
    case 'church':
      return pt.rect(x - 16, y - 2, 32, 24, '#c27a5c') + pt.fill(`M${x - 8},${y - 2} v-16 l8,-10 l8,10 v16 Z`, '#c27a5c') + pt.line(`M${x},${y - 28} v-6 M${x - 3},${y - 31} h6`, 'brass', 2) + pt.rect(x - 4, y + 10, 8, 12, '#8a5534', 4);
    case 'moon':
      return pt.fill(`M${x + 8},${y - 22} q-26,4 -22,26 q4,20 28,16 q-20,-6 -18,-24 q2,-14 12,-18 Z`, 'yellow') + pt.circle(x + 16, y - 8, 2, 'yellow') + pt.circle(x + 12, y + 14, 1.6, 'yellow');
    case 'moneyBag':
      return pt.fill(`M${x - 8},${y - 14} q-18,10 -16,26 q2,10 24,10 q22,0 24,-10 q2,-16 -16,-26 Z`, '#c9963a') + pt.fill(`M${x - 8},${y - 14} l-4,-8 h24 l-4,8 Z`, '#b8843a') + `<text x="${x}" y="${y + 14}" text-anchor="middle" font-family="Georgia, serif" font-size="14" font-weight="700" fill="${p.ink}">zł</text>`;
    case 'ship':
      return pt.fill(`M${x - 24},${y + 8} h48 l-8,12 h-32 Z`, '#8a5534') + pt.line(`M${x - 4},${y + 8} V${y - 24}`, 'ink', 2) + pt.fill(`M${x - 2},${y - 22} q16,8 18,26 h-18 Z`, 'white') + pt.fill(`M${x - 6},${y - 18} q-12,10 -14,22 h14 Z`, 'white') + pt.fill(`M${x - 4},${y - 26} h10 l-4,4 h-6 Z`, 'red');
    case 'briefcase':
      return pt.rect(x - 22, y - 10, 44, 30, '#8a5534', 4) + pt.line(`M${x - 8},${y - 10} v-6 h16 v6 M${x - 22},${y + 2} h44`, 'ink', 2) + pt.rect(x - 4, y - 2, 8, 6, 'brass', 1);
    case 'camera':
      return pt.rect(x - 22, y - 12, 44, 30, '#3a3236', 5) + pt.rect(x - 10, y - 18, 16, 8, '#3a3236', 2) + pt.circle(x, y + 3, 10, '#9cc3d6') + `<circle cx="${x - 3}" cy="${y}" r="3" fill="#fffaf0"/>` + pt.circle(x + 15, y - 6, 2.5, 'yellow');
    case 'beach':
      return pt.fill(`M${x - 26},${y + 22} q26,-14 52,0 Z`, '#efcf86') + pt.line(`M${x - 4},${y + 14} L${x + 4},${y - 16}`, 'ink', 2.2) + pt.fill(`M${x - 18},${y - 10} q20,-24 42,-6 Z`, 'red') + pt.circle(x + 18, y - 18, 6, 'yellow');
    case 'train':
      return pt.rect(x - 20, y - 20, 40, 36, 'red', 6) + pt.rect(x - 14, y - 14, 28, 12, light(p.blue, 0.4), 2) + pt.circle(x - 9, y + 6, 3.5, 'yellow') + pt.circle(x + 9, y + 6, 3.5, 'yellow') + pt.line(`M${x - 14},${y + 22} l-6,4 M${x + 14},${y + 22} l6,4`, 'ink', 2.4);
    case 'violin':
      return `<g transform="rotate(-30 ${x} ${y})">${pt.fill(`M${x},${y - 4} q-14,-2 -12,10 q-6,6 0,12 q2,8 12,8 q10,0 12,-8 q6,-6 0,-12 q2,-12 -12,-10 Z`, '#b8643a')}${pt.rect(x - 2, y - 26, 4, 22, '#3a3236', 1)}${pt.line(`M${x - 4},${y + 10} h8`, 'ink', 1.4)}</g>` + pt.line(`M${x - 22},${y - 6} L${x + 24},${y + 8}`, 'bar2', 1.8);
    case 'yarn':
      return pt.circle(x - 2, y + 2, 18, 'red') + pt.line(`M${x - 16},${y - 6} q14,6 26,-6 M${x - 18},${y + 4} q16,8 30,-8 M${x - 12},${y + 14} q14,2 24,-12 M${x + 16},${y + 8} q8,10 2,16`, light(p.red, 0.35), 1.8) + pt.line(`M${x + 14},${y - 14} l10,-8`, 'steel', 2.2);
    case 'tent':
      return pt.fill(`M${x - 24},${y + 20} l24,-36 l24,36 Z`, 'white') + pt.fill(`M${x - 16},${y + 8} l16,-24 l4,6 l-12,30 Z M${x + 4},${y - 10} l8,12 l-4,18 h-6 Z`, 'red') + pt.line(`M${x},${y - 16} v-8`, 'ink', 1.6) + pt.fill(`M${x},${y - 24} l8,3 l-8,3 Z`, 'yellow');
    case 'coin':
      return pt.circle(x, y, 20, '#e8b84b') + pt.circle(x, y, 14, '#f4cf6a') + `<text x="${x}" y="${y + 6}" text-anchor="middle" font-family="Georgia, serif" font-size="15" font-weight="700" fill="#8a5a12">zł</text>`;

    // ----- The weather -----
    case 'sun':
    case 'heatwave': {
      const hot = id === 'heatwave';
      let rays = '';
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        rays += pt.line(`M${x + Math.cos(a) * 17},${y + Math.sin(a) * 17} L${x + Math.cos(a) * 25},${y + Math.sin(a) * 25}`, hot ? '#e8673a' : '#e9a23b', 3);
      }
      return rays + pt.circle(x, y, 13, hot ? '#f08a4b' : 'yellow');
    }
    case 'cloud':
      return pt.fill(`M${x - 22},${y + 12} q-8,-14 6,-18 q2,-14 18,-12 q14,-8 20,8 q10,2 6,14 q-2,8 -10,8 h-34 q-6,0 -6,0 Z`, '#e3eaee');
    case 'cloudSun':
      return `<g transform="translate(${x + 8},${y - 8}) scale(0.75) translate(${-x - 8},${-y + 8})">${icon(pt, 'sun', x + 8, y - 8)}</g>` + pt.fill(`M${x - 24},${y + 18} q-6,-12 6,-16 q2,-12 16,-10 q12,-6 18,8 q8,2 4,12 q-2,6 -8,6 h-30 Z`, '#eef3f6');
    case 'rain':
      return pt.fill(`M${x - 22},${y + 2} q-8,-14 6,-18 q2,-14 18,-12 q14,-8 20,8 q10,2 6,14 q-2,8 -10,8 h-34 Z`, '#c6d0d8') + pt.line(`M${x - 12},${y + 10} l-4,10 M${x},${y + 10} l-4,10 M${x + 12},${y + 10} l-4,10`, 'blue', 2.4);
    case 'thermometer':
      return pt.rect(x - 5, y - 24, 10, 36, 'white', 5) + pt.circle(x, y + 16, 8, 'red') + pt.rect(x - 2, y - 8, 4, 22, 'red', 2);

    // ----- Mewa -----
    case 'mewa':
      return mewa(pt, x, y + 21, 1.02);
  }
  return '';
}

/** A star with `points` points, outer radius r and inner radius r2. */
function starPath(x: number, y: number, r: number, r2: number, points = 5): string {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const a = (i * Math.PI) / points - Math.PI / 2;
    const rr = i % 2 ? r2 : r;
    d += `${i ? 'L' : 'M'}${x + Math.cos(a) * rr},${y + Math.sin(a) * rr} `;
  }
  return d + 'Z';
}

/** Each dish as a little picture: soups in a bowl, mains on a plate, cakes, ice cream, and drinks in a glass. */
function dish(
  pt: Painter,
  t: TemplateId,
  x: number,
  y: number,
  bowl: (soup: string, garnish: string) => string,
  plateWith: (food: string) => string,
  glass: (liquid: string, extra?: string) => string,
): string {
  const soup = DISH_COLOURS[t];
  if (soup) return bowl(soup[0], pt.circle(x - 6, y - 4, 4, soup[1]) + pt.circle(x + 7, y - 3, 3, soup[1]));
  switch (t) {
    case 'pierogi':
      return plateWith([-12, 0, 12].map((d) => pt.fill(`M${x + d - 10},${y + 6} q10,-18 20,0 Z`, '#f1d79a')).join('') + pt.line(`M${x - 4},${y - 4} l2,-3 M${x + 6},${y - 3} l2,-3`, 'green', 1.6));
    case 'pizza':
      return plateWith(pt.fill(`M${x - 22},${y + 6} q22,-20 44,0 Z`, '#f1c25a') + pt.circle(x - 8, y, 3.5, 'red') + pt.circle(x + 6, y - 2, 3.5, 'red') + pt.circle(x, y + 4, 2.5, 'green'));
    case 'pasta':
      return plateWith(pt.fill(`M${x - 16},${y + 6} q16,-22 32,0 Z`, '#f1d79a') + pt.circle(x, y - 4, 5, '#d9502f'));
    case 'burger':
      return pt.fill(`M${x - 18},${y - 4} q18,-22 36,0 Z`, '#d9a066') + pt.rect(x - 19, y - 4, 38, 5, 'green', 2) + pt.rect(x - 18, y + 1, 36, 7, '#6b3d24', 3) + pt.rect(x - 18, y + 8, 36, 6, '#d9a066', 3);
    case 'friedCod':
      return plateWith(pt.fill(`M${x - 18},${y + 4} q10,-14 24,-4 q6,6 -6,8 Z`, '#e8b84b') + [0, 1, 2].map((k) => pt.rect(x + 6 + k * 5, y - 8 + k, 4, 14, '#f4d03f', 1)).join(''));
    case 'schabowy':
      return plateWith(pt.fill(`M${x - 20},${y + 4} q2,-14 18,-12 q12,2 8,12 Z`, '#d9a066') + pt.circle(x + 12, y + 1, 5, '#f1e2c4') + pt.circle(x + 18, y + 4, 4, '#f1e2c4') + pt.fill(`M${x - 2},${y - 6} l4,-4 l3,4 Z`, 'yellow'));
    case 'golabki':
      return plateWith([-9, 9].map((d) => pt.fill(`M${x + d - 10},${y + 6} q0,-14 10,-14 q10,0 10,14 Z`, '#a8c97a')).join('') + pt.fill(`M${x - 20},${y + 6} q20,6 40,0 q-20,-4 -40,0 Z`, '#d9502f'));
    case 'arrozDeVitela':
      return plateWith(pt.fill(`M${x - 20},${y + 6} q8,-16 22,-8 q2,8 -2,8 Z`, '#f6eedc') + pt.fill(`M${x},${y + 6} q4,-14 18,-8 q2,8 -4,8 Z`, '#8a5233'));
    case 'cabritoAssado':
      return plateWith(pt.fill(`M${x - 18},${y + 6} q0,-18 16,-16 q14,2 10,16 Z`, '#a8643a') + pt.line(`M${x + 2},${y - 6} l10,-8`, 'white', 3.4) + pt.circle(x + 14, y + 2, 5, '#f1d79a'));
    case 'saladBowl':
      return bowl('#7fb05a', pt.circle(x - 8, y - 6, 6, 'green') + pt.circle(x + 6, y - 7, 5, '#d9502f'));
    case 'szarlotka':
    case 'sernik':
      return plateWith(pt.fill(`M${x - 18},${y + 6} v-12 l30,-8 v20 Z`, t === 'sernik' ? '#fbecc0' : '#f4e3a1') + pt.fill(`M${x - 18},${y - 6} l30,-8 l2,3 l-30,8 Z`, t === 'sernik' ? '#8a5233' : '#c99a5a'));
    case 'iceCream':
      return pt.fill(`M${x - 14},${y + 2} h28 l-4,18 h-20 Z`, '#e8f2f6') + pt.circle(x - 6, y - 4, 8, '#f6e6c8') + pt.circle(x + 6, y - 6, 8, '#e6b0b4') + pt.circle(x + 12, y - 16, 3, 'red');
    case 'coffee':
      return pt.fill(`M${x - 16},${y - 6} h28 v12 q0,12 -14,12 q-14,0 -14,-12 Z`, 'white') + pt.line(`M${x + 12},${y - 2} q10,0 8,8 q-2,6 -8,6`, 'ink', 2.4) + pt.fill(`M${x - 14},${y - 6} h24 v4 h-24 Z`, '#6e4128');
    case 'kompot':
      return glass('#d56a8a', pt.circle(x - 3, y + 6, 4, 'red') + pt.circle(x + 4, y + 12, 3.5, 'yellow'));
    case 'lemonade':
      return glass('#f4e08a', pt.fill(`M${x + 6},${y - 22} q10,0 10,10 q-10,0 -10,-10 Z`, 'yellow') + pt.line(`M${x - 4},${y - 22} l4,-8`, 'ink', 1.6));
    case 'cytrynowka':
      return pt.fill(`M${x - 6},${y - 24} h12 v8 q8,4 8,14 v24 h-28 v-24 q0,-10 8,-14 Z`, '#e8f2f6') + pt.fill(`M${x - 12},${y + 2} h24 v18 h-24 Z`, '#f4e08a') + pt.rect(x - 9, y + 4, 18, 9, 'white', 1) + pt.circle(x, y + 8, 3, 'yellow');
    default:
      return plateWith('');
  }
}

/** Markers for the six streets: two gabled houses, a beer mug, an amber stone, Neptune's trident over his fountain, the Żuraw crane, a granary. */
function street(pt: Painter, s: LocationId, x: number, y: number): string {
  switch (s) {
    case 'ogarna':
      return pt.fill(`M${x - 22},${y + 22} v-26 l10,-10 l10,10 v26 Z`, 'facadeA') + pt.fill(`M${x},${y + 22} v-30 l11,-12 l11,12 v30 Z`, 'facadeB') + `<rect x="${x - 15}" y="${y}" width="6" height="8" fill="#93c3da"/><rect x="${x + 8}" y="${y - 4}" width="6" height="8" fill="#93c3da"/>`;
    case 'piwna':
      return pt.rect(x - 16, y - 14, 26, 34, '#e3b24a', 4) + pt.fill(`M${x - 18},${y - 16} q4,-10 14,-6 q8,-6 14,2 q2,6 -2,6 h-26 Z`, 'white') + pt.line(`M${x + 10},${y - 8} q12,0 12,10 q0,10 -12,10`, 'ink', 3);
    case 'mariacka':
      return pt.fill(`M${x},${y - 22} q20,6 18,24 q-4,18 -18,20 q-14,-2 -18,-20 q-2,-18 18,-24 Z`, '#e8a03a') + `<ellipse cx="${x - 6}" cy="${y - 6}" rx="5" ry="8" fill="#f6d58a" opacity="0.8"/>`;
    case 'dluga':
      return pt.rect(x - 18, y + 10, 36, 10, 'steel', 2) + icon(pt, 'trident', x, y - 6);
    case 'pobrzeze':
      return pt.rect(x - 14, y - 16, 22, 36, '#8a5534', 2) + pt.fill(`M${x - 18},${y - 16} l11,-10 l11,10 Z`, '#3a3236') + pt.line(`M${x + 8},${y - 12} h16 M${x + 22},${y - 12} v20`, 'ink', 2) + pt.fill(`M${x - 24},${y + 20} q12,-6 24,0 q12,6 24,0 v4 h-48 Z`, 'blue');
    case 'spichrzow':
      return pt.fill(`M${x - 18},${y + 22} v-28 l18,-18 l18,18 v28 Z`, '#c27a5c') + [0, 1].map((r) => `<rect x="${x - 9}" y="${y - 4 + r * 12}" width="6" height="7" fill="#fffaf0"/><rect x="${x + 3}" y="${y - 4 + r * 12}" width="6" height="7" fill="#fffaf0"/>`).join('') + pt.rect(x - 4, y - 16, 8, 6, '#fffaf0');
  }
}

/** All the icons in a grid, ICON_COLUMNS cells wide, each kept inside its own cell. */
export function iconSheet(pt: Painter): string {
  return ICON_IDS.map((id, i) => {
    const left = (i % ICON_COLUMNS) * ICON_CELL;
    const top = Math.floor(i / ICON_COLUMNS) * ICON_CELL;
    return `<svg x="${left}" y="${top}" width="${ICON_CELL}" height="${ICON_CELL}" viewBox="${left} ${top} ${ICON_CELL} ${ICON_CELL}">${icon(pt, id, left + ICON_CELL / 2, top + ICON_CELL / 2)}</svg>`;
  }).join('');
}
