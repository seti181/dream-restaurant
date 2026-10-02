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
import { PORTUGUESE_CORNER, SECRET_RECIPE, SPECIAL_STAFF, type SpecialStaffId } from '../data/personal';
import { RIVAL_IDS } from '../data/rivals';
import type { Weather } from '../data/weather';
import { helpTable, moveParty, startDay, stepDay, type DayInProgress, type FloorView, type Help } from './day';
import { isFavourite } from './seating';
import { dateOf, isMonday } from './calendar';
import { minuteOfDay, ticksPerDay } from './clock';
import {
  calendarEventsOn,
  calendarEventsStarting,
  conditionsFor,
  rollRandomEvent,
  rollWeather,
} from './events';
import { weeklyBillsDue } from './finance';
import { goalOf, goalText, nextGoal, startGoal, trackGoal, type GoalState } from './goals';
import { planGulls, shooGull, stepGulls, type GullsToday } from './gulls';
import { answerMoment, checkMoments, planMoments, type MomentResult, type MomentsToday } from './moments';
import { pairingsOf } from './menu';
import { isFairDay, isNeptuneDay, neptuneResult, type NeptuneResult, type SeasonTally } from './neptune';
import { regularsDay, regularsNews, type RegularStories, type RegularVisitReport } from './regulars';
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
  /** Days since the season started; day 0 is Monday 8 July. */
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
  /** The last day each choice card came up (a card rests for a while after it has come up). */
  momentsSeen: Partial<Record<MomentId, number>>;
  /** How far each named regular's story has got. */
  regulars: RegularStories;
  /** Dishes and decor unlocked by choice cards (the Portuguese corner). */
  unlocks: string[];
  /** Things coming up because of earlier answers: more of some groups for a while, or a card coming back. */
  upcoming: Upcoming[];
  /** True once the money ran out at the end of a day: the restaurant has closed for good. */
  gameOver: boolean;
  /** The player's restaurant first, then the rivals. */
  restaurants: Restaurant[];
}

/** Something coming up because of an answer to a choice card. */
export interface Upcoming {
  fromDay: number;
  untilDay: number;
  /** Multiplies how many of each group come out. */
  groups?: Partial<Record<GroupId, number>>;
  /** A card that comes back on `fromDay`. */
  card?: MomentId;
  news?: NewsItem;
}

/** A day that is currently being played. */
export interface OpenDay {
  progress: DayInProgress;
  /** The day's own copy of the random generator; handed back to the game at closing. */
  rng: RngState;
  /** Team members who didn't turn up today, and why. */
  absent: { id: number; name: string; excuse: string; special?: SpecialStaffId }[];
  /** The team as it was this morning: they work (and are paid) today, whoever is hired or let go meanwhile. */
  team: Employee[];
  /** Choice cards: when they come, the one on screen, and what was answered. */
  moments: MomentsToday;
  /** Terrace tables to draw, even if the terrace is closed today. */
  terraceBuilt: number;
  /** Help given to waiting tables today, and what the free drinks cost. */
  help: { drinks: number; apologies: number; cash: number };
  /** Gulls on the terrace today. */
  gulls: GullsToday;
  /** Parties the player showed to another table, and how many of those to a favourite spot. */
  seating: { moved: number; favourites: number };
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
  /** The named regulars who came (or tried to) today, and their stories. */
  regulars: RegularVisitReport[];
  /** The choice cards answered today. */
  moments: MomentResult[];
  /** What the answers and the free drinks gained or spent. */
  momentsCash: number;
  /** Free drinks and apologies given to waiting tables. */
  help: { drinks: number; apologies: number; cash: number };
  /** Gulls on the terrace: shooed away, and plates they got. */
  gulls: { shooed: number; stolen: number };
  /** Today's happy hour, if there was one. */
  happyHour: { from: number; until: number } | null;
  /** Guests the player showed to another table, and to a favourite spot. */
  seating: { moved: number; favourites: number };
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
    regulars: {},
    // Ana from Coimbra comes by in week 2 with the Portuguese corner.
    upcoming: [{ fromDay: PORTUGUESE_CORNER.day, untilDay: PORTUGUESE_CORNER.day, card: PORTUGUESE_CORNER.card }],
    unlocks: [],
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
    atTheDoor: [],
    leftTheDoor: [],
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
    team: state.team,
    // Moments get their own generator, so they never change who comes in or what they order.
    moments: planMoments(
      (state.rng.s ^ Math.imul(state.day + 1, 0x9e3779b1)) >>> 0,
      state.day,
      state.momentsSeen,
      state.upcoming.filter((u) => u.card && u.fromDay === state.day).map((u) => u.card!),
    ),
    terraceBuilt: terraceTablesBuilt(state),
    help: { drinks: 0, apologies: 0, cash: 0 },
    seating: { moved: 0, favourites: 0 },
    gulls: planGulls((state.rng.s ^ Math.imul(state.day + 7, 0x85ebca6b)) >>> 0, terraceTables),
  };
}

