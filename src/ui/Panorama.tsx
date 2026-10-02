// The riverside along the bottom of the planning screens and the day report:
// by day while planning, in the evening after closing, with the Fair's stalls in August.

import type { ReactNode } from 'react';
import type { Weather } from '../data/weather';
import { drawPanorama, panoramaSky } from './pixel/panorama';
import { imageUrl } from './pixel/raster';

/** Each kind of panorama is drawn once and kept. */
const drawn = new Map<string, string>();

function panoramaUrl(evening: boolean, fair: boolean): string {
  const key = `${evening}:${fair}`;
  let url = drawn.get(key);
  if (!url) {
    url = imageUrl(drawPanorama({ evening, fair }));
    drawn.set(key, url);
  }
  return url;
}

/** A screen with the sky behind it and the riverside along the bottom, below the card (or behind it). */
export function PanoramaScreen({
  weather,
  evening,
  fair,
  behind = false,
  children,
}: {
  weather: Weather;
  evening: boolean;
  fair: boolean;
  /** Just a background: the card keeps its full size and may cover the riverside (the day screen). */
  behind?: boolean;
  children: ReactNode;
}) {
  return (
    <main
      className={behind ? 'screen with-panorama behind' : 'screen with-panorama'}
      style={{ background: panoramaSky(weather, evening) }}
    >
      <div className="panorama" aria-hidden="true">
        <img src={panoramaUrl(evening, fair)} alt="" />
      </div>
      {children}
    </main>
  );
}
