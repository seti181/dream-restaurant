// What both views of the sketchbook look share (project.md section 9.5, M8): the inside of the
// restaurant (SketchRoomView) and the street outside (SketchStreetView). Pictures baked in the
// background, people from sheets of poses, people walking, each visit's own timeline (reading the
// menu, waiting, being served), bubbles and money floating up.

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { REGULARS } from '../../data/regulars';
import type { GroupId } from '../../data/groups';
import type { FloorView, GuestStage, TableGuests } from '../../sim/day';
import { Icon } from '../Icon';
import { bake } from '../sketch/bake';
import { GROUP_LOOKS, type SketchKind } from '../sketch/cast';
import { LAYER, type Point, type TableSpot } from '../sketch/frontRoom';
import { canHelp, canTend } from '../PixelRestaurantView';
import { PLATE_CELL, PLATES } from '../sketch/roomArt';
import { iconOf, type IconId } from '../sketch/icons';
import { Painter, svgPicture } from '../sketch/painter';
import { CHEF_SHEET, chefSheet, GUEST_SHEET, guestSheet, seatedCell, WAITER_CELLS, WAITER_SHEET, waiterSheet, WALK_BACK_CELL, WALK_CELL, type GuestPose, type Sheet } from '../sketch/sheets';

/** Page units a guest strolls per second at 1×, and a waiter walks. */
export const GUEST_PACE = 130;
export const WAITER_PACE = 175;
/** Real seconds at 1× that walking in may take at most, across the biggest room, and a waiter's walk with the plates. */
export const WALK_IN_SECONDS = 3.5;
export const SERVE_SECONDS = 2.2;
/**
 * The game moves on about five minutes a real second at 1×, and guests order within five minutes and
 * often have their food within fifteen: quicker than anyone can walk in, sit down and be served on
 * screen. So the room shows each visit on its own timeline, a little behind the game: seated guests
 * read the menu for this many game minutes, then wait at least this many more before a waiter sets off
 * with their food (longer if the kitchen isn't done). The meal (76 minutes in the game) leaves plenty.
 */
export const READING_MINUTES = 10;
export const WAITING_MINUTES = 10;
/** A table nobody has served after this long (every waiter busy) gets its food anyway. */
export const SERVE_BY_MINUTES = 50;
/** Seconds between people of the same party setting off. */
export const STAGGER = 0.3;
/** Seconds a waiter stands at the table putting the plates down. */
export const SERVING_PAUSE = 0.4;
/** From this time the evening falls: the sky outside darkens. */
export const DUSK_MINUTE = 19 * 60 + 30;
/** Guests at least this happy with their food send up a heart with their money. */
export const HAPPY = 60;
/** Real seconds the money floats up from a table. */
export const FLOAT_SECONDS = 1.8;

// ---------- Pictures ----------

/** A picture baked from SVG in the background; null until it's ready. */
export function useBaked(key: string | null, draw: () => string, w: number, h: number, scale: number, fonts = false): string | null {
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
export interface SheetSpec {
  key: string;
  sheet: Sheet;
  draw: (pt: Painter) => string;
}

export const guestSpec = (kind: SketchKind, variant: number): SheetSpec => ({ key: `guest|${kind}|${variant}`, sheet: GUEST_SHEET, draw: (pt) => guestSheet(pt, kind, variant) });
export const waiterSpec = (kind: 'waiter' | 'tomek' | 'adrian', variant: number): SheetSpec => ({ key: `waiter|${kind}|${variant}`, sheet: WAITER_SHEET, draw: (pt) => waiterSheet(pt, kind, variant) });
export const chefSpec = (variant: number): SheetSpec => ({ key: `chef|${variant}`, sheet: CHEF_SHEET, draw: (pt) => chefSheet(pt, variant) });

/** How long a path is, in page units. */
const lengthOf = (path: Point[]) => path.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - path[i].x, p.y - path[i].y), 0);
/** The pace that walks a path within `seconds`, never slower than `pace`. */
export const brisk = (path: Point[], pace: number, seconds: number) => Math.max(pace, lengthOf(path) / seconds);

