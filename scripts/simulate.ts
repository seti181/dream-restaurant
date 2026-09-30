// Headless balance simulation: plays whole seasons with scripted strategies and
// prints the results. Run with `npm run simulate`. See project.md section 13.

import { balance } from '../src/data/balance';
import { RIVAL_IDS, RIVALS, type RivalId } from '../src/data/rivals';
import { isInSeason, isMonday } from '../src/sim/calendar';
import { runDay } from '../src/sim/day';
import { dailyWages, weeklyBillsDue } from '../src/sim/finance';
import { isFairDay, neptuneScore } from '../src/sim/neptune';
import { createRng } from '../src/sim/rng';
import { createPlayerRestaurant, createRivalRestaurant } from '../src/sim/setup';
import { STRATEGIES, type Strategy } from './strategies';

/** Each strategy plays one season per seed; results are averaged. */
const SEEDS = [1, 2, 3];

interface SeasonResult {
  /** Cash at the end of each week. */
  weeklyCash: number[];
  weeklyProfit: number[];
  lowestCash: number;
  daysInDebt: number;
  guestsServed: number;
  guestsLost: number;
  averageRating: number;
  fairShare: number;
  /** Neptune Score for the player and each rival. */
  neptune: Record<string, number>;
}

function playSeason(strategy: Strategy, seed: number): SeasonResult {
  const rng = createRng(seed);
  let restaurants = [
    createPlayerRestaurant('Test Kitchen', strategy.menu, strategy.chefs, strategy.waiters),
    ...RIVAL_IDS.map(createRivalRestaurant),
  ];
  let cash = balance.finance.startingCash;
  let weekProfit = 0;
  const result: SeasonResult = {
    weeklyCash: [],
    weeklyProfit: [],
    lowestCash: cash,
    daysInDebt: 0,
    guestsServed: 0,
    guestsLost: 0,
    averageRating: 0,
    fairShare: 0,
    neptune: {},
  };
  const ratings = new Map<string, { total: number; count: number }>();
  const fairGuests = new Map<string, number>();
  let allFairGuests = 0;

  for (let day = 0; isInSeason(day); day++) {
    if (day > 0 && isMonday(day)) {
      result.weeklyCash.push(cash);
      result.weeklyProfit.push(weekProfit);
      weekProfit = 0;
    }

    const bills = weeklyBillsDue(restaurants[0], day);
    const { restaurants: after, outcomes } = runDay(rng, day, restaurants);
    restaurants = after;

    let revenue = 0;
    let ingredients = 0;
    for (const o of outcomes) {
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
        revenue += o.revenue;
        ingredients += o.ingredientCost;
        if (o.kind === 'served') result.guestsServed += o.size;
        else result.guestsLost += o.size;
      }
    }

    const profit = revenue - ingredients - dailyWages(restaurants[0]) - bills.rent - bills.utilities;
    cash += profit;
    weekProfit += profit;
    result.lowestCash = Math.min(result.lowestCash, cash);
    if (cash < 0) result.daysInDebt++;
  }
  result.weeklyCash.push(cash);
  result.weeklyProfit.push(weekProfit);

  for (const id of ['player', ...RIVAL_IDS]) {
    const r = ratings.get(id);
    const rating = r ? r.total / r.count : 0;
    const share = allFairGuests > 0 ? (fairGuests.get(id) ?? 0) / allFairGuests : 0;
    result.neptune[id] = neptuneScore(rating, share);
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

const started = performance.now();
const results = STRATEGIES.map((strategy) => ({
  strategy,
  seasons: SEEDS.map((seed) => playSeason(strategy, seed)),
}));

console.log(`\nOld Town Kitchen: season simulation (Normal, seeds ${SEEDS.join(', ')}, averages shown)\n`);

console.log(
  table(
    ['Strategy', 'Final cash', 'Lowest cash', 'Days in debt', 'First profitable week', 'Guests served', 'Guests lost', 'Avg rating', 'Fair share', 'Neptune', 'Best rival', 'Won'],
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
        mean(seasons.map((s) => s.daysInDebt)).toFixed(0),
        firstProfitable < 0 ? 'never' : `week ${firstProfitable + 1}`,
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

console.log(`\nSimulated ${STRATEGIES.length * SEEDS.length} seasons in ${((performance.now() - started) / 1000).toFixed(1)} s.\n`);
