// Sheets of poses: everyone the room shows is drawn once in each of their poses, side by side,
// and baked into one picture (bake.ts). The view then shows one cell at a time, so stepping
// between two cells (a walk, a fork going up and down, a pan tossed) is all an animation needs.
// Everyone is drawn facing right; facing left is the same cell mirrored.

import { lookFor, type SketchKind } from './cast';
import type { Painter } from './painter';
import { figure, type Look, type Pose } from './people';

export interface Sheet {
  cells: number;
  /** Each cell's size, and where in it the person's seat or feet are. */
  cellW: number;
  cellH: number;
  anchorX: number;
  anchorY: number;
}

/** A guest's poses: seated behind a table, seated at its end (legs showing), walking and standing. */
export const GUEST_POSES = ['order', 'wait', 'cross', 'eatUp', 'eatDown'] as const;
export type GuestPose = (typeof GUEST_POSES)[number];
const SEATED: Record<GuestPose, Pose> = {
  order: { arms: 'menu', mouth: 'talk' },
  wait: { arms: 'rest', mouth: 'smile' },
  cross: { arms: 'cross', mouth: 'frown' },
  eatUp: { arms: 'fork', mouth: 'smile', eyes: 'happy' },
  eatDown: { arms: 'eat', mouth: 'smile' },
};

/** The cell for a seated pose: behind the table, or at its end. */
export const seatedCell = (pose: GuestPose, end: boolean) => GUEST_POSES.indexOf(pose) + (end ? GUEST_POSES.length : 0);
export const WALK_CELL = GUEST_POSES.length * 2;
export const STAND_CELL = WALK_CELL + 2;
/** Walking away from us, seen from behind (two steps). */
export const WALK_BACK_CELL = STAND_CELL + 1;

/** How tall people are drawn (page units), seated and standing. */
export const SEATED_HEIGHT = 195;
export const STANDING_HEIGHT = 196;

export const GUEST_SHEET: Sheet = { cells: WALK_BACK_CELL + 2, cellW: 220, cellH: 340, anchorX: 110, anchorY: 260 };
/** A waiter: walking with a full tray, walking back with an empty one, standing by, and walking away with the tray at one side. */
export const WAITER_SHEET: Sheet = { cells: 7, cellW: 220, cellH: 340, anchorX: 110, anchorY: 260 };
export const WAITER_CELLS = { full: 0, empty: 2, stand: 4, away: 5 } as const;
/** A chef: tossing a pan (two cells), and standing by. */
export const CHEF_SHEET: Sheet = { cells: 3, cellW: 250, cellH: 340, anchorX: 110, anchorY: 260 };
export const CHEF_CELLS = { cook: 0, idle: 2 } as const;

function cells(pt: Painter, sheet: Sheet, poses: { pose: Pose; standing: boolean }[], look: Look): string {
  return poses
    .map(({ pose, standing }, i) => figure(pt, i * sheet.cellW + sheet.anchorX, sheet.anchorY, standing ? STANDING_HEIGHT : SEATED_HEIGHT, look, { turn: 1, ...pose }))
    .join('');
}

/** Every pose of a guest of this kind (or a special guest), as one sheet. */
export function guestSheet(pt: Painter, kind: SketchKind, variant: number): string {
  const look = lookFor(kind, variant);
  const seated = (end: boolean) => GUEST_POSES.map((p) => ({ pose: { ...SEATED[p], sit: true, stool: end }, standing: false }));
  return cells(
    pt,
    GUEST_SHEET,
    [
      ...seated(false),
      ...seated(true),
      { pose: { arms: 'swing', walk: 0, mouth: 'smile' }, standing: true },
      { pose: { arms: 'swing', walk: 1, mouth: 'smile' }, standing: true },
      { pose: { arms: 'rest', mouth: 'smile' }, standing: true },
      { pose: { back: true, walk: 0 }, standing: true },
      { pose: { back: true, walk: 1 }, standing: true },
    ],
    look,
  );
}

export function waiterSheet(pt: Painter, kind: 'waiter' | 'tomek' | 'adrian', variant: number): string {
  const look = lookFor(kind, variant);
  return cells(
    pt,
    WAITER_SHEET,
    [
      { pose: { arms: 'tray', tray: 'full', walk: 0, mouth: 'smile' }, standing: true },
      { pose: { arms: 'tray', tray: 'full', walk: 1, mouth: 'smile' }, standing: true },
      { pose: { arms: 'tray', tray: 'empty', walk: 0, mouth: 'smile' }, standing: true },
      { pose: { arms: 'tray', tray: 'empty', walk: 1, mouth: 'smile' }, standing: true },
      { pose: { arms: 'rest', mouth: 'smile' }, standing: true },
      { pose: { back: true, walk: 0, arms: 'tray' }, standing: true },
      { pose: { back: true, walk: 1, arms: 'tray' }, standing: true },
    ],
    look,
  );
}

export function chefSheet(pt: Painter, variant: number): string {
  const look = lookFor('chef', variant);
  return cells(
    pt,
    CHEF_SHEET,
    [
      { pose: { arms: 'pan', mouth: 'smile', eyes: 'happy' }, standing: true },
      { pose: { arms: 'panDown', mouth: 'smile' }, standing: true },
      { pose: { arms: 'rest', mouth: 'smile' }, standing: true },
    ],
    look,
  );
}
