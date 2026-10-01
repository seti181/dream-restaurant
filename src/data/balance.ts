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
    /** Dishes the menu can hold at the start... */
    startingSlots: 6,
    /** ...and at most, after upgrading the menu board. */
    maxSlots: 12,
    /** Each menu board upgrade adds this many slots, for this many złoty. */
    slotUpgrade: { slots: 2, cost: 3_000 },
    /** Lowest menu price for any dish, in złoty. */
    minPrice: 1,
    /** Highest menu price allowed for any dessert, in złoty. */
    maxDessertPrice: 50,
    /** Extras a dish can have in the dish creator. */
    maxExtras: 3,
    /** Longest name a player can give a dish. */
    maxNameLength: 30,
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
    /** Share of a price change when a rival nudges prices up or down. */
    priceStep: 0.05,
    /** Rival prices stay between these multiples of their starting prices. */
    minPriceFactor: 0.75,
    maxPriceFactor: 1.3,
    /** A rival turning away more than this share of its guests wants more room or higher prices. */
    crowdedShare: 0.15,
    /** Ambiance an upgrade adds, up to a maximum. */
    upgradeAmbiance: 3,
    maxAmbiance: 90,
  },

  events: {
    /** Chance each evening that something unexpected happens tomorrow. */
    randomChancePerDay: 0.2,
  },

  reviews: {
    /** Chance that a party writes a review. */
    chance: 0.12,
    /** Chance that a review is about a pairing on their plate, if there is one. */
    pairingMentionChance: 0.5,
    /** A food critic's review moves reputation this many times as far as an ordinary visit, with every group. */
    criticWeight: 10,
  },

  choice: {
    /** How tempting "somewhere else" is (a kebab, home, a picnic). Higher = fewer guests eat out. */
    noRestaurantUtility: 7.5,
    /** Restaurants further away than this (metres) are out of walking range. */
    walkRangeMetres: 700,
    /** How many of a menu's best-matching dishes decide how tempting it looks. */
    menuMatchDishes: 3,
    /** Matching tags, categories or dishes needed for a dish to be a perfect match. */
    matchesForFullAppeal: 2,
    /** How much less tempting a restaurant looks when people can see every table is taken. */
    fullPenalty: 6,
  },

  weather: {
    /**
     * Chances of sunny, cloudy, rain and heatwave for each month, January first.
     * Each row adds up to 1. Heatwaves only happen in high summer.
     */
    monthChances: [
      [0.2, 0.45, 0.35, 0], // January
      [0.2, 0.45, 0.35, 0],
      [0.25, 0.4, 0.35, 0],
      [0.35, 0.35, 0.3, 0], // April
      [0.45, 0.3, 0.25, 0],
      [0.5, 0.25, 0.2, 0.05],
      [0.5, 0.2, 0.2, 0.1], // July
      [0.5, 0.2, 0.2, 0.1],
      [0.4, 0.3, 0.3, 0],
      [0.3, 0.35, 0.35, 0],
      [0.2, 0.4, 0.4, 0],
      [0.2, 0.45, 0.35, 0], // December
    ],
    /** How many people are out and about in each kind of weather. */
    traffic: { sunny: 1.1, cloudy: 1, rain: 0.7, heatwave: 1 },
    /** How much more (or less) often guests order soups, and cold treats (ice cream, lemonade). */
    soupOrders: { sunny: 1, cloudy: 1, rain: 1.4, heatwave: 0.5 },
    coolTreatOrders: { sunny: 1.2, cloudy: 1, rain: 0.7, heatwave: 2 },
  },

  relocation: {
    /** Moving to another street costs this much, in złoty. */
    fee: 5_000,
    /** Share of reputation that comes along: new neighbours need winning over. */
    reputationKept: 0.7,
    /** Share of decor items that survive the move (the most atmospheric ones). */
    decorKept: 0.5,
  },

  interior: {
    /** One more table (seatsPerTable seats), in złoty. */
    tableCost: 4_000,
  },

  decor: {
    /** Decor items of one style needed before the room counts as that style. */
    itemsForStyle: 2,
    /** How much a matching style tempts the groups that like it. */
    styleBonus: 0.8,
  },

  terrace: {
    /** The summer terrace permit, for one season, in złoty. */
    permitCost: 3_000,
    /** The terrace is open from May to September. */
    firstMonth: 5,
    lastMonth: 9,
    /** How much an open terrace tempts each group. Tourists love it. */
    appeal: { tourists: 1.5, students: 0.3, locals: 0.3, office: 0, foodies: 0.5 },
  },

  marketing: {
    /** Each day without a campaign, awareness loses this share of what it gained above the start. */
    fadePerDay: 0.05,
  },

  happyHour: {
    /** Everything is cheaper from 15:00 until 18:00... */
    startHour: 15,
    endHour: 18,
    /** ...by this share. */
    discount: 0.2,
  },

  moments: {
    /** Choice cards that come at random times each day (a card tied to a time of day takes one's place)... */
    perDay: { min: 1, max: 4 },
    /** ...between these times, at least this far apart... */
    firstMinute: 11 * 60 + 45,
    lastMinute: 20 * 60 + 30,
    minGapMinutes: 45,
    /** ...and if none can happen when one is due, it tries again this many minutes later. */
    retryMinutes: 30,
    /** A card seen in the last few days is this much less likely to be picked again. */
    recentDays: 3,
    recentWeight: 0.25,
  },

  lunchSet: {
    /** "Obiad dnia" is served from 12:00 until 15:00. */
    startHour: 12,
    endHour: 15,
    /** How much a lunch set tempts a group that loves it (times the group's lunchSetAppeal). */
    appealBonus: 1.5,
    /** A new lunch set starts at this share of the two dishes' separate prices. */
    startingPriceShare: 0.8,
  },

  supplier: {
    /** Premium ingredients make every dish this much better (quality points)... */
    premiumQualityBonus: 8,
    /** ...and cost this many times as much as the market's. */
    premiumCostMultiplier: 1.5,
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
    chefWage: 650,
    waiterWage: 450,
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

  /** What changes between Relaxed and Normal. See project.md section 5. */
  difficulty: {
    relaxed: {
      startingCash: 60_000,
      /** A rival reacts once the player serves this share of the guests it serves, among its favourite groups. */
      rivalThreatShare: 0.6,
      /** How far a rival cuts prices when it reacts to the player. */
      rivalReactionCut: 0.04,
      /** Awareness a rival's promotion adds with its favourite groups (it fades afterwards). */
      rivalPromotion: 5,
    },
    normal: {
      startingCash: 40_000,
      rivalThreatShare: 0.35,
      rivalReactionCut: 0.08,
      rivalPromotion: 10,
    },
  },

  finance: {
    /** Paid every Monday, together with the week's rent. */
    weeklyUtilities: 1_400,
    /** Warn when cash would last fewer than this many days of wages and rent. */
    lowCashDays: 7,
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
    eatingMinutes: 60,
    /** Order-taking this slow feels like no service at all. */
    slowOrderMinutes: 10,
    /** Service score gained for each waiter skill point above average (lost below). */
    serviceBonusPerSkillPoint: 0.15,
    /** With every table taken, this many parties can wait at the door for one to free up... */
    doorQueueMax: 2,
    /** ...for at most this many minutes, before they go somewhere else. */
    doorWaitMinutes: 10,
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
