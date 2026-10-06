// A member of the team, head and shoulders, drawn in the sketchbook look like the people in the
// restaurant (the same look for the same person), and looking as they feel. Baked once per person
// and mood (sketch/bake.ts).

import { useEffect, useState } from 'react';
import type { Mood } from '../sim/staff';
import { bake } from './sketch/bake';
import { lookFor, type SketchKind } from './sketch/cast';
import { Painter, svgPicture } from './sketch/painter';
import { figure, type Pose } from './sketch/people';

/** The portrait's box, in page units; shown at the same size in pixels. */
const W = 72;
const H = 84;

const FACES: Record<Mood, Pose> = {
  happy: { mouth: 'laugh', eyes: 'happy' },
  fine: { mouth: 'smile' },
  tired: { mouth: 'o' },
  wornOut: { mouth: 'frown', arms: 'cross' },
};

export function Portrait({ kind, variant, mood }: { kind: SketchKind; variant: number; mood: Mood }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const scale = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
    const draw = () => svgPicture(W, H, figure(new Painter(), W / 2, H + 34, 150, lookFor(kind, variant), { sit: true, arms: 'rest', ...FACES[mood] }));
    bake(`portrait|${kind}|${variant}|${mood}|${scale}`, draw, W, H, scale, false)
      .then((u) => alive && setUrl(u))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [kind, variant, mood]);
  return <span className="portrait" style={{ width: W, height: H, backgroundImage: url ? `url(${url})` : undefined }} aria-hidden="true" />;
}
