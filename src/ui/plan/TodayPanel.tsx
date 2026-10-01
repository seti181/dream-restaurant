// Planning overview: where you are, what's on, and anything that needs attention.

import { LOCATIONS } from '../../data/locations';
import { WEATHER } from '../../data/weather';
import { weeklyBillsDue } from '../../sim/finance';
import { eventsToday, playerOf, teamWages, type GameState } from '../../sim/game';
import { dishName, money } from '../format';
import { GoalCard } from '../Mewa';
import { useGame } from '../store';

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** Things that would spoil the day, in plain words. */
export function planWarnings(game: GameState): string[] {
  const player = playerOf(game);
  const warnings: string[] = [];
  if (player.menu.length === 0) warnings.push('Your menu is empty, so no guests can order. Add a dish on the Menu tab.');
  if (player.chefs.length === 0) warnings.push('Nobody is cooking! Hire a chef on the Staff tab.');
  if (player.waiters.length === 0) warnings.push('No waiters: orders will be very slow. Hire one on the Staff tab.');
  return warnings;
}

export function TodayPanel() {
  const game = useGame((s) => s.game);
  const player = playerOf(game);
  const bills = weeklyBillsDue(player, game.day);

  return (
    <div>
      <h1>{game.day === 0 ? 'Welcome to Gdańsk!' : 'Good morning!'}</h1>
      <p>
        {player.name} on {LOCATIONS[player.location].name} is ready when you are.
      </p>

      <section className="today-news">
        <h2>Today in Gdańsk</h2>
        <p>
          {WEATHER[game.weather].icon} {WEATHER[game.weather].forecast}
        </p>
        {eventsToday(game).length > 0 && (
          <p>
            🎪 <strong>On today:</strong> {eventsToday(game).join(' · ')}
          </p>
        )}
        {game.news.map((item) => (
          <p key={item.title + item.text} className="news-item">
            <strong>{item.title}:</strong> {item.text}
          </p>
        ))}
      </section>

      <GoalCard />

      {planWarnings(game).map((warning) => (
        <p key={warning} className="note warning">
          {warning}
        </p>
      ))}
      {bills.rent > 0 && (
        <p className="note">
          It’s Monday, so this week’s rent ({money(bills.rent)}) and utilities ({money(bills.utilities)}) are paid
          tonight.
        </p>
      )}

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
              <span>{money(teamWages(game))} a day</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
