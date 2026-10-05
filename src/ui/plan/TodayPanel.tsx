// Planning overview: where you are, what's on, and anything that needs attention.

import { balance } from '../../data/balance';
import { HAPPENINGS } from '../../data/happenings';
import { LOCATIONS } from '../../data/locations';
import { RANKS } from '../../data/ranks';
import { WEATHER } from '../../data/weather';
import { happeningIn } from '../../sim/events';
import { weeklyBillsDue } from '../../sim/finance';
import { eventsToday, playerOf, teamWages, type GameState } from '../../sim/game';
import { freshOn, inSeasonOn, produceName, specialOf } from '../../sim/menu';
import { dishName, money } from '../format';
import { GoalCard } from '../Mewa';
import { BookingsBox } from './BookingsBox';
import { DAILY_GOALS } from '../../data/dailyGoals';
import { dailyGoalText } from '../../sim/dailyGoals';
import { RankingBox } from './RankingBox';
import { WEATHER_ICONS } from '../pixel/icons';
import { FoodIcon, PixelIcon } from '../PixelIcon';
import { useGame } from '../store';

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** Things that would spoil the day, in plain words. */
export function planWarnings(game: GameState): string[] {
  const player = playerOf(game);
  const warnings: string[] = [];
  if (player.menu.length === 0) warnings.push('Your menu is empty, so no guests can order. Add a dish on the Menu tab.');
  if (player.chefs.length === 0) warnings.push('Nobody is cooking! Hire a chef on the Staff tab.');
  if (player.waiters.length === 0) warnings.push('No waiters: orders will be very slow. Hire one on the Staff tab.');
  const dailyCosts = teamWages(game) + LOCATIONS[player.location].rentPerDay;
  if (game.cash < dailyCosts * balance.finance.lowCashDays) {
    warnings.push(
      'Money is running low! If it runs out at the end of a day, the restaurant has to close for good. Cut costs or win back guests.',
    );
  }
  return warnings;
}

/** Mewa's small goal for today, under the week's. */
function DailyGoalCard() {
  const goal = useGame((s) => s.game.dailyGoal);
  if (!goal) return null;
  const details = DAILY_GOALS[goal.id];
  return (
    <section className="goal-card daily-goal">
      <p>
        <strong>
          🎯 Today: {details.icon} {dailyGoalText(goal)}
        </strong>{' '}
        <span className="muted">· reward {money(details.reward)}</span>
      </p>
    </section>
  );
}

/** Today's special on the board outside, or a nudge to choose one. */
function SpecialLine() {
  const game = useGame((s) => s.game);
  const special = specialOf(playerOf(game));
  if (!special) return <p className="muted">⭐ No special on the board today. Tap ☆ next to a dish in the Menu tab.</p>;
  const fresh = freshOn(special, inSeasonOn(game.day));
  return (
    <p>
      ⭐ <strong>Dziś polecamy:</strong> {dishName(special)}
      {fresh.length > 0 && ` · 🌱 fresh ${fresh.map(produceName).join(' and ')}`}
    </p>
  );
}

export function TodayPanel() {
  const game = useGame((s) => s.game);
  const player = playerOf(game);
  const bills = weeklyBillsDue(player, game.day);
  // Once the doors are open, the real weather (the forecast can be wrong) and what's still on.
  const weather = useGame((s) => s.openDay?.weather ?? s.game.weather);
  const happening = happeningIn(game.happening, weather);

  return (
    <div>
      <h1>{game.day === 0 ? 'Welcome to Gdańsk!' : 'Good morning!'}</h1>
      <p>
        {player.name}, {RANKS[game.rank].inSentence} on {LOCATIONS[player.location].name}, is ready when you are.
      </p>

      <RankingBox />

      <section className="today-news">
        <h2>Today in Gdańsk</h2>
        <p>
          <PixelIcon art={WEATHER_ICONS[weather]} name={`weather:${weather}`} /> {WEATHER[weather].forecast}
        </p>
        {happening && (
          <p>
            {HAPPENINGS[happening].icon} {HAPPENINGS[happening].text}
          </p>
        )}
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
        <SpecialLine />
      </section>

      <BookingsBox />

      <GoalCard />
      <DailyGoalCard />

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
                <span>
                  <FoodIcon template={dish.template} /> {dishName(dish)}
                </span>
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
