// Mewa herself, drawn in the sketchbook look: a herring gull with a white head, grey wings with
// black tips, a yellow beak with the red spot, and orange legs. The same Mewa who sits on the picture
// frame in the restaurant.

import { Icon } from './Icon';

/**
 * `size` is roughly the height in screen pixels.
 * `label` names her for screen readers: Mewa, or just "a gull" where she stands for any gull.
 */
export function MewaIcon({ size = 48, label = 'Mewa' }: { size?: number; label?: string }) {
  return <Icon id="mewa" size={size} label={label} />;
}
