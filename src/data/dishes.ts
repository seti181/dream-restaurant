// Dish templates: the building blocks of every menu. See project.md section 6.3.
// Extras, combo bonuses and clashes arrive with the dish creator in M3.

export type Category = 'soup' | 'main' | 'dessert' | 'drink';

export type Tag =
  | 'polish'
  | 'hearty'
  | 'premium'
  | 'creative'
  | 'seafood'
  | 'veggie'
  | 'spicy'
  | 'sweet'
  | 'quick'
  | 'cheap'
  | 'homemade';

/** A chef's specialty; dishes of that cuisine come out better. */
export type Cuisine = 'polish' | 'italian' | 'grill' | 'pastry';

export type EquipmentId = 'stove' | 'fryer' | 'grill' | 'pizzaOven' | 'espresso' | 'dessertDisplay';

export const CATEGORY_NAMES: Record<Category, string> = {
  soup: 'Soups',
  main: 'Mains',
  dessert: 'Desserts',
  drink: 'Drinks',
};

export type TemplateId =
  | 'zurek'
  | 'barszcz'
  | 'fishSoup'
  | 'tomatoSoup'
  | 'pierogi'
  | 'pizza'
  | 'pasta'
  | 'burger'
  | 'friedCod'
  | 'schabowy'
  | 'golabki'
  | 'arrozDeVitela'
  | 'saladBowl'
  | 'szarlotka'
  | 'sernik'
  | 'iceCream'
  | 'coffee'
  | 'kompot'
  | 'lemonade'
  | 'cytrynowka';

export interface Variant {
  id: string;
  name: string;
  /** Złoty paid for ingredients each time the dish is sold. */
  ingredientCost: number;
  /** Extra taste tags on top of the template's own. */
  tags: Tag[];
}

export interface DishTemplate {
  name: string;
  category: Category;
  /** Which chef specialty suits it best, or null if none does. */
  cuisine: Cuisine | null;
  /** Equipment needed to cook it, or null if none is needed. */
  equipment: EquipmentId | null;
  /** Minutes an average chef needs for one portion. */
  prepMinutes: number;
  /** Quality (0–100) before supplier, chef and combo effects. */
  baseQuality: number;
  /** What a typical Old Town place charges, in złoty. Guests judge value against it. */
  referencePrice: number;
  tags: Tag[];
  variants: Variant[];
  /** A secret recipe stays hidden in the dish creator until it has been found. */
  secret?: boolean;
}

/** One line on a restaurant's menu. */
export interface MenuDish {
  template: TemplateId;
  /** A variant id from that template. */
  variant: string;
  price: number;
  /** Up to three extras from the dish creator. */
  extras?: ExtraId[];
  /** The player's own name for the dish, if they gave it one. */
  name?: string;
  /** Marks a dish served as part of a lunch set (price is its share of the set). */
  fromLunchSet?: boolean;
}

export const TEMPLATE_IDS: readonly TemplateId[] = [
  'zurek', 'barszcz', 'fishSoup', 'tomatoSoup',
  'pierogi', 'pizza', 'pasta', 'burger', 'friedCod', 'schabowy', 'golabki', 'arrozDeVitela', 'saladBowl',
  'szarlotka', 'sernik', 'iceCream',
  'coffee', 'kompot', 'lemonade', 'cytrynowka',
];

