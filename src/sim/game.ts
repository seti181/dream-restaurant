// The whole game and the rhythm of a day: plan, open, and close with the day's results.
// See project.md section 4.

import { balance } from '../data/balance';
import type { MenuDish } from '../data/dishes';
import { CALENDAR_EVENTS, RANDOM_EVENTS, type RandomEventId } from '../data/events';
import type { MomentId } from '../data/moments';
import { GROUP_IDS, type GroupId } from '../data/groups';
import { CAMPAIGNS, type CampaignId } from '../data/marketing';
import { FIRST_GOAL, type TipId } from '../data/mewa';
import { LOCATIONS } from '../data/locations';
import { SECRET_RECIPE, SPECIAL_STAFF, type SpecialStaffId } from '../data/personal';
import { RIVAL_IDS } from '../data/rivals';
import type { Weather } from '../data/weather';
import { startDay, stepDay, type DayInProgress, type FloorView } from './day';
import { dateOf, isMonday } from './calendar';
import {
  calendarEventsOn,
  calendarEventsStarting,
  conditionsFor,
  rollRandomEvent,
  rollWeather,
} from './events';
import { weeklyBillsDue } from './finance';
import { goalOf, goalText, nextGoal, startGoal, trackGoal, type GoalState } from './goals';
import { answerMoment, checkMoments, planMoments, type MomentResult, type MomentsToday } from './moments';
import { pairingsOf } from './menu';
import { isFairDay, isNeptuneDay, neptuneResult, type NeptuneResult, type SeasonTally } from './neptune';
import { planRivalWeek, rivalAwarenessToday } from './rivalAi';
import { chance, createRng, pick, type RngState } from './rng';
import { createPlayerRestaurant, createRivalRestaurant } from './setup';
import { generateCandidates, specialCandidate, specialsLookingForWork, starterTeam, staffOf } from './staff';
import type { Employee, PartyOutcome, Restaurant, Review, SatisfactionFactors } from './types';

/** A line of news for the morning: an event starting, a surprise, or a rival's move. */
export interface NewsItem {
  title: string;
  text: string;
}

/** Guests each restaurant served (by group) and turned away this week. The rivals study it on Mondays. */
export interface WeekTally {
  served: Record<string, Partial<Record<GroupId, number>>>;
  turnedAway: Record<string, number>;
}

export type Difficulty = 'relaxed' | 'normal';

/** Everything that makes up a game in progress. Plain data, so it can be saved. */
export interface GameState {
  difficulty: Difficulty;
  /** Days since the season started; day 0 is Monday 1 April. */
  day: number;
  cash: number;
  rng: RngState;
  /** How many dishes the player's menu can hold. */
  menuSlots: number;
  /** The player's staff. The player's restaurant always mirrors this list. */
  team: Employee[];
  /** This week's job candidates; a new pool arrives every Monday. */
  candidates: Employee[];
  /** The id the next new person will get. */
  nextEmployeeId: number;
  /** Last day the summer terrace permit is valid, or null without one. */
  terracePermitUntilDay: number | null;
  /** Marketing campaigns running, each until the end of its last day. */
  campaigns: { id: CampaignId; untilDay: number }[];
  /** Today's weather. */
  weather: Weather;
  /** Surprise events, from their first to their last day. */
  events: { id: RandomEventId; fromDay: number; untilDay: number }[];
  /** This morning's news. */
  news: NewsItem[];
  week: WeekTally;
  /** Mewa's tutorial tips already seen, or all of them switched off. */
  mewa: { seenTips: TipId[]; tipsOff: boolean };
  /** This week's goal from Mewa. */
  goal: GoalState;
  /** Ratings and Fair guests since the last Golden Neptune. */
  season: SeasonTally;
  /** Golden Neptunes won. */
  trophies: number;
  /** True once Mewa has found the secret recipe card. */
  secretRecipe: boolean;
  /** The last day each choice card came up, so the same ones don't keep coming back. */
  momentsSeen: Partial<Record<MomentId, number>>;
  /** True once the money ran out at the end of a day: the restaurant has closed for good. */
  gameOver: boolean;
  /** The player's restaurant first, then the rivals. */
  restaurants: Restaurant[];
}

