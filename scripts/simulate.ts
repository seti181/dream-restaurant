// Headless balance simulation: plays whole seasons with scripted strategies and
// prints the results. Run with `npm run simulate`. See project.md section 13.
// It uses the real game loop, so weather, events and the rivals' weekly moves all play their part.

import { balance } from '../src/data/balance';
import { RIVAL_IDS, RIVALS, type RivalId } from '../src/data/rivals';
import { isInSeason, isMonday } from '../src/sim/calendar';
import { wageOf } from '../src/sim/finance';
import { minuteOfDay } from '../src/sim/clock';
import { floorView } from '../src/sim/day';
import {
  answerTheMoment,
  closeDay,
  helpGuests,
  momentDue,
  newGame,
  openRestaurant,
  playTick,
  shooTheGull,
  startHappyHour,
  type GameState,
} from '../src/sim/game';
import { isFairDay, neptuneScore } from '../src/sim/neptune';
import { createPlayerRestaurant } from '../src/sim/setup';
import { staffOf } from '../src/sim/staff';
import type { Employee, Role, Staff } from '../src/sim/types';
import { manage, STRATEGIES, type Strategy, type WeekReport } from './strategies';

/** Each strategy plays one season per seed; results are averaged. */
/** Quick runs can pick their own seeds: `SEEDS=1 npm run simulate`. */
const seedsFromEnv = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.SEEDS;
const SEEDS = seedsFromEnv ? seedsFromEnv.split(',').map(Number) : [1, 2, 3];
/** `NO_CARDS=1 npm run simulate` plays without choice cards, to compare against. */
const NO_CARDS = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.NO_CARDS === '1';

interface SeasonResult {
  /** Cash at the end of each week. */
  weeklyCash: number[];
  weeklyProfit: number[];
  lowestCash: number;
  /** The week the money ran out (game over), or null. The season is still played to the end for comparison. */
  bustWeek: number | null;
  /** Tables and staff at the end of the season. */
  tables: number;
  staff: number;
  guestsServed: number;
  guestsLost: number;
  averageRating: number;
  fairShare: number;
  /** Neptune Score for the player and each rival, and what it's made of. */
  neptune: Record<string, number>;
  neptuneParts: Record<string, { rating: number; share: number }>;
}

/** A new game where the player's menu and team are the strategy's. */
function startingGame(strategy: Strategy, seed: number): GameState {
  const game = newGame(seed);
  const hire = (role: Role) => (person: Staff, i: number): Employee => ({
    ...person,
    id: 1000 + i + (role === 'chef' ? 0 : 100),
    role,
    name: `${role} ${i + 1}`,
    bio: '',
    morale: balance.staff.morale.start,
    wage: wageOf(role, person),
  });
  const team = [...strategy.chefs.map(hire('chef')), ...strategy.waiters.map(hire('waiter'))];
  const player = createPlayerRestaurant('Test Kitchen', strategy.menu, staffOf(team, 'chef'), staffOf(team, 'waiter'));
  return { ...game, team, candidates: [], restaurants: [player, ...game.restaurants.slice(1)] };
}

