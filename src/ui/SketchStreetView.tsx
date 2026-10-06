// The street outside the restaurant in the sketchbook look (project.md section 9.5, "The street
// outside"): the restaurant's townhouse among its neighbours, and the pavement in front, alive. The
// terrace's guests sit, read the menu, wait and are served by a waiter who comes out of the door;
// people going to eat inside walk in at the door, and out again; people stroll past (tap one to hand
// them a flyer); parties wait by the door for a table; a gull drops in on the terrace's plates; on
// live-music nights an accordion player plays by the door. The inside is the other view (SketchRoomView).

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { GroupId } from '../data/groups';
import type { Weather } from '../data/weather';
import type { FloorView, TableGuests } from '../sim/day';
import { recipeKey } from '../sim/menu';
import { dishName, money } from './format';
import { Icon } from './Icon';
import { GROUP_LOOKS } from './sketch/cast';
import { LAYER, zOf, type Point } from './sketch/frontRoom';
import { Painter, svgPicture } from './sketch/painter';
import { mewa } from './sketch/people';
import { chairsPicture, pageFramePicture, PLATE_CELL, PLATES, platesPicture, TABLE_BOX, tablePicture } from './sketch/roomArt';
import { MUSICIAN_SHEET, musicianSheet, STAND_CELL, GUEST_SHEET, WALK_BACK_CELL, WALK_CELL } from './sketch/sheets';
import { doorWalk, FRONT_Z, BACK_Z, passerWalk, streetDepth, streetLayout, streetQueueSpot, terraceMove, terraceServe, terraceWalkIn, toTheDoor, type StreetLayout } from './sketch/street';
import { streetPicture, type StreetLook } from './sketch/streetArt';
import {
  DUSK_MINUTE,
  GUEST_PACE,
  guestSpec,
  kindAt,
  partyAtTable,
  Person,
  specFor,
  STAGGER,
  useBaked,
  useBox,
  useFloats,
  useSheets,
  useVisits,
  variantAt,
  Walker,
  type SheetSpec,
  type Walk,
  type Ways,
} from './sketchView/shared';
import { useGame } from './store';

/** Who is out and about at each time of day: tourists at lunch, office workers at noon, students in the evening. */
const STROLLERS: { until: number; groups: GroupId[] }[] = [
  { until: 12 * 60, groups: ['locals', 'tourists', 'office', 'locals'] },
  { until: 15 * 60, groups: ['office', 'office', 'tourists', 'tourists', 'locals', 'students'] },
  { until: 18 * 60, groups: ['tourists', 'tourists', 'locals', 'students', 'foodies'] },
  { until: 24 * 60, groups: ['students', 'students', 'foodies', 'tourists', 'locals'] },
];
/** At most this many people walking past at once, so the street feels alive but never crowded. */
const MOST_PASSERS = 3;

const musicianSpec: SheetSpec = { key: 'musician', sheet: MUSICIAN_SHEET, draw: (pt) => musicianSheet(pt) };

