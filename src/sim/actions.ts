// Player actions during planning. Each one takes the game state and returns a new one;
// the old state is never changed. Invalid actions return the state unchanged.

import { balance } from '../data/balance';
import { DISH_TEMPLATES, EXTRAS, type EquipmentId, type ExtraId, type MenuDish, type TemplateId } from '../data/dishes';
import { DECOR, type DecorId } from '../data/decor';
import { EQUIPMENT } from '../data/equipment';
import { GROUP_IDS } from '../data/groups';
import { LOCATIONS, type LocationId } from '../data/locations';
import { CAMPAIGNS, type CampaignId } from '../data/marketing';
import type { TipId } from '../data/mewa';
import { playerOf, type Difficulty, type GameState } from './game';
import { dateOf, daysInMonth, nextDayOn } from './calendar';
import { ambianceWith } from './interior';
import { recipeKey } from './menu';
import { staffOf } from './staff';
import type { Employee, Restaurant, Supplier } from './types';

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
  const hired = withTeam(state, [...state.team, person]);
  return { ...hired, candidates: state.candidates.filter((c) => c.id !== candidateId) };
}

/** Says goodbye to a team member. */
export function letGo(state: GameState, employeeId: number): GameState {
  if (!state.team.some((person) => person.id === employeeId)) return state;
  return withTeam(state, state.team.filter((person) => person.id !== employeeId));
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
  if (state.menuSlots >= balance.menu.maxSlots) return 'Your menu board is as big as it gets';
  return cantAfford(state, balance.menu.slotUpgrade.cost);
}

/** A bigger menu board: room for more dishes. */
export function upgradeMenuBoard(state: GameState): GameState {
  if (menuBoardUnavailableReason(state) !== null) return state;
  const { slots, cost } = balance.menu.slotUpgrade;
  return { ...state, menuSlots: Math.min(balance.menu.maxSlots, state.menuSlots + slots), cash: state.cash - cost };
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

export function decorUnavailableReason(state: GameState, id: DecorId): string | null {
  if (DECOR[id].unlockable && !state.unlocks.includes(id)) return 'Not discovered yet';
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
  };
}

/** Moves the restaurant to another street. Equipment, menu and staff come along. */
export function relocate(state: GameState, to: LocationId): GameState {
  if (relocateUnavailableReason(state, to) !== null) return state;
  const moved = withPlayer(state, afterMove(state, to));
  return { ...moved, cash: state.cash - balance.relocation.fee };
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