/** A day that is currently being played. */
export interface OpenDay {
  progress: DayInProgress;
  /** The day's own copy of the random generator; handed back to the game at closing. */
  rng: RngState;
  /** Team members who didn't turn up today, and why. */
  absent: { id: number; name: string; excuse: string; special?: SpecialStaffId }[];
  /** Choice cards: when they come, the one on screen, and what was answered. */
  moments: MomentsToday;
  /** Terrace tables to draw, even if the terrace is closed today. */
  terraceBuilt: number;
}

/** The player's numbers for a day, so far or in total. */
export interface DayTally {
  guestsServed: number;
  guestsWalkedOut: number;
  guestsTurnedAway: number;
  revenue: number;
  ingredientCost: number;
  /** Average satisfaction (0–100) of served guests, or null if nobody was served. */
  averageSatisfaction: number | null;
}

export interface GroupDay {
  served: number;
  /** Walked out or found no free table. */
  lost: number;
  reputationBefore: number;
  reputationAfter: number;
}

export interface DaySummary extends DayTally {
  day: number;
  wages: number;
  rent: number;
  utilities: number;
  profit: number;
  ratingBefore: number;
  ratingAfter: number;
  groups: Record<GroupId, GroupDay>;
  /** Average of each satisfaction factor over served parties, or null if nobody was served. */
  feedback: SatisfactionFactors | null;
  /** Portions sold of each dish, best sellers first. */
  dishesSold: { dish: MenuDish; count: number }[];
  /** Guests each rival served today. */
  rivals: { id: string; name: string; guestsServed: number }[];
  /** Lunch sets ordered today. */
  lunchSetsSold: number;
  /** What guests said about pairings they tasted: hints for the dish creator. */
  pairingComments: { comment: string; happy: boolean }[];
  weather: Weather;
  /** Events that were on today. */
  events: string[];
  /** Reviews written today, the critic's first. */
  reviews: Review[];
  /** Mewa's goal, if it was completed today. */
  goalCompleted: { text: string; reward: number } | null;
  /** The Golden Neptune, on the day it is awarded. */
  neptune: NeptuneResult | null;
  /** Absences and mishaps in the team today. */
  staffNews: string[];
  /** The choice cards answered today. */
  moments: MomentResult[];
  /** What the answers gained or spent. */
  momentsCash: number;
}

export function newGame(seed: number, difficulty: Difficulty = 'normal'): GameState {
  const start = balance.start;
  const rng = createRng(seed);
  const team = starterTeam();
  const candidates = generateCandidates(rng, team.length + 1, namesOf(team));
  return {
    difficulty,
    day: 0,
    cash: balance.difficulty[difficulty].startingCash,
    rng,
    menuSlots: balance.menu.startingSlots,
    team,
    candidates,
    nextEmployeeId: team.length + candidates.length + 1,
    terracePermitUntilDay: null,
    campaigns: [],
    weather: rollWeather(rng, 0),
    events: [],
    news: [],
    week: { served: {}, turnedAway: {} },
    mewa: { seenTips: [], tipsOff: false },
    goal: startGoal(FIRST_GOAL),
    season: { ratings: {}, fairGuests: {} },
    trophies: 0,
    secretRecipe: false,
    momentsSeen: {},
    gameOver: false,
    restaurants: [
      createPlayerRestaurant(start.name, start.menu, staffOf(team, 'chef'), staffOf(team, 'waiter')),
      ...RIVAL_IDS.map(createRivalRestaurant),
    ],
  };
}

function namesOf(people: Employee[]): Set<string> {
  return new Set(people.map((person) => person.name));
}

export function playerOf(state: GameState): Restaurant {
  return state.restaurants[0];
}

/** What the player's team costs per day. */
export function teamWages(state: GameState): number {
  return state.team.reduce((sum, person) => sum + person.wage, 0);
}

/** Star rating from 0 to 5: the average reputation across all groups. */
export function starRating(restaurant: Restaurant): number {
  const total = GROUP_IDS.reduce((sum, group) => sum + restaurant.reputation[group], 0);
  return total / GROUP_IDS.length / 20;
}

/** True if the player's terrace is open on this day: a valid permit, in terrace season, and no rain today. */
export function terraceOpenOn(state: GameState, day: number): boolean {
  const { month } = dateOf(day);
  const inSeason = month >= balance.terrace.firstMonth && month <= balance.terrace.lastMonth;
  const dry = day !== state.day || state.weather !== 'rain';
  return inSeason && dry && state.terracePermitUntilDay !== null && day <= state.terracePermitUntilDay;
}

