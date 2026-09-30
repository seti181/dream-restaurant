// Interior: decor style and ambiance. See project.md section 6.6.

import { balance } from '../data/balance';
import { DECOR, DECOR_STYLE_IDS, DECOR_STYLES, type DecorId, type DecorStyle } from '../data/decor';
import type { GroupId } from '../data/groups';
import type { Restaurant } from './types';

/** The room's style: the one with the most items, once it has enough of them. */
export function decorStyleOf(decor: DecorId[]): DecorStyle | null {
  let best: DecorStyle | null = null;
  let bestCount = balance.decor.itemsForStyle - 1;
  for (const style of DECOR_STYLE_IDS) {
    const count = decor.filter((id) => DECOR[id].style === style).length;
    if (count > bestCount) {
      best = style;
      bestCount = count;
    }
  }
  return best;
}

/** The player's ambiance: a bare room plus every decor item, at most 100. */
export function ambianceWith(decor: DecorId[]): number {
  return Math.min(100, balance.start.ambiance + decor.reduce((sum, id) => sum + DECOR[id].ambiance, 0));
}

/** Extra appeal to a group from the room's style and an open terrace. */
export function interiorAppeal(restaurant: Restaurant, group: GroupId): number {
  const style = decorStyleOf(restaurant.decor);
  const styleBonus = style && DECOR_STYLES[style].favouredBy.includes(group) ? balance.decor.styleBonus : 0;
  const terraceBonus = restaurant.terraceTables > 0 ? balance.terrace.appeal[group] : 0;
  return styleBonus + terraceBonus;
}
