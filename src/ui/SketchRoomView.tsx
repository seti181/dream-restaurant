// The restaurant in the Kashubian sketchbook look (project.md section 9.5, M8): seen from the
// front like a stage, laid out for the restaurant's size, and alive. Guests walk in through the
// door and sit down, order, wait and eat; waiters carry plates from the kitchen hatch; chefs toss
// their pans; bubbles and money float over the tables. Every picture is baked once (sketch/bake.ts),
// and only those pictures move, with CSS and the browser's animations. The street outside, with the
// terrace, the queue and people walking past, is the other view (SketchStreetView).

import { useMemo, type ReactNode } from 'react';
import { balance } from '../data/balance';
import { LOCATIONS } from '../data/locations';
import type { Weather } from '../data/weather';
import type { FloorView, HurryState } from '../sim/day';
import { TOP_RANK } from '../sim/ranks';
import { dishName, money } from './format';
import { Icon } from './Icon';
import { chefSpot, COUNTER_Z, counterServe, counterSpots, counterWalkIn, depthScale, frontLayout, LAYER, moveWalk, serveWalk, waiterSpot, walkIn, zOf } from './sketch/frontRoom';
import { Painter, svgPicture } from './sketch/painter';
import { CANDLE_RISE, chairsPicture, hatchCounterPicture, pageFramePicture, PLATE_CELL, PLATES, platesPicture, roomLamps, roomPicture, TABLE_BOX, tablePicture, wallClock, type RoomLook } from './sketch/roomArt';
import { CHEF_CELLS, CHEF_SHEET, WAITER_CELLS, WAITER_SHEET } from './sketch/sheets';
import {
  chefSpec,
  lightAt,
  LightLayer,
  type Glow,
  kindAt,
  partyAtTable,
  Person,
  specFor,
  useBaked,
  useBox,
  useFloats,
  useSheets,
  useVisits,
  variantAt,
  waiterSpec,
  Walker,
  type SheetSpec,
  type Ways,
} from './sketchView/shared';
import { useGame } from './store';

/** For checking the layouts: "?slots=12" lays the room out for that many tables, whatever the premises. */
const slotsWanted = typeof location !== 'undefined' ? Number(new URLSearchParams(location.search).get('slots')) || 0 : 0;

/** The biggest a row is drawn (the front row of three); pictures are baked at this size. */
const MAX_ROW_SCALE = 1.12;

