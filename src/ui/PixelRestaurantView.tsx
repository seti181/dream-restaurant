// The restaurant view in pixel art: the room as one picture, with furniture and people
// stacked on top, back to front. Guests walk in from the door to their table and back
// out when they leave. Bubbles and coins float above them.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { balance } from '../data/balance';
import { LOCATIONS } from '../data/locations';
import type { Weather } from '../data/weather';
import type { FloorView, TableGuests } from '../sim/day';
import { project } from './pixel/iso';
import { imageUrl, type Pixels } from './pixel/raster';
import {
  depthAt,
  drawRoom,
  guestKind,
  roomLayout,
  scenePieces,
  seatsAt,
  servePath,
  walkPath,
  walkStrip,
  type Point,
  type RoomLayout,
  type RoomLook,
} from './pixel/room';
import type { Carry, PersonKind } from './pixel/sprites';
import { useGame } from './store';

/** World units a guest walks per second at 1× speed. */
const WALK_SPEED = 60;
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

/** Stacking order on screen: pieces and walkers share one scale, so walkers pass between tables. */
const zOf = (depth: number) => Math.round(depth * 2) + 1000;

/** How a table feels, as an emoji bubble, or null for no bubble. */
function bubbleFor(guests: TableGuests): string | null {
  // The Friday regular wants one thing, and the whole room knows it.
  if (guests.regular && guests.stage !== 'eating') return '🍋';
  if (guests.stage === 'ordering') return '💬';
  if (guests.stage === 'waiting') {
    if (guests.impatience > 0.8) return '😤';
    if (guests.impatience > 0.5) return '⏳';
    return null;
  }
  // A reaction when the food arrives, then they just enjoy it.
  if (guests.eatingFor > 15 || guests.satisfaction === null) return null;
  if (guests.satisfaction >= 80) return '😋';
  if (guests.satisfaction >= 60) return '🙂';
  if (guests.satisfaction >= 40) return '😐';
  return '😞';
}

/**
 * The biggest scale that fits. Whole device pixels per art pixel keep the art crisp, but when
 * that would waste a lot of space (big rooms), an in-between scale is better than a tiny room.
 */
