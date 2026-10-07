// Player actions during planning. Each one takes the game state and returns a new one;
// the old state is never changed. Invalid actions return the state unchanged.

import { balance } from '../data/balance';
import { DISH_TEMPLATES, EXTRAS, type EquipmentId, type ExtraId, type MenuDish, type TemplateId } from '../data/dishes';
import { DECOR, type DecorId } from '../data/decor';
import { EQUIPMENT } from '../data/equipment';
import { GROUP_IDS } from '../data/groups';
import { LOCATIONS, type LocationId } from '../data/locations';
import { CAMPAIGNS, type CampaignId } from '../data/marketing';
import type { BuildingWorkId } from '../data/works';
import type { TipId } from '../data/mewa';
import { REPLIES, type ReplyId } from '../data/reviews';
import { canReply } from './reviews';
import { playerOf, type Difficulty, type GameState } from './game';
import { dateOf, daysInMonth, nextDayOn } from './calendar';
import { ambianceWith } from './interior';
import { recipeKey } from './menu';
import { maxMenuSlots } from './ranks';
import { weekOf } from './themeNights';
import { THEME_NIGHTS, type ThemeNightId } from '../data/themeNights';
import { awayOn, fairWageOf, offOn, onCourseOn, staffOf, underpaid } from './staff';
import type { Employee, Restaurant, Review, Supplier } from './types';

function withPlayer(state: GameState, changes: Partial<Restaurant>): GameState {
  const [player, ...rivals] = state.restaurants;
  return { ...state, restaurants: [{ ...player, ...changes }, ...rivals] };
}

/** Lowest and highest allowed price for a dish. */
export function priceRange(template: TemplateId): { min: number; max: number } {
  const isDessert = DISH_TEMPLATES[template].category === 'dessert';
  return { min: balance.menu.minPrice, max: isDessert ? balance.menu.maxDessertPrice : Infinity };
}

function clampPrice(template: TemplateId, price: number): number {
  const { min, max } = priceRange(template);
  return Math.max(min, Math.min(max, Math.round(price)));
}

/** Why this extra can't go on this dish, or null if it can. */
export function extraUnavailableReason(template: TemplateId, chosen: ExtraId[], extra: ExtraId): string | null {
  if (chosen.includes(extra)) return null; // already chosen: it can always be taken off again
  if (!EXTRAS[extra].categories.includes(DISH_TEMPLATES[template].category)) return 'Doesn’t suit this dish';
  if (chosen.length >= balance.menu.maxExtras) return `Up to ${balance.menu.maxExtras} extras`;
  return null;
}

/** Why a dish can't be added to the menu right now, or null if it can. */
export function dishUnavailableReason(
  state: GameState,
  template: TemplateId,
  variant: string,
  extras: ExtraId[] = [],
): string | null {
  const player = playerOf(state);
  if (DISH_TEMPLATES[template].secret && !state.secretRecipe) return 'A secret recipe, not found yet';
  if (DISH_TEMPLATES[template].unlockable && !state.unlocks.includes(template)) return 'Not discovered yet';
  const needs = DISH_TEMPLATES[template].equipment;
  if (needs !== null && !player.equipment.includes(needs)) return `Needs a ${EQUIPMENT[needs].name.toLowerCase()}`;
  if (!DISH_TEMPLATES[template].variants.some((v) => v.id === variant)) return 'Unknown recipe';
  const recipe = recipeKey({ template, variant, extras, price: 0 });
  if (player.menu.some((dish) => recipeKey(dish) === recipe)) return 'Already on your menu';
  if (player.menu.length >= state.menuSlots) return 'Your menu is full';
  if (new Set(extras).size !== extras.length || extras.length > balance.menu.maxExtras) return 'Too many extras';
  if (extras.some((extra) => !EXTRAS[extra].categories.includes(DISH_TEMPLATES[template].category))) {
    return 'An extra doesn’t suit this dish';
  }
  return null;
}

/** Adds a dish, with any extras and name, at the typical Old Town price. */
export function addDish(
  state: GameState,
  template: TemplateId,
  variant: string,
  extras: ExtraId[] = [],
  name = '',
): GameState {
  if (dishUnavailableReason(state, template, variant, extras) !== null) return state;
  const dish: MenuDish = { template, variant, price: clampPrice(template, DISH_TEMPLATES[template].referencePrice) };
  if (extras.length > 0) dish.extras = [...extras];
  const cleanName = name.trim().slice(0, balance.menu.maxNameLength);
  if (cleanName) dish.name = cleanName;
  return withPlayer(state, { menu: [...playerOf(state).menu, dish] });
}