export function SketchRoomView({
  floor,
  weather,
  minute,
  onTableTap,
  selectedTable = null,
  freeTables = [],
  onFreeTableTap,
  onStaffTap,
}: {
  floor: FloorView;
  weather: Weather;
  minute: number;
  onTableTap?: (table: number) => void;
  selectedTable?: number | null;
  freeTables?: { table: number; favourite: boolean }[];
  onFreeTableTap?: (table: number) => void;
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
  // The light of the day: the pictures change with it (windows, candles), and the live light fades over them.
  const light = lightAt(minute);
  const dusk = light === 'evening';
  const golden = light === 'golden';
  const lit = light !== 'day';
  const specials = menu
    .filter((d) => !d.fromLunchSet)
    .slice(0, 3)
    .map((d) => ({ name: shorten(dishName(d)), price: d.price }));
  const look: RoomLook = { decor: floor.decor, equipment: floor.equipment, weather, dusk, golden, live: true, plaque, specials, works: floor.works };
  const lookKey = [look.decor.join(), look.equipment.join(), (floor.works ?? []).join(), weather, light, plaque, specials.map((s) => s.name + s.price).join()].join('|');
  const ready = bakeScale > 0;
  const room = useBaked(ready ? `room|${slots}|${aspect}|${lookKey}|${bakeScale}` : null, () => svgPicture(layout.width, layout.height, roomPicture(new Painter(), layout, look)), layout.width, layout.height, bakeScale, true);
  const counter = useBaked(ready ? `counter|${slots}|${aspect}|${bakeScale}` : null, () => svgPicture(layout.width, layout.height, hatchCounterPicture(new Painter(), layout)), layout.width, layout.height, bakeScale);
  const frame = useBaked(ready ? `frame|${layout.width}|${layout.height}|${bakeScale}` : null, () => svgPicture(layout.width, layout.height, pageFramePicture(new Painter(), layout.width, layout.height)), layout.width, layout.height, bakeScale);
  const embroidered = floor.decor.includes('tablecloths');
  const oak = floor.decor.includes('communalTable');
  const tableScale = bakeScale * MAX_ROW_SCALE;
  const chairs = useBaked(ready ? `chairs|${tableScale}` : null, () => svgPicture(TABLE_BOX.width, TABLE_BOX.height, chairsPicture(new Painter())), TABLE_BOX.width, TABLE_BOX.height, tableScale);
  const table = useBaked(ready ? `table|${embroidered}|${oak}|${lit}|${tableScale}` : null, () => svgPicture(TABLE_BOX.width, TABLE_BOX.height, tablePicture(new Painter(), embroidered, oak, lit)), TABLE_BOX.width, TABLE_BOX.height, tableScale);
  const platesW = PLATES.length * PLATE_CELL.width;
  const plates = useBaked(ready ? `plates|${tableScale}` : null, () => svgPicture(platesW, PLATE_CELL.height, platesPicture(new Painter())), platesW, PLATE_CELL.height, tableScale);

  // ----- People -----
  const furnished = Math.min(floor.insideTables, layout.tables.length);
  // The bar counter's places come after the terrace's tables; drawn on the stools in front of the bar.
  const counterFrom = floor.counterFrom;
  const barPlaces = useMemo(() => counterSpots(layout, floor.tables.length - counterFrom), [layout, floor.tables.length, counterFrom]);
  const atCounter = (t: number) => t >= counterFrom && t - counterFrom < barPlaces.length;
  const shows = (t: number) => t < furnished || atCounter(t);
  const spotAt = (t: number) => (atCounter(t) ? barPlaces[t - counterFrom] : layout.tables[t]);
  const ways: Ways = useMemo(
    () => ({
      shows: (t) => t < furnished || (t >= counterFrom && t - counterFrom < barPlaces.length),
      walkIn: (t, seat) => (t >= counterFrom ? counterWalkIn(layout, barPlaces[t - counterFrom], seat) : walkIn(layout, t, seat)),
      serve: (t) => (t >= counterFrom ? counterServe(layout, barPlaces[t - counterFrom]) : serveWalk(layout, t)),
      move: (from, fromSeat, to, toSeat) => (from < furnished && to < furnished ? moveWalk(layout, from, fromSeat, to, toSeat) : null),
    }),
    [layout, furnished, counterFrom, barPlaces],
  );
  const { walks, done, arriving, busyWaiters, served, stageOf } = useVisits(ways, floor, minute);
  const floats = useFloats(floor, served).filter((f) => shows(f.table));
  const specs: SheetSpec[] = [];
  const seen = new Set<string>();
  const need = (spec: SheetSpec) => !seen.has(spec.key) && (seen.add(spec.key), specs.push(spec));
  floor.chefsBusy.forEach((_, i) => need(chefSpec(floor.chefLooks[i] ?? i)));
  floor.waiters.forEach((w, i) => need(waiterSpec(w ?? 'waiter', floor.waiterLooks[i] ?? i)));
  floor.tables.forEach((guests, t) => {
    if (guests && shows(t)) for (let i = 0; i < Math.min(guests.seated, 4); i++) need(specFor(kindAt(guests, i), variantAt(guests, t, i)));
  });
  for (const w of walks) need(w.sheet);
  const sheets = useSheets(specs, tableScale);
  const depth = useMemo(() => (y: number) => depthScale(layout, y), [layout]);

  if (!ready) return <div ref={wrap} className="sk-wrap" />;

  // Seated guests, their plates, their bubbles and the buttons to look after them.
  const people: ReactNode[] = [];
  const bubbles: ReactNode[] = [];
  for (let t = 0; t < floor.tables.length; t++) {
    const guests = floor.tables[t];
    if (!guests || arriving.has(t) || !shows(t)) continue;
    const spot = spotAt(t);
    // At the counter, the plates stand on the bar behind the guests on their stools.
    const z = atCounter(t) ? (layer: number) => (layer === LAYER.plates ? COUNTER_Z - 1 : COUNTER_Z) : (layer: number) => zOf(spot.row, layer);
    const party = partyAtTable({ table: t, guests, spot, stage: stageOf(guests, t), sheets, plates, scale, speed, z, selected: t === selectedTable, onTableTap });
    people.push(...party.people);
    bubbles.push(...party.bubbles);
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
    const spot = waiterSpot(layout, i, barPlaces.length > 0);
    const url = sheets.get(waiterSpec(w ?? 'waiter', floor.waiterLooks[i] ?? i).key);
    return url ? <Person key={`waiter${i}`} url={url} sheet={WAITER_SHEET} cell={WAITER_CELLS.stand} x={spot.x} y={spot.y} k={depthScale(layout, spot.y)} scale={scale} z={spot.z} /> : null;
  });

  const clock = wallClock(layout);

  // A candle on every table, and the decor's lamps.
  const glows: Glow[] = [
    ...layout.tables.slice(0, furnished).map((spot) => ({ x: at(spot.x), y: at(spot.top - CANDLE_RISE * spot.scale), r: at(95 * spot.scale), kind: 'candle' as const })),
    ...roomLamps(layout, floor.decor).map((lamp) => ({ x: at(lamp.x), y: at(lamp.y), r: at(lamp.r), kind: 'lamp' as const })),
  ];

  return (
    <div ref={wrap} className="sk-wrap">
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
        {walks.map((walk) => (
          <Walker key={walk.id} walk={walk} url={sheets.get(walk.sheet.key)} depth={depth} scale={scale} speed={speed} onDone={done} />
        ))}
        <LightLayer light={light} weather={weather} glows={glows} />
        {frame && <img src={frame} className="sk-layer sk-frame" alt="" style={{ width: at(layout.width), height: at(layout.height) }} />}
        {bubbles}
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
          const spot = waiterSpot(layout, i, barPlaces.length > 0);
          return <StaffHurry key={`hurryWaiter${i}`} state={state} left={at(spot.x)} top={at(spot.y - 220 * depthScale(layout, spot.y))} label="Hurry this waiter" onTap={onStaffTap && (() => onStaffTap('waiter', i))} />;
        })}
        {floats.map((f) => {
          const spot = spotAt(f.table);
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

/** A short name for the chalkboard. */
export function shorten(name: string): string {
  const first = name.split(/ · |, with /)[0];
  return first.length > 16 ? `${first.slice(0, 15)}…` : first;
}

/** The wall clock above the hatch shows the day's time. */
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
