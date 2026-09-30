// Planning: time is paused. For now it shows the menu and team, and opens the day.
// Editing the menu and hiring staff arrive in the next checklist item.

import { LOCATIONS } from '../data/locations';
import { dateOf, formatDate } from '../sim/calendar';
import { dailyWages, weeklyBillsDue } from '../sim/finance';
import { playerOf } from '../sim/game';
import { dishName, money } from './format';
import { useGame } from './store';

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

export function PlanScreen() {
  const game = useGame((s) => s.game);
  const open = useGame((s) => s.open);
  const player = playerOf(game);
  const bills = weeklyBillsDue(player, game.day);

  return (
    <main className="screen">
      <div className="card">
        <p className="eyebrow">{formatDate(dateOf(game.day))}</p>
        <h1>{game.day === 0 ? 'Welcome to Gdańsk!' : 'Good morning!'}</h1>
        <p>
          {player.name} on {LOCATIONS[player.location].name} is ready when you are.
        </p>

        <div className="columns">
          <section>
            <h2>Today’s menu</h2>
            <ul className="rows">
              {player.menu.map((dish) => (
                <li key={`${dish.template}-${dish.variant}`}>
                  <span>{dishName(dish)}</span>
                  <span>{money(dish.price)}</span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2>Your team</h2>
            <ul className="rows">
              <li>
                <span>{plural(player.chefs.length, 'chef')}</span>
              </li>
              <li>
                <span>{plural(player.waiters.length, 'waiter')}</span>
              </li>
              <li>
                <span>Wages</span>
                <span>{money(dailyWages(player))} a day</span>
              </li>
            </ul>
          </section>
        </div>

        {bills.rent > 0 && (
          <p className="note">
            It’s Monday, so this week’s rent ({money(bills.rent)}) and utilities ({money(bills.utilities)}) are
            paid tonight.
          </p>
        )}

        <button type="button" className="primary" onClick={open}>
          Open the restaurant
        </button>
      </div>
    </main>
  );
}