function useFittingScale(width: number, height: number) {
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(2);
  useLayoutEffect(() => {
    const element = wrap.current;
    if (!element) return;
    const measure = () => {
      const dpr = window.devicePixelRatio || 1;
      const fit = Math.min(element.clientWidth / width, element.clientHeight / height) * dpr;
      const whole = Math.max(1, Math.floor(fit));
      setScale((whole / fit >= 0.85 ? whole : Math.max(1, fit)) / dpr);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [width, height]);
  return { wrap, scale };
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
}

/** One guest on the move. The browser animates each stretch of the walk; React only steps in between. */
function Walker({
  walk,
  layout,
  scale,
  speed,
  onDone,
}: {
  walk: Walk;
  layout: RoomLayout;
  scale: number;
  speed: number;
  onDone: (walk: Walk) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const speedNow = useRef(speed);
  speedNow.current = speed;
  const [leg, setLeg] = useState(0);
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
      const { sx, sy } = project(layout.origin, p.x, p.y, 0);
      return `translate(${(sx + strip.dx) * scale}px, ${(sy + strip.dy) * scale}px)`;
    };
    const seconds = Math.hypot(to.x - from.x, to.y - from.y) / WALK_SPEED;
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
  }, [leg, scale, layout, walk, from, to, strip, onDone]);

  // Game speed changes (and pauses) apply to a walk already under way.
  useEffect(() => {
    if (animation.current) animation.current.playbackRate = speed;
  }, [speed]);

  if (!to) return null;
  return (
    <div
      ref={ref}
      className="pixel-walker"
      data-walker={walk.waiter !== undefined ? 'waiter' : 'guest'}
      style={{
        width: (strip.pixels.width / 2) * scale,
        height: strip.pixels.height * scale,
        backgroundImage: `url(${urlOf(strip.pixels)})`,
        backgroundSize: `${strip.pixels.width * scale}px ${strip.pixels.height * scale}px`,
        ['--walk-shift' as string]: `${-strip.pixels.width * scale}px`,
        animationDuration: `${0.5 / Math.max(speed, 0.01)}s`,
        animationPlayState: speed === 0 ? 'paused' : 'running',
      }}
    >
      {walk.angry && <span className="pixel-bubble walker-bubble">😠</span>}
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
          kind: guestKind(guests),
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
      const id = `serve:${table}:${guests.since}`;
      started.push({
        id,
        kind,
        variant: 0,
        path,
        delay: 0,
        angry: false,
        waiter,
        carry: 'full',
        then: { id: `${id}:back`, kind, variant: 0, path: [...path].reverse(), delay: SERVING_PAUSE, angry: false, waiter, carry: 'empty' },
      });
    };

    for (const [table, guests] of now) {
      const was = before.get(table);
      if (!was || was.since !== guests.since) walkersFor(table, guests, false);
      else if (was.stage !== 'eating' && guests.stage === 'eating') serve(table, guests);
    }
    for (const [table, guests] of before) {
      const still = now.get(table);
      if (!still || still.since !== guests.since) walkersFor(table, guests, true);
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

export function PixelRestaurantView({
  floor,
  weather,
  minute,
}: {
  floor: FloorView;
  weather: Weather;
  minute: number;
}) {
  const speed = useGame((s) => s.speed);
  const maxTables = Math.floor(LOCATIONS[floor.location].maxSeats / balance.service.seatsPerTable);
  const terraceTables = floor.tables.length - floor.insideTables;
  const layout = useMemo(() => roomLayout(maxTables, terraceTables), [maxTables, terraceTables]);

  const dusk = minute >= 19 * 60 + 30;
  const { decor, equipment, insideTables } = floor;
  const roomKey = [decor.join(), equipment.join(), weather, dusk, insideTables].join('|');
  // The room only needs redrawing when what it shows changes.
  const look: RoomLook = useMemo(
    () => ({ decor, equipment, weather, dusk, insideTables }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roomKey],
  );
  const background = useMemo(() => imageUrl(drawRoom(layout, look)), [layout, look]);
  useEffect(() => () => URL.revokeObjectURL(background), [background]);

  const { walks, done, arriving, busyWaiters } = useWalkers(layout, floor);
  const pieces = scenePieces(layout, floor, look, arriving, busyWaiters);
  const { wrap, scale } = useFittingScale(layout.width, layout.height);
  const at = (n: number) => n * scale;

  return (
    <div ref={wrap} className="pixel-wrap">
      <div className="pixel-scene" style={{ width: at(layout.width), height: at(layout.height) }} role="img" aria-label="Your restaurant">
        <img src={background} className="pixel" alt="" style={{ left: 0, top: 0, width: at(layout.width), zIndex: 0 }} />
        {pieces.map((p) => (
          <img
            key={p.key}
            src={urlOf(p.image.pixels)}
            className={p.kind === 'steam' ? 'pixel steam' : 'pixel'}
            alt=""
            style={{ left: at(p.px), top: at(p.py), width: at(p.image.pixels.width), zIndex: zOf(p.depth) }}
          />
        ))}
        {walks.map((walk) => (
          <Walker key={walk.id} walk={walk} layout={layout} scale={scale} speed={speed} onDone={done} />
        ))}
        {/* Bubbles and coins above the seated guests, on top of everything. */}
        {pieces.map((p) => {
          if (p.kind !== 'guest' || !p.guests) return null;
          const x = at(p.px + p.image.pixels.width / 2);
          const y = at(p.py + 4);
          const bubble = bubbleFor(p.guests);
          return (
            <span key={`${p.key}:extras`}>
              {bubble && (
                <span key={bubble} className="pixel-bubble" style={{ left: x, top: y }}>
                  {bubble}
                </span>
              )}
              {p.guests.critic && (
                <span className="pixel-badge" style={{ left: x + at(7), top: y + at(4) }}>
                  🖋️
                </span>
              )}
              {p.guests.stage === 'eating' && p.guests.eatingFor <= 10 && (
                <span className="pixel-coin" style={{ left: x, top: y }}>
                  🪙
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
