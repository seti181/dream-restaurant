// The cellar room (piwnica) in the sketchbook look (project.md section 6.14, "Bigger premises"): a
// view of its own, down the stairs from the room, switched with a round button like the street
// outside. Its tables come after the terrace's in the floor view (cellarFrom); guests and waiters
// come down the stairs on the left. The room upstairs is SketchRoomView.

import { useMemo, type ReactNode } from 'react';
import type { Weather } from '../data/weather';
import type { FloorView } from '../sim/day';
import { money } from './format';
import { cellarDepth, cellarLayout, cellarMove, cellarServe, cellarWalkIn } from './sketch/cellar';
import { cellarCandles, cellarPicture, type CellarLook } from './sketch/cellarArt';
import { LAYER, zOf } from './sketch/frontRoom';
import { Painter, svgPicture } from './sketch/painter';
import { CANDLE_RISE, chairsPicture, pageFramePicture, PLATE_CELL, PLATES, platesPicture, TABLE_BOX, tablePicture } from './sketch/roomArt';
import { kindAt, lightAt, LightLayer, partyAtTable, specFor, useBaked, useBox, useFloats, useSheets, useVisits, variantAt, Walker, type Glow, type SheetSpec, type Ways } from './sketchView/shared';
import { useGame } from './store';

/** The biggest a table is drawn (the cellar's one row); pictures are baked at this size. */
const ROW_SCALE = 1.12;

