// A rival's cook-off challenge on the Today tab: pick an entry from the menu (or decline) until
// the morning of the duel. See project.md section 6.15, C10.

import { COOK_OFFS } from '../../data/cookOffs';
import { RIVALS } from '../../data/rivals';
import { cookOffEntries, cookOffScore, rivalCookOffScore } from '../../sim/cookOffs';
import { dateOf, WEEKDAY_NAMES } from '../../sim/calendar';
import { inSeasonOn, recipeKey } from '../../sim/menu';
import { withStars } from '../../sim/practice';
import { dishName } from '../format';
import { useGame } from '../store';

export function CookOffCard() {
  const game = useGame((s) => s.game);
  const pick = useGame((s) => s.pickCookOffEntry);
  const planning = useGame((s) => s.phase === 'plan');
  const duel = game.cookOff;
  if (!duel || game.day > duel.day || game.day < duel.offeredDay) return null;
  const kind = COOK_OFFS[duel.rival];
  const rival = RIVALS[duel.rival];
  const inSeason = inSeasonOn(duel.day);
  // The menu as the kitchen will cook it, dish stars and all.
  const player = { ...game.restaurants[0], menu: withStars(game.restaurants[0].menu, game.dishPractice) };
  const entries = cookOffEntries(player, duel.rival, inSeason);
  const theirs = rivalCookOffScore(game.restaurants.find((r) => r.id === duel.rival)!, duel.rival, inSeason);
  const when = duel.day === game.day ? 'tonight' : `on ${WEEKDAY_NAMES[dateOf(duel.day).weekday]}`;

  return (
    <section className="rival-move cook-off">
      <p className="rival-move-from">
        ⚔️ Cook-off · {rival.name} · {rival.owner}
      </p>
      <h2>
        {kind.icon} {kind.title[0].toUpperCase() + kind.title.slice(1)}, judged {when}
      </h2>
      <p>{kind.text}</p>
      <p className="small">
        {kind.hint}{' '}
        {theirs.dish && (
          <span className="muted">
            Their entry, {dishName(theirs.dish)}, scores about {Math.round(theirs.score)}.
          </span>
        )}
      </p>
      {duel.declined ? (
        <p>
          You declined politely. {rival.owner} will tell everyone anyway.
          {planning && duel.day >= game.day && (
            <button type="button" className="secondary quiet" onClick={() => pick(recipeKey(entries[0]))} disabled={entries.length === 0}>
              Change your mind
            </button>
          )}
        </p>
      ) : entries.length === 0 ? (
        <p className="small down">
          You have no {kind.fieldName} on the menu. Add one in the Menu tab before {when === 'tonight' ? 'you open' : when}, or{' '}
          {planning && (
            <button type="button" className="secondary quiet" onClick={() => pick(null)}>
              decline politely
            </button>
          )}
        </p>
      ) : (
        <>
          <p className="small muted">
            {planning
              ? `Pick your entry until the morning of the duel. Score: quality, plus value for money${kind.valueWeight > 1 ? ' (counting double here)' : ''}, plus a little luck on the day.`
              : 'Your entry is set for today.'}
          </p>
          <div className="booking-buttons">
            {entries.map((dish) => {
              const key = recipeKey(dish);
              return (
                <button
                  key={key}
                  type="button"
                  className="secondary"
                  aria-pressed={duel.entry === key}
                  disabled={!planning}
                  onClick={() => pick(key)}
                >
                  {duel.entry === key ? '✓ ' : ''}
                  {dishName(dish)} · {Math.round(cookOffScore(player, dish, inSeason, kind.valueWeight))}
                </button>
              );
            })}
            {planning && (
              <button type="button" className="secondary quiet" onClick={() => pick(null)}>
                Decline politely
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