export const DISH_TEMPLATES: Record<TemplateId, DishTemplate> = {
  // Soups
  zurek: {
    name: 'Żurek',
    category: 'soup',
    cuisine: 'polish',
    equipment: 'stove',
    prepMinutes: 4,
    baseQuality: 60,
    referencePrice: 28,
    tags: ['polish', 'homemade', 'hearty'],
    variants: [
      { id: 'classic', name: 'with sausage and egg', ingredientCost: 8, tags: [] },
      { id: 'breadBowl', name: 'in a bread bowl', ingredientCost: 10, tags: ['creative'] },
    ],
  },
  barszcz: {
    name: 'Barszcz',
    category: 'soup',
    cuisine: 'polish',
    equipment: 'stove',
    prepMinutes: 4,
    baseQuality: 58,
    referencePrice: 24,
    tags: ['polish', 'veggie'],
    variants: [
      { id: 'uszka', name: 'with mushroom uszka', ingredientCost: 7, tags: ['homemade'] },
      { id: 'mug', name: 'in a mug', ingredientCost: 3, tags: ['quick', 'cheap'] },
    ],
  },
  fishSoup: {
    name: 'Baltic fish soup',
    category: 'soup',
    cuisine: 'polish',
    equipment: 'stove',
    prepMinutes: 5,
    baseQuality: 62,
    referencePrice: 34,
    tags: ['seafood'],
    variants: [
      { id: 'classic', name: 'classic', ingredientCost: 10, tags: ['homemade'] },
      { id: 'creamy', name: 'creamy, with dill', ingredientCost: 13, tags: ['premium'] },
    ],
  },
  tomatoSoup: {
    name: 'Tomato soup',
    category: 'soup',
    cuisine: 'polish',
    equipment: 'stove',
    prepMinutes: 3,
    baseQuality: 50,
    referencePrice: 18,
    tags: ['polish', 'homemade', 'quick', 'cheap'],
    variants: [
      { id: 'noodles', name: 'with noodles', ingredientCost: 4, tags: [] },
      { id: 'rice', name: 'with rice', ingredientCost: 4, tags: [] },
    ],
  },

  // Mains
  pierogi: {
    name: 'Pierogi',
    category: 'main',
    cuisine: 'polish',
    equipment: 'stove',
    prepMinutes: 10,
    baseQuality: 62,
    referencePrice: 36,
    tags: ['polish', 'homemade'],
    variants: [
      { id: 'ruskie', name: 'ruskie (potato and cheese)', ingredientCost: 8, tags: ['veggie'] },
      { id: 'meat', name: 'with meat', ingredientCost: 11, tags: ['hearty'] },
      { id: 'mushroomCabbage', name: 'with mushroom and cabbage', ingredientCost: 9, tags: ['veggie'] },
      { id: 'blueberry', name: 'with blueberries', ingredientCost: 10, tags: ['sweet'] },
    ],
  },
  pizza: {
    name: 'Pizza',
    category: 'main',
    cuisine: 'italian',
    equipment: 'pizzaOven',
    prepMinutes: 12,
    baseQuality: 58,
    referencePrice: 42,
    tags: [],
    variants: [
      { id: 'margherita', name: 'margherita', ingredientCost: 9, tags: ['veggie', 'cheap'] },
      { id: 'salami', name: 'salami', ingredientCost: 12, tags: ['hearty'] },
      { id: 'kielbasa', name: 'kiełbasa and pickle', ingredientCost: 12, tags: ['polish', 'creative'] },
    ],
  },
  pasta: {
    name: 'Pasta',
    category: 'main',
    cuisine: 'italian',
    equipment: 'stove',
    prepMinutes: 9,
    baseQuality: 55,
    referencePrice: 38,
    tags: [],
    variants: [
      { id: 'carbonara', name: 'carbonara', ingredientCost: 10, tags: ['hearty'] },
      { id: 'pesto', name: 'pesto', ingredientCost: 9, tags: ['veggie'] },
      { id: 'seafood', name: 'with seafood', ingredientCost: 17, tags: ['seafood', 'premium'] },
    ],
  },
  burger: {
    name: 'Burger',
    category: 'main',
    cuisine: 'grill',
    equipment: 'grill',
    prepMinutes: 10,
    baseQuality: 58,
    referencePrice: 42,
    tags: ['hearty'],
    variants: [
      { id: 'classic', name: 'classic beef', ingredientCost: 13, tags: [] },
      { id: 'veggie', name: 'veggie', ingredientCost: 12, tags: ['veggie'] },
    ],
  },
  friedCod: {
    name: 'Fried Baltic cod with fries',
    category: 'main',
    cuisine: 'grill',
    equipment: 'fryer',
    prepMinutes: 12,
    baseQuality: 60,
    referencePrice: 48,
    tags: ['seafood', 'hearty'],
    variants: [{ id: 'classic', name: 'classic', ingredientCost: 16, tags: [] }],
  },
  schabowy: {
    name: 'Schabowy',
    category: 'main',
    cuisine: 'polish',
    equipment: 'stove',
    prepMinutes: 14,
    baseQuality: 60,
    referencePrice: 44,
    tags: ['polish', 'hearty', 'homemade'],
    variants: [
      { id: 'cabbage', name: 'with potatoes and fried cabbage', ingredientCost: 12, tags: [] },
      { id: 'mizeria', name: 'with potatoes and cucumber salad', ingredientCost: 12, tags: [] },
    ],
  },
  golabki: {
    name: 'Gołąbki',
    category: 'main',
    cuisine: 'polish',
    equipment: 'stove',
    prepMinutes: 11,
    baseQuality: 58,
    referencePrice: 38,
    tags: ['polish', 'homemade', 'hearty'],
    variants: [
      { id: 'tomato', name: 'in tomato sauce', ingredientCost: 10, tags: [] },
      { id: 'mushroom', name: 'in mushroom sauce', ingredientCost: 10, tags: [] },
      { id: 'buckwheat', name: 'with buckwheat and mushrooms', ingredientCost: 9, tags: ['veggie'] },
    ],
  },
  arrozDeVitela: {
    name: 'Arroz de vitela',
    category: 'main',
    cuisine: null,
    equipment: 'stove',
    prepMinutes: 15,
    baseQuality: 70,
    referencePrice: 46,
    tags: ['hearty', 'homemade'],
    variants: [{ id: 'joana', name: 'slow-cooked veal with rice, Joana’s way', ingredientCost: 14, tags: [] }],
    secret: true,
  },
  saladBowl: {
    name: 'Salad bowl',
    category: 'main',
    cuisine: null,
    equipment: null,
    prepMinutes: 5,
    baseQuality: 52,
    referencePrice: 34,
    tags: ['quick'],
    variants: [
      { id: 'garden', name: 'garden', ingredientCost: 8, tags: ['veggie', 'cheap'] },
      { id: 'goatCheese', name: 'goat cheese and beetroot', ingredientCost: 11, tags: ['veggie', 'creative'] },
      { id: 'salmon', name: 'smoked salmon', ingredientCost: 15, tags: ['seafood', 'premium'] },
    ],
  },

  // Desserts
  szarlotka: {
    name: 'Szarlotka',
    category: 'dessert',
    cuisine: 'pastry',
    equipment: 'dessertDisplay',
    prepMinutes: 2,
    baseQuality: 60,
    referencePrice: 20,
    tags: ['polish', 'homemade', 'sweet'],
    variants: [
      { id: 'classic', name: 'classic', ingredientCost: 4, tags: [] },
      { id: 'warm', name: 'warm, with ice cream', ingredientCost: 6, tags: ['premium'] },
    ],
  },
  sernik: {
    name: 'Sernik',
    category: 'dessert',
    cuisine: 'pastry',
    equipment: 'dessertDisplay',
    prepMinutes: 2,
    baseQuality: 60,
    referencePrice: 20,
    tags: ['polish', 'sweet'],
    variants: [{ id: 'classic', name: 'classic', ingredientCost: 5, tags: ['homemade'] }],
  },
  iceCream: {
    name: 'Ice cream',
    category: 'dessert',
    cuisine: 'pastry',
    equipment: 'dessertDisplay',
    prepMinutes: 2,
    baseQuality: 50,
    referencePrice: 16,
    tags: ['sweet', 'quick'],
    variants: [
      { id: 'vanilla', name: 'vanilla', ingredientCost: 3, tags: ['cheap'] },
      { id: 'sorbet', name: 'seasonal sorbet', ingredientCost: 4, tags: ['veggie'] },
    ],
  },

  // Drinks
  coffee: {
    name: 'Coffee',
    category: 'drink',
    cuisine: null,
    equipment: 'espresso',
    prepMinutes: 2,
    baseQuality: 55,
    referencePrice: 14,
    tags: ['quick'],
    variants: [
      { id: 'espresso', name: 'espresso', ingredientCost: 2, tags: [] },
      { id: 'cappuccino', name: 'cappuccino', ingredientCost: 3, tags: [] },
    ],
  },
  kompot: {
    name: 'Kompot',
    category: 'drink',
    cuisine: null,
    equipment: null,
    prepMinutes: 1,
    baseQuality: 55,
    referencePrice: 9,
    tags: ['polish', 'homemade', 'cheap', 'quick'],
    variants: [
      { id: 'strawberry', name: 'strawberry', ingredientCost: 2, tags: [] },
      { id: 'cherry', name: 'cherry', ingredientCost: 2, tags: [] },
    ],
  },
  lemonade: {
    name: 'Lemonade',
    category: 'drink',
    cuisine: null,
    equipment: null,
    prepMinutes: 2,
    baseQuality: 52,
    referencePrice: 14,
    tags: ['sweet', 'quick'],
    variants: [
      { id: 'mint', name: 'lemon and mint', ingredientCost: 3, tags: [] },
      { id: 'rhubarb', name: 'rhubarb', ingredientCost: 3, tags: ['creative'] },
    ],
  },
  cytrynowka: {
    name: 'Cytrynówka',
    category: 'drink',
    cuisine: null,
    equipment: null,
    prepMinutes: 1,
    baseQuality: 58,
    referencePrice: 14,
    tags: ['polish', 'homemade'],
    variants: [{ id: 'homemade', name: 'homemade lemon vodka, ice-cold', ingredientCost: 3, tags: [] }],
  },
};