/** Plays one tick (five in-game minutes). */
export function playTick(open: OpenDay): void {
  stepGulls(open.gulls, open.progress);
  stepDay(open.rng, open.progress);
}

/** The player taps the gull on the terrace. Returns true if there was one to shoo. */
export function shooTheGull(open: OpenDay): boolean {
  return shooGull(open.gulls, open.progress);
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

/**
 * Brings changes made to the menu, the lunch set or the supplier during the day into today's
 * kitchen straight away. (Purchases and new staff wait until tomorrow morning.)
 */
export function updateToday(open: OpenDay, state: GameState): void {
  const player = playerOf(state);
  const today = open.progress.restaurants[0];
  today.menu = player.menu;
  today.lunchSet = player.lunchSet;
  today.supplier = player.supplier;
}

/** Starts today's happy hour now. Returns false if it was already used today, or the day is over. */
export function startHappyHour(open: OpenDay): boolean {
  const player = open.progress.restaurants[0];
  if (player.happyHourFrom !== undefined || open.progress.tick >= ticksPerDay()) return false;
  player.happyHourFrom = minuteOfDay(open.progress.tick);
  return true;
}

/** Today's happy hour: when it started and ends, or null if it hasn't been started. */
export function happyHourToday(open: OpenDay): { from: number; until: number } | null {
  const from = open.progress.restaurants[0].happyHourFrom;
  return from === undefined ? null : { from, until: from + balance.happyHour.minutes };
}

/**
 * Shows the guests at one table to a free one. Returns whether it's one of their favourite
 * spots (which makes them happier), or null if they can't move there.
 */
export function moveGuests(open: OpenDay, from: number, to: number): { favourite: boolean } | null {
  const player = open.progress.restaurants[0];
  const visit = moveParty(open.progress, 0, from, to);
  if (!visit) return null;
  const favourite = isFavourite(visit.party.group, player.location, player.tables, to);
  if (favourite) {
    visit.mood += balance.seating.favouriteMood;
    open.seating.favourites++;
  }
  open.seating.moved++;
  return { favourite };
}

/** The chef's apologies left today. */
export function apologiesLeft(open: OpenDay): number {
  return Math.max(0, balance.help.apologiesPerDay - open.help.apologies);
}

/** What a free drink for the party at a table would cost, or null if nobody there can have one. */
export function drinkCost(open: OpenDay, table: number): number | null {
  const visit = open.progress.floors[0].visits.find((v) => v.tables.includes(table) && !v.eating && !v.skipped);
  return visit && !visit.drink ? balance.help.drinkCostPerGuest * visit.party.size : null;
}

/** Helps the guests at one of the player's tables. Returns false if that help isn't possible. */
export function helpGuests(open: OpenDay, table: number, help: Help): boolean {
  if (help === 'apology' && apologiesLeft(open) === 0) return false;
  const cost = drinkCost(open, table);
  const visit = helpTable(open.progress, 0, table, help);
  if (!visit) return false;
  if (help === 'drink') {
    open.help.drinks++;
    open.help.cash -= cost ?? 0;
  } else {
    open.help.apologies++;
  }
  return true;
}

/** Answers the choice card on screen with its first (0) or second (1) answer. */
export function answerTheMoment(open: OpenDay, choice: 0 | 1): MomentResult | null {
  return answerMoment(open.moments, open.progress, choice);
}

/** The day's numbers, broken down: which groups were served, walked out or found no table, and what sold. */
export interface DayBreakdown {
  served: Partial<Record<GroupId, number>>;
  walkedOut: Partial<Record<GroupId, number>>;
  turnedAway: Partial<Record<GroupId, number>>;
  /** Each dish sold, with how many portions and what they brought in, best sellers first. */
  dishes: { dish: MenuDish; count: number; revenue: number }[];
}

export function dayBreakdown(outcomes: PartyOutcome[], restaurantId: string): DayBreakdown {
  const result: DayBreakdown = { served: {}, walkedOut: {}, turnedAway: {}, dishes: [] };
  const add = (counts: Partial<Record<GroupId, number>>, group: GroupId, n: number) => {
    counts[group] = (counts[group] ?? 0) + n;
  };
  const dishes = new Map<string, { dish: MenuDish; count: number; revenue: number }>();
  for (const o of outcomes) {
    if (o.restaurant !== restaurantId) continue;
    if (o.kind === 'served') {
      add(result.served, o.group, o.size);
      for (const dish of o.order) {
        const key = `${dish.template}/${dish.variant}/${dish.name ?? ''}`;
        const entry = dishes.get(key) ?? { dish, count: 0, revenue: 0 };
        entry.count++;
        entry.revenue += dish.price;
        dishes.set(key, entry);
      }
    } else if (o.kind === 'walkedOut') add(result.walkedOut, o.group, o.size);
    else if (o.kind === 'noTable') add(result.turnedAway, o.group, o.size);
  }
  result.dishes = [...dishes.values()].sort((a, b) => b.revenue - a.revenue);
  return result;
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

/** Adds points to some groups' reputation or awareness, keeping each within 0–100. */
function addToGroups(points: Record<GroupId, number>, change: Partial<Record<GroupId, number>>): Record<GroupId, number> {
  const result = { ...points };
  for (const g of GROUP_IDS) result[g] = Math.max(0, Math.min(100, result[g] + (change[g] ?? 0)));
  return result;
}

/** Ends the day: pays wages and any weekly bills, and moves on to the next day. */
export function closeDay(state: GameState, open: OpenDay): { state: GameState; summary: DaySummary } {
  const playerBefore = playerOf(state);
  const rng = { ...open.rng };
  const tally = tallyFor(open.progress.outcomes, playerBefore.id);

  // What the team got up to: who didn't come in, and any mishaps that cost reputation.
  const staffNews = open.absent.map((a) => a.excuse);
  // The restaurant as it is now, with anything bought during the day, plus what the day
  // changed: how guests feel about it, how many have heard of it, and today's terrace.
  const working = open.progress.restaurants[0];
  let playerAfter = {
    ...playerBefore,
    reputation: working.reputation,
    awareness: working.awareness,
    terraceTables: working.terraceTables,
  };
  for (const person of open.team) {
    const special = person.special && SPECIAL_STAFF[person.special];
    const working = !open.absent.some((a) => a.id === person.id);
    if (!special?.reputationLossPerDay || !working) continue;
    const loss = special.reputationLossPerDay;
    const reputation = { ...playerAfter.reputation };
    for (const g of GROUP_IDS) reputation[g] = Math.max(0, reputation[g] - loss);
    playerAfter = { ...playerAfter, reputation };
    staffNews.push(`${pick(rng, special.mishaps ?? [])} Reputation −${loss} with everyone.`);
  }
  // The regulars who came today: the next part of their story, and what they tell their friends.
  const regularsToday = regularsDay(state.regulars, open.progress.outcomes, playerBefore.id);
  playerAfter = {
    ...playerAfter,
    reputation: addToGroups(playerAfter.reputation, regularsToday.reputation),
    awareness: addToGroups(playerAfter.awareness, regularsToday.awareness),
  };
  // Whoever worked today is paid today; anyone hired during the day starts tomorrow.
  const wages = teamWages({ ...state, team: open.team });
  const { rent, utilities } = weeklyBillsDue(playerBefore, state.day);
  const momentsCash = open.moments.cash + open.help.cash;
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

  // What today's answers set in motion, and the news of anything starting tomorrow.
  const upcoming: Upcoming[] = [
    ...state.upcoming.filter((u) => u.untilDay >= nextDay),
    ...open.moments.results.flatMap((r) => {
      if (!r.followUp) return [];
      const fromDay = state.day + r.followUp.inDays;
      const { groups, card, news } = r.followUp;
      return [{ fromDay, untilDay: fromDay + (r.followUp.days ?? 1) - 1, groups, card, news }];
    }),
  ];
  for (const u of upcoming) if (u.news && u.fromDay === nextDay) news.push(u.news);
  // Anything unlocked today is there tomorrow morning.
  const unlocked = open.moments.results.flatMap((r) => r.unlock ?? []).filter((id) => !state.unlocks.includes(id));
  if (unlocked.length > 0) {
    news.push({
      title: 'A Portuguese corner',
      text: 'Ana’s cabrito assado is waiting in the dish creator, and her azulejo tiles are in the Interior tab. Obrigada, Ana!',
    });
  }

  news.push(...regularsNews(nextDay, regularsToday.stories));
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
    ...open.gulls.reviews,
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
      regulars: regularsToday.stories,
      unlocks: [...state.unlocks, ...unlocked],
      upcoming,
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
      regulars: regularsToday.visits,
      moments: open.moments.results,
      momentsCash,
      help: open.help,
      gulls: { shooed: open.gulls.shooed, stolen: open.gulls.stolen },
      happyHour: happyHourToday(open),
      seating: open.seating,
    },
  };
}