export function removeDish(state: GameState, index: number): GameState {
  const { menu, lunchSet } = playerOf(state);
  if (index < 0 || index >= menu.length) return state;
  const removed = recipeKey(menu[index]);
  // A lunch set can't be served without both of its dishes.
  const keepSet = lunchSet && lunchSet.soup !== removed && lunchSet.main !== removed;
  return withPlayer(state, { menu: menu.filter((_, i) => i !== index), lunchSet: keepSet ? lunchSet : null });
}

/** Makes a dish today's special ("Dziś polecamy"), or takes it off the board if it already is. */
export function toggleSpecial(state: GameState, index: number): GameState {
  const { menu, special } = playerOf(state);
  if (index < 0 || index >= menu.length) return state;
  const key = recipeKey(menu[index]);
  return withPlayer(state, { special: special === key ? undefined : key });
}

export function setDishPrice(state: GameState, index: number, price: number): GameState {
  const menu = playerOf(state).menu;
  const dish = menu[index];
  if (!dish) return state;
  const newPrice = clampPrice(dish.template, price);
  return withPlayer(state, { menu: menu.map((d, i) => (i === index ? { ...d, price: newPrice } : d)) });
}

/** Replaces the team, keeping the restaurant's chefs and waiters in step. */
function withTeam(state: GameState, team: Employee[]): GameState {
  return withPlayer({ ...state, team }, { chefs: staffOf(team, 'chef'), waiters: staffOf(team, 'waiter') });
}

/** Moves a candidate onto the team. */
export function hire(state: GameState, candidateId: number): GameState {
  const person = state.candidates.find((c) => c.id === candidateId);
  if (!person) return state;
  const hired = withTeam(state, [...state.team, { ...person, since: state.day }]);
  return { ...hired, candidates: state.candidates.filter((c) => c.id !== candidateId) };
}

/** Says goodbye to a team member. */
export function letGo(state: GameState, employeeId: number): GameState {
  if (!state.team.some((person) => person.id === employeeId)) return state;
  return withTeam(state, state.team.filter((person) => person.id !== employeeId));
}

/** Why this person can't be away from work that day, or null if they can: someone has to cook and serve. */
function awayUnavailableReason(state: GameState, person: Employee, day: number): string | null {
  const cover = state.team.filter((p) => p.role === person.role && p.id !== person.id && !awayOn(p, day));
  if (cover.length === 0) return person.role === 'chef' ? 'Someone has to cook' : 'Someone has to serve';
  return null;
}

/** Why this person can't have that day off, or null if they can. */
export function dayOffUnavailableReason(state: GameState, employeeId: number, day: number): string | null {
  const person = state.team.find((p) => p.id === employeeId);
  if (!person) return 'Not on the team';
  if (onCourseOn(person, day)) return 'On a course that day';
  return awayUnavailableReason(state, person, day);
}

/** Gives someone that day off, or takes the day off back if they already have it. */
export function toggleDayOff(state: GameState, employeeId: number, day: number): GameState {
  const person = state.team.find((p) => p.id === employeeId);
  if (!person) return state;
  if (offOn(person, day)) {
    const { dayOff: _undo, ...rest } = person;
    return withTeam(state, state.team.map((p) => (p.id === employeeId ? rest : p)));
  }
  if (dayOffUnavailableReason(state, employeeId, day) !== null) return state;
  return withTeam(state, state.team.map((p) => (p.id === employeeId ? { ...p, dayOff: day } : p)));
}

/** What a course costs: so much for each level it takes someone to. */
export function courseCost(person: Employee, stat: 'skill' | 'speed'): number {
  return balance.staff.training.costPerLevel * (person[stat] + 1);
}

/** Why this person can't go on that course on that day, or null if they can. */
export function courseUnavailableReason(state: GameState, employeeId: number, stat: 'skill' | 'speed', day: number): string | null {
  const person = state.team.find((p) => p.id === employeeId);
  if (!person) return 'Not on the team';
  if (person[stat] >= 5) return 'Already the best';
  if (person.course) return 'Already booked on a course';
  if (offOn(person, day)) return 'Has the day off';
  return awayUnavailableReason(state, person, day) ?? cantAfford(state, courseCost(person, stat));
}

