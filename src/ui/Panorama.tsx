// Behind the planning screens and the day report: the restaurant's own street inside the
// sketchbook page frame (SketchBackdrop), by day while planning, in the evening after closing.

import type { ReactNode } from 'react';
import type { Weather } from '../data/weather';
import { SketchBackdrop } from './SketchBackdrop';

/** A screen with the street behind it, washed pale, and the card in front. */
export function PanoramaScreen({ weather, evening, children }: { weather: Weather; evening: boolean; children: ReactNode }) {
  return (
    <main className="screen with-sketch">
      <SketchBackdrop weather={weather} evening={evening} />
      {children}
    </main>
  );
}
