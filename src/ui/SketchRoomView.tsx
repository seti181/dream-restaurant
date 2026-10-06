// The restaurant in the Kashubian sketchbook look (project.md section 9.5, M8): seen from the
// front like a stage, laid out for the restaurant's size, and alive. Guests walk in through the
// door and sit down, order, wait and eat; waiters carry plates from the kitchen hatch; chefs toss
// their pans; bubbles and money float over the tables. Every picture is baked once (sketch/bake.ts),
// and only those pictures move, with CSS and the browser's animations.

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { balance } from '../data/balance';
import { LOCATIONS } from '../data/locations';
import type { GroupId } from '../data/groups';
import type { Weather } from '../data/weather';
import type { FloorView, GuestStage, HurryState, TableGuests } from '../sim/day';
import { TOP_RANK } from '../sim/ranks';
import { dishName, money } from './format';
import { canHelp, canTend } from './PixelRestaurantView';
import { REGULARS } from '../data/regulars';
import { ICON_CELL, ICON_IDS, iconOf, iconSheet, type IconId } from './sketch/icons';
import { bake } from './sketch/bake';
import { GROUP_LOOKS, type SketchKind } from './sketch/cast';
import { chefSpot, depthScale, frontLayout, LAYER, moveWalk, queueSpot, serveWalk, waiterSpot, walkIn, zOf, type FrontLayout, type Point } from './sketch/frontRoom';
import { Painter, svgPicture } from './sketch/painter';
import { mewa } from './sketch/people';
import { chairsPicture, hatchCounterPicture, pageFramePicture, PLATE_CELL, PLATES, platesPicture, roomPicture, TABLE_BOX, tablePicture, wallClock, type RoomLook } from './sketch/roomArt';
import {
  CHEF_CELLS,
  CHEF_SHEET,
  chefSheet,
  GUEST_SHEET,
  guestSheet,
  seatedCell,
  STAND_CELL,
  WALK_BACK_CELL,
  WAITER_CELLS,
  WAITER_SHEET,
  waiterSheet,
  WALK_CELL,
  type GuestPose,
  type Sheet,
} from './sketch/sheets';
import { useGame } from './store';

/** Shown instead of the pixel-art restaurant with "?sketch" at the end of the game's address, while M8 is built. */
export const sketchWanted = typeof location !== 'undefined' && new URLSearchParams(location.search).has('sketch');
/** For checking the layouts: "?sketch&slots=12" lays the room out for that many tables, whatever the premises. */
const slotsWanted = typeof location !== 'undefined' ? Number(new URLSearchParams(location.search).get('slots')) || 0 : 0;

/** Page units a guest strolls per second at 1×, and a waiter walks. */
const GUEST_PACE = 130;
const WAITER_PACE = 175;
/** Real seconds at 1× that walking in may take at most, across the biggest room, and a waiter's walk with the plates. */
const WALK_IN_SECONDS = 3.5;
const SERVE_SECONDS = 2.2;
/**
 * The game moves on about five minutes a real second at 1×, and guests order within five minutes and
 * often have their food within fifteen: quicker than anyone can walk in, sit down and be served on
 * screen. So the room shows each visit on its own timeline, a little behind the game: seated guests
 * read the menu for this many game minutes, then wait at least this many more before a waiter sets off
 * with their food (longer if the kitchen isn't done). The meal (76 minutes in the game) leaves plenty.
 */
const READING_MINUTES = 10;
const WAITING_MINUTES = 10;
/** A table nobody has served after this long (every waiter busy) gets its food anyway. */
const SERVE_BY_MINUTES = 50;
/** Seconds between people of the same party setting off. */
const STAGGER = 0.3;
/** Seconds a waiter stands at the table putting the plates down. */
const SERVING_PAUSE = 0.4;
/** From this time the evening falls: the sky outside darkens. */
const DUSK_MINUTE = 19 * 60 + 30;
/** Guests at least this happy with their food send up a heart with their money. */
const HAPPY = 60;
/** Real seconds the money floats up from a table. */
const FLOAT_SECONDS = 1.8;
/** The biggest a row is drawn (the front row of three); pictures are baked at this size. */
const MAX_ROW_SCALE = 1.12;

// ---------- Pictures ----------

/** A picture baked from SVG in the background; null until it's ready. */
function useBaked(key: string | null, draw: () => string, w: number, h: number, scale: number, fonts = false): string | null {
  const [baked, setBaked] = useState<{ key: string; url: string } | null>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    if (!key) return;
    let alive = true;
    bake(key, () => drawRef.current(), w, h, scale, fonts)
      .then((url) => alive && setBaked({ key, url }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [key, w, h, scale, fonts]);
  // Keep showing the last picture while the next one bakes, so nothing flickers.
  return baked?.url ?? null;
}

/** Which sheet of poses someone needs. */
interface SheetSpec {
  key: string;
  sheet: Sheet;
  draw: (pt: Painter) => string;
}

const guestSpec = (kind: SketchKind, variant: number): SheetSpec => ({ key: `guest|${kind}|${variant}`, sheet: GUEST_SHEET, draw: (pt) => guestSheet(pt, kind, variant) });
const waiterSpec = (kind: 'waiter' | 'tomek' | 'adrian', variant: number): SheetSpec => ({ key: `waiter|${kind}|${variant}`, sheet: WAITER_SHEET, draw: (pt) => waiterSheet(pt, kind, variant) });
const chefSpec = (variant: number): SheetSpec => ({ key: `chef|${variant}`, sheet: CHEF_SHEET, draw: (pt) => chefSheet(pt, variant) });

/** How long a path is, in page units. */
const lengthOf = (path: Point[]) => path.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - path[i].x, p.y - path[i].y), 0);
/** The pace that walks a path within `seconds`, never slower than `pace`. */
const brisk = (path: Point[], pace: number, seconds: number) => Math.max(pace, lengthOf(path) / seconds);

