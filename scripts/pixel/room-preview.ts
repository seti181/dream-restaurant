// Draws the game's own restaurant room, with tables, guests and staff, into PNG files, and a sheet
// of everyone who can appear: for working on the pixel art without starting the game.
// Run with `npx tsx scripts/pixel/room-preview.ts <folder>`; it writes room-*.png and people.png there.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { balance } from '../../src/data/balance';
import type { DecorId } from '../../src/data/decor';
import type { GroupId } from '../../src/data/groups';
import { LOCATIONS, type LocationId } from '../../src/data/locations';
import type { FloorView, TableGuests } from '../../src/sim/day';
import { hex, Pixels, pngBytes } from '../../src/ui/pixel/raster';
import { drawRoom, roomLayout, scenePieces, type RoomLook } from '../../src/ui/pixel/room';
import { personPixels, portraitPixels, type PersonKind } from '../../src/ui/pixel/sprites';

const out = process.argv[2];
if (!out) throw new Error('Usage: npx tsx scripts/pixel/room-preview.ts <folder>');
mkdirSync(out, { recursive: true });

/** Guests at a table, part way through their visit. */
function guests(group: GroupId, seated: number, stage: TableGuests['stage'], since: number): TableGuests {
  return {
    group,
    seated,
    stage,
    impatience: stage === 'waiting' ? 0.6 : 0.1,
    satisfaction: stage === 'eating' ? 70 : null,
    eatingFor: stage === 'eating' ? 20 : 0,
    bill: 0,
    critic: false,
    regular: false,
    regularId: null,
    visitor: null,
    drink: false,
    apology: false,
    moved: false,
    tablesUsed: 1,
    since,
  };
}

const GROUPS: GroupId[] = ['tourists', 'locals', 'students', 'office', 'foodies'];

function scene(location: LocationId, dusk: boolean, decor: DecorId[], name: string): void {
  const maxTables = Math.floor(LOCATIONS[location].maxSeats / balance.service.seatsPerTable);
  const terraceTables = Math.floor(LOCATIONS[location].terraceSeats / balance.service.seatsPerTable);
  const insideTables = Math.max(1, maxTables - 2);
  const layout = roomLayout(maxTables, terraceTables);
  const tables = Array.from({ length: insideTables + terraceTables }, (_, i) =>
    i % 3 === 2 ? null : guests(GROUPS[i % GROUPS.length], 2 + (i % 3), i % 4 === 1 ? 'waiting' : 'eating', 660 + i),
  );
  const floor: FloorView = {
    location,
    tables,
    insideTables,
    terraceTables,
    chefsBusy: [true, false],
    waiters: [null, null],
    chefLooks: [0, 1],
    waiterLooks: [0, 1],
    decor,
    equipment: ['fryer', 'espresso'],
    ordersWaiting: 3,
    walkouts: [],
    atTheDoor: [],
    leftTheDoor: [],
  };
  const look: RoomLook = { decor, equipment: floor.equipment, weather: 'sunny', dusk, insideTables };
  const picture = new Pixels(layout.width, layout.height);
  const backdrop = hex(dusk ? '#2c3150' : '#b9ada0');
  for (let y = 0; y < layout.height; y++) for (let x = 0; x < layout.width; x++) picture.set(x, y, backdrop);
  picture.draw(drawRoom(layout, look), 0, 0);
  for (const p of scenePieces(layout, floor, look)) picture.draw(p.image.pixels, p.px, p.py);

  // Three times as big, so single pixels are easy to see; and the back walls up close.
  write(picture, 0, 0, picture.width, picture.height, 3, `room-${name}.png`);
  write(picture, 0, 0, picture.width, Math.round(picture.height * 0.55), 6, `room-${name}-walls.png`);
  // The window on the left wall, closer still.
  const { ox, oy } = layout.origin;
  write(picture, Math.round(ox - 70), Math.round(oy - 36), 52, 58, 12, `room-${name}-window.png`);
}

function write(picture: Pixels, x0: number, y0: number, width: number, height: number, k: number, file: string): void {
  const big = new Pixels(width * k, height * k);
  for (let y = 0; y < big.height; y++) {
    for (let x = 0; x < big.width; x++) {
      const i = ((y0 + Math.floor(y / k)) * picture.width + x0 + Math.floor(x / k)) * 4;
      big.set(x, y, [picture.data[i], picture.data[i + 1], picture.data[i + 2]], picture.data[i + 3]);
    }
  }
  writeFileSync(join(out, file), pngBytes(big));
  console.log(file);
}

scene('ogarna', false, [], 'small-day');
scene('ogarna', true, [], 'small-dusk');
scene('dluga', false, ['tablecloths', 'pendantLights', 'plantWall', 'tiledStove'], 'big-decor-day');
scene('dluga', true, ['portraits', 'seaChart', 'shipsInBottles', 'panelling', 'chandelier'], 'big-decor-dusk');

// Everyone, from the front and behind, sitting, walking and carrying a tray; then the team's faces by mood.
const kinds: PersonKind[] = [
  'tourists', 'students', 'locals', 'office', 'foodies', 'critic', 'regular', 'waiter', 'tomek', 'adrian', 'chef',
  'walesa', 'guard', 'footballer', 'musician', 'amberSeller', 'filip', 'fletcher', 'henryk', 'weronika',
];
const cell = 24;
const rowHeight = 46;
const sheet = new Pixels(cell * 9, rowHeight * kinds.length);
for (let y = 0; y < sheet.height; y++) for (let x = 0; x < sheet.width; x++) sheet.set(x, y, hex('#efe3cc'));
kinds.forEach((kind, row) => {
  const pictures = [
    personPixels(kind, 'front', 'stand', 0),
    personPixels(kind, 'front', 'stand', 1),
    personPixels(kind, 'front', 'stand', 2),
    personPixels(kind, 'back', 'stand', 1),
    personPixels(kind, 'front', 'sit', 3),
    personPixels(kind, 'back', 'sit', 4),
    personPixels(kind, 'front', 'walk1', 0),
    personPixels(kind, 'front', 'walk2', 0, kind === 'waiter' ? 'full' : undefined),
    portraitPixels(kind, 2, row % 4 === 0 ? 'happy' : row % 4 === 1 ? 'tired' : row % 4 === 2 ? 'wornOut' : 'fine'),
  ];
  pictures.forEach((p, i) => sheet.draw(p, i * cell + 2, row * rowHeight + 2));
});
write(sheet, 0, 0, sheet.width, sheet.height, 4, 'people.png');
