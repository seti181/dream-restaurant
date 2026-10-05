// The restaurant's rank and the way to the next one, on the Mewa tab. See project.md section 6.15, B7.

import { RANKS } from '../data/ranks';
import { playerRating } from '../sim/game';
import { TOP_RANK, totalGuests } from '../sim/ranks';
import { useGame } from './store';

export function RankCard() {
  const game = useGame((s) => s.game);
  const rank = RANKS[game.rank];
  const next = game.rank < TOP_RANK ? RANKS[game.rank + 1] : null;
  const guests = totalGuests(game.guestsServed);
  const rating = playerRating(game);

  return (
    <section className="goal-card rank-card">
      <h2>
        🏅 {game.restaurants[0].name}: {rank.name}
      </h2>
      {next ? (
        <>
          <p>
            Next: <strong>{next.name}</strong> <span className="muted">· {next.unlockText}</span>
          </p>
          <div className="meter" aria-hidden="true">
            <div style={{ width: `${Math.min(1, guests / next.guests) * 100}%` }} />
          </div>
          <p className="small muted">
            {guests.toLocaleString('en-GB')} of {next.guests.toLocaleString('en-GB')} guests served ·{' '}
            {rating.toFixed(1)} ★ of {next.stars.toFixed(1)} ★
            {guests >= next.guests && rating < next.stars && ' · enough guests: now for the stars!'}
            {rating >= next.stars && guests < next.guests && ' · stars enough: now for the guests!'}
          </p>
        </>
      ) : (
        <p>The top of the Old Town. There’s a brass plaque on your front door to prove it.</p>
      )}
    </section>
  );
}