// ---------- Extras and pairings (the dish creator) ----------

export type ExtraId =
  | 'dill'
  | 'sourCream'
  | 'friedOnions'
  | 'skwarki'
  | 'oscypek'
  | 'cranberry'
  | 'horseradish'
  | 'wildMushrooms'
  | 'chili'
  | 'whippedCream'
  | 'honey'
  | 'strawberries'
  | 'cytrynowka';

export interface Extra {
  name: string;
  /** Złoty per portion, on top of the variant's ingredients. */
  ingredientCost: number;
  tags: Tag[];
  /** Kinds of dish it can go on. */
  categories: Category[];
}

export const EXTRA_IDS: readonly ExtraId[] = [
  'dill', 'sourCream', 'friedOnions', 'skwarki', 'oscypek', 'cranberry',
  'horseradish', 'wildMushrooms', 'chili', 'whippedCream', 'honey', 'strawberries', 'cytrynowka',
];

export const EXTRAS: Record<ExtraId, Extra> = {
  dill: { name: 'dill', ingredientCost: 1, tags: [], categories: ['soup', 'main'] },
  sourCream: { name: 'sour cream', ingredientCost: 2, tags: ['homemade'], categories: ['soup', 'main', 'dessert'] },
  friedOnions: { name: 'fried onions', ingredientCost: 1, tags: ['hearty'], categories: ['soup', 'main'] },
  skwarki: { name: 'skwarki (crispy bacon bits)', ingredientCost: 2, tags: ['hearty', 'polish'], categories: ['soup', 'main'] },
  oscypek: { name: 'oscypek (smoked mountain cheese)', ingredientCost: 5, tags: ['polish', 'premium'], categories: ['soup', 'main', 'dessert'] },
  cranberry: { name: 'cranberry', ingredientCost: 2, tags: ['creative'], categories: ['main', 'dessert', 'drink'] },
  horseradish: { name: 'horseradish', ingredientCost: 1, tags: ['polish', 'spicy'], categories: ['soup', 'main', 'dessert'] },
  wildMushrooms: { name: 'wild mushrooms', ingredientCost: 5, tags: ['premium'], categories: ['soup', 'main'] },
  chili: { name: 'chili', ingredientCost: 1, tags: ['spicy'], categories: ['soup', 'main', 'dessert', 'drink'] },
  whippedCream: { name: 'whipped cream', ingredientCost: 2, tags: ['sweet'], categories: ['soup', 'main', 'dessert', 'drink'] },
  honey: { name: 'honey', ingredientCost: 2, tags: ['sweet', 'homemade'], categories: ['main', 'dessert', 'drink'] },
  strawberries: { name: 'Kashubian strawberries', ingredientCost: 3, tags: ['sweet', 'polish'], categories: ['main', 'dessert', 'drink'] },
  cytrynowka: { name: 'a glass of cytrynówka on the side', ingredientCost: 4, tags: ['polish'], categories: ['soup', 'main'] },
};