/** Terrace tables the player has: all of them while the permit is valid, whether or not the terrace is open today. */
export function terraceTablesBuilt(state: GameState): number {
  const permit = state.terracePermitUntilDay !== null && state.day <= state.terracePermitUntilDay;
  return permit ? Math.floor(LOCATIONS[playerOf(state).location].terraceSeats / balance.service.seatsPerTable) : 0;
}

/** Names of every event on today, calendar and surprise. */
export function eventsToday(state: GameState): string[] {
  const surprises = state.events
    .filter((e) => e.fromDay <= state.day && e.untilDay >= state.day)
    .map((e) => RANDOM_EVENTS[e.id].name);
  return [...calendarEventsOn(state.day).map((id) => CALENDAR_EVENTS[id].name), ...surprises];
}

/**
 * Today's awareness: running campaigns raise it (less as it nears 100);
 * without one, it slowly fades back towards where it started.
 */
export function awarenessToday(state: GameState): Record<GroupId, number> {
  const { awareness } = playerOf(state);
  const running = state.campaigns.filter((c) => c.untilDay >= state.day);
  const start = balance.start.awareness;
  const today = { ...awareness };
  for (const group of GROUP_IDS) {
    const boost = running.reduce((sum, c) => sum + (CAMPAIGNS[c.id].boost[group] ?? 0), 0);
    today[group] =
      boost > 0
        ? awareness[group] + boost * (1 - awareness[group] / 100)
        : awareness[group] - Math.max(0, awareness[group] - start) * balance.marketing.fadePerDay;
  }
  return today;
}

/**
 * The restaurant before opening: the tables (and the terrace, if it's open today), decor and
 * equipment, and the team in place, but no guests yet. Drawn by the restaurant view while planning.
 */
export function restingFloor(state: GameState): FloorView {
  const player = playerOf(state);
  const terraceTables = terraceOpenOn(state, state.day) ? terraceTablesBuilt(state) : 0;
  return {
    location: player.location,
    tables: Array<null>(player.tables + terraceTables).fill(null),
    insideTables: player.tables,
    terraceTables: terraceTablesBuilt(state),
    chefsBusy: state.team.filter((person) => person.role === 'chef').map(() => false),
    waiters: state.team.filter((person) => person.role === 'waiter').map((person) => person.special ?? null),
    ordersWaiting: 0,
    walkouts: [],
    decor: player.decor,
    equipment: player.equipment,
  };
}

export function openRestaurant(state: GameState): OpenDay {
  const [player, ...rivals] = state.restaurants;
  const terraceTables = terraceOpenOn(state, state.day)
    ? Math.floor(LOCATIONS[player.location].terraceSeats / balance.service.seatsPerTable)
    : 0;
  // Someone who sometimes doesn't turn up decides this morning.
  const rng = { ...state.rng };
  const absent: OpenDay['absent'] = [];
  for (const person of state.team) {
    const special = person.special && SPECIAL_STAFF[person.special];
    if (special?.absenceChance && chance(rng, special.absenceChance)) {
      absent.push({ id: person.id, name: person.name, excuse: pick(rng, special.excuses ?? []), special: person.special });
    }
  }
  const working = state.team.filter((person) => !absent.some((a) => a.id === person.id));
  const today = {
    ...player,
    terraceTables,
    awareness: awarenessToday(state),
    chefs: staffOf(working, 'chef'),
    waiters: staffOf(working, 'waiter'),
  };
  const rivalsToday = rivals.map((rival) => ({ ...rival, awareness: rivalAwarenessToday(rival) }));
  return {
    progress: startDay(state.day, [today, ...rivalsToday], conditionsFor(state)),
    rng,
    absent,
    // Moments get their own generator, so they never change who comes in or what they order.
    moments: planMoments((state.rng.s ^ Math.imul(state.day + 1, 0x9e3779b1)) >>> 0, state.day, state.momentsSeen),
    terraceBuilt: terraceTablesBuilt(state),
  };
}

/** Plays one tick (five in-game minutes). */
export function playTick(open: OpenDay): void {
  stepDay(open.rng, open.progress);
}

/**
 * Checks for a choice card before the next tick. Returns true while one is waiting
 * for an answer: the clock should stop until answerMoment() is called.
 */