export function SketchCellarView({
  floor,
  weather,
  minute,
  onTableTap,
  selectedTable = null,
  freeTables = [],
  onFreeTableTap,
}: {
  floor: FloorView;
  weather: Weather;
  minute: number;
  onTableTap?: (table: number) => void;
  selectedTable?: number | null;
  freeTables?: { table: number; favourite: boolean }[];
  onFreeTableTap?: (table: number) => void;
}) {
  const speed = useGame((s) => s.speed);
  const { wrap, box } = useBox();
  const from = floor.cellarFrom;
  const count = Math.max(0, floor.counterFrom - from);
  const aspect = box.width > 0 && box.height > 0 ? Math.round((box.width / box.height) * 20) / 20 : 0;
  const layout = useMemo(() => cellarLayout(count, aspect || 1364 / 603), [count, aspect]);
  const scale = box.width > 0 ? Math.min(box.width / layout.width, box.height / layout.height) : 0;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const bakeScale = Math.round(scale * dpr * 20) / 20;
  const at = (n: number) => n * scale;
  const ready = bakeScale > 0;

  // ----- The cellar, the page around it, the tables and plates -----
  const light = lightAt(minute);
  const look: CellarLook = { weather, dusk: light === 'evening' };
  const cellar = useBaked(ready ? `cellar|${count}|${aspect}|${weather}|${look.dusk}|${bakeScale}` : null, () => svgPicture(layout.width, layout.height, cellarPicture(new Painter(), layout, look)), layout.width, layout.height, bakeScale, true);
  const frame = useBaked(ready ? `frame|${layout.width}|${layout.height}|${bakeScale}` : null, () => svgPicture(layout.width, layout.height, pageFramePicture(new Painter(), layout.width, layout.height)), layout.width, layout.height, bakeScale);
  const embroidered = floor.decor.includes('tablecloths');
  const oak = floor.decor.includes('communalTable');
  const tableScale = bakeScale * ROW_SCALE;
  // The cellar's candles are always lit: the tables' cloths are baked with theirs burning.
  const chairs = useBaked(ready ? `chairs|${tableScale}` : null, () => svgPicture(TABLE_BOX.width, TABLE_BOX.height, chairsPicture(new Painter())), TABLE_BOX.width, TABLE_BOX.height, tableScale);
  const table = useBaked(ready ? `table|${embroidered}|${oak}|true|${tableScale}` : null, () => svgPicture(TABLE_BOX.width, TABLE_BOX.height, tablePicture(new Painter(), embroidered, oak, true)), TABLE_BOX.width, TABLE_BOX.height, tableScale);
  const platesW = PLATES.length * PLATE_CELL.width;
  const plates = useBaked(ready ? `plates|${tableScale}` : null, () => svgPicture(platesW, PLATE_CELL.height, platesPicture(new Painter())), platesW, PLATE_CELL.height, tableScale);

  // ----- People -----
  const shows = (t: number) => t >= from && t - from < layout.tables.length;
  const ways: Ways = useMemo(
    () => ({
      shows: (t) => t >= from && t - from < layout.tables.length,
      walkIn: (t, seat) => cellarWalkIn(layout, t - from, seat),
      serve: (t) => cellarServe(layout, t - from),
      move: (a, aSeat, b, bSeat) => (a >= from && b >= from ? cellarMove(layout, a - from, aSeat, b - from, bSeat) : null),
    }),
    [layout, from],
  );
  const { walks, done, arriving, served, stageOf } = useVisits(ways, floor, minute);
  const floats = useFloats(floor, served).filter((f) => shows(f.table));
  const specs: SheetSpec[] = [];
  const seen = new Set<string>();
  const need = (spec: SheetSpec) => !seen.has(spec.key) && (seen.add(spec.key), specs.push(spec));
  floor.tables.forEach((guests, t) => {
    if (guests && shows(t)) for (let i = 0; i < Math.min(guests.seated, 4); i++) need(specFor(kindAt(guests, i), variantAt(guests, t, i)));
  });
  for (const w of walks) need(w.sheet);
  const sheets = useSheets(specs, tableScale);
  const depth = useMemo(() => (y: number) => cellarDepth(layout, y), [layout]);

  if (!ready) return <div ref={wrap} className="sk-wrap" />;

  const people: ReactNode[] = [];
  const bubbles: ReactNode[] = [];
  layout.tables.forEach((spot, i) => {
    const t = from + i;
    const guests = floor.tables[t];
    if (!guests || arriving.has(t)) return;
    const party = partyAtTable({ table: t, guests, spot, stage: stageOf(guests, t), sheets, plates, scale, speed, z: (layer) => zOf(spot.row, layer), selected: t === selectedTable, onTableTap });
    people.push(...party.people);
    bubbles.push(...party.bubbles);
  });

  // Candles on every table, in the niches and on the chandelier, lit all day down here.
  const glows: Glow[] = [
    ...layout.tables.map((spot) => ({ x: at(spot.x), y: at(spot.top - CANDLE_RISE * spot.scale), r: at(95 * spot.scale), kind: 'candle' as const, always: true })),
    ...cellarCandles(layout).map((c) => ({ x: at(c.x), y: at(c.y), r: at(c.r), kind: 'candle' as const, always: true })),
  ];

  return (
    <div ref={wrap} className="sk-wrap">
      <div className="sk-scene" style={{ width: at(layout.width), height: at(layout.height) }} role="img" aria-label="Your cellar room">
        {cellar && <img src={cellar} className="sk-layer" alt="" style={{ width: at(layout.width), height: at(layout.height), zIndex: 0 }} />}
        {layout.tables.map((spot, i) => {
          const k = spot.scale;
          const style = (z: number) => ({ left: at(spot.x + TABLE_BOX.left * k), top: at(spot.top + TABLE_BOX.top * k), width: at(TABLE_BOX.width * k), height: at(TABLE_BOX.height * k), zIndex: z });
          return (
            <span key={`table${i}`}>
              {chairs && <img src={chairs} className="sk-layer" alt="" style={style(zOf(spot.row, LAYER.chairs))} />}
              {table && <img src={table} className="sk-layer" alt="" style={style(zOf(spot.row, LAYER.table))} />}
            </span>
          );
        })}
        {people}
        {walks.map((walk) => (
          <Walker key={walk.id} walk={walk} url={sheets.get(walk.sheet.key)} depth={depth} scale={scale} speed={speed} onDone={done} />
        ))}
        <LightLayer light={light} weather={weather} glows={glows} />
        {frame && <img src={frame} className="sk-layer sk-frame" alt="" style={{ width: at(layout.width), height: at(layout.height) }} />}
        {bubbles}
        {onFreeTableTap &&
          freeTables.map(({ table: t, favourite }) => {
            if (!shows(t)) return null;
            const spot = layout.tables[t - from];
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
          const spot = layout.tables[f.table - from];
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
