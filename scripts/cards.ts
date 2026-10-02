// Which choice cards come up over a season, and how often: a check for repetitive cards.
// Plays whole seasons with the "balanced" player, saying yes to every card.
// Run with `npx tsx scripts/cards.ts [seasons]`.

import { MOMENT_IDS, MOMENTS, type MomentId } from '../src/data/moments';
import { isInSeason, isMonday } from '../src/sim/calendar';
import { answerTheMoment, closeDay, momentDue, newGame, openRestaurant, playTick } from '../src/sim/game';
import { manage, STRATEGIES, type WeekReport } from './strategies';

const argv = (globalThis as { process?: { argv: string[] } }).process?.argv ?? [];
const seasons = Number(argv[2] ?? 5);
const counts = new Map<MomentId, number>();
const daysWith = new Map<MomentId, number>();
let days = 0;
let cards = 0;
let sameAsYesterday = 0;
const sample: string[] = [];

for (let s = 0; s < seasons; s++) {
  const strategy = STRATEGIES.find((st) => st.name === 'balanced') ?? STRATEGIES[0];
  let state = newGame(1000 + s);
  let week: WeekReport = { served: 0, walkedOut: 0, turnedAway: 0, profit: 0 };
  let yesterday: MomentId[] = [];
  while (isInSeason(state.day)) {
    if (state.day > 0 && isMonday(state.day)) {
      state = manage(strategy, state, week);
      week = { served: 0, walkedOut: 0, turnedAway: 0, profit: 0 };
    }
    const open = openRestaurant(state);
    const today: MomentId[] = [];
    while (!open.progress.done) {
      if (momentDue(open)) {
        today.push(open.moments.pending!.id);
        answerTheMoment(open, 0);
      }
      playTick(open);
    }
    for (const id of today) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
      if (yesterday.includes(id)) sameAsYesterday++;
    }
    for (const id of new Set(today)) daysWith.set(id, (daysWith.get(id) ?? 0) + 1);
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

console.log(`${seasons} seasons, ${days} days, ${cards} cards (${(cards / days).toFixed(1)} a day)`);
console.log(`A card seen again the very next day: ${sameAsYesterday} times\n`);
console.log('Card                          rarity     shown  per season  days apart (avg)');
const perSeason = (n: number) => n / seasons;
for (const id of [...MOMENT_IDS].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))) {
  const n = counts.get(id) ?? 0;
  const apart = n > 0 ? ((days / seasons) / perSeason(daysWith.get(id) ?? 1)).toFixed(1) : '-';
  console.log(`${id.padEnd(30)}${MOMENTS[id].rarity.padEnd(11)}${String(n).padStart(5)}${perSeason(n).toFixed(1).padStart(12)}${apart.padStart(17)}`);
}
console.log('\nThe first season, day by day:');
for (const line of sample) console.log(line);
