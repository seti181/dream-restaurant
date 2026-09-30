// All tunable numbers for the game live here. Logic reads them from this file
// and never hard-codes its own copies.

export const balance = {
  clock: {
    /** In-game minutes that pass in one simulation tick. */
    tickMinutes: 5,
    /** Opening time, in minutes after midnight (11:00). */
    openMinute: 11 * 60,
    /** Closing time, in minutes after midnight (22:00). */
    closeMinute: 22 * 60,
    /** Times of day used by the customer groups: lunch runs from opening until the afternoon starts. */
    afternoonStartHour: 15,
    eveningStartHour: 18,
    /** Real seconds that one day (11:00 to 22:00) takes at 1× speed. */
    realSecondsPerDay: 50,
  },

  menu: {
    /** Dishes the menu can hold at the start (it can be upgraded later). */
    startingSlots: 6,
    /** Lowest menu price for any dish, in złoty. */
    minPrice: 1,
    /** Highest menu price allowed for any dessert, in złoty. */
    maxDessertPrice: 50,
  },

  calendar: {
    /** The season starts on 1 April. */
    seasonStartMonth: 4,
    seasonStartDayOfMonth: 1,
    /** Weekday of the first day: 0 = Monday … 6 = Sunday. */
    seasonStartWeekday: 0,
    /** 20 weeks: 1 April to Sunday 18 August, the last day of St. Dominic's Fair. */
    seasonLengthDays: 140,
    /** St. Dominic's Fair: the last 23 days of the season, Saturday 27 July to Sunday 18 August. */
    fairLengthDays: 23,
  },

  start: {
    name: 'Joana’s Kitchen',
    /** The player's first home. */
    location: 'ogarna',
    /** A simple starter menu at typical prices, until the player builds their own. */
    menu: [
      { template: 'tomatoSoup', variant: 'noodles', price: 18 },
      { template: 'zurek', variant: 'classic', price: 28 },
      { template: 'pierogi', variant: 'ruskie', price: 36 },
      { template: 'schabowy', variant: 'cabbage', price: 44 },
      { template: 'golabki', variant: 'tomato', price: 38 },
      { template: 'kompot', variant: 'strawberry', price: 9 },
    ],
    /** The kitchen comes with a stove. */
    equipment: ['stove'],
    seats: 16,
    /** 0–100. A bare room before any decor. */
    ambiance: 30,
    /** Starting reputation with every group, 0–100. */
    reputation: 30,
    /** How many people of each group have heard of the player at the start, 0–100. */
    awareness: 10,
  },

  rivals: {
    /** Rivals are well known in the Old Town from day one, 0–100. */
    awareness: 60,
  },

  choice: {
    /** How tempting "somewhere else" is (a kebab, home, a picnic). Higher = fewer guests eat out. */
    noRestaurantUtility: 6,
    /** Restaurants further away than this (metres) are out of walking range. */
    walkRangeMetres: 700,
    /** How many of a menu's best-matching dishes decide how tempting it looks. */
    menuMatchDishes: 3,
    /** Matching tags, categories or dishes needed for a dish to be a perfect match. */
    matchesForFullAppeal: 2,
  },

  orders: {
    /** Every dish gets some orders; dishes a group likes get up to this much more again. */
    baseDishWeight: 0.5,
    /** Chance that each guest also orders a drink or a dessert, if the menu has one. */
    drinkChance: 0.6,
    dessertChance: 0.3,
  },

  staff: {
    /** Skill and speed of an average worker (the scale is 1–5). */
    averageLevel: 3,
    /** Daily wages of an average chef and waiter, in złoty. */
    chefWage: 350,
    waiterWage: 250,
    /** Each skill or speed point above average adds this share to the wage (and below, takes it off). */
    wageStepPerLevel: 0.1,
    /** How each trait changes a person's skill and speed while they work. */
    traitEffects: {
      cheerful: { skill: 0.5, speed: 0 },
      perfectionist: { skill: 1, speed: -1 },
      speedy: { skill: -0.5, speed: 1 },
      chatty: { skill: 0.5, speed: -0.5 },
      calm: { skill: 0, speed: 0.5 },
    },
    /** Nobody works at less than this skill or speed, whatever their trait. */
    minEffectiveLevel: 0.5,
    /** Job candidates each Monday. */
    candidatePool: { min: 3, max: 4 },
    /** How common each level (1 to 5) is among candidates. */
    candidateLevelWeights: [1, 3, 4, 3, 1],
  },

  finance: {
    /** Starting cash on Normal. */
    startingCash: 40_000,
    /** Paid every Monday, together with the week's rent. */
    weeklyUtilities: 400,
  },

  neptune: {
    /** Neptune Score = 60% average rating + 40% share of Old Town guests during the Fair. */
    ratingWeight: 0.6,
    shareWeight: 0.4,
  },

  kitchen: {
    /** Extra minutes for each additional portion in the same order. */
    extraPortionMinutes: 1,
    /** Menus bigger than this slow the kitchen a little... */
    menuSizeBeforeSlowdown: 6,
    /** ...by this fraction per extra dish. */
    slowdownPerExtraDish: 0.03,
    /** Dish quality gained for each chef skill point above average (lost below). */
    qualityPerSkillPoint: 5,
    /** Extra quality when a dish matches the chef's specialty. */
    specialtyBonus: 8,
  },

  service: {
    seatsPerTable: 4,
    /** Minutes from sitting down to the order reaching the kitchen, with an average waiter. */
    orderMinutes: 5,
    /** Occupied tables one waiter can look after before service slows down. */
    tablesPerWaiter: 4,
    eatingMinutes: 30,
    /** Order-taking this slow feels like no service at all. */
    slowOrderMinutes: 10,
    /** Service score gained for each waiter skill point above average (lost below). */
    serviceBonusPerSkillPoint: 0.15,
  },

  satisfaction: {
    /** How much each factor counts. They add up to 1. */
    weights: { quality: 0.4, value: 0.25, wait: 0.2, ambiance: 0.1, service: 0.05 },
    /** Quality points above (or below) a group's expectation for full delight (or disappointment). */
    qualityRange: 30,
    /** How strongly paying more or less than the usual price changes happiness. */
    valueSlope: 2,
    /** Satisfaction (0–100) of a party that gave up waiting and walked out. */
    walkoutScore: 10,
  },

  reputation: {
    /** How far reputation moves towards each party's satisfaction. Small = slow and steady. */
    smoothing: 0.02,
  },
} as const;