/** Books someone on a one-day course (paid now), or cancels it with the money back. */
export function toggleCourse(state: GameState, employeeId: number, stat: 'skill' | 'speed', day: number): GameState {
  const person = state.team.find((p) => p.id === employeeId);
  if (!person) return state;
  if (person.course?.day === day && person.course.stat === stat) {
    const { course: _cancelled, ...rest } = person;
    const team = state.team.map((p) => (p.id === employeeId ? rest : p));
    return { ...withTeam(state, team), cash: state.cash + courseCost(person, stat) };
  }
  if (courseUnavailableReason(state, employeeId, stat, day) !== null) return state;
  const team = state.team.map((p) => (p.id === employeeId ? { ...p, course: { day, stat } } : p));
  return { ...withTeam(state, team), cash: state.cash - courseCost(person, stat) };
}

/** Raises someone's wage to what their skill and speed are worth, which cheers them up. */
export function giveRaise(state: GameState, employeeId: number): GameState {
  const person = state.team.find((p) => p.id === employeeId);
  if (!person || !underpaid(person)) return state;
  const morale = Math.min(100, person.morale + balance.staff.morale.raise);
  return withTeam(state, state.team.map((p) => (p.id === employeeId ? { ...p, wage: fairWageOf(p), morale } : p)));
}

// ---------- Replying to reviews ----------

/**
 * Answers an unhappy review: a kind reply wins the guest's group back a little, an invitation
 * (dessert on the house) a little more; standing your ground does the opposite.
 * Returns the game and what came of it.
 */
export function replyToReview(state: GameState, review: Review, reply: ReplyId): { state: GameState; result: string } {
  if (!canReply(review)) return { state, result: '' };
  const answer = REPLIES[reply];
  const group = review.group!;
  const player = playerOf(state);
  const reputation = { ...player.reputation, [group]: Math.max(0, Math.min(100, player.reputation[group] + answer.reputation)) };
  // Which of the answers comes back depends on the review, so it is the same every time.
  const result = answer.results[(review.text.length + review.stars) % answer.results.length];
  const who = review.reviewer[0].toUpperCase() + review.reviewer.slice(1);
  return {
    state: { ...withPlayer(state, { reputation }), cash: state.cash + (answer.cash ?? 0) },
    result: result.replace('{who}', who),
  };
}

// ---------- Kitchen ----------

/** Why this can't be bought right now, or null if it can. */
function cantAfford(state: GameState, cost: number): string | null {
  return state.cash < cost ? 'Not enough cash' : null;
}

export function equipmentUnavailableReason(state: GameState, id: EquipmentId): string | null {
  const player = playerOf(state);
  if (player.equipment.includes(id)) return 'Already in your kitchen';
  if (player.equipment.length >= LOCATIONS[player.location].equipmentSlots) return 'No room left in this kitchen';
  return cantAfford(state, EQUIPMENT[id].cost);
}

export function buyEquipment(state: GameState, id: EquipmentId): GameState {
  if (equipmentUnavailableReason(state, id) !== null) return state;
  const bought = withPlayer(state, { equipment: [...playerOf(state).equipment, id] });
  return { ...bought, cash: state.cash - EQUIPMENT[id].cost };
}

export function menuBoardUnavailableReason(state: GameState): string | null {
  if (state.menuSlots >= maxMenuSlots(state.rank)) return 'Your menu board is as big as it gets';
  return cantAfford(state, balance.menu.slotUpgrade.cost);
}

/** A bigger menu board: room for more dishes. */
export function upgradeMenuBoard(state: GameState): GameState {
  if (menuBoardUnavailableReason(state) !== null) return state;
  const { slots, cost } = balance.menu.slotUpgrade;
  return { ...state, menuSlots: Math.min(maxMenuSlots(state.rank), state.menuSlots + slots), cash: state.cash - cost };
}

export function setSupplier(state: GameState, supplier: Supplier): GameState {
  return withPlayer(state, { supplier });
}

// ---------- Lunch set ----------

/**
 * Sets up the lunch set from a soup and a main on the menu (by position).
 * A brand-new set starts a little cheaper than the two dishes bought separately.
 */
export function setLunchSet(state: GameState, soupIndex: number, mainIndex: number): GameState {
  const { menu, lunchSet } = playerOf(state);
  const soup = menu[soupIndex];
  const main = menu[mainIndex];
  if (!soup || !main) return state;
  if (DISH_TEMPLATES[soup.template].category !== 'soup' || DISH_TEMPLATES[main.template].category !== 'main') {
    return state;
  }
  const price = lunchSet?.price ?? Math.round((soup.price + main.price) * balance.lunchSet.startingPriceShare);
  return withPlayer(state, { lunchSet: { soup: recipeKey(soup), main: recipeKey(main), price } });
}

