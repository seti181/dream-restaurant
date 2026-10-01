// Pixel-art icons for the interface, drawn crisp at a whole number of pixels per art pixel.

import type { TemplateId } from '../data/dishes';
import { FOOD_ICONS, ICON_HEIGHT, type IconArt } from './pixel/icons';
import { imageUrl, Pixels } from './pixel/raster';
import { sprite } from './pixel/sprites';

const urls = new Map<string, { url: string; width: number; height: number }>();

/** The icon as an image URL, made once and reused. Food icons are padded to one height so lists line up. */
function iconImage(key: string, art: IconArt, padTo = 0): { url: string; width: number; height: number } {
  const cached = urls.get(key);
  if (cached) return cached;
  let pixels = sprite(art.rows, art.palette);
  if (pixels.height < padTo) {
    const padded = new Pixels(pixels.width, padTo);
    padded.draw(pixels, 0, padTo - pixels.height);
    pixels = padded;
  }
  const made = { url: imageUrl(pixels), width: pixels.width, height: pixels.height };
  urls.set(key, made);
  return made;
}

export function PixelIcon({ art, name, scale = 2, label }: { art: IconArt; name: string; scale?: number; label?: string }) {
  const { url, width, height } = iconImage(name, art);
  return (
    <img
      className="pixel-icon"
      src={url}
      width={width * scale}
      height={height * scale}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
    />
  );
}

/** A little picture of a dish or drink. */
export function FoodIcon({ template, scale = 2 }: { template: TemplateId; scale?: number }) {
  const { url, width, height } = iconImage(`food:${template}`, FOOD_ICONS[template], ICON_HEIGHT);
  return <img className="pixel-icon" src={url} width={width * scale} height={height * scale} alt="" aria-hidden />;
}
