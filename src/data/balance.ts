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
    /** Real seconds that one day (11:00 to 22:00) takes at 1× speed: calm enough to look after the guests. */
    realSecondsPerDay: 130,
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
    /** The season starts on Monday 8 July... */
    seasonStartMonth: 7,
    seasonStartDayOfMonth: 8,
    /** Weekday of the first day: 0 = Monday … 6 = Sunday. */
    seasonStartWeekday: 0,
    /** ...and lasts six weeks, to Sunday 18 August, the last day of St. Dominic's Fair. */
    seasonLengthDays: 42,
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
    noRestaurantUtility: 7.8,
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
    /** With a permit, the terrace is open from the very first day to the end of September. */
    firstMonth: 4,
    lastMonth: 9,
    /** How much an open terrace tempts each group. Tourists love it. */
    appeal: { tourists: 1.5, students: 0.3, locals: 0.3, office: 0, foodies: 0.5 },
  },

  marketing: {
    /** Each day without a campaign, awareness loses this share of what it gained above the start. */
    fadePerDay: 0.05,
  },

  happyHour: {
    /** Started with a button during the day, once a day: it lasts this many minutes... */
    minutes: 60,
    /** ...everything is cheaper by this share... */
    discount: 0.2,
    /** ...and the board outside makes the restaurant this much more tempting to passers-by. */
    appealBonus: 1,
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
    /** How often cards of each rarity turn up, compared with each other. */
    rarityWeights: { common: 4, uncommon: 2, rare: 1, veryRare: 0.3 },
    /**
     * A card that has come up rests for this many days while the others have their turn.
     * Only if every card that fits right now is resting does one come back early: the one
     * seen longest ago.
     */
    restDays: 8,
  },

  /** Fresh produce in season (the seasons are in dishes.ts, on each extra). */
  seasonal: {
    /** Quality points for a dish with something fresh in season on it... */
    freshQuality: 6,
    /** ...and what that ingredient costs out of season, imported, compared with in season. */
    outOfSeasonCost: 2,
  },

  /** "Dziś polecamy": one dish on the board outside as today's special. */
  specials: {
    /** How much more often guests order the special than they otherwise would... */
    orderWeight: 2,
    /** ...how much more tempting the board makes the restaurant to people walking by... */
    appeal: 0.25,
    /** ...and more again when the special has something fresh in season on it. */
    freshAppeal: 0.5,
  },

  regulars: {
    /** Regulars feel at home: this much happier (0–100) than other guests from the start. */
    atHomeMood: 5,
    /** A regular's visit is a happy one when their wish came true and they were at least this happy (0–100)... */
    happyFrom: 60,
    /** ...and then their group likes you this many points more. */
    happyReputation: 1,
    /** With this many happy visits by the last part of their story, they become friends of the house... */
    friendsVisits: 3,
    /** ...and tell everyone: reputation and awareness with their group. */
    friendsReputation: 3,
    friendsAwareness: 10,
    /** The dearest main a student can afford (Weronika's wish). */
    cheapMainPrice: 34,
  },

  gulls: {
    /** On days the terrace is open, this many gulls come looking for food... */
    perDay: { min: 1, max: 3 },
    /** ...between these times; if no terrace table is eating, they circle back this many minutes later. */
    firstMinute: 12 * 60,
    lastMinute: 20 * 60 + 30,
    retryMinutes: 20,
    /** Ticks the player has to shoo a gull before it grabs the plate (the clock runs at 1× meanwhile). */
    windowTicks: 6,
    /** Reputation with that table's group: gained when the gull is shooed, lost when it steals. */
    shooedReputation: 0.3,
    stolenReputation: 0.3,
  },

  seating: {
    /** Happiness points for guests the player shows to one of their favourite spots. */
    favouriteMood: 6,
  },

  help: {
    /** Tapping a waiting table: a free drink costs this much for each guest at it... */
    drinkCostPerGuest: 6,
    /** ...and buys them this many more minutes of patience, and a little goodwill. */
    drinkPatienceMinutes: 15,
    drinkMood: 3,
    /** The chef comes out to apologise and cooks their order next: this many times a day. */
    apologiesPerDay: 3,
    apologyMood: 5,
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
    /** One-day courses: a level up in skill or speed costs this many złoty for each level reached (3 → 4 costs 4×)... */
    training: {
      costPerLevel: 1_000,
      /** ...and people enjoy learning something new: morale. */
      morale: 5,
    },
    /** Small moments for the team (a birthday, pączki): the chance each morning, for people who've been there this long. */
    teamMoments: {
      chance: 0.15,
      settledInDays: 7,
    },
    /** How everyone feels about the job, from 0 to 100. See project.md section 6.14 (staff growth). */
    morale: {
      /** New starters, and the team you start with. */
      start: 80,
      /** Lost for every day worked (Cheerful people tire more slowly)... */
      workDay: 1.5,
      cheerfulWorkDay: 1,
      /** ...and won back by a day off (or a day in bed). */
      dayOff: 15,
      /** From this, someone is in good spirits (it shows; no other effect). */
      happyFrom: 70,
      /** Below this, someone is tired, and works this much slower (never below 1). */
      tiredBelow: 40,
      tiredSpeedLoss: 0.5,
      /** Lost on top of a day's work by someone paid less than their fair wage (after a course, say)... */
      underpaidWorkDay: 1.5,
      /** ...and won by a raise to the fair wage. */
      raise: 10,
      /** Below this, they're worn out, and each morning they may call in sick. */
      wornOutBelow: 15,
      sickChance: 0.5,
    },
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
    weeklyUtilities: 4_200,
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
    /** Guests who booked go to the front of the queue and wait this many times as long. */
    bookedWaitFactor: 4,
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
    smoothing: 0.035,
  },
} as const;