export function setLunchSetPrice(state: GameState, price: number): GameState {
  const { lunchSet } = playerOf(state);
  if (!lunchSet) return state;
  return withPlayer(state, { lunchSet: { ...lunchSet, price: Math.max(balance.menu.minPrice, Math.round(price)) } });
}

export function clearLunchSet(state: GameState): GameState {
  return withPlayer(state, { lunchSet: null });
}

// ---------- Interior and terrace ----------

export function tableUnavailableReason(state: GameState): string | null {
  const player = playerOf(state);
  const maxTables = Math.floor(LOCATIONS[player.location].maxSeats / balance.service.seatsPerTable);
  if (player.tables >= maxTables) return 'The room is full';
  return cantAfford(state, balance.interior.tableCost);
}

/** One more table of four seats. */
export function buyTable(state: GameState): GameState {
  if (tableUnavailableReason(state) !== null) return state;
  const bought = withPlayer(state, { tables: playerOf(state).tables + 1 });
  return { ...bought, cash: state.cash - balance.interior.tableCost };
}

/** What a piece of building work costs (balance.works). */
export function workCost(id: BuildingWorkId): number {
  return { counter: balance.works.counterCost, toilet: balance.works.toiletCost, cellar: balance.works.cellarCost }[id];
}

/** Why this building work can't be done, or null if it can. */
export function workUnavailableReason(state: GameState, id: BuildingWorkId): string | null {
  const works = playerOf(state).works ?? [];
  if (works.includes(id)) return 'Already done';
  if (id === 'cellar' && !works.includes('toilet')) return 'The sanepid inspector wants a toilet first';
  return cantAfford(state, workCost(id));
}

/** Has the building work done (it's ready the next morning, like any purchase), and pays for it. */
export function buildWork(state: GameState, id: BuildingWorkId): GameState {
  if (workUnavailableReason(state, id) !== null) return state;
  const built = withPlayer(state, { works: [...(playerOf(state).works ?? []), id] });
  return { ...built, cash: state.cash - workCost(id) };
}

export function decorUnavailableReason(state: GameState, id: DecorId): string | null {
  if (DECOR[id].unlockable && !state.unlocks.includes(id)) return 'Not discovered yet';
  if (DECOR[id].found && !playerOf(state).decor.includes(id)) return 'Only Mewa can find this';
  if (playerOf(state).decor.includes(id)) return 'Already in your dining room';
  return cantAfford(state, DECOR[id].cost);
}

export function buyDecor(state: GameState, id: DecorId): GameState {
  if (decorUnavailableReason(state, id) !== null) return state;
  const decor = [...playerOf(state).decor, id];
  const bought = withPlayer(state, { decor, ambiance: ambianceWith(decor) });
  return { ...bought, cash: state.cash - DECOR[id].cost };
}

export function terraceUnavailableReason(state: GameState): string | null {
  if (state.terracePermitUntilDay !== null && state.day <= state.terracePermitUntilDay) {
    return 'You already have this season’s permit';
  }
  if (dateOf(state.day).month > balance.terrace.lastMonth) return 'Terrace season is over for this year';
  return cantAfford(state, balance.terrace.permitCost);
}

/** A permit for this year's terrace season, valid until its last day. */
export function buyTerracePermit(state: GameState): GameState {
  if (terraceUnavailableReason(state) !== null) return state;
  const lastMonth = balance.terrace.lastMonth;
  const untilDay = nextDayOn(lastMonth, daysInMonth(lastMonth), state.day);
  return { ...state, terracePermitUntilDay: untilDay, cash: state.cash - balance.terrace.permitCost };
}

// ---------- Marketing ----------

export function campaignUnavailableReason(state: GameState, id: CampaignId): string | null {
  if (state.campaigns.some((c) => c.id === id && c.untilDay >= state.day)) return 'Already running';
  return cantAfford(state, CAMPAIGNS[id].cost);
}

/** Last day a campaign started today would run. */
export function campaignEndDay(state: GameState, id: CampaignId): number {
  const { days } = CAMPAIGNS[id];
  if (days !== 'season') return state.day + days - 1;
  const seasonEnd = balance.calendar.seasonLengthDays - 1;
  // After the season, a "rest of the season" listing runs for a season's length.
  return state.day <= seasonEnd ? seasonEnd : state.day + balance.calendar.seasonLengthDays - 1;
}

