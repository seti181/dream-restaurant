// The restaurant view in pixel art: the room as one picture, with furniture and people
// stacked on top, back to front. Guests walk in from the door to their table and back
// out when they leave. Bubbles sit above them, and money floats up when they pay.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { balance } from '../data/balance';
import { LOCATIONS } from '../data/locations';
import type { GroupId } from '../data/groups';
import type { Visitor } from '../data/moments';
import { REGULARS } from '../data/regulars';
import type { Weather } from '../data/weather';
import type { FloorView, TableGuests } from '../sim/day';
import { money } from './format';
import { project } from './pixel/iso';
import { imageUrl, type Pixels } from './pixel/raster';
import {
  depthAt,
  drawRoom,
  guestKind,
  gullImage,
  leaveQueuePath,
  movePath,
  tableMiddle,
  passerByPath,
  toSteps,
  roomLayout,
  scenePieces,
  seatsAt,
  servePath,
  walkPath,
  walkStrip,
  WALK_FRAMES,
  type Point,
  type RoomLayout,
  type RoomLook,
  type ScenePiece,
} from './pixel/room';
import type { Carry, PersonKind } from './pixel/sprites';
import { TOP_RANK } from '../sim/ranks';
import { useGame } from './store';
import { drawCloud, drawRainTile, drawSky, drawStreet } from './pixel/street';
import { useFittingScale } from './useFittingScale';

/** World units a waiter walks per second at 1× speed... */
const WAITER_WALK_SPEED = 90;
/** ...and guests and people walking past, who take their time (90 slowed by 20%, then twice by 10% more). */
const GUEST_WALK_SPEED = 58.5;
/** Seconds for a waiter's two steps; slower walkers take slower steps. */
const WAITER_STEP_SECONDS = 0.5;
/** Seconds between people of the same party setting off. */
const STAGGER = 0.25;
/** Seconds a waiter stands at the table putting the plates down. */
const SERVING_PAUSE = 0.4;

/** Sprite pictures never change once drawn, so each gets one URL for the whole session. */
const spriteUrls = new WeakMap<Pixels, string>();
function urlOf(pixels: Pixels): string {
  let url = spriteUrls.get(pixels);
  if (!url) {
    url = imageUrl(pixels);
    spriteUrls.set(pixels, url);
  }
  return url;
}

/** From this time the street lamps and windows are lit, and the sky turns to evening. */
const DUSK_MINUTE = 19 * 60 + 30;

/** Stacking order on screen: pieces and walkers share one scale, so walkers pass between tables. */
const zOf = (depth: number) => Math.round(depth * 2) + 1000;

const VISITOR_BUBBLES: Record<Visitor, string> = { merry: '🥃', footballer: '⚽', walesa: '✌️', filmCrew: '🎬' };

/** Guests at least this happy with their food (0–100) show 🙂 or 😋, and send up a heart. */
const HAPPY = 60;

/** How a table feels, as an emoji bubble, or null for no bubble. */
function bubbleFor(guests: TableGuests): string | null {
  // The Friday regular wants one thing, and the whole room knows it.
  if (guests.regular && guests.stage !== 'eating') return '🍋';
  // The named regulars show who they are until their food comes.
  if (guests.regularId && guests.stage !== 'eating') return REGULARS[guests.regularId].emoji;
  // Special guests show why they're here, all the way through.
  if (guests.visitor) return VISITOR_BUBBLES[guests.visitor];
  if (guests.stage === 'ordering') return '💬';
  if (guests.stage === 'waiting') {
    if (guests.impatience > 0.8) return '😤';
    if (guests.impatience > 0.5) return '⏳';
    return null;
  }
  // A reaction when the food arrives, then they just enjoy it.
  if (guests.eatingFor > 15 || guests.satisfaction === null) return null;
  if (guests.satisfaction >= 80) return '😋';
  if (guests.satisfaction >= HAPPY) return '🙂';
  if (guests.satisfaction >= 40) return '😐';
  return '😞';
}

// ---------- Walking guests ----------

