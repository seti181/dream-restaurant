// Booking requests the player can accept or decline: parties who want a table at a set
// time (with a wish for the menu), and big orders a chef cooks ahead of a deadline.
// How often they come, and what they pay, is tuned in balance.ts (balance.bookings).
// See project.md section 6.15, A2.

import type { Category, Tag, TemplateId } from './dishes';
import type { GroupId } from './groups';

export type BookingKindId =
  | 'wedding'
  | 'tourBus'
  | 'birthday'
  | 'officeParty'
  | 'studentSociety'
  | 'supperClub'
  | 'officeLunches'
  | 'museumSoups'
  | 'parishPierogi'
  | 'summerCamp';

/** Something on the menu: a dish in this category, with this tag, or this very dish (every one given must match). */
export interface MenuWant {
  category?: Category;
  tag?: Tag;
  template?: TemplateId;
}

interface BookingKindBase {
  icon: string;
  /** A short name for lists and the day report: "A wedding party". */
  name: string;
  /** A few ways of telling the request; one is picked. {size} is filled in. */
  texts: string[];
  group: GroupId;
  /** How many guests (a table booking) or portions (a big order), at least and at most. */
  size: { min: number; max: number };
  /** Minutes after midnight. */
  minute: number;
  /** How likely this one is compared with the others. */
  weight: number;
  /** Only on these weekdays (0 = Monday … 6 = Sunday). */
  weekdays?: number[];
}

/** A party that books a table, and hopes for something on the menu. */
export interface TableBookingKind extends BookingKindBase {
  kind: 'table';
  wish: MenuWant;
  /** Their wish in a few words: "they’d love a dessert". */
  wishText: string;
  /** In the day report, when the wish came true and they were happy. */
  delighted: string;
}

/** Portions a chef cooks ahead, ready by a set time, at an agreed price each. */
export interface BigOrderKind extends BookingKindBase {
  kind: 'order';
  needs: MenuWant;
  /** What they order, in a few words: "lunches", "soups". */
  portionName: string;
  /** Złoty paid for each portion. */
  pricePerPortion: number;
}

export type BookingKind = TableBookingKind | BigOrderKind;

const WEEKDAYS = [0, 1, 2, 3, 4];

export const BOOKING_KIND_IDS: readonly BookingKindId[] = [
  'wedding', 'tourBus', 'birthday', 'officeParty', 'studentSociety', 'supperClub',
  'officeLunches', 'museumSoups', 'parishPierogi', 'summerCamp',
];

