// The restaurant before opening: see new tables, decor and equipment straight after buying them.

import { useMemo } from 'react';
import { restingFloor } from '../../sim/game';
import { PixelRestaurantView } from '../PixelRestaurantView';
import { useGame } from '../store';

/** Mid-morning, before the doors open. */
const BEFORE_OPENING = 10 * 60 + 30;

export function RestaurantPanel() {
  const game = useGame((s) => s.game);
  const floor = useMemo(() => restingFloor(game), [game]);
  return (
    <div className="restaurant-panel">
      <p className="small muted">
        Your restaurant before the doors open. New tables, decor and equipment show up here as soon as you buy them.
      </p>
      <div className="restaurant-panel-view">
        <PixelRestaurantView floor={floor} weather={game.weather} minute={BEFORE_OPENING} />
      </div>
    </div>
  );
}
