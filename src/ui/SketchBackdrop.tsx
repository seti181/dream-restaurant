// Behind the planning screens and the day report in the sketchbook look (M8, project.md section 9.5):
// the restaurant's own street, washed pale, inside the same sketchbook page frame as the day screen.

import { useMemo } from 'react';
import type { Weather } from '../data/weather';
import { recipeKey } from '../sim/menu';
import { dishName } from './format';
import { Painter, svgPicture } from './sketch/painter';
import { pageFramePicture } from './sketch/roomArt';
import { streetLayout } from './sketch/street';
import { streetPicture } from './sketch/streetArt';
import { useBaked, useBox } from './sketchView/shared';
import { useGame } from './store';

/** The tallest shape the street behind the screens is drawn in (width over height). */
const NARROWEST_SHAPE = 1.3;

export function SketchBackdrop({ weather, evening }: { weather: Weather; evening: boolean }) {
  const restaurant = useGame((s) => s.game.restaurants[0]);
  const { wrap, box } = useBox();
  const aspect = box.width > 0 && box.height > 0 ? Math.round((box.width / box.height) * 20) / 20 : 0;
  // Never drawn taller than a little wider than square: held upright, the tablet shows the middle of a wide
  // street, the restaurant and its neighbours, rather than a sliver of street under a tall sky.
  const shape = Math.max(aspect || 1364 / 603, NARROWEST_SHAPE);
  const layout = useMemo(() => streetLayout(0, shape, restaurant.location), [shape, restaurant.location]);
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  // The street fills the screen (cut at the edges if need be); it is washed out, so a little softer is fine.
  const cover = box.width > 0 ? Math.max(box.width / layout.width, box.height / layout.height) : 0;
  const streetScale = Math.round(cover * dpr * 0.75 * 20) / 20;
  const special = restaurant.menu.find((d) => recipeKey(d) === restaurant.special) ?? null;
  const look = {
    weather,
    dusk: evening,
    name: restaurant.name,
    special: special ? dishName(special).split(/ · |, with /)[0] : null,
    terraceOpen: false,
  };
  const street = useBaked(
    streetScale > 0 ? `backdrop|${restaurant.location}|${shape}|${weather}|${evening}|${look.name}|${look.special}|${streetScale}` : null,
    () => svgPicture(layout.width, layout.height, streetPicture(new Painter(), layout, look)),
    layout.width,
    layout.height,
    streetScale,
    true,
  );
  const w = Math.round(box.width);
  const h = Math.round(box.height);
  const frame = useBaked(w > 0 ? `frame|${w}|${h}|${dpr}` : null, () => svgPicture(w, h, pageFramePicture(new Painter(), w, h)), w, h, dpr);

  return (
    <div ref={wrap} className="sk-backdrop" aria-hidden="true">
      {street && <img className="sk-backdrop-street" src={street} alt="" />}
      <div className="sk-backdrop-wash" />
      {frame && <img className="sk-backdrop-frame" src={frame} alt="" />}
    </div>
  );
}