export const BOOKING_KINDS: Record<BookingKindId, BookingKind> = {
  wedding: {
    kind: 'table',
    icon: '💒',
    name: 'A wedding party',
    texts: [
      'A young couple from Oliwa would like to celebrate their wedding with you: {size} guests, straight from St. Mary’s.',
      'A wedding party of {size} asks for your dining room. Babcia will be inspecting the pierogi.',
    ],
    group: 'locals',
    size: { min: 12, max: 16 },
    minute: 17 * 60,
    weight: 2,
    weekdays: [4, 5],
    wish: { category: 'dessert' },
    wishText: 'they’d love a dessert',
    delighted: 'The newlyweds cut their dessert like a wedding cake. Everyone cheered.',
  },
  tourBus: {
    kind: 'table',
    icon: '🚌',
    name: 'A tour bus',
    texts: [
      'A tour group from Kraków asks for lunch: {size} hungry tourists. Their guide promised them “the real Gdańsk”.',
      'A coach of Swedish cruise passengers would like lunch with you: {size} of them. They have heard about the żurek.',
    ],
    group: 'tourists',
    size: { min: 10, max: 14 },
    minute: 13 * 60,
    weight: 3,
    wish: { tag: 'polish' },
    wishText: 'they want something Polish',
    delighted: 'The tour group loved their taste of Poland. The guide wrote your name in her notebook.',
  },
  birthday: {
    kind: 'table',
    icon: '🎂',
    name: 'A birthday table',
    texts: [
      'A regular is turning seventy and wants to celebrate with you: a table for {size}.',
      'A family asks for a birthday table for {size}. They asked for “the usual, times {size}”.',
    ],
    group: 'locals',
    size: { min: 5, max: 8 },
    minute: 19 * 60,
    weight: 2,
    wish: { template: 'pierogi' },
    wishText: 'they hope for pierogi',
    delighted: 'Pierogi for the birthday table, just like Mama made. There was singing.',
  },
  officeParty: {
    kind: 'table',
    icon: '🥂',
    name: 'An office leaving-do',
    texts: [
      'An office on Granary Island is saying goodbye to a colleague: a table for {size} after work.',
      'A team of {size} from a shipping office wants to celebrate a big contract with you.',
    ],
    group: 'office',
    size: { min: 6, max: 10 },
    minute: 18 * 60,
    weight: 2,
    weekdays: WEEKDAYS,
    wish: { category: 'drink' },
    wishText: 'they’d like something to toast with',
    delighted: 'The office raised their glasses to the colleague who’s leaving, and to your kitchen.',
  },
  studentSociety: {
    kind: 'table',
    icon: '🎓',
    name: 'A student society',
    texts: [
      'The university sailing club wants a big dinner after their regatta: {size} students.',
      'A student choir of {size} would like dinner after their concert. They promise not to sing. Much.',
    ],
    group: 'students',
    size: { min: 8, max: 12 },
    minute: 20 * 60,
    weight: 2,
    wish: { tag: 'hearty' },
    wishText: 'they want something hearty',
    delighted: 'The students cleaned their plates and asked who cooked. Big portions win hearts.',
  },
  supperClub: {
    kind: 'table',
    icon: '🍷',
    name: 'A supper club',
    texts: [
      'A supper club of {size} food lovers would like to try your kitchen one evening.',
      'A food writer is bringing {size} friends for dinner. They’re curious about Baltic fish.',
    ],
    group: 'foodies',
    size: { min: 4, max: 6 },
    minute: 19 * 60 + 30,
    weight: 1,
    wish: { tag: 'seafood' },
    wishText: 'they hope for something from the sea',
    delighted: 'The supper club passed the fish round the table and took far too many photos.',
  },
  officeLunches: {
    kind: 'order',
    icon: '🍱',
    name: 'Lunches for an office',
    texts: [
      'An office on Granary Island orders {size} lunches, to be picked up at 12:30.',
      'A software company by the Motława wants {size} lunches for a meeting, ready at 12:30.',
    ],
    group: 'office',
    size: { min: 20, max: 30 },
    minute: 12 * 60 + 30,
    weight: 3,
    weekdays: WEEKDAYS,
    needs: { category: 'main' },
    portionName: 'lunches',
    pricePerPortion: 36,
  },
  museumSoups: {
    kind: 'order',
    icon: '🍲',
    name: 'Soup for the museum',
    texts: [
      'The staff of the Crane museum order {size} soups for their lunch break at 13:00.',
      'The crew restoring the Green Gate would like {size} hot soups at 13:00.',
    ],
    group: 'locals',
    size: { min: 15, max: 25 },
    minute: 13 * 60,
    weight: 2,
    needs: { category: 'soup' },
    portionName: 'soups',
    pricePerPortion: 22,
  },
  parishPierogi: {
    kind: 'order',
    icon: '⛪',
    name: 'Pierogi for the parish',
    texts: [
      'The parish of St. Bridget orders {size} plates of pierogi for their fête, ready at 15:00.',
      'The ladies of St. Mary’s choir order {size} plates of pierogi for an afternoon fête at 15:00.',
    ],
    group: 'locals',
    size: { min: 20, max: 30 },
    minute: 15 * 60,
    weight: 2,
    weekdays: [5, 6],
    needs: { template: 'pierogi' },
    portionName: 'plates of pierogi',
    pricePerPortion: 32,
  },
  summerCamp: {
    kind: 'order',
    icon: '🍰',
    name: 'Desserts for a summer camp',
    texts: [
      'A language summer camp orders {size} desserts for their farewell party at 16:00.',
      'A sailing camp in Górki orders {size} desserts for the end of the week, at 16:00.',
    ],
    group: 'students',
    size: { min: 20, max: 30 },
    minute: 16 * 60,
    weight: 1,
    needs: { category: 'dessert' },
    portionName: 'desserts',
    pricePerPortion: 18,
  },
};