export function momentDue(open: OpenDay): boolean {
  return checkMoments(open.moments, {
    progress: open.progress,
    adrianAway: open.absent.some((a) => a.special === 'adrian'),
  });
}

/** Answers the choice card on screen with its first (0) or second (1) answer. */
export function answerTheMoment(open: OpenDay, choice: 0 | 1): MomentResult | null {
  return answerMoment(open.moments, open.progress, choice);
}

/** The player's results from a list of party outcomes. */
export function tallyFor(outcomes: PartyOutcome[], restaurantId: string): DayTally {
  const tally: DayTally = {
    guestsServed: 0,
    guestsWalkedOut: 0,
    guestsTurnedAway: 0,
    revenue: 0,
    ingredientCost: 0,
    averageSatisfaction: null,
  };
  let satisfactionTotal = 0;
  let servedParties = 0;
  for (const o of outcomes) {
    if (o.restaurant !== restaurantId) continue;
    tally.revenue += o.revenue;
    tally.ingredientCost += o.ingredientCost;
    if (o.kind === 'served') {
      tally.guestsServed += o.size;
      satisfactionTotal += o.satisfaction ?? 0;
      servedParties++;
    } else if (o.kind === 'walkedOut') {
      tally.guestsWalkedOut += o.size;
    } else if (o.kind === 'noTable') {
      tally.guestsTurnedAway += o.size;
    }
  }
  if (servedParties > 0) tally.averageSatisfaction = satisfactionTotal / servedParties;
  return tally;
}

function groupDays(outcomes: PartyOutcome[], before: Restaurant, after: Restaurant): Record<GroupId, GroupDay> {
  const groups = Object.fromEntries(
    GROUP_IDS.map((g) => [
      g,
      { served: 0, lost: 0, reputationBefore: before.reputation[g], reputationAfter: after.reputation[g] },
    ]),
  ) as Record<GroupId, GroupDay>;
  for (const o of outcomes) {
    if (o.restaurant !== before.id) continue;
    if (o.kind === 'served') groups[o.group].served += o.size;
    else if (o.kind === 'walkedOut' || o.kind === 'noTable') groups[o.group].lost += o.size;
  }
  return groups;
}

function averageFeedback(outcomes: PartyOutcome[], restaurantId: string): SatisfactionFactors | null {
  const served = outcomes.filter((o) => o.restaurant === restaurantId && o.factors !== null);
  if (served.length === 0) return null;
  const mean = (key: keyof SatisfactionFactors) =>
    served.reduce((sum, o) => sum + o.factors![key], 0) / served.length;
  return {
    quality: mean('quality'),
    value: mean('value'),
    wait: mean('wait'),
    ambiance: mean('ambiance'),
    service: mean('service'),
  };
}

