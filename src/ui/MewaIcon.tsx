// Mewa herself, in pixel art: a herring gull with a white head, grey wings with black tips,
// a yellow beak with the red spot, and pink legs. The same Mewa who sits on the windowsill.

import { MEWA, MEWA_COLOURS } from './pixel/sprites';
import { PixelIcon } from './PixelIcon';

/** `size` is roughly the height in screen pixels; she's drawn at the nearest crisp scale. */
export function MewaIcon({ size = 48 }: { size?: number }) {
  const scale = Math.max(1, Math.round(size / MEWA.length / 1.3));
  return <PixelIcon art={{ rows: MEWA, palette: MEWA_COLOURS }} name="mewa" scale={scale} label="Mewa" />;
}
