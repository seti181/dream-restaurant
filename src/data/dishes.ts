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
  | 'saladBowl'
  | 'szarlotka'
  | 'sernik'
  | 'iceCream'
  | 'coffee'
  | 'kompot'
  | 'lemonade';

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
}

/** One line on a restaurant's menu. */
export interface MenuDish {
  template: TemplateId;
  /** A variant id from that template. */
  variant: string;
  price: number;
}

export const TEMPLATE_IDS: readonly TemplateId[] = [
  'zurek', 'barszcz', 'fishSoup', 'tomatoSoup',
  'pierogi', 'pizza', 'pasta', 'burger', 'friedCod', 'schabowy', 'golabki', 'saladBowl',
  'szarlotka', 'sernik', 'iceCream',
  'coffee', 'kompot', 'lemonade',
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
};
