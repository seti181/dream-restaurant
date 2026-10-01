// The restaurant view in pixel art: the room as one picture, with furniture and people
// stacked on top, back to front. Bubbles and coins float above the guests.
// Each art pixel is drawn as a whole number of screen pixels, so it stays crisp.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { balance } from '../data/balance';
import { LOCATIONS } from '../data/locations';
import type { Weather } from '../data/weather';
import type { FloorView, TableGuests } from '../sim/day';
import { imageUrl, type Pixels } from './pixel/raster';
import { drawRoom, roomLayout, scenePieces, type RoomLook } from './pixel/room';

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

export function PixelRestaurantView({
  floor,
  weather,
  minute,
}: {
  floor: FloorView;
  weather: Weather;
  minute: number;
}) {
  const maxTables = Math.floor(LOCATIONS[floor.location].maxSeats / balance.service.seatsPerTable);
  const terraceTables = floor.tables.length - floor.insideTables;
  const layout = useMemo(() => roomLayout(maxTables, terraceTables), [maxTables, terraceTables]);

  const dusk = minute >= 19 * 60 + 30;
  const roomKey = [floor.decor.join(), floor.equipment.join(), weather, dusk, floor.insideTables].join('|');
  const look: RoomLook = useMemo(
    () => ({ decor: floor.decor, equipment: floor.equipment, weather, dusk, insideTables: floor.insideTables }),
    // The room only needs redrawing when what it shows changes.
    [roomKey],
  );
  const background = useMemo(() => imageUrl(drawRoom(layout, look)), [layout, look]);
  useEffect(() => () => URL.revokeObjectURL(background), [background]);

  const pieces = scenePieces(layout, floor, look);
  const { wrap, scale } = useFittingScale(layout.width, layout.height);
  const at = (n: number) => n * scale;

  return (
    <div ref={wrap} className="pixel-wrap">
      <div className="pixel-scene" style={{ width: at(layout.width), height: at(layout.height) }} role="img" aria-label="Your restaurant">
        <img src={background} className="pixel" alt="" style={{ left: 0, top: 0, width: at(layout.width) }} />
        {pieces.map((p) => (
          <img
            key={p.key}
            src={urlOf(p.image.pixels)}
            className={p.kind === 'steam' ? 'pixel steam' : 'pixel'}
            alt=""
            style={{ left: at(p.px), top: at(p.py), width: at(p.image.pixels.width) }}
          />
        ))}
        {/* Bubbles and coins above the guests, on top of everything. */}
        {pieces.map((p) => {
          const x = at(p.px + p.image.pixels.width / 2);
          const y = at(p.py - 1);
          if (p.kind === 'walkout') {
            return (
              <span key={`${p.key}:bubble`} className="pixel-bubble" style={{ left: x, top: y }}>
                😠
              </span>
            );
          }
          if (p.kind !== 'guest' || !p.guests) return null;
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