interface Walk {
  id: string;
  kind: PersonKind;
  variant: number;
  path: Point[];
  /** Seconds to wait before setting off (people in a party follow each other). */
  delay: number;
  angry: boolean;
  /** For guests walking in: the table they're heading for, and which visit that is. */
  arrivingAt?: { table: number; since: number };
  /** For waiters: which one (by number), what they carry, and the walk back afterwards. */
  waiter?: number;
  carry?: Carry;
  then?: Walk;
  /** Someone walking past who took a flyer and is heading for the door. */
  flyer?: boolean;
  /** Said over their head as they walk. */
  bubble?: string;
}

/** One guest on the move. The browser animates each stretch of the walk; React only steps in between. */
function Walker({
  walk,
  layout,
  scale,
  speed,
  onDone,
  onTap,
}: {
  walk: Walk;
  layout: RoomLayout;
  scale: number;
  speed: number;
  onDone: (walk: Walk) => void;
  /** For someone walking past: tapping them hands them a flyer (true: they come in; false: they don't; null: none left). */
  onTap?: (walk: Walk, at: Point) => boolean | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const speedNow = useRef(speed);
  speedNow.current = speed;
  const [leg, setLeg] = useState(0);
  // What they say when handed a flyer; once handed one, they can't be handed another.
  const [said, setSaid] = useState<string | null>(walk.bubble ?? null);
  const pace = walk.waiter !== undefined ? WAITER_WALK_SPEED : GUEST_WALK_SPEED;
  const from = walk.path[leg];
  const to = walk.path[leg + 1];
  // Walking towards us shows the face; walking away shows the back.
  const facing = to && to.x + to.y >= from.x + from.y ? 'front' : 'back';
  const strip = walkStrip(walk.kind, facing, walk.variant, walk.carry);

  useEffect(() => {
    if (!to) {
      onDone(walk);
      return;
    }
    const corner = (p: Point) => {
      const { sx, sy } = project(layout.origin, p.x, p.y, p.z ?? 0);
      return `translate(${(sx + strip.dx) * scale}px, ${(sy + strip.dy) * scale}px)`;
    };
    const seconds = Math.hypot(to.x - from.x, to.y - from.y) / pace;
    const anim = ref.current!.animate(
      [
        { transform: corner(from), zIndex: zOf(depthAt(from)) },
        { transform: corner(to), zIndex: zOf(depthAt(to)) },
      ],
      { duration: Math.max(1, seconds * 1000), delay: leg === 0 ? walk.delay * 1000 : 0, fill: 'both', easing: 'linear' },
    );
    anim.playbackRate = speedNow.current;
    anim.onfinish = () => setLeg((l) => l + 1);
    animation.current = anim;
    return () => anim.cancel();
  }, [leg, scale, layout, walk, from, to, strip, onDone, pace]);

  // Game speed changes (and pauses) apply to a walk already under way.
  useEffect(() => {
    if (animation.current) animation.current.playbackRate = speed;
  }, [speed]);

  if (!to) return null;
  const tappable = onTap !== undefined && said === null;
  /** Where they are right now, part of the way along this stretch of the walk. */
  const here = (): Point => {
    const progress = animation.current?.effect?.getComputedTiming().progress;
    const p = typeof progress === 'number' ? progress : 0;
    return { x: from.x + (to.x - from.x) * p, y: from.y + (to.y - from.y) * p, z: (from.z ?? 0) + ((to.z ?? 0) - (from.z ?? 0)) * p };
  };
  return (
    <div
      ref={ref}
      className={tappable ? 'pixel-walker tappable' : 'pixel-walker'}
      role={tappable ? 'button' : undefined}
      aria-label={tappable ? 'Hand them a flyer' : undefined}
      onClick={
        tappable
          ? () => {
              const comes = onTap(walk, here());
              if (comes === false) setSaid('👋');
            }
          : undefined
      }
      data-walker={walk.waiter !== undefined ? 'waiter' : walk.id.startsWith('passer') ? 'passer' : 'guest'}
      style={{
        width: (strip.pixels.width / WALK_FRAMES) * scale,
        height: strip.pixels.height * scale,
        backgroundImage: `url(${urlOf(strip.pixels)})`,
        backgroundSize: `${strip.pixels.width * scale}px ${strip.pixels.height * scale}px`,
        ['--walk-shift' as string]: `${-strip.pixels.width * scale}px`,
        animationDuration: `${(WAITER_STEP_SECONDS * WAITER_WALK_SPEED) / pace / Math.max(speed, 0.01)}s`,
        animationPlayState: speed === 0 ? 'paused' : 'running',
      }}
    >
      {walk.angry && <span className="pixel-bubble walker-bubble">😠</span>}
      {said && <span className="pixel-bubble walker-bubble">{said}</span>}
    </div>
  );
}

/**
 * Watches the tables from one moment to the next: a new party at a table walks in,
 * and a party that's gone walks out (cross, if they never got their food).
 */
function useWalkers(layout: RoomLayout, floor: FloorView) {
  const known = useRef(new Map<number, TableGuests>());
  const [walks, setWalks] = useState<Walk[]>([]);
  // The walks as they are right now, for picking a free waiter.
  const current = useRef(walks);
  current.current = walks;

  useEffect(() => {
    const before = known.current;
    const now = new Map<number, TableGuests>();
    floor.tables.forEach((guests, table) => guests && now.set(table, guests));
    const started: Walk[] = [];

    const walkersFor = (table: number, guests: TableGuests, leaving: boolean) => {
      const seats = seatsAt(layout, floor.insideTables, table);
      for (let i = 0; i < guests.seated && i < seats.length; i++) {
        const path = walkPath(layout, floor.insideTables, table, seats[i]);
        if (path.length < 2) continue;
        started.push({
          id: `${table}:${guests.since}:${i}:${leaving ? 'out' : 'in'}`,
          kind: guestKind(guests, i),
          variant: table * 4 + i,
          path: leaving ? [...path].reverse() : path,
          delay: i * STAGGER,
          angry: leaving && guests.stage !== 'eating',
          arrivingAt: leaving ? undefined : { table, since: guests.since },
        });
      }
    };

    // The food is ready: a free waiter carries it from the kitchen, then walks back.
    const busy = new Set(current.current.map((w) => w.waiter).filter((w) => w !== undefined));
    const serve = (table: number, guests: TableGuests) => {
      const waiter = floor.waiters.findIndex((_, i) => !busy.has(i));
      if (waiter < 0) return;
      busy.add(waiter);
      const path = servePath(layout, floor.insideTables, table, waiter);
      if (path.length < 2) return;
      const kind = floor.waiters[waiter] ?? 'waiter';
      const variant = floor.waiterLooks[waiter] ?? waiter;
      const id = `serve:${table}:${guests.since}`;
      started.push({
        id,
        kind,
        variant,
        path,
        delay: 0,
        angry: false,
        waiter,
        carry: 'full',
        then: { id: `${id}:back`, kind, variant, path: [...path].reverse(), delay: SERVING_PAUSE, angry: false, waiter, carry: 'empty' },
      });
    };

    // A party the player showed to another table: gone from one, the same party at another.
    const movedFrom = new Map<number, number>();
    for (const [table, guests] of now) {
      if (before.get(table)?.since === guests.since) continue;
      for (const [old, was] of before) {
        const left = now.get(old)?.since !== was.since;
        if (old !== table && left && was.since === guests.since && was.group === guests.group) movedFrom.set(table, old);
      }
    }
    const moving = (from: number, to: number, guests: TableGuests) => {
      const fromSeats = seatsAt(layout, floor.insideTables, from);
      const toSeats = seatsAt(layout, floor.insideTables, to);
      for (let i = 0; i < guests.seated && i < toSeats.length && i < fromSeats.length; i++) {
        const path = movePath(layout, floor.insideTables, from, fromSeats[i], to, toSeats[i]);
        if (path.length < 2) continue;
        started.push({
          id: `${to}:${guests.since}:${i}:moved`,
          kind: guestKind(guests, i),
          variant: from * 4 + i,
          path,
          delay: i * STAGGER,
          angry: false,
          arrivingAt: { table: to, since: guests.since },
        });
      }
    };

    for (const [table, guests] of now) {
      const was = before.get(table);
      const from = movedFrom.get(table);
      if (from !== undefined) moving(from, table, guests);
      else if (!was || was.since !== guests.since) walkersFor(table, guests, false);
      else if (was.stage !== 'eating' && guests.stage === 'eating') serve(table, guests);
    }
    const movedAway = new Set(movedFrom.values());
    for (const [table, guests] of before) {
      const still = now.get(table);
      if ((!still || still.since !== guests.since) && !movedAway.has(table)) walkersFor(table, guests, true);
    }
    known.current = now;
    if (started.length > 0) setWalks((current) => [...current, ...started]);
  }, [floor, layout]);

  // A finished walk goes; a waiter's walk to a table is followed by the walk back.
  const [done] = useState(
    () => (walk: Walk) => setWalks((list) => [...list.filter((w) => w.id !== walk.id), ...(walk.then ? [walk.then] : [])]),
  );

  // Tables whose current party still has someone walking in: they aren't seated yet.
  const arriving = new Set(
    walks
      .filter((w) => w.arrivingAt && floor.tables[w.arrivingAt.table]?.since === w.arrivingAt.since)
      .map((w) => w.arrivingAt!.table),
  );
  const busyWaiters = new Set(walks.map((w) => w.waiter).filter((w): w is number => w !== undefined));
  return { walks, done, arriving, busyWaiters };
}

// ---------- The view ----------

/** True when a table's guests are waiting long enough to show ⏳ or 😤, and can still be helped. */
export function canHelp(guests: TableGuests | null): boolean {
  return guests !== null && guests.stage === 'waiting' && guests.impatience > 0.5 && !(guests.drink && guests.apology);
}

/** True for guests the player can still do something for: seated, food not here yet. */
export function canTend(guests: TableGuests | null): boolean {
  return guests !== null && guests.stage !== 'eating' && guests.visitor === null;
}

/** How wide a piece of the scene is on screen: one pose, for a picture holding several. */
const pieceWidth = (p: ScenePiece) => p.image.pixels.width / (p.frames?.count ?? 1);

/** Little animations for some pieces of the scene: steam and flames at the pots, pigeons, the busker, boats. */
const PIECE_CLASSES: Record<string, string> = {
  steam: 'pixel steam',
  flame: 'pixel flicker',
  pigeon: 'pixel pecking',
  busker: 'pixel busking',
  boat: 'pixel bobbing',
};

export function PixelRestaurantView({
  floor,
  weather,
  minute,
  onTableTap,
  selectedTable = null,
  onGullTap,
  freeTables = [],
  onFreeTableTap,
  onPasserTap,
  onFlyerArrives,
}: {
  floor: FloorView;
  weather: Weather;
  minute: number;
  /** Tapping a waiting table's bubble (only while the day runs). */
  onTableTap?: (table: number) => void;
  selectedTable?: number | null;
  /** Tapping the gull on the terrace. */
  onGullTap?: () => void;
  /** Choosing a new table for the selected guests: the free tables to offer, and which are their favourites. */
  freeTables?: { table: number; favourite: boolean }[];
  onFreeTableTap?: (table: number) => void;
  /** Handing a flyer to someone walking past (only while the day runs and there are flyers left). */
  onPasserTap?: (group: GroupId) => boolean | null;
  /** Someone who took a flyer has reached the foot of the steps. */
  onFlyerArrives?: (group: GroupId) => void;
}) {
  const speed = useGame((s) => s.speed);
  const maxTables = Math.floor(LOCATIONS[floor.location].maxSeats / balance.service.seatsPerTable);
  const terraceTables = Math.max(floor.terraceTables, floor.tables.length - floor.insideTables);
  const layout = useMemo(() => roomLayout(maxTables, terraceTables), [maxTables, terraceTables]);

  const dusk = minute >= DUSK_MINUTE;
  const { decor, equipment, insideTables } = floor;
  const plaque = useGame((s) => s.game.rank >= TOP_RANK);
  const roomKey = [decor.join(), equipment.join(), weather, dusk, insideTables, plaque].join('|');
  // The room only needs redrawing when what it shows changes.
  const look: RoomLook = useMemo(
    () => ({ decor, equipment, weather, dusk, insideTables, plaque }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roomKey],
  );
  const background = useMemo(() => imageUrl(drawRoom(layout, look)), [layout, look]);
  // How far out of sight people passing by start and finish, in art pixels.
  const passers = usePassersBy(layout, minute, layout.width + 120, onPasserTap, onFlyerArrives);
  const leavers = useQueueLeavers(layout, floor);
  const floats = useFloats(floor);
  useEffect(() => () => URL.revokeObjectURL(background), [background]);

  const { walks, done, arriving, busyWaiters } = useWalkers(layout, floor);
  const pieces = scenePieces(layout, floor, look, arriving, busyWaiters);
  const { wrap, scale, box } = useFittingScale(layout.width, layout.height);
  const at = (n: number) => n * scale;

  // The street fills the whole frame around the room, so it's drawn as big as the frame.
  const marginX = Math.max(0, Math.ceil((box.width / scale - layout.width) / 2) + 1);
  const marginY = Math.max(0, Math.ceil((box.height / scale - layout.height) / 2) + 1);
  const streetWidth = layout.width + 2 * marginX;
  const streetHeight = layout.height + 2 * marginY;
  const street = useMemo(
    () => imageUrl(drawStreet(layout, look, streetWidth, streetHeight, marginX, marginY, floor.location)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layout, look.weather, look.dusk, streetWidth, streetHeight, floor.location],
  );
  useEffect(() => () => URL.revokeObjectURL(street), [street]);
  const sky = useMemo(
    () => imageUrl(drawSky(look, streetWidth, streetHeight)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [look.weather, look.dusk, streetWidth, streetHeight],
  );
  useEffect(() => () => URL.revokeObjectURL(sky), [sky]);

  return (
    <div ref={wrap} className="pixel-wrap">
      <div className="pixel-scene" style={{ width: at(layout.width), height: at(layout.height) }} role="img" aria-label="Your restaurant">
        <img src={sky} className="pixel" alt="" style={{ left: -at(marginX), top: -at(marginY), width: at(streetWidth), zIndex: 0 }} />
        <Clouds look={look} left={-at(marginX)} top={-at(marginY)} width={at(streetWidth)} height={at(streetHeight)} scale={scale} />
        <img
          src={street}
          className="pixel"
          alt=""
          style={{ left: -at(marginX), top: -at(marginY), width: at(streetWidth), zIndex: 0 }}
        />
        <img src={background} className="pixel" alt="" style={{ left: 0, top: 0, width: at(layout.width), zIndex: 0 }} />
        {pieces.map((p) =>
          p.frames ? (
            // Several poses side by side: the box shows one at a time, and the picture slides along inside it.
            <div
              key={p.key}
              className="pixel-frames"
              style={{
                left: at(p.px),
                top: at(p.py),
                width: at(p.image.pixels.width / p.frames.count),
                height: at(p.image.pixels.height),
                zIndex: zOf(p.depth),
              }}
            >
              <img
                src={urlOf(p.image.pixels)}
                className={`pixel ${p.frames.rhythm}`}
                alt=""
                style={{
                  width: at(p.image.pixels.width),
                  ['--frame' as string]: `${-at(p.image.pixels.width / p.frames.count)}px`,
                  animationDuration: `${p.frames.seconds}s`,
                  animationDelay: `${-p.frames.offset}s`,
                }}
              />
            </div>
          ) : (
            <img
              key={p.key}
              src={urlOf(p.image.pixels)}
              className={PIECE_CLASSES[p.kind ?? ''] ?? 'pixel'}
              alt=""
              style={{ left: at(p.px), top: at(p.py), width: at(p.image.pixels.width), zIndex: zOf(p.depth) }}
            />
          ),
        )}
        {walks.map((walk) => (
          <Walker key={walk.id} walk={walk} layout={layout} scale={scale} speed={speed} onDone={done} />
        ))}
        {/* Every table whose guests are still waiting for food can be tapped, even while they walk in. */}
        {onTableTap &&
          floor.tables.map((guests, table) => {
            if (!canTend(guests)) return null;
            const middle = tableMiddle(layout, floor.insideTables, table);
            if (!middle) return null;
            const { sx, sy } = project(layout.origin, middle.x, middle.y, 18);
            return (
              <button
                key={`tend${table}`}
                type="button"
                className={`table-help${table === selectedTable ? ' selected' : ''}`}
                style={{ left: sx * scale, top: sy * scale }}
                aria-label="Look after this table"
                onClick={() => onTableTap(table)}
              />
            );
          })}
        {floor.gull && <Gull layout={layout} floor={floor} scale={scale} onTap={onGullTap} />}
        {onFreeTableTap &&
          freeTables.map(({ table, favourite }) => {
            const middle = tableMiddle(layout, floor.insideTables, table);
            if (!middle) return null;
            const { sx, sy } = project(layout.origin, middle.x, middle.y, 15);
            return (
              <button
                key={`free${table}`}
                type="button"
                className={`free-table${favourite ? ' favourite' : ''}`}
                style={{ left: sx * scale, top: sy * scale }}
                aria-label={favourite ? 'Their favourite spot: seat them here' : 'Seat them here'}
                onClick={() => onFreeTableTap(table)}
              >
                {favourite ? '⭐' : '🪑'}
              </button>
            );
          })}
        {passers.walks.map((walk) => (
          <Walker
            key={walk.id}
            walk={walk}
            layout={layout}
            scale={scale}
            speed={speed}
            onDone={passers.done}
            onTap={onPasserTap && !walk.flyer ? passers.tap : undefined}
          />
        ))}
        {leavers.walks.map((walk) => (
          <Walker key={walk.id} walk={walk} layout={layout} scale={scale} speed={speed} onDone={leavers.done} />
        ))}
        {pieces
          .filter((p) => p.kind === 'queue')
          .map((p) => (
            <span
              key={`${p.key}:waiting`}
              className="pixel-bubble"
              style={{ left: at(p.px + pieceWidth(p) / 2), top: at(p.py + 4) }}
            >
              ⏳
            </span>
          ))}
        {/* Bubbles above the seated guests, on top of everything. */}
        {pieces.map((p) => {
          if (p.kind !== 'guest' || !p.guests) return null;
          const x = at(p.px + pieceWidth(p) / 2);
          const y = at(p.py + 4);
          const bubble = bubbleFor(p.guests);
          const urgent = onTableTap !== undefined && p.table !== undefined && canHelp(p.guests);
          return (
            <span key={`${p.key}:extras`}>
              {bubble && (
                <span
                  key={bubble}
                  className={`pixel-bubble${urgent ? ' tappable' : ''}${p.table === selectedTable ? ' selected' : ''}`}
                  style={{ left: x, top: y }}
                >
                  {bubble}
                </span>
              )}
              {p.guests.critic && (
                <span className="pixel-badge" style={{ left: x + at(7), top: y + at(4) }}>
                  🖋️
                </span>
              )}
            </span>
          );
        })}
        {/* Money floating up from the tables that have just paid, above their bubbles. */}
        {floats.map((f) => {
          const middle = tableMiddle(layout, floor.insideTables, f.table);
          if (!middle) return null;
          const { sx, sy } = project(layout.origin, middle.x, middle.y, FLOAT_HEIGHT);
          return (
            <span key={f.id} className="pixel-float" style={{ left: sx * scale, top: sy * scale }}>
              +{money(f.bill)}
              {f.heart && <span className="pixel-heart">♥</span>}
            </span>
          );
        })}
      </div>
      {look.weather === 'rain' && <Rain scale={scale} />}
    </div>
  );
}

// ---------- Money floating up ----------

/** Real seconds that the money floats up from a table, the same at any speed. */
const FLOAT_SECONDS = 1.8;
/** Where it starts, in world units above the table: just over the guests' bubbles. */
const FLOAT_HEIGHT = 48;

interface Float {
  id: string;
  table: number;
  bill: number;
  heart: boolean;
}

/**
 * The money each table pays, floating up from it the moment its food arrives (that's when the
 * party pays), with a heart when they like it.
 */
function useFloats(floor: FloorView): Float[] {
  const [floats, setFloats] = useState<Float[]>([]);
  const seen = useRef(new Set<string>());
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);
  useEffect(() => {
    const fresh: Float[] = [];
    floor.tables.forEach((guests, table) => {
      if (!guests || guests.bill === 0) return;
      const id = `${table}:${guests.since}`;
      if (seen.current.has(id)) return;
      seen.current.add(id);
      // Only food that arrived in the last few minutes: not tables that paid before the view opened.
      if (guests.eatingFor >= balance.clock.tickMinutes) return;
      fresh.push({ id, table, bill: guests.bill, heart: (guests.satisfaction ?? 0) >= HAPPY });
    });
    if (fresh.length === 0) return;
    setFloats((now) => [...now, ...fresh]);
    timers.current.push(window.setTimeout(() => setFloats((now) => now.filter((f) => !fresh.includes(f))), FLOAT_SECONDS * 1000));
  }, [floor]);
  return floats;
}

// ---------- A gull on the terrace ----------

/** A gull swooping down onto a terrace table's plate, with a big target to tap it away. */
function Gull({ layout, floor, scale, onTap }: { layout: RoomLayout; floor: FloorView; scale: number; onTap?: () => void }) {
  const spot = floor.gull ? tableMiddle(layout, floor.insideTables, floor.gull.table) : null;
  if (!spot) return null;
  const image = gullImage();
  const { sx, sy } = project(layout.origin, spot.x, spot.y, 16);
  // Drawn twice as big as everything else: a bold gull, close up, and easy to spot.
  const size = scale * 2;
  const left = sx * scale + image.dx * size;
  const top = sy * scale + image.dy * size;
  return (
    <>
      <img
        src={urlOf(image.pixels)}
        className="pixel gull"
        alt=""
        style={{ left, top, width: image.pixels.width * size, zIndex: 5002 }}
      />
      {onTap && (
        <button
          type="button"
          className="gull-tap"
          style={{ left: left + (image.pixels.width * size) / 2, top: top + (image.pixels.height * size) / 2 }}
          aria-label="Shoo the gull away"
          onClick={onTap}
        />
      )}
    </>
  );
}

// ---------- People giving up on the queue ----------

/** Parties that gave up waiting for a table walk off down the street, cross. */
function useQueueLeavers(layout: RoomLayout, floor: FloorView) {
  const [walks, setWalks] = useState<Walk[]>([]);
  const seen = useRef(new Set<string>());
  useEffect(() => {
    const started: Walk[] = [];
    floor.leftTheDoor.forEach((party, p) => {
      const key = `${party.minute}:${p}:${party.group}:${party.size}`;
      if (seen.current.has(key)) return;
      seen.current.add(key);
      for (let i = 0; i < Math.min(party.size, 4); i++) {
        started.push({
          id: `left:${key}:${i}`,
          kind: party.group,
          variant: p * 4 + i,
          path: leaveQueuePath(layout, i),
          delay: i * STAGGER,
          angry: true,
        });
      }
    });
    if (started.length > 0) setWalks((now) => [...now, ...started]);
  }, [floor.leftTheDoor, layout]);
  const done = useCallback((walk: Walk) => setWalks((now) => now.filter((w) => w.id !== walk.id)), []);
  return { walks, done };
}

// ---------- People passing by ----------

/** Who is out and about at each time of day: tourists at lunch, office workers at noon, students in the evening. */
const STROLLERS: { until: number; groups: GroupId[] }[] = [
  { until: 12 * 60, groups: ['locals', 'tourists', 'office', 'locals'] },
  { until: 15 * 60, groups: ['office', 'office', 'tourists', 'tourists', 'locals', 'students'] },
  { until: 18 * 60, groups: ['tourists', 'tourists', 'locals', 'students', 'foodies'] },
  { until: 24 * 60, groups: ['students', 'students', 'foodies', 'tourists', 'locals'] },
];

/** At most this many people passing by at once, so the street feels alive but never crowded. */
const MOST_PASSERS = 3;

/**
 * People strolling past along the street, in their group colours: one may set off every few in-game
 * minutes while the day runs. Handed a flyer, someone may turn and head for the door instead.
 */
function usePassersBy(
  layout: RoomLayout,
  minute: number,
  reach: number,
  onTap?: (group: GroupId) => boolean | null,
  onArrive?: (group: GroupId) => void,
) {
  const [walks, setWalks] = useState<Walk[]>([]);
  const count = useRef(0);
  useEffect(() => {
    setWalks((now) => {
      if (now.length >= MOST_PASSERS) return now;
      const n = count.current++;
      // A little hash instead of Math.random, so it never touches the game's dice.
      const roll = (n * 2654435761 + minute * 40503) >>> 0;
      // With five-minute steps coming every second or so at 1×, one in four brings someone along.
      // (The hash's top bits: they're well mixed, while its last bits repeat from one step to the next.)
      if (((roll >>> 24) & 3) !== 0) return now;
      const groups = (STROLLERS.find((s) => minute < s.until) ?? STROLLERS[STROLLERS.length - 1]).groups;
      const kind = groups[(roll >>> 4) % groups.length];
      return [
        ...now,
        {
          id: `passer:${n}`,
          kind,
          variant: (roll >>> 8) % 12,
          path: passerByPath(layout, (roll >>> 12) % 3, ((roll >>> 14) & 1) === 0, reach),
          delay: 0,
          angry: false,
        },
      ];
    });
  }, [minute, layout, reach]);
  // The latest callbacks, so tap and done can stay the same functions from one moment to the next.
  const callbacks = useRef({ onTap, onArrive });
  callbacks.current = { onTap, onArrive };
  const tap = useCallback(
    (walk: Walk, at: Point) => {
      const comes = callbacks.current.onTap?.(walk.kind as GroupId) ?? null;
      // Coming in: they turn, smiling, and walk to the foot of the steps.
      if (comes) {
        const toDoor: Walk = { ...walk, id: `${walk.id}:flyer`, path: toSteps(layout, at), delay: 0, flyer: true, bubble: '😊' };
        setWalks((now) => now.map((w) => (w.id === walk.id ? toDoor : w)));
      }
      return comes;
    },
    [layout],
  );
  const done = useCallback((walk: Walk) => {
    if (walk.flyer) callbacks.current.onArrive?.(walk.kind as GroupId);
    setWalks((now) => now.filter((w) => w.id !== walk.id));
  }, []);
  return { walks, done, tap };
}

// ---------- Weather in the sky ----------

/** How many clouds each kind of weather brings, and how big they are (art pixels wide). */
const CLOUDS: Record<Weather, { count: number; width: [number, number] }> = {
  heatwave: { count: 1, width: [18, 22] },
  sunny: { count: 3, width: [22, 34] },
  cloudy: { count: 7, width: [34, 56] },
  rain: { count: 8, width: [40, 64] },
};

/** Clouds drifting slowly across the sky, behind the houses. Moved by CSS, so they cost almost nothing. */
function Clouds({ look, left, top, width, height, scale }: { look: RoomLook; left: number; top: number; width: number; height: number; scale: number }) {
  const { count, width: [narrow, wide] } = CLOUDS[look.weather];
  const clouds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const w = Math.round(narrow + ((wide - narrow) * ((i * 37) % 11)) / 10);
        return { w, url: imageUrl(drawCloud(look, w, i)), y: ((i * 29) % 7) / 7, seconds: 70 + ((i * 53) % 60), start: (i * 0.37) % 1 };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [look.weather, look.dusk, count, narrow, wide],
  );
  useEffect(() => () => clouds.forEach((c) => URL.revokeObjectURL(c.url)), [clouds]);
  return (
    <div className="sky-clouds" style={{ left, top, width, height, zIndex: 0 }} aria-hidden="true">
      {clouds.map((cloud, i) => (
        <img
          key={i}
          src={cloud.url}
          className="pixel cloud"
          alt=""
          style={{
            top: cloud.y * height * 0.28,
            width: cloud.w * scale,
            animationDuration: `${cloud.seconds}s`,
            animationDelay: `${-cloud.start * cloud.seconds}s`,
            ['--sky-width' as string]: `${width}px`,
            ['--cloud-width' as string]: `${cloud.w * scale}px`,
          }}
        />
      ))}
    </div>
  );
}

let rainUrl: string | null = null;

/** Rain falling over the whole street: one light layer of streaks, moved down in a loop. */
function Rain({ scale }: { scale: number }) {
  const url = (rainUrl ??= imageUrl(drawRainTile()));
  const tile = 24 * scale;
  return (
    <div
      className="rain-layer"
      aria-hidden="true"
      style={{
        backgroundImage: `url(${url})`,
        backgroundSize: `${tile}px ${tile}px`,
        top: -tile,
        ['--rain-tile' as string]: `${tile}px`,
      }}
    />
  );
}