function dishesSold(outcomes: PartyOutcome[], restaurantId: string): { dish: MenuDish; count: number }[] {
  const counts = new Map<string, { dish: MenuDish; count: number }>();
  for (const o of outcomes) {
    if (o.restaurant !== restaurantId || o.kind !== 'served') continue;
    for (const dish of o.order) {
      const key = `${dish.template}/${dish.variant}`;
      const entry = counts.get(key) ?? { dish, count: 0 };
      entry.count++;
      counts.set(key, entry);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

function pairingComments(outcomes: PartyOutcome[], restaurantId: string): { comment: string; happy: boolean }[] {
  const comments = new Map<string, boolean>();
  for (const o of outcomes) {
    if (o.restaurant !== restaurantId || o.kind !== 'served') continue;
    for (const dish of o.order) {
      for (const pairing of pairingsOf(dish)) comments.set(pairing.comment, pairing.quality > 0);
    }
  }
  return [...comments].map(([comment, happy]) => ({ comment, happy })).sort((a, b) => Number(b.happy) - Number(a.happy));
}

/** Adds a day's ratings, and any Fair guests, to the season's tally. */
function addToSeason(season: SeasonTally, outcomes: PartyOutcome[], day: number): SeasonTally {
  const ratings: SeasonTally['ratings'] = Object.fromEntries(
    Object.entries(season.ratings).map(([id, r]) => [id, { ...r }]),
  );
  const fairGuests = { ...season.fairGuests };
  const fair = isFairDay(day);
  for (const o of outcomes) {
    if (o.restaurant === null) continue;
    if (o.satisfaction !== null) {
      const r = (ratings[o.restaurant] ??= { total: 0, count: 0 });
      r.total += o.satisfaction;
      r.count++;
    }
    if (fair && o.kind === 'served') fairGuests[o.restaurant] = (fairGuests[o.restaurant] ?? 0) + o.size;
  }
  return { ratings, fairGuests };
}

/** Adds a day's guests to the week's tally. */
function addToWeek(week: WeekTally, outcomes: PartyOutcome[]): WeekTally {
  const served: WeekTally['served'] = Object.fromEntries(
    Object.entries(week.served).map(([id, groups]) => [id, { ...groups }]),
  );
  const turnedAway = { ...week.turnedAway };
  for (const o of outcomes) {
    if (o.restaurant === null) continue;
    if (o.kind === 'served') {
      const groups = (served[o.restaurant] ??= {});
      groups[o.group] = (groups[o.group] ?? 0) + o.size;
    } else if (o.kind === 'noTable') {
      turnedAway[o.restaurant] = (turnedAway[o.restaurant] ?? 0) + o.size;
    }
  }
  return { served, turnedAway };
}

/** Ends the day: pays wages and any weekly bills, and moves on to the next day. */
export function closeDay(state: GameState, open: OpenDay): { state: GameState; summary: DaySummary } {
  const playerBefore = playerOf(state);
  const rng = { ...open.rng };
  const tally = tallyFor(open.progress.outcomes, playerBefore.id);

  // What the team got up to: who didn't come in, and any mishaps that cost reputation.
  const staffNews = open.absent.map((a) => a.excuse);
  let playerAfter = { ...open.progress.restaurants[0], chefs: playerBefore.chefs, waiters: playerBefore.waiters };
  for (const person of state.team) {
    const special = person.special && SPECIAL_STAFF[person.special];
    const working = !open.absent.some((a) => a.id === person.id);
    if (!special?.reputationLossPerDay || !working) continue;
    const loss = special.reputationLossPerDay;
    const reputation = { ...playerAfter.reputation };
    for (const g of GROUP_IDS) reputation[g] = Math.max(0, reputation[g] - loss);
    playerAfter = { ...playerAfter, reputation };
    staffNews.push(`${pick(rng, special.mishaps ?? [])} Reputation −${loss} with everyone.`);
  }
  const wages = teamWages(state);
  const { rent, utilities } = weeklyBillsDue(playerBefore, state.day);
  const momentsCash = open.moments.cash;
  const profit = tally.revenue - tally.ingredientCost - wages - rent - utilities + momentsCash;

  const nextDay = state.day + 1;
  const news: NewsItem[] = [];
  const week = addToWeek(state.week, open.progress.outcomes);
  let restaurants = [playerAfter, ...open.progress.restaurants.slice(1)];
  let { candidates, nextEmployeeId } = state;
  let cash = state.cash + profit;
  let nextWeek = week;

  if (isMonday(nextDay)) {
    // A new week brings new faces looking for work, sometimes familiar ones...
    const specials = specialsLookingForWork(nextDay, state.team);
    const taken = namesOf(state.team);
    for (const id of specials) taken.add(SPECIAL_STAFF[id].name);
    candidates = generateCandidates(rng, nextEmployeeId, taken);
    nextEmployeeId += candidates.length;
    for (const id of specials) candidates.push(specialCandidate(id, nextEmployeeId++));
    // ...and the rivals make their moves, having studied last week.
    const planned = planRivalWeek({ ...state, restaurants, week }, rng);
    restaurants = planned.restaurants;
    planned.news.forEach((text, i) => news.push({ title: restaurants[i + 1].name, text }));
    nextWeek = { served: {}, turnedAway: {} };
  }

  for (const id of calendarEventsStarting(nextDay)) {
    news.push({ title: CALENDAR_EVENTS[id].name, text: CALENDAR_EVENTS[id].description });
  }

  // Maybe something unexpected happens tomorrow.
  const events = state.events.filter((e) => e.untilDay >= nextDay);
  const surprise = events.length === 0 ? rollRandomEvent(rng) : null;
  if (surprise) {
    const event = RANDOM_EVENTS[surprise];
    events.push({ id: surprise, fromDay: nextDay, untilDay: nextDay + event.days - 1 });
    news.push({ title: event.name, text: pick(rng, event.descriptions) });
    if (event.cash) cash += event.cash;
    if (event.awareness) {
      const [player, ...rivals] = restaurants;
      const awareness = { ...player.awareness };
      for (const g of GROUP_IDS) awareness[g] = Math.min(100, awareness[g] + event.awareness!);
      restaurants = [{ ...player, awareness }, ...rivals];
    }
  }

  const outcomes = open.progress.outcomes;
  const groups = groupDays(outcomes, playerBefore, playerAfter);
  const reviews = [
    ...outcomes.filter((o) => o.restaurant === playerBefore.id && o.review !== null).map((o) => o.review!),
    ...open.moments.results.flatMap((m) => (m.review ? [m.review] : [])),
  ].sort((a, b) => Number(b.critic) - Number(a.critic));
  const lunchSetsSold = outcomes
    .filter((o) => o.restaurant === playerBefore.id && o.kind === 'served')
    .reduce((sum, o) => sum + o.order.filter((d) => d.fromLunchSet).length / 2, 0);

  // Mewa's goal: count today, and pay the reward the moment it's done.
  let goal = trackGoal(state.goal, {
    guestsServed: tally.guestsServed,
    servedByGroup: Object.fromEntries(GROUP_IDS.map((g) => [g, groups[g].served])),
    fiveStarReviews: reviews.filter((r) => r.stars === 5).length,
    profit,
    lunchSetsSold,
    averageSatisfaction: tally.averageSatisfaction,
    player: restaurants[0],
  });
  let goalCompleted: DaySummary['goalCompleted'] = null;
  if (goal.done && !state.goal.done) {
    const reward = goalOf(goal).reward;
    cash += reward;
    goalCompleted = { text: goalText(goalOf(goal)), reward };
  }
  if (isMonday(nextDay)) {
    goal = nextGoal(rng, state.goal.index);
    news.push({ title: 'Mewa’s goal for the week', text: `${goalText(goalOf(goal))}. Reward: ${goalOf(goal).reward} zł.` });
  }

  // Mewa finds the secret recipe once the restaurant is doing well, or by week 3 at the latest.
  let { secretRecipe } = state;
  if (!secretRecipe && (starRating(playerAfter) >= SECRET_RECIPE.unlockStars || nextDay >= SECRET_RECIPE.unlockByDay)) {
    secretRecipe = true;
    news.push({ ...SECRET_RECIPE.news });
  }

  // The Golden Neptune, on the last day of the Fair.
  let season = addToSeason(state.season, outcomes, state.day);
  let neptune: NeptuneResult | null = null;
  let { trophies } = state;
  if (isNeptuneDay(state.day)) {
    neptune = neptuneResult(season, open.progress.restaurants);
    if (neptune.playerWon) trophies += 1;
    season = { ratings: {}, fairGuests: {} };
  }

  return {
    state: {
      ...state,
      day: nextDay,
      cash,
      rng,
      candidates,
      nextEmployeeId,
      campaigns: state.campaigns.filter((c) => c.untilDay > state.day),
      weather: rollWeather(rng, nextDay),
      events,
      news,
      week: nextWeek,
      goal,
      season,
      trophies,
      secretRecipe,
      momentsSeen: { ...state.momentsSeen, ...Object.fromEntries(open.moments.seen.map((id) => [id, state.day])) },
      // Running out of money ends the game.
      gameOver: state.gameOver || cash <= 0,
      restaurants,
    },
    summary: {
      ...tally,
      day: state.day,
      wages,
      rent,
      utilities,
      profit,
      ratingBefore: starRating(playerBefore),
      ratingAfter: starRating(playerAfter),
      groups,
      feedback: averageFeedback(outcomes, playerBefore.id),
      dishesSold: dishesSold(outcomes, playerBefore.id),
      pairingComments: pairingComments(outcomes, playerBefore.id),
      lunchSetsSold,
      rivals: open.progress.restaurants.slice(1).map((rival) => ({
        id: rival.id,
        name: rival.name,
        guestsServed: tallyFor(outcomes, rival.id).guestsServed,
      })),
      weather: state.weather,
      events: eventsToday(state),
      reviews,
      goalCompleted,
      neptune,
      staffNews,
      moments: open.moments.results,
      momentsCash,
    },
  };
}
