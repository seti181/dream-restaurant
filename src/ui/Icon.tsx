// The game's drawn icons (project.md section 9.5, "All the icons"): one sheet with every icon,
// baked once in the background, and an <Icon> that shows one of them. The game's texts and data
// still write emojis; withIcons() swaps each emoji in a piece of text for its drawn icon, and the
// game's JSX runs every element's text through it (src/ui/iconJsx), so no emoji reaches the screen.

import { Fragment, jsx } from 'react/jsx-runtime';
import { useEffect, useState, type ReactNode } from 'react';
import { bake } from './sketch/bake';
import type { TemplateId } from '../data/dishes';
import { ICON_CELL, ICON_COLUMNS, ICON_ROWS, iconCell, iconForEmoji, iconSheet, type IconId } from './sketch/icons';
import { Painter, svgPicture } from './sketch/painter';

// ---------- The sheet ----------

let sheetUrl: string | null = null;
let sheetPromise: Promise<string> | null = null;
const waiting = new Set<(url: string) => void>();

/** Bakes the icon sheet once, in the screen's own pixels (icons are shown up to 64 px across). */
function loadSheet(): Promise<string> {
  if (!sheetPromise) {
    const scale = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const w = ICON_COLUMNS * ICON_CELL;
    const h = ICON_ROWS * ICON_CELL;
    sheetPromise = bake(`icons|${scale}`, () => svgPicture(w, h, iconSheet(new Painter())), w, h, scale, false).then((url) => {
      sheetUrl = url;
      waiting.forEach((done) => done(url));
      return url;
    });
    sheetPromise.catch(() => (sheetPromise = null));
  }
  return sheetPromise;
}

function useIconSheet(): string | null {
  const [url, setUrl] = useState(sheetUrl);
  useEffect(() => {
    if (sheetUrl) {
      setUrl(sheetUrl);
      return;
    }
    waiting.add(setUrl);
    loadSheet().catch(() => {});
    return () => {
      waiting.delete(setUrl);
    };
  }, []);
  return url;
}

// ---------- One icon ----------

/**
 * A drawn icon, `size` pixels square, or the size of the text around it (a little bigger than a
 * letter) when no size is given. With a label it's read out as a picture; without, it's decoration.
 */
export function Icon({ id, size, label, className }: { id: IconId; size?: number; label?: string; className?: string }) {
  const url = useIconSheet();
  const { column, row } = iconCell(id);
  const s = size === undefined ? '1.3em' : `${size}px`;
  return (
    <span
      className={`sk-icon${size === undefined ? ' inline' : ''}${className ? ` ${className}` : ''}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{
        width: s,
        height: s,
        backgroundImage: url ? `url(${url})` : undefined,
        backgroundSize: `calc(${s} * ${ICON_COLUMNS}) calc(${s} * ${ICON_ROWS})`,
        backgroundPosition: `calc(${s} * ${-column}) calc(${s} * ${-row})`,
      }}
    />
  );
}

/** A little picture of a dish or drink; `scale` 2 is about the height of a line of text, 3 a little bigger. */
export function FoodIcon({ template, scale = 2 }: { template: TemplateId; scale?: number }) {
  return <Icon id={`dish:${template}`} size={13 * scale} className="food-icon" />;
}

// ---------- Emojis in text ----------

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
/** Emojis, and the two stars the game writes as plain symbols. */
const PICTURE = /\p{Extended_Pictographic}|\p{Regional_Indicator}|[★☆]/u;

/** A piece of text with each emoji that has a drawn icon swapped for it; the text itself if it has none. */
export function iconiseText(text: string): ReactNode {
  if (!PICTURE.test(text)) return text;
  const parts: ReactNode[] = [];
  let run = '';
  let n = 0;
  for (const { segment } of graphemes.segment(text)) {
    const id = PICTURE.test(segment) ? iconForEmoji(segment) : null;
    if (!id) {
      run += segment;
      continue;
    }
    if (run) parts.push(run);
    run = '';
    parts.push(jsx(Icon, { id }, `i${n++}`));
  }
  if (run) parts.push(run);
  return jsx(Fragment, { children: parts });
}

/** Elements whose text must stay plain text. */
const PLAIN = new Set(['option', 'textarea', 'title', 'style', 'script']);

function iconiseChild(child: unknown, key: string): unknown {
  if (typeof child === 'string') {
    const done = iconiseText(child);
    return done === child ? child : jsx(Fragment, { children: done }, key);
  }
  if (Array.isArray(child)) {
    let changed = false;
    const out = child.map((c, i) => {
      const done = iconiseChild(c, `${key}.${i}`);
      if (done !== c) changed = true;
      return done;
    });
    return changed ? out : child;
  }
  return child;
}

/** An element's props with the emojis in its text children swapped for drawn icons (see src/ui/iconJsx). */
export function withIcons<P>(type: unknown, props: P): P {
  const children = (props as { children?: unknown } | null)?.children;
  if (typeof type !== 'string' || PLAIN.has(type) || children === undefined || children === null) return props;
  const done = iconiseChild(children, 'e');
  return done === children ? props : { ...props, children: done };
}