export function launchCampaign(state: GameState, id: CampaignId): GameState {
  if (campaignUnavailableReason(state, id) !== null) return state;
  return {
    ...state,
    cash: state.cash - CAMPAIGNS[id].cost,
    campaigns: [...state.campaigns, { id, untilDay: campaignEndDay(state, id) }],
  };
}

// ---------- Relocation ----------

export function relocateUnavailableReason(state: GameState, to: LocationId): string | null {
  const player = playerOf(state);
  if (player.location === to) return 'You’re already here';
  if (player.equipment.length > LOCATIONS[to].equipmentSlots) {
    return `Your equipment won’t fit: this kitchen has room for ${LOCATIONS[to].equipmentSlots}`;
  }
  return cantAfford(state, balance.relocation.fee);
}

/** What the restaurant looks like after moving to another street. */
export function afterMove(state: GameState, to: LocationId): Restaurant {
  const player = playerOf(state);
  const r = balance.relocation;
  // The most atmospheric decor survives the move; the rest stays behind.
  const keep = Math.ceil(player.decor.length * r.decorKept);
  const decor = [...player.decor].sort((a, b) => DECOR[b].ambiance - DECOR[a].ambiance).slice(0, keep);
  const maxTables = Math.floor(LOCATIONS[to].maxSeats / balance.service.seatsPerTable);
  const reputation = { ...player.reputation };
  for (const g of GROUP_IDS) reputation[g] *= r.reputationKept;
  return {
    ...player,
    location: to,
    decor,
    ambiance: ambianceWith(decor),
    tables: Math.min(player.tables, maxTables),
    reputation,
    // Building works belong to the premises: they stay behind.
    works: [],
  };
}

/** Moves the restaurant to another street. Equipment, menu and staff come along. */
export function relocate(state: GameState, to: LocationId): GameState {
  if (relocateUnavailableReason(state, to) !== null) return state;
  const moved = withPlayer(state, afterMove(state, to));
  return { ...moved, cash: state.cash - balance.relocation.fee };
}

// ---------- Theme nights ----------

/** Why this theme night can't be booked for this evening, or null if it can. One a week, this week, paid now. */
export function themeNightUnavailableReason(state: GameState, id: ThemeNightId, day: number): string | null {
  const booked = state.themeNight;
  if (booked && weekOf(booked.day) === weekOf(state.day)) return 'This week’s theme night is booked';
  if (day < state.day || weekOf(day) !== weekOf(state.day)) return 'Pick an evening this week';
  return cantAfford(state, THEME_NIGHTS[id].cost);
}

/** Books a theme night for one evening this week, and pays for it. */
export function bookThemeNight(state: GameState, id: ThemeNightId, day: number): GameState {
  if (themeNightUnavailableReason(state, id, day) !== null) return state;
  return { ...state, themeNight: { id, day }, cash: state.cash - THEME_NIGHTS[id].cost };
}

// ---------- Bookings ----------

/** Says yes to a booking request: the party comes (or the order is due) on its day. */
export function acceptBooking(state: GameState, id: number): GameState {
  const request = state.bookings.find((r) => r.id === id);
  if (!request || request.accepted || request.day <= state.day) return state;
  return { ...state, bookings: state.bookings.map((r) => (r.id === id ? { ...r, accepted: true } : r)) };
}

/** Says no to a booking request, politely. Once accepted, a booking stays. */
export function declineBooking(state: GameState, id: number): GameState {
  const request = state.bookings.find((r) => r.id === id);
  if (!request || request.accepted) return state;
  return { ...state, bookings: state.bookings.filter((r) => r.id !== id) };
}

// ---------- Mewa ----------

/** Marks one of Mewa's tips as read. */
export function dismissTip(state: GameState, tip: TipId): GameState {
  if (state.mewa.seenTips.includes(tip)) return state;
  return { ...state, mewa: { ...state.mewa, seenTips: [...state.mewa.seenTips, tip] } };
}

/** Switches all of Mewa's tutorial tips off. */
export function skipTips(state: GameState): GameState {
  return { ...state, mewa: { ...state.mewa, tipsOff: true } };
}

// ---------- Settings ----------

/** Relaxed or Normal. Rivals change their manner straight away; starting cash only matters for new games. */
export function setDifficulty(state: GameState, difficulty: Difficulty): GameState {
  return { ...state, difficulty };
}