function playSeason(strategy: Strategy, seed: number): SeasonResult {
  let state = startingGame(strategy, seed);
  let weekProfit = 0;
  const result: SeasonResult = {
    weeklyCash: [],
    weeklyProfit: [],
    lowestCash: state.cash,
    bustWeek: null,
    tables: 0,
    staff: 0,
    guestsServed: 0,
    guestsLost: 0,
    averageRating: 0,
    fairShare: 0,
    neptune: {},
    neptuneParts: {},
  };
  const ratings = new Map<string, { total: number; count: number }>();
  const fairGuests = new Map<string, number>();
  let allFairGuests = 0;
  let week: WeekReport = { served: 0, walkedOut: 0, turnedAway: 0, profit: 0 };
  // Opening-day purchases count towards the first week.
  const opening = manage(strategy, state, null);
  weekProfit += opening.cash - state.cash;
  state = opening;

  while (isInSeason(state.day)) {
    const day = state.day;
    if (day > 0 && isMonday(day)) {
      result.weeklyCash.push(state.cash);
      result.weeklyProfit.push(weekProfit);
      weekProfit = 0;
      // Money spent on Monday morning counts towards the new week.
      const before = state.cash;
      state = manage(strategy, state, week);
      weekProfit += state.cash - before;
      week = { served: 0, walkedOut: 0, turnedAway: 0, profit: 0 };
    }

    const open = openRestaurant(state);
    const interactive = strategy.plan?.interactive ?? false;
    while (!open.progress.done) {
      // A player who only watches says no to every card; an interactive one says yes.
      if (!NO_CARDS && momentDue(open)) answerTheMoment(open, interactive ? 0 : 1);
      const happyHourAt = strategy.plan?.happyHourAt;
      if (happyHourAt !== undefined && minuteOfDay(open.progress.tick) >= happyHourAt) startHappyHour(open);
      if (interactive) {
        // Shoos every gull, and looks after tables that have waited a while.
        shooTheGull(open);
        floorView(open.progress, 0).tables.forEach((guests, table) => {
          if (!guests || guests.stage !== 'waiting') return;
          if (guests.impatience > 0.5 && !guests.drink) helpGuests(open, table, 'drink');
          if (guests.impatience > 0.8 && !guests.apology) helpGuests(open, table, 'apology');
        });
      }
      playTick(open);
    }
    for (const o of open.progress.outcomes) {
      if (o.restaurant === null) continue;
      if (o.satisfaction !== null) {
        const r = ratings.get(o.restaurant) ?? { total: 0, count: 0 };
        r.total += o.satisfaction;
        r.count++;
        ratings.set(o.restaurant, r);
      }
      if (o.kind === 'served' && isFairDay(day)) {
        fairGuests.set(o.restaurant, (fairGuests.get(o.restaurant) ?? 0) + o.size);
        allFairGuests += o.size;
      }
      if (o.restaurant === 'player') {
        if (o.kind === 'served') result.guestsServed += o.size;
        else result.guestsLost += o.size;
      }
    }

    const { state: next, summary } = closeDay(state, open);
    weekProfit += next.cash - state.cash;
    week.served += summary.guestsServed;
    week.walkedOut += summary.guestsWalkedOut;
    week.turnedAway += summary.guestsTurnedAway;
    week.profit += summary.profit;
    state = next;
    result.lowestCash = Math.min(result.lowestCash, state.cash);
    if (state.gameOver && result.bustWeek === null) result.bustWeek = Math.floor(day / 7) + 1;
  }
  result.tables = state.restaurants[0].tables;
  result.staff = state.team.length;
  result.weeklyCash.push(state.cash);
  result.weeklyProfit.push(weekProfit);

  for (const id of ['player', ...RIVAL_IDS]) {
    const r = ratings.get(id);
    const rating = r ? r.total / r.count : 0;
    const share = allFairGuests > 0 ? (fairGuests.get(id) ?? 0) / allFairGuests : 0;
    result.neptune[id] = neptuneScore(rating, share);
    result.neptuneParts[id] = { rating, share };
    if (id === 'player') {
      result.averageRating = rating;
      result.fairShare = share;
    }
  }
  return result;
}

// ---------- Averaging and printing ----------

const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

const money = (value: number) => `${Math.round(value).toLocaleString('en-GB')} zł`;

function table(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((row) => row[i].length)));
  const line = (cells: string[]) =>
    cells.map((cell, i) => (i === 0 ? cell.padEnd(widths[i]) : cell.padStart(widths[i]))).join('  ');
  return [line(headers), line(widths.map((w) => '-'.repeat(w))), ...rows.map(line)].join('\n');
}

