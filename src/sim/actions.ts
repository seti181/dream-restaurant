// Player actions during planning. Each one takes the game state and returns a new one;
// the old state is never changed. Invalid actions return the state unchanged.

import { balance } from '../data/balance';
import { DISH_TEMPLATES, EXTRAS, type EquipmentId, type ExtraId, type MenuDish, type TemplateId } from '../data/dishes';
import { EQUIPMENT } from '../data/equipment';
import { LOCATIONS } from '../data/locations';
import { playerOf, type GameState } from './game';
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
  const menu = playerOf(state).menu;
  if (index < 0 || index >= menu.length) return state;
  return withPlayer(state, { menu: menu.filter((_, i) => i !== index) });
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
