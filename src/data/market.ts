// The morning market: what the kitchen buys each day, and what each dish is mostly made of.
// Prices change a little every day, with a deal or two (sim/market.ts); how much is in
// balance.ts (balance.market). See project.md section 6.15, D13.

import type { ExtraId, TemplateId } from './dishes';

export type GoodId = 'fish' | 'pork' | 'beef' | 'potatoes' | 'vegetables' | 'mushrooms' | 'dairy' | 'fruit' | 'coffee' | 'lemons';

export interface Good {
  icon: string;
  /** "fish", as in "Fish is cheap today". */
  name: string;
  /** What the morning's deal is called on the Today tab. */
  deal: string;
  /** Why it's cheap, one picked each time. */
  dealStories: string[];
  /** Why it's dear, one picked each time. */
  dearStories: string[];
}

export const GOOD_IDS: readonly GoodId[] = ['fish', 'pork', 'beef', 'potatoes', 'vegetables', 'mushrooms', 'dairy', 'fruit', 'coffee', 'lemons'];

export const GOODS: Record<GoodId, Good> = {
  fish: {
    icon: '🐟',
    name: 'fish',
    deal: 'Cheap cod at the harbour today!',
    dealStories: ['The boats came in heavy at dawn.', 'The fishmonger on the Motława has more cod than ice.'],
    dearStories: ['The wind kept the boats in.', 'The boats came back nearly empty.'],
  },
  pork: {
    icon: '🍖',
    name: 'pork',
    deal: 'The butcher has pork on offer!',
    dealStories: ['Pan Zenon at the Hala Targowa is clearing his counter.', 'A farm near Kartuzy sent too much.'],
    dearStories: ['The butcher’s van broke down on the way in.', 'Every grill in Gdańsk wants pork this week.'],
  },
  beef: {
    icon: '🍖',
    name: 'beef and veal',
    deal: 'Beef is a bargain today!',
    dealStories: ['The butcher bought a whole side and needs room.'],
    dearStories: ['The butcher is short of beef this morning.'],
  },
  potatoes: {
    icon: '🥔',
    name: 'potatoes',
    deal: 'Sacks of potatoes going cheap!',
    dealStories: ['A farmer from Żuławy is selling them by the sack.', 'The market stalls are piled high with potatoes.'],
    dearStories: ['The potato lorry is stuck on the ring road.'],
  },
  vegetables: {
    icon: '🥬',
    name: 'cabbage, beetroot and tomatoes',
    deal: 'Vegetables are cheap at the market!',
    dealStories: ['Kashubian growers brought in crates of cabbage and beetroot.', 'The stalls by St Catherine’s are overflowing.'],
    dearStories: ['Last night’s storm flattened the greenhouses.'],
  },
  mushrooms: {
    icon: '🍄',
    name: 'mushrooms',
    deal: 'Baskets of mushrooms going cheap!',
    dealStories: ['The mushroom pickers had a wonderful morning in the Kashubian woods.'],
    dearStories: ['Too dry in the woods: the pickers found very little.'],
  },
  dairy: {
    icon: '🧀',
    name: 'cheese, cream and milk',
    deal: 'Cheese and cream on offer!',
    dealStories: ['The dairy in Kościerzyna had a bumper week.', 'The cheese stall wants it gone before the weekend.'],
    dearStories: ['The dairy’s cooler broke: half the cream was lost.'],
  },
  fruit: {
    icon: '🍓',
    name: 'fruit and berries',
    deal: 'Fruit is cheap at the market!',
    dealStories: ['The orchards sent more than the stalls can sell.', 'Baskets and baskets of it, going cheap by noon.'],
    dearStories: ['Hail in the orchards last night.'],
  },
  coffee: {
    icon: '☕',
    name: 'coffee',
    deal: 'Your roaster has coffee on offer!',
    dealStories: ['The roaster on Szeroka ordered too many beans.'],
    dearStories: ['Coffee prices are up again, the roaster sighs.'],
  },
  lemons: {
    icon: '🍋',
    name: 'lemons',
    deal: 'Crates of lemons going cheap!',
    dealStories: ['A ship from Spain unloaded at the port.'],
    dearStories: ['Lemons are scarce this week.'],
  },
};

/** What each dish is mostly made of: by template, or by variant ("template.variant") where they differ. */
export const DISH_GOODS: Partial<Record<TemplateId | `${TemplateId}.${string}`, GoodId>> = {
  zurek: 'pork',
  barszcz: 'vegetables',
  fishSoup: 'fish',
  tomatoSoup: 'vegetables',
  'pierogi.ruskie': 'potatoes',
  'pierogi.meat': 'pork',
  'pierogi.mushroomCabbage': 'mushrooms',
  'pierogi.blueberry': 'fruit',
  'pizza.margherita': 'dairy',
  'pizza.salami': 'pork',
  'pizza.kielbasa': 'pork',
  'pasta.carbonara': 'pork',
  'pasta.pesto': 'dairy',
  'pasta.seafood': 'fish',
  'burger.classic': 'beef',
  'burger.veggie': 'vegetables',
  friedCod: 'fish',
  schabowy: 'pork',
  'golabki.tomato': 'vegetables',
  'golabki.mushroom': 'mushrooms',
  'golabki.buckwheat': 'mushrooms',
  arrozDeVitela: 'beef',
  'cabritoAssado.batatas': 'potatoes',
  'saladBowl.garden': 'vegetables',
  'saladBowl.goatCheese': 'dairy',
  'saladBowl.salmon': 'fish',
  szarlotka: 'fruit',
  sernik: 'dairy',
  'iceCream.vanilla': 'dairy',
  'iceCream.sorbet': 'fruit',
  coffee: 'coffee',
  kompot: 'fruit',
  'lemonade.mint': 'lemons',
  'lemonade.rhubarb': 'fruit',
  cytrynowka: 'lemons',
};

/** What each extra is, at the market (dill, chili and honey keep their price). */
export const EXTRA_GOODS: Partial<Record<ExtraId, GoodId>> = {
  sourCream: 'dairy',
  friedOnions: 'vegetables',
  skwarki: 'pork',
  oscypek: 'dairy',
  cranberry: 'fruit',
  horseradish: 'vegetables',
  wildMushrooms: 'mushrooms',
  whippedCream: 'dairy',
  strawberries: 'fruit',
  newPotatoes: 'potatoes',
  blueberries: 'fruit',
  chanterelles: 'mushrooms',
  plums: 'fruit',
  cytrynowka: 'lemons',
};