export function SketchStreetView({
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
  onTableTap?: (table: number) => void;
  selectedTable?: number | null;
  onGullTap?: () => void;
  freeTables?: { table: number; favourite: boolean }[];
  onFreeTableTap?: (table: number) => void;
  /** Handing a flyer to someone walking past: true, they come in; false, they don't; null, none left. */
  onPasserTap?: (group: GroupId) => boolean | null;
  onFlyerArrives?: (group: GroupId) => void;
}) {
  const speed = useGame((s) => s.speed);
  const name = useGame((s) => s.game.restaurants[0].name);
  const menu = useGame((s) => s.game.restaurants[0].menu);
  const specialKey = useGame((s) => s.game.restaurants[0].special);
  const { wrap, box } = useBox();
  const aspect = box.width > 0 && box.height > 0 ? Math.round((box.width / box.height) * 20) / 20 : 0;
  const layout = useMemo(() => streetLayout(floor.terraceTables, aspect || 1364 / 603, floor.location), [floor.terraceTables, aspect, floor.location]);
  const scale = box.width > 0 ? Math.min(box.width / layout.width, box.height / layout.height) : 0;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const bakeScale = Math.round(scale * dpr * 20) / 20;
  const at = (n: number) => n * scale;
  const ready = bakeScale > 0;

  // ----- The street, the page around it, the terrace's tables and plates -----
  const inside = floor.insideTables;
  const spots = Math.min(floor.terraceTables, layout.tables.length);
  const terraceOpen = floor.tables.length > inside;
  const special = menu.find((d) => recipeKey(d) === specialKey) ?? null;
  const look: StreetLook = { weather, dusk: minute >= DUSK_MINUTE, name, special: special ? dishName(special).split(/ · |, with /)[0] : null, terraceOpen };
  const lookKey = [weather, look.dusk, name, look.special, terraceOpen].join('|');
  const street = useBaked(ready ? `street|${floor.location}|${floor.terraceTables}|${aspect}|${lookKey}|${bakeScale}` : null, () => svgPicture(layout.width, layout.height, streetPicture(new Painter(), layout, look)), layout.width, layout.height, bakeScale, true);
  const frame = useBaked(ready ? `frame|${layout.width}|${layout.height}|${bakeScale}` : null, () => svgPicture(layout.width, layout.height, pageFramePicture(new Painter(), layout.width, layout.height)), layout.width, layout.height, bakeScale);
  const embroidered = floor.decor.includes('tablecloths');
  const tableScale = bakeScale * 1.12;
  const chairs = useBaked(ready ? `chairs|${tableScale}` : null, () => svgPicture(TABLE_BOX.width, TABLE_BOX.height, chairsPicture(new Painter())), TABLE_BOX.width, TABLE_BOX.height, tableScale);
  const table = useBaked(ready ? `table|${embroidered}|false|${tableScale}` : null, () => svgPicture(TABLE_BOX.width, TABLE_BOX.height, tablePicture(new Painter(), embroidered, false)), TABLE_BOX.width, TABLE_BOX.height, tableScale);
  const platesW = PLATES.length * PLATE_CELL.width;
  const plates = useBaked(ready ? `plates|${tableScale}` : null, () => svgPicture(platesW, PLATE_CELL.height, platesPicture(new Painter())), platesW, PLATE_CELL.height, tableScale);

  // ----- People -----
  const spotOf = (t: number) => layout.tables[t - inside];
  const ways: Ways = useMemo(
    () => ({
      shows: (t) => t >= inside && t - inside < spots,
      walkIn: (t, seat) => terraceWalkIn(layout, t - inside, seat),
      serve: (t) => terraceServe(layout, t - inside),
      move: (from, fromSeat, to, toSeat) => (from >= inside && to >= inside ? terraceMove(layout, from - inside, fromSeat, to - inside, toSeat) : null),
    }),
    [layout, inside, spots],
  );
  const { walks, done, arriving, served, stageOf } = useVisits(ways, floor, minute);
  const floats = useFloats(floor, served).filter((f) => f.table >= inside && f.table - inside < spots);
  const door = useDoorTraffic(layout, floor);
  const passers = usePassers(layout, minute, onPasserTap, onFlyerArrives);
  const leavers = useQueueLeavers(layout, floor);
  const everyone = [...walks, ...door.walks, ...passers.walks, ...leavers.walks];

  const specs: SheetSpec[] = [];
  const seen = new Set<string>();
  const need = (spec: SheetSpec) => !seen.has(spec.key) && (seen.add(spec.key), specs.push(spec));
  for (let s = 0; s < spots; s++) {
    const guests = floor.tables[inside + s];
    if (guests) for (let i = 0; i < Math.min(guests.seated, 4); i++) need(specFor(kindAt(guests, i), variantAt(guests, inside + s, i)));
  }
  floor.atTheDoor.slice(0, 3).forEach((party, p) => need(guestSpec(party.group, (p * 3) % GROUP_LOOKS)));
  if (floor.musician) need(musicianSpec);
  for (const w of everyone) need(w.sheet);
  const sheets = useSheets(specs, tableScale);
  const depth = useMemo(() => (y: number) => streetDepth(layout, y), [layout]);

  if (!ready) return <div ref={wrap} className="sk-wrap" />;

  // The terrace's guests, their plates, bubbles and the buttons to look after them.
  const people: ReactNode[] = [];
  const bubbles: ReactNode[] = [];
  for (let s = 0; s < spots; s++) {
    const t = inside + s;
    const guests = floor.tables[t];
    const spot = layout.tables[s];
    if (!guests || arriving.has(t)) continue;
    const party = partyAtTable({ table: t, guests, spot, stage: stageOf(guests, t), sheets, plates, scale, speed, z: (layer) => zOf(spot.row, layer), selected: t === selectedTable, onTableTap });
    people.push(...party.people);
    bubbles.push(...party.bubbles);
  }

  // Parties waiting for a table, by the door.
  const queue = floor.atTheDoor.slice(0, 3).flatMap((party, p) =>
    Array.from({ length: Math.min(party.size, 2) }, (_, i) => {
      const spot = streetQueueSpot(layout, p, i);
      const url = sheets.get(guestSpec(party.group, (p * 3) % GROUP_LOOKS).key);
      return url ? <Person key={`queue${p}:${i}`} url={url} sheet={GUEST_SHEET} cell={STAND_CELL} x={spot.x} y={spot.y} k={streetDepth(layout, spot.y)} scale={scale} z={spot.z} mirror={false} /> : null;
    }),
  );
  if (floor.atTheDoor.length > 0) {
    const spot = streetQueueSpot(layout, 0, 0);
    bubbles.push(
      <span key="queue" className="sk-bubble" style={{ left: at(spot.x), top: at(spot.y - 220 * streetDepth(layout, spot.y)) }}>
        <span className="sk-bubble-face">
          <Icon id="hourglass" size={28} />
          {floor.atTheDoor.length > 1 && <span className="sk-bubble-after">×{floor.atTheDoor.length}</span>}
        </span>
      </span>,
    );
  }

  const musicianUrl = floor.musician ? sheets.get(musicianSpec.key) : undefined;

  return (
    <div ref={wrap} className="sk-wrap">
      <div className="sk-scene" style={{ width: at(layout.width), height: at(layout.height) }} role="img" aria-label="The street outside your restaurant">
        {street && <img src={street} className="sk-layer" alt="" style={{ width: at(layout.width), height: at(layout.height), zIndex: 0 }} />}
        {layout.tables.slice(0, spots).map((spot, s) => {
          const k = spot.scale;
          const style = (z: number) => ({ left: at(spot.x + TABLE_BOX.left * k), top: at(spot.top + TABLE_BOX.top * k), width: at(TABLE_BOX.width * k), height: at(TABLE_BOX.height * k), zIndex: z });
          return (
            <span key={`table${s}`}>
              {chairs && <img src={chairs} className="sk-layer" alt="" style={style(zOf(spot.row, LAYER.chairs))} />}
              {table && <img src={table} className="sk-layer" alt="" style={style(zOf(spot.row, LAYER.table))} />}
            </span>
          );
        })}
        {people}
        {queue}
        {musicianUrl && (
          <Person url={musicianUrl} sheet={MUSICIAN_SHEET} cell={0} x={layout.musician.x} y={layout.musician.y} k={streetDepth(layout, layout.musician.y)} scale={scale} z={BACK_Z} frames={{ seconds: 1.2 / Math.max(speed, 0.25), offset: 0 }} />
        )}
        {walks.map((walk) => (
          <Walker key={walk.id} walk={walk} url={sheets.get(walk.sheet.key)} depth={depth} scale={scale} speed={speed} onDone={done} />
        ))}
        {door.walks.map((walk) => (
          <Walker key={walk.id} walk={walk} url={sheets.get(walk.sheet.key)} depth={depth} scale={scale} speed={speed} onDone={door.done} />
        ))}
        {leavers.walks.map((walk) => (
          <Walker key={walk.id} walk={walk} url={sheets.get(walk.sheet.key)} depth={depth} scale={scale} speed={speed} onDone={leavers.done} />
        ))}
        {passers.walks.map((walk) => (
          <Walker
            key={walk.id}
            walk={walk}
            url={sheets.get(walk.sheet.key)}
            depth={depth}
            scale={scale}
            speed={speed}
            onDone={passers.done}
            onTap={onPasserTap && walk.passer && !walk.bubble ? passers.tap : undefined}
          />
        ))}
        {floor.gull && spotOf(floor.gull.table) && <Gull spot={spotOf(floor.gull.table)!} scale={scale} onTap={onGullTap} />}
        {frame && <img src={frame} className="sk-layer sk-frame" alt="" style={{ width: at(layout.width), height: at(layout.height) }} />}
        {bubbles}
        {onFreeTableTap &&
          freeTables.map(({ table: t, favourite }) => {
            const spot = spotOf(t);
            if (!spot || t < inside) return null;
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
        {floats.map((f) => {
          const spot = spotOf(f.table)!;
          return (
            <span key={f.id} className="sk-float" style={{ left: at(spot.x), top: at(spot.top - 170 * spot.scale) }}>
              +{money(f.bill)}
              {f.heart && <span className="sk-heart">♥</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ---------- People going in and out of the door ----------

/** Parties at the tables inside, seen from the street: walking in at the door when they come, and out again when they go. */
function useDoorTraffic(L: StreetLayout, floor: FloorView) {
  const known = useRef<Map<number, TableGuests> | null>(null);
  const [walks, setWalks] = useState<Walk[]>([]);
  useEffect(() => {
    const now = new Map<number, TableGuests>();
    floor.tables.forEach((guests, table) => guests && table < floor.insideTables && now.set(table, guests));
    const before = known.current;
    known.current = now;
    if (!before) return;
    const parties = (from: Map<number, TableGuests>, to: Map<number, TableGuests>) => [...from].filter(([table, g]) => ![...to.values()].some((h) => h.since === g.since && h.group === g.group) && to.get(table)?.since !== g.since);
    const started: Walk[] = [];
    const walk = (table: number, guests: TableGuests, leaving: boolean) => {
      const fromLeft = (guests.since + table) % 2 === 0;
      for (let i = 0; i < Math.min(guests.seated, 4); i++) {
        const path = doorWalk(L, i, fromLeft);
        started.push({
          id: `door:${table}:${guests.since}:${i}:${leaving ? 'out' : 'in'}`,
          sheet: specFor(kindAt(guests, i), variantAt(guests, table, i)),
          cell: WALK_CELL,
          away: WALK_BACK_CELL,
          path: leaving ? [...path].reverse() : path,
          pace: GUEST_PACE,
          delay: i * STAGGER,
          bubble: leaving && guests.stage !== 'eating' ? 'angry' : undefined,
        });
      }
    };
    for (const [table, guests] of parties(now, before)) walk(table, guests, false);
    for (const [table, guests] of parties(before, now)) walk(table, guests, true);
    if (started.length > 0) setWalks((list) => [...list, ...started]);
  }, [floor, L]);
  const done = useCallback((walk: Walk) => setWalks((list) => list.filter((w) => w.id !== walk.id)), []);
  return { walks, done };
}

/** Parties that gave up waiting by the door walk off down the street, cross. */
function useQueueLeavers(L: StreetLayout, floor: FloorView) {
  const [walks, setWalks] = useState<Walk[]>([]);
  const seen = useRef(new Set<string>());
  useEffect(() => {
    const started: Walk[] = [];
    floor.leftTheDoor.forEach((party, p) => {
      const key = `${party.minute}:${p}:${party.group}:${party.size}`;
      if (seen.current.has(key)) return;
      seen.current.add(key);
      for (let i = 0; i < Math.min(party.size, 2); i++) {
        const start = streetQueueSpot(L, 0, i);
        started.push({
          id: `left:${key}:${i}`,
          sheet: guestSpec(party.group, (p * 3 + i) % GROUP_LOOKS),
          cell: WALK_CELL,
          away: WALK_BACK_CELL,
          path: [start, { x: -80, y: start.y, z: start.z }],
          pace: GUEST_PACE,
          delay: i * STAGGER,
          bubble: 'angry',
        });
      }
    });
    if (started.length > 0) setWalks((now) => [...now, ...started]);
  }, [floor.leftTheDoor, L]);
  const done = useCallback((walk: Walk) => setWalks((now) => now.filter((w) => w.id !== walk.id)), []);
  return { walks, done };
}

// ---------- People walking past ----------

/**
 * People strolling past, in their group's looks: one may set off every few game minutes while the day
 * runs. Handed a flyer, someone may turn and go in at the door instead.
 */
function usePassers(L: StreetLayout, minute: number, onTap?: (group: GroupId) => boolean | null, onArrive?: (group: GroupId) => void) {
  const [walks, setWalks] = useState<(Walk & { flyer?: boolean })[]>([]);
  const count = useRef(0);
  useEffect(() => {
    setWalks((now) => {
      if (now.filter((w) => w.passer).length >= MOST_PASSERS) return now;
      const n = count.current++;
      // A little hash instead of Math.random, so it never touches the game's dice.
      const roll = (n * 2654435761 + minute * 40503) >>> 0;
      if (((roll >>> 24) & 3) !== 0) return now;
      const groups = (STROLLERS.find((s) => minute < s.until) ?? STROLLERS[STROLLERS.length - 1]).groups;
      const group = groups[(roll >>> 4) % groups.length];
      const path = passerWalk(L, ((roll >>> 12) & 3) === 0, ((roll >>> 14) & 1) === 0);
      return [...now, { id: `passer:${n}`, passer: group, sheet: guestSpec(group, (roll >>> 8) % GROUP_LOOKS), cell: WALK_CELL, away: WALK_BACK_CELL, path, pace: GUEST_PACE * 0.8, delay: 0 }];
    });
  }, [minute, L]);
  const callbacks = useRef({ onTap, onArrive });
  callbacks.current = { onTap, onArrive };
  const tap = useCallback(
    (walk: Walk, here: Point) => {
      if (!walk.passer) return;
      const comes = callbacks.current.onTap?.(walk.passer) ?? null;
      if (comes === null) return;
      // Someone handed a flyer has a bubble from then on, so they can't be handed another. Coming in: they turn, smiling, and go in at the door; not tempted: they wave and walk on.
      if (comes) setWalks((now) => now.map((w) => (w.id === walk.id ? { ...walk, id: `${walk.id}:flyer`, path: toTheDoor(L, here), bubble: 'happy', flyer: true } : w)));
      else setWalks((now) => now.map((w) => (w.id === walk.id ? { ...walk, path: [here, walk.path[walk.path.length - 1]], id: `${walk.id}:wave`, bubble: 'wave' } : w)));
    },
    [L],
  );
  const done = useCallback((walk: Walk & { flyer?: boolean }) => {
    if (walk.flyer && walk.passer) callbacks.current.onArrive?.(walk.passer);
    setWalks((now) => now.filter((w) => w.id !== walk.id));
  }, []);
  return { walks, done, tap };
}

// ---------- The gull ----------

/** A gull landing on a terrace table's plate, with a big target to tap it away. */
function Gull({ spot, scale, onTap }: { spot: { x: number; top: number }; scale: number; onTap?: () => void }) {
  const url = useBaked(`gull|${scale.toFixed(2)}`, () => svgPicture(80, 60, mewa(new Painter(), 44, 56, 1.5)), 80, 60, scale * (window.devicePixelRatio || 1));
  const left = (spot.x - 40) * scale;
  const top = (spot.top - 58) * scale;
  return (
    <>
      {url && <img src={url} className="sk-layer sk-gull" alt="" style={{ left, top, width: 80 * scale, height: 60 * scale }} />}
      {onTap && <button type="button" className="gull-tap" style={{ left: left + 40 * scale, top: top + 30 * scale }} aria-label="Shoo the gull away" onClick={onTap} />}
    </>
  );
}

export { FRONT_Z };