/** One at a time, so baking never holds up the day for long. */
let queue: Promise<unknown> = Promise.resolve();

/** The baked sheets for everyone on show, filled in as each is ready. */
export function useSheets(specs: SheetSpec[], scale: number): Map<string, string> {
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
export function kindAt(guests: TableGuests, seat: number): SketchKind {
  if (guests.visitor === 'walesa') return seat === 0 ? 'walesa' : 'guard';
  if (guests.visitor === 'footballer' && seat === 0) return 'footballer';
  if (seat === 0 && guests.regularId) return guests.regularId;
  if (seat === 0 && guests.critic) return 'critic';
  if (seat === 0 && guests.regular) return 'regular';
  return guests.group;
}

/** A guest's look, the same all visit long: picked from when they came and where they sit. */
export function variantAt(guests: TableGuests, table: number, seat: number): number {
  return (guests.since * 7 + seat * 3 + table) % GROUP_LOOKS;
}

export const specFor = (kind: SketchKind, variant: number) => (isGroup(kind) ? guestSpec(kind, variant) : guestSpec(kind, 0));
const isGroup = (kind: SketchKind): kind is GroupId => ['tourists', 'students', 'locals', 'office', 'foodies'].includes(kind);

// ---------- Someone in a pose ----------

/** One cell of a sheet, with its anchor at (x, y), k times life size; two cells stepping in a loop if `frames`. */
export function Person({
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

export interface Walk {
  id: string;
  /** For someone walking past outside: their group, for handing them a flyer. */
  passer?: GroupId;
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
export function Walker({
  walk,
  url,
  depth,
  scale,
  speed,
  onDone,
  onTap,
}: {
  walk: Walk;
  url: string | undefined;
  /** How big someone is drawn at depth y: smaller far off, bigger near us. */
  depth: (y: number) => number;
  scale: number;
  speed: number;
  onDone: (walk: Walk) => void;
  /** Tapping them (someone walking past): where they are right now, to turn from there. */
  onTap?: (walk: Walk, here: Point) => void;
}) {
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
    // Smaller far off, bigger near us.
    const at = (p: Point) => {
      const k = depth(p.y);
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
  }, [leg, scale, depth, walk, from, to, onDone, sheet]);

  useEffect(() => {
    if (animation.current) animation.current.playbackRate = speed;
  }, [speed]);

  if (!to) return null;
  const w = sheet.cellW * scale;
  /** Where they are right now, part of the way along this stretch. */
  const here = (): Point => {
    const progress = animation.current?.effect?.getComputedTiming().progress;
    const t = typeof progress === 'number' ? progress : 0;
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, z: from.z };
  };
  // Someone whose picture isn't baked yet walks unseen, and shows up as soon as it is.
  return (
    <div
      ref={ref}
      className={`sk-person sk-walker${onTap ? ' tappable' : ''}`}
      style={{ width: w, height: sheet.cellH * scale }}
      role={onTap ? 'button' : undefined}
      aria-label={onTap ? 'Hand them a flyer' : undefined}
      onClick={onTap && (() => onTap(walk, here()))}
    >
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

/** Which tables a view shows, and the ways people take to them. */
export interface Ways {
  /** The game's table numbers this view shows (inside, or the terrace). */
  shows: (table: number) => boolean;
  /** From the way in to a seat at a table; the way out is the same, back. */
  walkIn: (table: number, seat: number) => Point[];
  /** A waiter's way from the kitchen to a table. */
  serve: (table: number) => Point[];
  /** A party shown from one table to another in this view; null to have them walk out and in. */
  move: (from: number, fromSeat: number, to: number, toSeat: number) => Point[] | null;
}

/**
 * Watches the tables a view shows from one moment to the next: guests walking in and out, parties
 * moving, and each visit on its own timeline (reading the menu, then waiting until a waiter brings the
 * food), a little behind the game.
 */
export function useVisits(ways: Ways, floor: FloorView, minute: number) {
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
    floor.tables.forEach((guests, table) => guests && ways.shows(table) && now.set(table, guests));
    // Parties already here when the view opens are simply sitting there, served if they're eating.
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
        const path = ways.walkIn(table, i);
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

    // The food is ready and they've waited a little: a free waiter carries it from the kitchen, then walks back.
    const busy = new Set(current.current.map((w) => w.waiter).filter((w) => w !== undefined));
    const serve = (table: number, guests: TableGuests) => {
      const waiter = floor.waiters.findIndex((_, i) => !busy.has(i));
      if (waiter < 0) return false;
      const path = ways.serve(table);
      if (path.length < 2) return false;
      busy.add(waiter);
      const spec = waiterSpec(floor.waiters[waiter] ?? 'waiter', floor.waiterLooks[waiter] ?? waiter);
      const id = `serve:${table}:${guests.since}`;
      const pace = brisk(path, WAITER_PACE, SERVE_SECONDS);
      started.push({
        id,
        sheet: spec,
        cell: WAITER_CELLS.full,
        away: WAITER_CELLS.away,
        path,
        pace,
        delay: 0,
        waiter,
        then: { id: `${id}:back`, sheet: spec, cell: WAITER_CELLS.empty, away: WAITER_CELLS.away, path: [...path].reverse(), pace, delay: SERVING_PAUSE, waiter },
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
      const moved = from === undefined ? null : Array.from({ length: Math.min(guests.seated, 4) }, (_, i) => ways.move(from, i, table, i));
      if (moved && moved.every((p) => p && p.length >= 2)) {
        moved.forEach((path, i) =>
          started.push({
            id: `${table}:${guests.since}:${i}:moved`,
            sheet: specFor(kindAt(guests, i), variantAt(guests, from!, i)),
            cell: WALK_CELL,
            away: WALK_BACK_CELL,
            path: path!,
            pace: brisk(path!, GUEST_PACE, WALK_IN_SECONDS),
            delay: i * STAGGER,
            arrivingAt: { table, since: guests.since },
          }),
        );
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
    const movedAway = new Set([...movedFrom.entries()].filter(([to]) => started.some((w) => w.id.startsWith(`${to}:`) && w.id.endsWith(':moved'))).map(([, from]) => from));
    for (const [table, guests] of before) {
      const still = now.get(table);
      if ((!still || still.since !== guests.since) && !movedAway.has(table)) guestsWalk(table, guests, true);
    }
    known.current = now;
    if (started.length > 0) setWalks((list) => [...list, ...started]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floor, ways]);

  const done = useCallback((walk: Walk) => {
    const key = walk.arrivingAt && `${walk.arrivingAt.table}:${walk.arrivingAt.since}`;
    if (key && !seatedAt.current.has(key)) seatedAt.current.set(key, minuteNow.current);
    // The waiter has put the plates down.
    if (walk.id.startsWith('serve:') && !walk.id.endsWith(':back')) served.current.add(walk.id.slice(6));
    setWalks((list) => [...list.filter((w) => w.id !== walk.id), ...(walk.then ? [walk.then] : [])]);
  }, []);
  const arriving = new Set(walks.filter((w) => w.arrivingAt && floor.tables[w.arrivingAt.table]?.since === w.arrivingAt.since).map((w) => w.arrivingAt!.table));
  const busyWaiters = new Set(walks.map((w) => w.waiter).filter((w): w is number => w !== undefined));
  /** The visit as the player sees it: reading the menu after sitting down, then waiting until the waiter brings the food. */
  const stageOf = (guests: TableGuests, table: number): GuestStage => {
    const key = `${table}:${guests.since}`;
    if (served.current.has(key)) return 'eating';
    const sat = seatedAt.current.get(key) ?? minute;
    if (minute - sat < READING_MINUTES) return 'ordering';
    return 'waiting';
  };
  return { walks, done, arriving, busyWaiters, served: served.current, stageOf };
}

// ---------- Money floating up ----------

export interface Float {
  id: string;
  table: number;
  bill: number;
  heart: boolean;
}

/** The money each table pays, floating up the moment its food arrives, with a heart when they like it. */
export function useFloats(floor: FloorView, served: Set<string>): Float[] {
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

/** True while the tablet is held upright (taller than wide): the day shows the room and the street together. */
export function useUpright(): boolean {
  const query = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(orientation: portrait)') : null;
  const [upright, setUpright] = useState(query?.matches ?? false);
  useEffect(() => {
    if (!query) return;
    const changed = () => setUpright(query.matches);
    changed();
    query.addEventListener('change', changed);
    return () => query.removeEventListener('change', changed);
    // The query object is the same for the page's whole life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return upright;
}

/** The size of the box the view fills. */
export function useBox() {
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
export function poseOf(guests: TableGuests, stage: GuestStage, seat: number): { pose: GuestPose; eating: boolean } {
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
export function bubbleLook(guests: TableGuests, stage: GuestStage): BubbleLook | null {
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


// ---------- A party at a table ----------

/**
 * A table's party: everyone in their seat in the right pose (reading the menu, waiting, eating), their
 * plates, the bubble over the table, the help button for frustrated guests, and a tap area over the
 * bubble and the guests. `z` stacks things for the table's row (see LAYER in frontRoom.ts).
 */
export function partyAtTable({
  table: t,
  guests,
  spot,
  stage,
  sheets,
  plates,
  scale,
  speed,
  z,
  selected,
  onTableTap,
}: {
  table: number;
  guests: TableGuests;
  spot: TableSpot;
  stage: GuestStage;
  sheets: Map<string, string>;
  plates: string | null;
  scale: number;
  speed: number;
  z: (layer: number) => number;
  selected: boolean;
  onTableTap?: (table: number) => void;
}): { people: ReactNode[]; bubbles: ReactNode[] } {
  const at = (n: number) => n * scale;
  const k = spot.scale;
  const people: ReactNode[] = [];
  const bubbles: ReactNode[] = [];
  for (let i = 0; i < Math.min(guests.seated, 4); i++) {
    const seat = spot.seats[i];
    const url = sheets.get(specFor(kindAt(guests, i), variantAt(guests, t, i)).key);
    const { pose, eating } = poseOf(guests, stage, i);
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
          z={z(LAYER.behind)}
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
            zIndex: z(LAYER.plates),
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
  const bubble = bubbleLook(guests, stage);
  const bx = at(spot.x);
  const by = at(spot.top - 150 * k);
  if (bubble)
    bubbles.push(
      <span
        key={`bubble${t}:${bubble.icon}`}
        className={`sk-bubble${bubble.patience !== undefined ? ` sk-ring ${bubble.tone}` : ''}${selected ? ' selected' : ''}`}
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
  if (onTableTap && canTend(guests)) {
    // Getting frustrated: a button beside the bubble to do something about it.
    if (canHelp(guests) && stage === 'waiting')
      bubbles.push(
        <button key={`help${t}`} type="button" className="sk-help" style={{ left: bx + 56, top: by - 24 }} aria-label="Help them: a drink, an apology, or another table" onClick={() => onTableTap(t)}>
          <Icon id="help" size={30} />
        </button>,
      );
    // The bubble and the guests themselves can be tapped too; nearer rows on top.
    bubbles.push(
      <button
        key={`tend${t}`}
        type="button"
        className="sk-tend"
        style={{ left: at(spot.x - 75 * k), top: at(spot.top - 150 * k) - 34, width: at(150 * k), height: at(150 * k) + 34, zIndex: 960 + spot.row }}
        aria-label="Look after this table"
        onClick={() => onTableTap(t)}
      />,
    );
  }
  return { people, bubbles };
}