/**
 * A hidden pairing: extras that go wonderfully (positive quality) or terribly
 * (negative quality) together, or with a certain kind of dish. The player never
 * sees this list; guests drop hints in the daily report.
 */
export interface Pairing {
  /** All of these extras must be on the dish... */
  extras: ExtraId[];
  /** ...and, if given, the dish must also have this tag, be this dish, or be in this category. */
  with?: { tag?: Tag; template?: TemplateId; category?: Category };
  /** Quality points added (or, for a clash, taken away). */
  quality: number;
  /** What a guest says about it. */
  comment: string;
}

export const PAIRINGS: Pairing[] = [
  // Perfect pairings
  { extras: ['dill'], with: { tag: 'seafood' }, quality: 10, comment: 'The dill and the fish were made for each other.' },
  { extras: ['oscypek', 'cranberry'], quality: 12, comment: 'Oscypek with cranberry! Just like in the mountains.' },
  { extras: ['horseradish'], with: { template: 'zurek' }, quality: 10, comment: 'Żurek with horseradish, like Easter at Grandma’s.' },
  { extras: ['friedOnions'], with: { template: 'pierogi' }, quality: 8, comment: 'Pierogi with fried onions, exactly as they should be.' },
  { extras: ['wildMushrooms', 'sourCream'], quality: 10, comment: 'Wild mushrooms and sour cream: a hug in a bowl.' },
  { extras: ['whippedCream'], with: { template: 'szarlotka' }, quality: 8, comment: 'Szarlotka with a cloud of cream. Perfect.' },
  { extras: ['strawberries', 'whippedCream'], quality: 10, comment: 'Kashubian strawberries and cream taste like summer.' },
  { extras: ['honey'], with: { template: 'lemonade' }, quality: 6, comment: 'Honey in the lemonade was a lovely touch.' },
  {
    extras: ['cytrynowka'],
    with: { template: 'arrozDeVitela' },
    quality: 20,
    comment: 'Arroz de vitela with a glass of cytrynówka: Portugal and Poland at one table. Perfect.',
  },
  // Clashes
  { extras: ['chili', 'whippedCream'], quality: -15, comment: 'Someone put chili in the cream. Brave, but no.' },
  { extras: ['cranberry'], with: { tag: 'seafood' }, quality: -10, comment: 'Cranberry and fish? The seagulls approved. Nobody else did.' },
  { extras: ['horseradish'], with: { category: 'dessert' }, quality: -15, comment: 'Horseradish in a dessert made a guest cry. Not happy tears.' },
  { extras: ['whippedCream'], with: { category: 'soup' }, quality: -12, comment: 'Whipped cream on soup. Bold. Very bold.' },
];
