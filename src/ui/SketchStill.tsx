// M8's first step (project.md section 9.5): the Kashubian sketchbook concept as a still picture
// behind the day screen. It only shows with "?sketch" at the end of the game's address, until the
// next M8 items make the new view playable; normal play keeps the pixel-art restaurant.

import { useEffect, useState } from 'react';
import { bake } from './sketch/bake';
import { stillPageSvg } from './sketch/page';
import { PAGE_H, PAGE_W } from './sketch/palette';

export const sketchWanted = typeof location !== 'undefined' && new URLSearchParams(location.search).has('sketch');

export function SketchStill() {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    // Drawn at the size it covers the screen, in the screen's own pixels, so the lines stay crisp.
    const scale = Math.max(window.innerWidth / PAGE_W, window.innerHeight / PAGE_H) * (window.devicePixelRatio || 1);
    bake(`still|${scale.toFixed(2)}`, stillPageSvg, PAGE_W, PAGE_H, scale)
      .then((u) => alive && setUrl(u))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return <div className="sketch-still">{url && <img src={url} alt="" draggable={false} />}</div>;
}