/** How many seasons went bust, and in which week on average. */
function bustText(seasons: SeasonResult[]): string {
  const weeks = seasons.map((s) => s.bustWeek).filter((w): w is number => w !== null);
  return weeks.length === 0 ? `0/${seasons.length}` : `${weeks.length}/${seasons.length}, wk ${Math.round(mean(weeks))}`;
}

const started = performance.now();
const results = STRATEGIES.map((strategy) => ({
  strategy,
  seasons: SEEDS.map((seed) => playSeason(strategy, seed)),
}));

console.log(`\nOld Town Kitchen: season simulation (Normal, seeds ${SEEDS.join(', ')}, averages shown)\n`);

console.log(
  table(
    ['Strategy', 'Final cash', 'Lowest cash', 'Went bust', 'First profitable week', 'Tables', 'Staff', 'Guests served', 'Guests lost', 'Avg rating', 'Fair share', 'Neptune', 'Best rival', 'Won'],
    results.map(({ strategy, seasons }) => {
      const weeklyProfit = seasons[0].weeklyProfit.map((_, w) => mean(seasons.map((s) => s.weeklyProfit[w])));
      const firstProfitable = weeklyProfit.findIndex((p) => p > 0);
      const rivalScores = RIVAL_IDS.map((id) => ({ id, score: mean(seasons.map((s) => s.neptune[id])) }));
      const bestRival = rivalScores.reduce((a, b) => (b.score > a.score ? b : a));
      const wins = seasons.filter((s) => RIVAL_IDS.every((id) => s.neptune.player > s.neptune[id])).length;
      return [
        strategy.name,
        money(mean(seasons.map((s) => s.weeklyCash[s.weeklyCash.length - 1]))),
        money(mean(seasons.map((s) => s.lowestCash))),
        bustText(seasons),
        firstProfitable < 0 ? 'never' : `week ${firstProfitable + 1}`,
        mean(seasons.map((s) => s.tables)).toFixed(1),
        mean(seasons.map((s) => s.staff)).toFixed(1),
        Math.round(mean(seasons.map((s) => s.guestsServed))).toLocaleString('en-GB'),
        Math.round(mean(seasons.map((s) => s.guestsLost))).toLocaleString('en-GB'),
        mean(seasons.map((s) => s.averageRating)).toFixed(1),
        `${(mean(seasons.map((s) => s.fairShare)) * 100).toFixed(1)}%`,
        mean(seasons.map((s) => s.neptune.player)).toFixed(1),
        `${RIVALS[bestRival.id as RivalId].name} ${bestRival.score.toFixed(1)}`,
        `${wins}/${seasons.length}`,
      ];
    }),
  ),
);

console.log('\nCash at the end of each week\n');
const weeks = results[0].seasons[0].weeklyCash.length;
console.log(
  table(
    ['Week', ...results.map(({ strategy }) => strategy.name)],
    Array.from({ length: weeks }, (_, w) => [
      String(w + 1),
      ...results.map(({ seasons }) => money(mean(seasons.map((s) => s.weeklyCash[w])))),
    ]),
  ),
);

// What each Golden Neptune score is made of, in the balanced strategy's seasons.
const balanced = results.find(({ strategy }) => strategy.name === 'balanced');
if (balanced) {
  console.log('\nGolden Neptune in the balanced seasons: average rating and share of Fair guests\n');
  console.log(
    table(
      ['Restaurant', 'Rating', 'Fair share', 'Neptune'],
      ['player', ...RIVAL_IDS].map((id) => [
        id,
        mean(balanced.seasons.map((s) => s.neptuneParts[id].rating)).toFixed(1),
        `${(mean(balanced.seasons.map((s) => s.neptuneParts[id].share)) * 100).toFixed(1)}%`,
        mean(balanced.seasons.map((s) => s.neptune[id])).toFixed(1),
      ]),
    ),
  );
}

console.log(`\nSimulated ${STRATEGIES.length * SEEDS.length} seasons in ${((performance.now() - started) / 1000).toFixed(1)} s.\n`);
