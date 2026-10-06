// The Old Town map: the drawn map as one picture (in ink and wash, or with "?pixel" the old pixel
// art), with a tappable marker for each street on top, its name in clear letters, the rivals'
// signs, and Mewa by your door.

import { useMemo } from 'react';
import { LOCATION_IDS, LOCATIONS, type LocationId } from '../data/locations';
import type { RivalId } from '../data/rivals';
import { playerOf } from '../sim/game';
import { MewaIcon } from './MewaIcon';
import { drawOldTown, MAP_HEIGHT, MAP_WIDTH, mapPixel } from './pixel/map';
import { imageUrl } from './pixel/raster';
import { Icon } from './Icon';
import { useGame } from './store';
import { useFittingScale } from './useFittingScale';
import { sketchWanted } from './SketchRoomView';
import { oldTownMapPicture, SKETCH_MAP_H, SKETCH_MAP_W, sketchMapPoint } from './sketch/mapArt';
import { Painter, svgPicture } from './sketch/painter';
import { useBaked } from './sketchView/shared';

const BADGES: Record<RivalId, string> = { nonnaRosa: 'NR', blyskawica: 'BB', karczma: 'KŻ', spichlerz: 'SB' };

/** Small names for the landmarks, in map pixels. */
const NOTES = [
  { text: 'St. Mary’s', px: 118, py: 2 },
  { text: 'Żuraw', px: 233, py: 92 },
  { text: 'Granary Island', px: 272, py: 4 },
  { text: 'Motława', px: 244, py: 168 },
];

/** The map never changes, so it is drawn once. */
let mapUrl: string | null = null;
const theMap = () => (mapUrl ??= imageUrl(drawOldTown()));

export function OldTownMap({ selected, onSelect }: { selected: LocationId; onSelect: (id: LocationId) => void }) {
  const game = useGame((s) => s.game);
  const home = playerOf(game).location;
  const rivals = game.restaurants.slice(1);
  // The sketchbook map is drawn at four times the pixel map's size, on the same plan.
  const width = sketchWanted ? SKETCH_MAP_W : MAP_WIDTH;
  const height = sketchWanted ? SKETCH_MAP_H : MAP_HEIGHT;
  const url = useMemo(() => (sketchWanted ? null : theMap()), []);
  // The pixel map keeps whole pixels; the sketchbook map simply fills the column's width.
  const fitting = useFittingScale(width, height, false);
  const { wrap, scale: pixelScale, box } = fitting;
  const scale = sketchWanted ? (box.width > 0 ? box.width / width : 0) : pixelScale;
  const at = (n: number) => n * scale;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const bakeScale = Math.round(scale * dpr * 20) / 20;
  const sketch = useBaked(
    sketchWanted && bakeScale > 0 ? `oldTownMap|${bakeScale}` : null,
    () => svgPicture(SKETCH_MAP_W, SKETCH_MAP_H, oldTownMapPicture(new Painter())),
    SKETCH_MAP_W,
    SKETCH_MAP_H,
    bakeScale,
    true,
  );
  const spot = (x: number, y: number) => {
    if (sketchWanted) return sketchMapPoint(x, y);
    const { px, py } = mapPixel(x, y);
    return { x: px, y: py };
  };

  return (
    <div ref={wrap} className="pixel-map-wrap">
      <div className={sketchWanted ? 'pixel-map sketch-map' : 'pixel-map'} style={{ width: at(width), height: at(height) }} role="group" aria-label="Map of the Old Town">
        {url && <img src={url} className="pixel" alt="" style={{ left: 0, top: 0, width: at(MAP_WIDTH) }} />}
        {sketch && <img src={sketch} alt="" style={{ position: 'absolute', left: 0, top: 0, width: at(width), height: at(height) }} />}
        {/* The sketchbook map writes its own names. */}
        {!sketchWanted && NOTES.map((note) => (
          <span key={note.text} className="map-note" style={{ left: at(note.px), top: at(note.py) }}>
            {note.text}
          </span>
        ))}
        {LOCATION_IDS.map((id) => {
          const { x, y } = LOCATIONS[id].mapPosition;
          const { x: px, y: py } = spot(x, y);
          const here = rivals.filter((r) => r.location === id);
          return (
            <div key={id} className="map-marker" style={{ left: at(px), top: at(py) }}>
              <button
                type="button"
                className={`map-pin${id === home ? ' home' : ''}`}
                aria-pressed={id === selected}
                aria-label={LOCATIONS[id].name}
                onClick={() => onSelect(id)}
              >
                <Icon id={`street:${id}`} size={34} />
              </button>
              <span className="map-name">{LOCATIONS[id].name}</span>
              {here.length > 0 && (
                <span className="map-rivals">
                  {here.map((rival) => (
                    <span key={rival.id} className="map-badge">
                      {BADGES[rival.id as RivalId]}
                    </span>
                  ))}
                </span>
              )}
              {id === home && (
                <span className="map-mewa">
                  <MewaIcon size={48} />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
