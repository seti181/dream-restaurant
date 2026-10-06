// The Old Town map in ink and wash (src/ui/sketch/mapArt.ts), baked as one picture, with a tappable
// marker for each street on top, its name on a paper tag, the rivals' seals, and Mewa by your door.

import { LOCATION_IDS, LOCATIONS, type LocationId } from '../data/locations';
import type { RivalId } from '../data/rivals';
import { playerOf } from '../sim/game';
import { MewaIcon } from './MewaIcon';
import { Icon } from './Icon';
import { useGame } from './store';
import { oldTownMapPicture, SKETCH_MAP_H, SKETCH_MAP_W, sketchMapPoint } from './sketch/mapArt';
import { Painter, svgPicture } from './sketch/painter';
import { useBaked, useBox } from './sketchView/shared';

const BADGES: Record<RivalId, string> = { nonnaRosa: 'NR', blyskawica: 'BB', karczma: 'KŻ', spichlerz: 'SB' };

export function OldTownMap({ selected, onSelect }: { selected: LocationId; onSelect: (id: LocationId) => void }) {
  const game = useGame((s) => s.game);
  const home = playerOf(game).location;
  const rivals = game.restaurants.slice(1);
  // The map fills the column's width.
  const { wrap, box } = useBox();
  const width = SKETCH_MAP_W;
  const height = SKETCH_MAP_H;
  const scale = box.width > 0 ? box.width / width : 0;
  const at = (n: number) => n * scale;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const bakeScale = Math.round(scale * dpr * 20) / 20;
  const sketch = useBaked(
    bakeScale > 0 ? `oldTownMap|${bakeScale}` : null,
    () => svgPicture(SKETCH_MAP_W, SKETCH_MAP_H, oldTownMapPicture(new Painter())),
    SKETCH_MAP_W,
    SKETCH_MAP_H,
    bakeScale,
    true,
  );

  return (
    <div ref={wrap} className="old-town-map-wrap">
      <div className="old-town-map" style={{ width: at(width), height: at(height) }} role="group" aria-label="Map of the Old Town">
        {sketch && <img src={sketch} alt="" style={{ position: 'absolute', left: 0, top: 0, width: at(width), height: at(height) }} />}
        {LOCATION_IDS.map((id) => {
          const { x, y } = LOCATIONS[id].mapPosition;
          const { x: px, y: py } = sketchMapPoint(x, y);
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