/** The baked sheet of icons, for anything in the room that shows one. */
const IconSheet = createContext<string | null>(null);

/** A hand-drawn icon, `size` pixels square. */
function Icon({ id, size }: { id: IconId; size: number }) {
  const url = useContext(IconSheet);
  const i = ICON_IDS.indexOf(id);
  return (
    <span
      className="sk-icon"
      style={{ width: size, height: size, backgroundImage: url ? `url(${url})` : undefined, backgroundSize: `${size * ICON_IDS.length}px ${size}px`, backgroundPositionX: -i * size }}
    />
  );
}

/** One at a time, so baking never holds up the day for long. */
let queue: Promise<unknown> = Promise.resolve();

/** The baked sheets for everyone on show, filled in as each is ready. */
function useSheets(specs: SheetSpec[], scale: number): Map<string, string> {
  const [urls, setUrls] = useState(() => new Map<string, string>());
  const asked = useRef(new Set<string>());
  const keys = specs.map((s) => s.key).join(',');
  useEffect(() => {
    for (const spec of specs) {
      const key = `${spec.key}|${scale.toFixed(2)}`;
      if (asked.current.has(key)) continue;
      asked.current.add(key);
      const { sheet } = spec;
      queue = queue
        .then(() => bake(key, () => svgPicture(sheet.cells * sheet.cellW, sheet.cellH, spec.draw(new Painter())), sheet.cells * sheet.cellW, sheet.cellH, scale, false))
        .then((url) => setUrls((now) => new Map(now).set(spec.key, url)))
        .catch(() => asked.current.delete(key));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys, scale]);
  return urls;
}

// ---------- Who's who ----------

/** Who sits in each seat: the special guest in the first, their party in the others. */
function kindAt(guests: TableGuests, seat: number): SketchKind {
  if (guests.visitor === 'walesa') return seat === 0 ? 'walesa' : 'guard';
  if (guests.visitor === 'footballer' && seat === 0) return 'footballer';
  if (seat === 0 && guests.regularId) return guests.regularId;
  if (seat === 0 && guests.critic) return 'critic';
  if (seat === 0 && guests.regular) return 'regular';
  return guests.group;
}

/** A guest's look, the same all visit long: picked from when they came and where they sit. */
function variantAt(guests: TableGuests, table: number, seat: number): number {
  return (guests.since * 7 + seat * 3 + table) % GROUP_LOOKS;
}

const specFor = (kind: SketchKind, variant: number) => (isGroup(kind) ? guestSpec(kind, variant) : guestSpec(kind, 0));
const isGroup = (kind: SketchKind): kind is GroupId => ['tourists', 'students', 'locals', 'office', 'foodies'].includes(kind);

// ---------- Someone in a pose ----------

/** One cell of a sheet, with its anchor at (x, y), k times life size; two cells stepping in a loop if `frames`. */
function Person({
  url,
  sheet,
  cell,
  x,
  y,
  k,
  scale,
  z,
  mirror = false,
  frames,
}: {
  url: string;
  sheet: Sheet;
  cell: number;
  x: number;
  y: number;
  k: number;
  scale: number;
  z: number;
  mirror?: boolean;
  frames?: { seconds: number; offset: number };
}) {
  const w = sheet.cellW * k * scale;
  return (
    <div
      className="sk-person"
      style={{ left: (x - sheet.anchorX * k) * scale, top: (y - sheet.anchorY * k) * scale, width: w, height: sheet.cellH * k * scale, zIndex: z }}
    >
      <div
        className={frames ? 'sk-cell sk-frames' : 'sk-cell'}
        style={{
          backgroundImage: `url(${url})`,
          backgroundSize: `${w * sheet.cells}px 100%`,
          backgroundPositionX: -cell * w,
          transform: mirror ? 'scaleX(-1)' : undefined,
          ['--from' as string]: `${-cell * w}px`,
          ['--to' as string]: `${-(cell + 2) * w}px`,
          animationDuration: frames ? `${frames.seconds}s` : undefined,
          animationDelay: frames ? `${-frames.offset}s` : undefined,
        }}
      />
    </div>
  );
}

// ---------- People walking ----------

interface Walk {
  id: string;
  sheet: SheetSpec;
  /** The walking cells, the first of two: coming towards us, and going away (seen from behind). */
  cell: number;
  away: number;
  path: Point[];
  pace: number;
  delay: number;
  bubble?: IconId;
  /** Guests walking in: the table they're heading for, and which visit that is. */
  arrivingAt?: { table: number; since: number };
  waiter?: number;
  then?: Walk;
}

/** One person on the move: the browser animates each stretch of the way; React only steps in between. */
function Walker({ walk, url, layout, scale, speed, onDone }: { walk: Walk; url: string | undefined; layout: FrontLayout; scale: number; speed: number; onDone: (walk: Walk) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const [leg, setLeg] = useState(0);
  const [left, setLeft] = useState(false);
  const [away, setAway] = useState(false);
  const speedNow = useRef(speed);
  speedNow.current = speed;
  const from = walk.path[leg];
  const to = walk.path[leg + 1];
  const { sheet } = walk.sheet;

  useEffect(() => {
    if (!to) {
      onDone(walk);
      return;
    }
    if (to.x !== from.x) setLeft(to.x < from.x);
    // Walking up the room, towards the back wall, we see their back.
    setAway(to.y < from.y - 1);
    // Smaller by the back wall, bigger near us.
    const at = (p: Point) => {
      const k = depthScale(layout, p.y);
      return `translate(${(p.x - sheet.anchorX * k) * scale}px, ${(p.y - sheet.anchorY * k) * scale}px) scale(${k})`;
    };
    const seconds = Math.hypot(to.x - from.x, to.y - from.y) / walk.pace;
    // Behind a table for the whole stretch when either end is behind it.
    const z = Math.min(from.z, to.z);
    const anim = ref.current!.animate([{ transform: at(from), zIndex: z }, { transform: at(to), zIndex: z }], {
      duration: Math.max(1, seconds * 1000),
      delay: leg === 0 ? walk.delay * 1000 : 0,
      fill: 'both',
      easing: 'linear',
    });
    anim.playbackRate = speedNow.current;
    anim.onfinish = () => setLeg((l) => l + 1);
    animation.current = anim;
    return () => anim.cancel();
  }, [leg, scale, layout, walk, from, to, onDone, sheet]);

  useEffect(() => {
    if (animation.current) animation.current.playbackRate = speed;
  }, [speed]);

  if (!to) return null;
  const w = sheet.cellW * scale;
  // Someone whose picture isn't baked yet walks unseen, and shows up as soon as it is.
  return (
    <div ref={ref} className="sk-person sk-walker" style={{ width: w, height: sheet.cellH * scale }}>
      {url && <div
        className="sk-cell sk-frames sk-stepping"
        style={{
          backgroundImage: `url(${url})`,
          backgroundSize: `${w * sheet.cells}px 100%`,
          transform: left ? 'scaleX(-1)' : undefined,
          ['--from' as string]: `${-(away ? walk.away : walk.cell) * w}px`,
          ['--to' as string]: `${-((away ? walk.away : walk.cell) + 2) * w}px`,
          animationDuration: `${(walk.pace === WAITER_PACE ? 0.5 : 0.62) / Math.max(speed, 0.01)}s`,
          animationPlayState: speed === 0 ? 'paused' : 'running',
        }}
      />}
      {url && walk.bubble && (
        <span className="sk-bubble sk-walker-bubble">
          <Icon id={walk.bubble} size={26} />
        </span>
      )}
    </div>
  );
}

/** Watches the tables from one moment to the next: guests walking in and out, parties moving, waiters serving. */
function useWalks(layout: FrontLayout, floor: FloorView, minute: number) {
  const known = useRef<Map<number, TableGuests> | null>(null);
  const [walks, setWalks] = useState<Walk[]>([]);
  const current = useRef(walks);
  current.current = walks;
  const minuteNow = useRef(minute);
  minuteNow.current = minute;
  // When each party sat down (the game minute, as seen), and which have had their food brought.
  const seatedAt = useRef(new Map<string, number>());
  const served = useRef(new Set<string>());

  useEffect(() => {
    const now = new Map<number, TableGuests>();
    floor.tables.forEach((guests, table) => guests && table < floor.insideTables && table < layout.tables.length && now.set(table, guests));
    // Parties already here when the room opens are simply sitting there, served if they're eating.
    if (known.current === null) {
      for (const [table, guests] of now) {
        const key = `${table}:${guests.since}`;
        seatedAt.current.set(key, -Infinity);
        if (guests.stage === 'eating') served.current.add(key);
      }
      known.current = now;
      return;
    }
    const before = known.current;
    const started: Walk[] = [];

    const guestsWalk = (table: number, guests: TableGuests, leaving: boolean) => {
      for (let i = 0; i < Math.min(guests.seated, 4); i++) {
        const path = walkIn(layout, table, i);
        if (path.length < 2) continue;
        started.push({
          id: `${table}:${guests.since}:${i}:${leaving ? 'out' : 'in'}`,
          sheet: specFor(kindAt(guests, i), variantAt(guests, table, i)),
          cell: WALK_CELL,
          away: WALK_BACK_CELL,
          path: leaving ? [...path].reverse() : path,
          pace: brisk(path, GUEST_PACE, WALK_IN_SECONDS),
          delay: i * STAGGER,
          bubble: leaving && guests.stage !== 'eating' ? 'angry' : undefined,
          arrivingAt: leaving ? undefined : { table, since: guests.since },
        });
      }
    };

    // The food is ready and they've waited a little: a free waiter carries it from the hatch, then walks back.
    const busy = new Set(current.current.map((w) => w.waiter).filter((w) => w !== undefined));
    const serve = (table: number, guests: TableGuests) => {
      const waiter = floor.waiters.findIndex((_, i) => !busy.has(i));
      if (waiter < 0) return false;
      busy.add(waiter);
      const path = serveWalk(layout, table);
      if (path.length < 2) return false;
      const spec = waiterSpec(floor.waiters[waiter] ?? 'waiter', floor.waiterLooks[waiter] ?? waiter);
      const id = `serve:${table}:${guests.since}`;
      const back = [...path].reverse();
      started.push({
        id,
        sheet: spec,
        cell: WAITER_CELLS.full,
        away: WAITER_CELLS.away,
        path,
        pace: brisk(path, WAITER_PACE, SERVE_SECONDS),
        delay: 0,
        waiter,
        then: { id: `${id}:back`, sheet: spec, cell: WAITER_CELLS.empty, away: WAITER_CELLS.away, path: back, pace: brisk(path, WAITER_PACE, SERVE_SECONDS), delay: SERVING_PAUSE, waiter },
      });
      return true;
    };

    // A party the player showed to another table.
    const movedFrom = new Map<number, number>();
    for (const [table, guests] of now) {
      if (before.get(table)?.since === guests.since) continue;
      for (const [old, was] of before) {
        const left = now.get(old)?.since !== was.since;
        if (old !== table && left && was.since === guests.since && was.group === guests.group) movedFrom.set(table, old);
      }
    }
    for (const [table, guests] of now) {
      const was = before.get(table);
      const from = movedFrom.get(table);
      if (from !== undefined) {
        for (let i = 0; i < Math.min(guests.seated, 4); i++)
          started.push({
            id: `${table}:${guests.since}:${i}:moved`,
            sheet: specFor(kindAt(guests, i), variantAt(guests, from, i)),
            cell: WALK_CELL,
          away: WALK_BACK_CELL,
            path: moveWalk(layout, from, i, table, i),
            pace: brisk(moveWalk(layout, from, i, table, i), GUEST_PACE, WALK_IN_SECONDS),
            delay: i * STAGGER,
            arrivingAt: { table, since: guests.since },
          });
      } else if (!was || was.since !== guests.since) guestsWalk(table, guests, false);
    }
    // Tables whose food is ready, once the guests have read the menu and waited a little.
    const walkingIn = new Set([...current.current, ...started].filter((w) => w.arrivingAt).map((w) => w.arrivingAt!.table));
    const onTheWay = new Set(current.current.filter((w) => w.id.startsWith('serve:')).map((w) => w.id.slice(6).replace(/:back$/, '')));
    for (const [table, guests] of now) {
      const key = `${table}:${guests.since}`;
      if (guests.stage !== 'eating' || served.current.has(key) || onTheWay.has(key) || walkingIn.has(table)) continue;
      // Guests who sat down without walking in (no way from the door) sit from now.
      if (!seatedAt.current.has(key)) seatedAt.current.set(key, minute);
      const sat = minute - seatedAt.current.get(key)!;
      if (sat >= READING_MINUTES + WAITING_MINUTES && !serve(table, guests) && sat >= SERVE_BY_MINUTES) served.current.add(key);
    }
    const movedAway = new Set(movedFrom.values());
    for (const [table, guests] of before) {
      const still = now.get(table);
      if ((!still || still.since !== guests.since) && !movedAway.has(table)) guestsWalk(table, guests, true);
    }
    known.current = now;
    if (started.length > 0) setWalks((list) => [...list, ...started]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floor, layout]);

  const done = useCallback((walk: Walk) => {
    const key = walk.arrivingAt && `${walk.arrivingAt.table}:${walk.arrivingAt.since}`;
    if (key && !seatedAt.current.has(key)) seatedAt.current.set(key, minuteNow.current);
    // The waiter has put the plates down.
    if (walk.id.startsWith('serve:') && !walk.id.endsWith(':back')) served.current.add(walk.id.slice(6));
    setWalks((list) => [...list.filter((w) => w.id !== walk.id), ...(walk.then ? [walk.then] : [])]);
  }, []);
  const arriving = new Set(walks.filter((w) => w.arrivingAt && floor.tables[w.arrivingAt.table]?.since === w.arrivingAt.since).map((w) => w.arrivingAt!.table));
  const busyWaiters = new Set(walks.map((w) => w.waiter).filter((w): w is number => w !== undefined));
  return { walks, done, arriving, busyWaiters, served: served.current, seatedAt: seatedAt.current };
}

/** Parties that gave up waiting at the door walk out of it, cross. */
function useQueueLeavers(layout: FrontLayout, floor: FloorView) {
  const [walks, setWalks] = useState<Walk[]>([]);
  const seen = useRef(new Set<string>());
  useEffect(() => {
    const started: Walk[] = [];
    floor.leftTheDoor.forEach((party, p) => {
      const key = `${party.minute}:${p}:${party.group}:${party.size}`;
      if (seen.current.has(key)) return;
      seen.current.add(key);
      for (let i = 0; i < Math.min(party.size, 2); i++) {
        const start = queueSpot(layout, 0, i);
        started.push({
          id: `left:${key}:${i}`,
          sheet: guestSpec(party.group, (p * 3 + i) % GROUP_LOOKS),
          cell: WALK_CELL,
          away: WALK_BACK_CELL,
          path: [start, { x: layout.door.x, y: layout.floorY + 2, z: start.z }],
          pace: GUEST_PACE,
          delay: i * STAGGER,
          bubble: 'angry',
        });
      }
    });
    if (started.length > 0) setWalks((now) => [...now, ...started]);
  }, [floor.leftTheDoor, layout]);
  const done = useCallback((walk: Walk) => setWalks((now) => now.filter((w) => w.id !== walk.id)), []);
  return { walks, done };
}

// ---------- Money floating up ----------

interface Float {
  id: string;
  table: number;
  bill: number;
  heart: boolean;
}

/** The money each table pays, floating up the moment its food arrives, with a heart when they like it. */
function useFloats(floor: FloorView, served: Set<string>): Float[] {
  const [floats, setFloats] = useState<Float[]>([]);
  const seen = useRef(new Set<string>());
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);
  const first = useRef(true);
  useEffect(() => {
    const fresh: Float[] = [];
    floor.tables.forEach((guests, table) => {
      if (!guests || guests.bill === 0) return;
      const id = `${table}:${guests.since}`;
      if (seen.current.has(id) || !served.has(id)) return;
      seen.current.add(id);
      // Not the tables that had already paid when the room opened.
      if (!first.current) fresh.push({ id, table, bill: guests.bill, heart: (guests.satisfaction ?? 0) >= HAPPY });
    });
    first.current = false;
    if (fresh.length === 0) return;
    setFloats((now) => [...now, ...fresh]);
    timers.current.push(window.setTimeout(() => setFloats((now) => now.filter((f) => !fresh.includes(f))), FLOAT_SECONDS * 1000));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floor]);
  return floats;
}

// ---------- The view ----------

/** The size of the box the view fills. */
function useBox() {
  const wrap = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const element = wrap.current;
    if (!element) return;
    const measure = () => setBox({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { wrap, box };
}

/** How a seated guest sits: reading the menu, waiting (arms crossed when it's taking too long), or eating. */
function poseOf(guests: TableGuests, stage: GuestStage, seat: number): { pose: GuestPose; eating: boolean } {
  if (stage === 'eating') return { pose: 'eatUp', eating: true };
  if (stage === 'ordering') return { pose: seat === 0 || seat === 2 ? 'order' : 'wait', eating: false };
  return { pose: guests.impatience > 0.6 ? 'cross' : 'wait', eating: false };
}

/** What a table's bubble shows: an icon, what's written after it, and for waiting guests their patience (1 full, 0 gone). */
interface BubbleLook {
  icon: IconId;
  after?: string;
  patience?: number;
  tone?: 'calm' | 'amber' | 'red';
}

const VISITOR_ICONS: Record<NonNullable<TableGuests['visitor']>, IconId> = { merry: 'shot', footballer: 'ball', walesa: 'victory', filmCrew: 'clapper' };

/** The bubble over a table, as the player sees the visit (stage), or null for none. */
function bubbleLook(guests: TableGuests, stage: GuestStage): BubbleLook | null {
  if (guests.regular && stage !== 'eating') return { icon: 'lemon' };
  if (guests.regularId && stage !== 'eating') return iconOf(REGULARS[guests.regularId].emoji) ?? null;
  if (guests.visitor) return { icon: VISITOR_ICONS[guests.visitor] };
  if (guests.wish && stage !== 'eating' && guests.impatience <= 0.5) return iconOf(guests.wish.bubble);
  if (guests.wish && stage === 'eating' && guests.eatingFor <= 15) return { icon: guests.wish.met ? 'heart' : 'missed' };
  if (stage === 'ordering') return { icon: 'menu' };
  if (stage === 'waiting') {
    // Waiting for their food: an empty plate, and their patience running out round it.
    const patience = Math.max(0, 1 - guests.impatience);
    if (guests.impatience > 0.8) return { icon: 'angry', patience, tone: 'red' };
    if (guests.impatience > 0.5) return { icon: 'hourglass', patience, tone: 'amber' };
    return { icon: 'plate', patience, tone: 'calm' };
  }
  if (guests.eatingFor > 15 || guests.satisfaction === null) return null;
  if (guests.satisfaction >= 80) return { icon: 'yum' };
  if (guests.satisfaction >= HAPPY) return { icon: 'happy' };
  if (guests.satisfaction >= 40) return { icon: 'meh' };
  return { icon: 'sad' };
}

export function SketchRoomView({
  floor,
  weather,
  minute,
  onTableTap,
  selectedTable = null,
  onGullTap,
  freeTables = [],
  onFreeTableTap,
  onStaffTap,
}: {
  floor: FloorView;
  weather: Weather;
  minute: number;
  onTableTap?: (table: number) => void;
  selectedTable?: number | null;
  onGullTap?: () => void;
  freeTables?: { table: number; favourite: boolean }[];
  onFreeTableTap?: (table: number) => void;
  /** People passing by and flyers come with the street outside (the next M8 item). */
  onPasserTap?: (group: GroupId) => boolean | null;
  onFlyerArrives?: (group: GroupId) => void;
  onStaffTap?: (role: 'chef' | 'waiter', at: number) => void;
}) {
  const speed = useGame((s) => s.speed);
  const plaque = useGame((s) => s.game.rank >= TOP_RANK);
  const menu = useGame((s) => s.game.restaurants[0].menu);
  const { wrap, box } = useBox();
  const slots = slotsWanted || Math.floor(LOCATIONS[floor.location].maxSeats / balance.service.seatsPerTable);
  const aspect = box.width > 0 && box.height > 0 ? Math.round((box.width / box.height) * 20) / 20 : 0;
  const layout = useMemo(() => frontLayout(slots, aspect || 1364 / 603), [slots, aspect]);
  const scale = box.width > 0 ? Math.min(box.width / layout.width, box.height / layout.height) : 0;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  // Pictures are baked in the screen's own pixels; rounded so a tiny resize doesn't bake them again.
  const bakeScale = Math.round(scale * dpr * 20) / 20;
  const at = (n: number) => n * scale;

  // ----- The room, the counter in front of the chefs, the page around it, the tables and plates -----
  const dusk = minute >= DUSK_MINUTE;
  const specials = menu
    .filter((d) => !d.fromLunchSet)
    .slice(0, 3)
    .map((d) => ({ name: shorten(dishName(d)), price: d.price }));
  const look: RoomLook = { decor: floor.decor, equipment: floor.equipment, weather, dusk, plaque, specials };
  const lookKey = [look.decor.join(), look.equipment.join(), weather, dusk, plaque, specials.map((s) => s.name + s.price).join()].join('|');
  const ready = bakeScale > 0;
  const room = useBaked(ready ? `room|${slots}|${aspect}|${lookKey}|${bakeScale}` : null, () => svgPicture(layout.width, layout.height, roomPicture(new Painter(), layout, look)), layout.width, layout.height, bakeScale, true);
  const counter = useBaked(ready ? `counter|${slots}|${aspect}|${bakeScale}` : null, () => svgPicture(layout.width, layout.height, hatchCounterPicture(new Painter(), layout)), layout.width, layout.height, bakeScale);
  const frame = useBaked(ready ? `frame|${slots}|${aspect}|${bakeScale}` : null, () => svgPicture(layout.width, layout.height, pageFramePicture(new Painter(), layout.width, layout.height)), layout.width, layout.height, bakeScale);
  const embroidered = floor.decor.includes('tablecloths');
  const oak = floor.decor.includes('communalTable');
  const tableScale = bakeScale * MAX_ROW_SCALE;
  const chairs = useBaked(ready ? `chairs|${tableScale}` : null, () => svgPicture(TABLE_BOX.width, TABLE_BOX.height, chairsPicture(new Painter())), TABLE_BOX.width, TABLE_BOX.height, tableScale);
  const table = useBaked(ready ? `table|${embroidered}|${oak}|${tableScale}` : null, () => svgPicture(TABLE_BOX.width, TABLE_BOX.height, tablePicture(new Painter(), embroidered, oak)), TABLE_BOX.width, TABLE_BOX.height, tableScale);
  const platesW = PLATES.length * PLATE_CELL.width;
  const plates = useBaked(ready ? `plates|${tableScale}` : null, () => svgPicture(platesW, PLATE_CELL.height, platesPicture(new Painter())), platesW, PLATE_CELL.height, tableScale);

  // ----- People -----
  const { walks, done, arriving, busyWaiters, served, seatedAt } = useWalks(layout, floor, minute);
  const leavers = useQueueLeavers(layout, floor);
  const floats = useFloats(floor, served);
  const iconScale = Math.round(dpr * 40) / 40;
  const icons = useBaked(ready ? `icons|${iconScale}` : null, () => svgPicture(ICON_IDS.length * ICON_CELL, ICON_CELL, iconSheet(new Painter())), ICON_IDS.length * ICON_CELL, ICON_CELL, iconScale);
  /** The visit as the player sees it: reading the menu after sitting down, then waiting until the waiter brings the food. */
  const stageOf = (guests: TableGuests, table: number): GuestStage => {
    const key = `${table}:${guests.since}`;
    if (served.has(key)) return 'eating';
    const sat = seatedAt.get(key) ?? minute;
    if (minute - sat < READING_MINUTES) return 'ordering';
    return 'waiting';
  };
  const furnished = Math.min(floor.insideTables, layout.tables.length);
  const specs: SheetSpec[] = [];
  const seen = new Set<string>();
  const need = (spec: SheetSpec) => !seen.has(spec.key) && (seen.add(spec.key), specs.push(spec));
  floor.chefsBusy.forEach((_, i) => need(chefSpec(floor.chefLooks[i] ?? i)));
  floor.waiters.forEach((w, i) => need(waiterSpec(w ?? 'waiter', floor.waiterLooks[i] ?? i)));
  for (let t = 0; t < furnished; t++) {
    const guests = floor.tables[t];
    if (guests) for (let i = 0; i < Math.min(guests.seated, 4); i++) need(specFor(kindAt(guests, i), variantAt(guests, t, i)));
  }
  floor.atTheDoor.slice(0, 3).forEach((party, p) => need(guestSpec(party.group, (p * 3) % GROUP_LOOKS)));
  for (const w of [...walks, ...leavers.walks]) need(w.sheet);
  const sheets = useSheets(specs, tableScale);

  if (!ready) return <div ref={wrap} className="sk-wrap" />;

  const people: React.ReactNode[] = [];
  const bubbles: React.ReactNode[] = [];
  // Seated guests, their plates and their bubbles.
  for (let t = 0; t < furnished; t++) {
    const guests = floor.tables[t];
    const spot = layout.tables[t];
    if (!guests || arriving.has(t)) continue;
    const k = spot.scale;
    for (let i = 0; i < Math.min(guests.seated, 4); i++) {
      const seat = spot.seats[i];
      const spec = specFor(kindAt(guests, i), variantAt(guests, t, i));
      const url = sheets.get(spec.key);
      const { pose, eating } = poseOf(guests, stageOf(guests, t), i);
      if (url)
        people.push(
          <Person
            key={`seat${t}:${i}`}
            url={url}
            sheet={GUEST_SHEET}
            cell={seatedCell(pose, seat.end)}
            x={seat.x}
            y={seat.y}
            k={k}
            scale={scale}
            z={zOf(spot.row, LAYER.behind)}
            mirror={seat.mirror}
            frames={eating ? { seconds: 1.6 / Math.max(speed, 0.25), offset: (t * 0.37 + i * 0.61) % 1.6 } : undefined}
          />,
        );
      if (plates) {
        const kind = eating ? 1 + ((guests.since + i * 3 + t) % 4) : 0;
        const px = spot.x + (seat.end ? (seat.mirror ? 62 : -62) : seat.mirror ? 28 : -28) * k;
        const w = PLATE_CELL.width * k * scale;
        people.push(
          <div
            key={`plate${t}:${i}`}
            className="sk-plate"
            style={{
              left: at(px - PLATE_CELL.x * k),
              top: at(spot.top + 2 * k - PLATE_CELL.y * k),
              width: w,
              height: at(PLATE_CELL.height * k),
              zIndex: zOf(spot.row, LAYER.plates),
              backgroundImage: `url(${plates})`,
              backgroundSize: `${w * PLATES.length}px 100%`,
              backgroundPositionX: -kind * w,
            }}
          >
            {PLATES[kind] === 'soup' && guests.eatingFor < 20 && <span className="sk-steam" />}
          </div>,
        );
      }
    }
    const bubble = bubbleLook(guests, stageOf(guests, t));
    const bx = at(spot.x);
    const by = at(spot.top - 150 * k);
    if (bubble)
      bubbles.push(
        <span
          key={`bubble${t}:${bubble.icon}`}
          className={`sk-bubble${bubble.patience !== undefined ? ` sk-ring ${bubble.tone}` : ''}${t === selectedTable ? ' selected' : ''}`}
          style={{ left: bx, top: by, ['--patience' as string]: bubble.patience ?? 1 }}
        >
          <span className="sk-bubble-face">
            <Icon id={bubble.icon} size={30} />
            {bubble.after && <span className="sk-bubble-after">{bubble.after}</span>}
          </span>
          {guests.critic && (
            <span className="sk-badge">
              <Icon id="pen" size={18} />
            </span>
          )}
        </span>,
      );
    // Getting frustrated: a button beside the bubble to do something about it.
    if (onTableTap && canHelp(guests) && stageOf(guests, t) === 'waiting')
      bubbles.push(
        <button key={`help${t}`} type="button" className="sk-help" style={{ left: bx + 56, top: by - 24 }} aria-label="Help them: a drink, an apology, or another table" onClick={() => onTableTap(t)}>
          <Icon id="help" size={30} />
        </button>,
      );
  }

  // The chefs behind the hatch, tossing their pans while they cook.
  const chefs = floor.chefsBusy.map((busyNow, i) => {
    const spot = chefSpot(layout, floor.chefsBusy.length, i);
    const url = sheets.get(chefSpec(floor.chefLooks[i] ?? i).key);
    return url ? (
      <Person
        key={`chef${i}`}
        url={url}
        sheet={CHEF_SHEET}
        cell={busyNow ? CHEF_CELLS.cook : CHEF_CELLS.idle}
        x={spot.x}
        y={spot.y}
        k={1}
        scale={scale}
        z={6}
        frames={busyNow ? { seconds: 0.9 / Math.max(speed, 0.25), offset: i * 0.3 } : undefined}
      />
    ) : null;
  });

  // Waiters standing by at the bar, when they aren't carrying anything.
  const idleWaiters = floor.waiters.map((w, i) => {
    if (busyWaiters.has(i)) return null;
    const spot = waiterSpot(layout, i);
    const url = sheets.get(waiterSpec(w ?? 'waiter', floor.waiterLooks[i] ?? i).key);
    return url ? <Person key={`waiter${i}`} url={url} sheet={WAITER_SHEET} cell={WAITER_CELLS.stand} x={spot.x} y={spot.y} k={depthScale(layout, spot.y)} scale={scale} z={spot.z} /> : null;
  });

  // Parties waiting for a table, by the door.
  const queue = floor.atTheDoor.slice(0, 3).flatMap((party, p) =>
    Array.from({ length: Math.min(party.size, 2) }, (_, i) => {
      const spot = queueSpot(layout, p, i);
      const url = sheets.get(guestSpec(party.group, (p * 3) % GROUP_LOOKS).key);
      return url ? <Person key={`queue${p}:${i}`} url={url} sheet={GUEST_SHEET} cell={STAND_CELL} x={spot.x} y={spot.y} k={depthScale(layout, spot.y)} scale={scale} z={spot.z + p} mirror={i === 1} /> : null;
    }),
  );
  if (floor.atTheDoor.length > 0) {
    const spot = queueSpot(layout, 0, 0);
    bubbles.push(
      <span key="queue" className="sk-bubble" style={{ left: at(spot.x + 14), top: at(spot.y - 230 * depthScale(layout, spot.y)) }}>
        <span className="sk-bubble-face">
          <Icon id="hourglass" size={28} />
          {floor.atTheDoor.length > 1 && <span className="sk-bubble-after">×{floor.atTheDoor.length}</span>}
        </span>
      </span>,
    );
  }

  const clock = wallClock(layout);

  return (
    <div ref={wrap} className="sk-wrap">
      <IconSheet.Provider value={icons}>
        <div className="sk-scene" style={{ width: at(layout.width), height: at(layout.height) }} role="img" aria-label="Your restaurant">
          {room && <img src={room} className="sk-layer" alt="" style={{ width: at(layout.width), height: at(layout.height), zIndex: 0 }} />}
          {clock && <WallClock minute={minute} x={at(clock.x)} y={at(clock.y)} r={at(19)} />}
          {chefs}
          {counter && <img src={counter} className="sk-layer" alt="" style={{ width: at(layout.width), height: at(layout.height), zIndex: 7 }} />}
          {layout.tables.slice(0, furnished).map((spot, t) => {
            const k = spot.scale;
            const style = (z: number) => ({ left: at(spot.x + TABLE_BOX.left * k), top: at(spot.top + TABLE_BOX.top * k), width: at(TABLE_BOX.width * k), height: at(TABLE_BOX.height * k), zIndex: z });
            return (
              <span key={`table${t}`}>
                {chairs && <img src={chairs} className="sk-layer" alt="" style={style(zOf(spot.row, LAYER.chairs))} />}
                {table && <img src={table} className="sk-layer" alt="" style={style(zOf(spot.row, LAYER.table))} />}
              </span>
            );
          })}
          {people}
          {idleWaiters}
          {queue}
          {[...walks, ...leavers.walks].map((walk) => (
            <Walker key={walk.id} walk={walk} url={sheets.get(walk.sheet.key)} layout={layout} scale={scale} speed={speed} onDone={walks.includes(walk) ? done : leavers.done} />
          ))}
          {frame && <img src={frame} className="sk-layer sk-frame" alt="" style={{ width: at(layout.width), height: at(layout.height) }} />}
          {bubbles}
          {/* Every table still waiting for food can be tapped: its bubble, or the guests themselves. Nearer rows on top. */}
          {onTableTap &&
            layout.tables.slice(0, furnished).map((spot, t) =>
              canTend(floor.tables[t]) ? (
                <button
                  key={`tend${t}`}
                  type="button"
                  className="sk-tend"
                  style={{
                    left: at(spot.x - 75 * spot.scale),
                    top: at(spot.top - 150 * spot.scale) - 34,
                    width: at(150 * spot.scale),
                    height: at(150 * spot.scale) + 34,
                    zIndex: 960 + spot.row,
                  }}
                  aria-label="Look after this table"
                  onClick={() => onTableTap(t)}
                />
              ) : null,
            )}
          {onFreeTableTap &&
            freeTables.map(({ table: t, favourite }) => {
              const spot = layout.tables[t];
              if (!spot || t >= furnished) return null;
              return (
                <button
                  key={`free${t}`}
                  type="button"
                  className={`free-table${favourite ? ' favourite' : ''}`}
                  style={{ left: at(spot.x), top: at(spot.top) }}
                  aria-label={favourite ? 'Their favourite spot: seat them here' : 'Seat them here'}
                  onClick={() => onFreeTableTap(t)}
                >
                  {favourite ? '⭐' : '🪑'}
                </button>
              );
            })}
          {floor.chefHurry?.map((state, i) => {
            const spot = chefSpot(layout, floor.chefHurry!.length, i);
            return <StaffHurry key={`hurryChef${i}`} state={state} left={at(spot.x)} top={at(layout.hatch.counter - 150)} label="Hurry this chef" onTap={onStaffTap && (() => onStaffTap('chef', i))} />;
          })}
          {floor.waiterHurry?.map((state, i) => {
            if (busyWaiters.has(i) && state === 'ready') return null;
            const spot = waiterSpot(layout, i);
            return <StaffHurry key={`hurryWaiter${i}`} state={state} left={at(spot.x)} top={at(spot.y - 220 * depthScale(layout, spot.y))} label="Hurry this waiter" onTap={onStaffTap && (() => onStaffTap('waiter', i))} />;
          })}
          {floats.map((f) => {
            const spot = layout.tables[f.table];
            if (!spot) return null;
            return (
              <span key={f.id} className="sk-float" style={{ left: at(spot.x), top: at(spot.top - 170 * spot.scale) }}>
                +{money(f.bill)}
                {f.heart && <span className="sk-heart">♥</span>}
              </span>
            );
          })}
          {floor.gull && <DoorGull layout={layout} scale={scale} onTap={onGullTap} />}
        </div>
      </IconSheet.Provider>
    </div>
  );
}

/** A short name for the chalkboard. */
function shorten(name: string): string {
  const first = name.split(/ · |, with /)[0];
  return first.length > 16 ? `${first.slice(0, 15)}…` : first;
}

/** The wall clock above the door shows the day's time. */
function WallClock({ minute, x, y, r }: { minute: number; x: number; y: number; r: number }) {
  const hour = ((minute / 60) % 12) * 30;
  const min = (minute % 60) * 6;
  return (
    <div className="sk-clock" style={{ left: x, top: y, width: r * 2, height: r * 2 }} aria-hidden="true">
      <span className="sk-hand hour" style={{ transform: `translateX(-50%) rotate(${hour}deg)` }} />
      <span className="sk-hand minute" style={{ transform: `translateX(-50%) rotate(${min}deg)` }} />
    </div>
  );
}

/** A lightning bolt on a chef or waiter who can be hurried, and a small sign on the hurried ones (a bolt, or a coffee while they rest). */
function StaffHurry({ state, left, top, label, onTap }: { state: HurryState; left: number; top: number; label: string; onTap?: () => void }) {
  if (state === 'ready' && onTap)
    return (
      <button type="button" className="staff-hurry sk-staff-hurry" style={{ left, top }} aria-label={label} onClick={onTap}>
        <Icon id="lightning" size={30} />
      </button>
    );
  if (state === 'hurrying' || state === 'resting')
    return (
      <span className={`staff-hurry-sign ${state}`} style={{ left, top }} aria-hidden="true">
        <Icon id={state === 'hurrying' ? 'lightning' : 'coffee'} size={26} />
      </span>
    );
  return null;
}

/** Until the street outside has its own view, a gull after the terrace's plates shows in the open door. */
function DoorGull({ layout, scale, onTap }: { layout: FrontLayout; scale: number; onTap?: () => void }) {
  const url = useBaked(`gull|${scale.toFixed(2)}`, () => svgPicture(80, 60, mewa(new Painter(), 44, 56, 1.5)), 80, 60, scale * (window.devicePixelRatio || 1));
  const left = (layout.door.x - 40) * scale;
  const top = (layout.floorY - 70) * scale;
  return (
    <>
      {url && <img src={url} className="sk-layer sk-gull" alt="" style={{ left, top, width: 80 * scale, height: 60 * scale }} />}
      {onTap && <button type="button" className="gull-tap" style={{ left: left + 40 * scale, top: top + 30 * scale }} aria-label="Shoo the gull away" onClick={onTap} />}
    </>
  );
}
