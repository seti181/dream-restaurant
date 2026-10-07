// Which choice cards come up over a season, and how often: a check for repetitive cards.
// Plays whole seasons with one of the simulator's players, answering every card the same way.
// Run with `npx tsx scripts/cards.ts [seasons] [strategy] [yes|no]`, e.g. `npx tsx scripts/cards.ts 10 "do nothing" no`.

import { MOMENT_IDS, MOMENTS, type MomentId } from '../src/data/moments';
import { isInSeason, isMonday } from '../src/sim/calendar';
import { answerTheMoment, closeDay, momentDue, newGame, openRestaurant, playTick } from '../src/sim/game';
import { manage, STRATEGIES, type WeekReport } from './strategies';

const argv = (globalThis as { process?: { argv: string[] } }).process?.argv ?? [];
const seasons = Number(argv[2] ?? 5);
const strategyName = argv[3] ?? 'balanced';
const answer: 0 | 1 = argv[4] === 'no' ? 1 : 0;
const strategy = STRATEGIES.find((st) => st.name === strategyName);
if (!strategy) throw new Error(`No strategy called "${strategyName}". Try: ${STRATEGIES.map((s) => s.name).join(', ')}`);

const counts = new Map<MomentId, number>();
/** For each card, the days it came up in each season. */
const daysOf = new Map<MomentId, number[][]>();
let days = 0;
let cards = 0;
let sameAsYesterday = 0;
const sample: string[] = [];

for (let s = 0; s < seasons; s++) {
  let state = newGame(1000 + s);
  let week: WeekReport = { served: 0, walkedOut: 0, turnedAway: 0, profit: 0, openTicks: 0, fullTicks: 0 };
  let yesterday: MomentId[] = [];
  while (isInSeason(state.day) && !state.gameOver) {
    if (state.day > 0 && isMonday(state.day)) {
      state = manage(strategy, state, week);
      week = { served: 0, walkedOut: 0, turnedAway: 0, profit: 0, openTicks: 0, fullTicks: 0 };
    }
    const open = openRestaurant(state);
    const today: MomentId[] = [];
    while (!open.progress.done) {
      if (momentDue(open)) {
        today.push(open.moments.pending!.id);
        answerTheMoment(open, answer);
      }
      playTick(open);
    }
    for (const id of today) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
      if (yesterday.includes(id)) sameAsYesterday++;
      const seasonsOfCard = daysOf.get(id) ?? [];
      (seasonsOfCard[s] ??= []).push(state.day);
      daysOf.set(id, seasonsOfCard);
    }
    if (s === 0) sample.push(`day ${String(state.day).padStart(2)}: ${today.join(', ')}`);
    cards += today.length;
    days++;
    yesterday = today;
    const { state: next, summary } = closeDay(state, open);
    week.served += summary.guestsServed;
    week.walkedOut += summary.guestsWalkedOut;
    week.turnedAway += summary.guestsTurnedAway;
    week.profit += summary.profit;
    state = next;
  }
}

/** The fewest days between two appearances of a card in the same season, or null if it never came twice. */
function shortestGap(id: MomentId): number | null {
  let best: number | null = null;
  for (const seasonDays of daysOf.get(id) ?? []) {
    for (let i = 1; i < (seasonDays?.length ?? 0); i++) {
      const gap = seasonDays[i] - seasonDays[i - 1];
      if (best === null || gap < best) best = gap;
    }
  }
  return best;
}

console.log(`${strategyName}, answering ${answer === 0 ? 'yes' : 'no'}: ${seasons} seasons, ${days} days, ${cards} cards (${(cards / days).toFixed(1)} a day)`);
console.log(`A card seen again the very next day: ${sameAsYesterday} times\n`);
console.log('Card                          rarity     shown  per season  shortest gap (days)');
const perSeason = (n: number) => n / seasons;
for (const id of [...MOMENT_IDS].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))) {
  const n = counts.get(id) ?? 0;
  const gap = shortestGap(id);
  console.log(
    `${id.padEnd(30)}${MOMENTS[id].rarity.padEnd(11)}${String(n).padStart(5)}${perSeason(n).toFixed(1).padStart(12)}${String(gap ?? '-').padStart(16)}`,
  );
}
console.log('\nThe first season, day by day:');
for (const line of sample) console.log(line);
