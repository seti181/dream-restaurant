// Choice cards: small moments during service that pause the clock and offer two answers.
// See project.md section 6.13. How many come each day is tuned in balance.ts.

import type { GroupId } from './groups';

export type MomentId =
  | 'blogger'
  | 'shower'
  | 'regularsRound'
  | 'adrianText'
  | 'tomekTray'
  | 'tourGroup'
  | 'stoLat'
  | 'busker'
  | 'merryTourists'
  | 'brazilianCouple'
  | 'heatwaveKompot'
  | 'balticStorm'
  | 'fairStallholder'
  | 'engagementDinner'
  | 'proposal'
  | 'inspector'
  | 'nonnaBasil'
  | 'footballer'
  | 'herring'
  | 'babcia'
  | 'dineAndDash'
  | 'tramStrike'
  | 'blackout'
  | 'shantyChoir'
  | 'walesa';

/** Special guests who sit at a table for a while without ordering from the kitchen. */
export type Visitor = 'merry' | 'footballer' | 'walesa';

/** What has to be true right now for a moment to happen. The simulation checks these. */
export type MomentNeed =
  /** A dessert on the menu. */
  | 'dessertOnMenu'
  /** A soup on the menu. */
  | 'soupOnMenu'
  /** At least one party waiting for its food. */
  | 'guestsWaiting'
  /** At least two parties inside. */
  | 'guestsIn'
  /** Guests sitting on the terrace. */
  | 'terraceGuests'
  /** A cloudy day (on a sunny day there's no shower; on a rainy one the terrace is closed). */
  | 'cloudy'
  /** Pan Cytrynówka is in. */
  | 'regularHere'
  /** Adrian didn't turn up today. */
  | 'adrianAway'
  /** Tomek is working today. */
  | 'tomekWorking'
  /** Two free tables, and the door open to new guests. */
  | 'roomForSix'
  /** A free table, and the door open to new guests. */
  | 'freeTable'
  /** During St. Dominic's Fair. */
  | 'duringFair'
  /** During the tall ships festival. */
  | 'tallShipsWeek'
  /** A heatwave today. */
  | 'heatwave'
  /** Rain today. */
  | 'rainy';

/** How often a card turns up, compared with the others. The weights are in balance.ts. */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'veryRare';

/** What an answer does. Everything is optional; `result` says what happened. */
export interface MomentEffect {
  result: string;
  /** Złoty gained (or spent, if negative). */
  cash?: number;
  /** Złoty for every guest in the restaurant right now (a round on the house). */
  cashPerGuest?: number;
  /**
   * Points added to how happy guests end up (0–100), for guests still waiting for their food:
   * all of them, those on the terrace, or the one table the moment is about.
   */
  mood?: { who: 'waiting' | 'terrace' | 'one'; amount: number };
  /** Reputation points with each group. */
  reputation?: Partial<Record<GroupId, number>>;
  /** Awareness points with each group. */
  awareness?: Partial<Record<GroupId, number>>;
  /** Someone comes in to wait tables for the rest of the day. */
  helper?: { skill: number; speed: number };
  /** A group walks in right now. */
  walkIn?: { group: GroupId; size: number };
  /**
   * Special guests take a table for a while (until closing at the latest) and order nothing
   * from the kitchen. They can keep new guests away until they leave: walk-ins only, or
   * everyone (except Pan Cytrynówka, whom everybody knows). Leaving, they can multiply
   * reputation with some groups.
   */
  visitors?: {
    who: Visitor;
    group: GroupId;
    size: number;
    minutes: number;
    closesDoor?: 'walkIns' | 'everyone';
    reputationAfterwards?: Partial<Record<GroupId, number>>;
  };
  /** Quality points added to everything cooked for the rest of the day. */
  qualityBoost?: number;
  /** One waiter leaves the floor for this many minutes. */
  waiterAway?: number;
  /** Terrace guests move to free tables inside. */
  moveInside?: boolean;
  /** A review for the day report: one of the texts, by one of the reviewers. */
  review?: { stars: number; texts: string[]; reviewers: string[] };
  /** Every chef stops for this many minutes. */
  kitchenPause?: number;
  /** A gamble: the chance this answer works out, and what happens if it doesn't. */
  chance?: number;
  otherwise?: MomentEffect;
  /**
   * Something that comes of it later: in `inDays` days, more of some groups for `days` days
   * (with a line in the morning news), or another card that comes back that day.
   */
  followUp?: {
    inDays: number;
    days?: number;
    groups?: Partial<Record<GroupId, number>>;
    news?: { title: string; text: string };
    card?: MomentId;
  };
}

export interface MomentChoice {
  label: string;
  effect: MomentEffect;
}

export interface Moment {
  title: string;
  text: string;
  needs: MomentNeed[];
  /** A moment that belongs to one time of day comes then (if its needs are met); the others come at random times. */
  at?: { hour: number; minute: number };
  /** How often it turns up, compared with the others. */
  rarity: Rarity;
  /** Only ever comes as the follow-up of another card, never at random. */
  followUpOnly?: boolean;
  /** For a rare moment: the fewest days before it can come again. */
  cooldownDays?: number;
  /** The first answer is the "yes"; the second is what a player who doesn't help would choose. */
  choices: [MomentChoice, MomentChoice];
}

export const MOMENT_IDS: readonly MomentId[] = [
  'blogger',
  'shower',
  'regularsRound',
  'adrianText',
  'tomekTray',
  'tourGroup',
  'stoLat',
  'busker',
  'merryTourists',
  'brazilianCouple',
  'heatwaveKompot',
  'balticStorm',
  'fairStallholder',
  'engagementDinner',
  'proposal',
  'inspector',
  'nonnaBasil',
  'footballer',
  'herring',
  'babcia',
  'dineAndDash',
  'tramStrike',
  'blackout',
  'shantyChoir',
  'walesa',
];

const EVERYONE = (points: number) => ({ tourists: points, students: points, locals: points, office: points, foodies: points });

export const MOMENTS: Record<MomentId, Moment> = {
  blogger: {
    title: 'A food blogger',
    text: 'A food blogger with a very big camera asks if she could have a dessert on the house, “just for the photos”.',
    needs: ['dessertOnMenu'],
    rarity: 'common',
    choices: [
      {
        label: 'Of course!',
        effect: {
          cash: -30,
          awareness: { foodies: 4, students: 2 },
          followUp: {
            inDays: 1,
            days: 1,
            groups: { foodies: 1.4, students: 1.2 },
            news: {
              title: 'Your dessert is famous',
              text: 'The food blogger’s photos are everywhere this morning. Expect a few more foodies and students today!',
            },
          },
          result: 'Your dessert is all over social media tonight. Foodies and students have heard of you.',
        },
      },
      {
        label: 'Sorry, not today',
        effect: { result: 'She orders a coffee and photographs that instead. It’s a nice coffee.' },
      },
    ],
  },
  shower: {
    title: 'Clouds over the Motława',
    text: 'Dark clouds are rolling in, and the first drops are falling on the terrace!',
    needs: ['terraceGuests', 'cloudy'],
    rarity: 'common',
    choices: [
      {
        label: 'Bring them inside',
        effect: {
          moveInside: true,
          mood: { who: 'terrace', amount: -5 },
          result: 'Everyone carries their plates inside. Anyone who doesn’t fit gets an umbrella and a smile.',
        },
      },
      {
        label: 'It’ll pass',
        effect: {
          chance: 0.5,
          mood: { who: 'terrace', amount: 5 },
          result: 'It passed! The sun is back, and the terrace guests feel very lucky.',
          otherwise: {
            mood: { who: 'terrace', amount: -20 },
            reputation: { tourists: -1 },
            result: 'It did not pass. Soggy guests, soggy pierogi.',
          },
        },
      },
    ],
  },
  regularsRound: {
    title: 'A round for the room!',
    text:
      'Pan Cytrynówka stands up: “Cytrynówka for everyone!” Then he pats his pockets. ' +
      'He has forgotten his wallet. Again.',
    needs: ['regularHere'],
    at: { hour: 19, minute: 30 },
    rarity: 'common',
    choices: [
      {
        label: 'On the house!',
        effect: {
          cashPerGuest: -6,
          mood: { who: 'waiting', amount: 10 },
          reputation: { locals: 2 },
          result: 'The whole room raises a glass. “Na zdrowie!” The locals will talk about this for weeks.',
        },
      },
      {
        label: 'Put it on his tab',
        effect: { result: 'He promises to pay next Friday. He says that every Friday.' },
      },
    ],
  },
  adrianText: {
    title: 'A text from Adrian',
    text: '“almost there!! 5 min 🏃” The lunch rush is about to start. A friend could cover for him, for 250 zł.',
    needs: ['adrianAway'],
    at: { hour: 12, minute: 0 },
    rarity: 'common',
    choices: [
      {
        label: 'Call in a friend',
        effect: {
          cash: -250,
          helper: { skill: 3, speed: 3 },
          result: 'A friend of a friend arrives ten minutes later, apron already on. What a hero.',
        },
      },
      {
        label: 'Wait for Adrian',
        effect: { result: 'Adrian arrives at 21:55, just in time for the staff dinner.' },
      },
    ],
  },
  tomekTray: {
    title: 'CRASH!',
    text: 'Tomek has dropped a tray of kompot all over a table’s tablecloth. And a little bit on the guests.',
    needs: ['tomekWorking', 'guestsWaiting'],
    rarity: 'uncommon',
    choices: [
      {
        label: 'Dessert on the house',
        effect: {
          cash: -40,
          mood: { who: 'one', amount: 5 },
          result: 'A free slice of cake makes everything better. They’re laughing about it now.',
        },
      },
      {
        label: 'Laugh it off',
        effect: {
          mood: { who: 'one', amount: -15 },
          result: 'They don’t laugh. Tomek does, which doesn’t help.',
        },
      },
    ],
  },
  tourGroup: {
    title: 'A tour group',
    text: 'A tour guide with a little flag pops in: “Can you fit six hungry tourists, right now?”',
    needs: ['roomForSix'],
    rarity: 'common',
    choices: [
      {
        label: 'Come in!',
        effect: {
          walkIn: { group: 'tourists', size: 6 },
          result: 'Six tourists squeeze in, cameras and all. The kitchen is about to get busy!',
        },
      },
      {
        label: 'Sorry, we’re full',
        effect: { result: 'They head off towards Długa. Maybe next time.' },
      },
    ],
  },
  stoLat: {
    title: 'A birthday',
    text: 'A family asks if the whole room could sing “Sto lat” for their grandma’s 80th birthday.',
    needs: ['guestsIn'],
    rarity: 'common',
    choices: [
      {
        label: 'Everyone sing!',
        effect: {
          kitchenPause: 5,
          mood: { who: 'waiting', amount: 8 },
          reputation: { locals: 2 },
          result: '“Sto lat, sto lat!” Grandma cries happy tears. The kitchen lost five minutes, and nobody minds.',
        },
      },
      {
        label: 'Just a candle',
        effect: { result: 'A candle on her plate. Grandma blows it out on the first try.' },
      },
    ],
  },
  busker: {
    title: 'An accordion player',
    text: 'An accordion player offers to play outside your door for the afternoon, for 150 zł.',
    needs: [],
    rarity: 'common',
    choices: [
      {
        label: 'Play us something!',
        effect: {
          cash: -150,
          mood: { who: 'waiting', amount: 5 },
          awareness: { tourists: 3, locals: 2 },
          result: 'Old Polish songs drift down the street. People stop to listen, and some of them peek in.',
        },
      },
      {
        label: 'No, thank you',
        effect: { result: 'He plays outside a rival’s door instead. It sounds lovely from here.' },
      },
    ],
  },
  merryTourists: {
    title: 'A very merry group',
    text:
      'Four tourists stumble in, already very cheerful, singing something about Gdańsk. ' +
      'They don’t want food, only shots of cytrynówka. Lots of them. They promise a big tip.',
    needs: ['freeTable'],
    rarity: 'uncommon',
    choices: [
      {
        label: 'Pour the cytrynówka!',
        effect: {
          cash: 500,
          mood: { who: 'waiting', amount: -10 },
          visitors: { who: 'merry', group: 'tourists', size: 4, minutes: 45, closesDoor: 'walkIns' },
          result:
            'They sing, they toast everyone and they tip 500 zł. The other guests stare at their plates, ' +
            'and people outside decide to come back another time.',
        },
      },
      {
        label: 'Sorry, we’re a restaurant',
        effect: { result: 'They sing their way down Długa to find a bar.' },
      },
    ],
  },
  brazilianCouple: {
    title: 'A Brazilian couple',
    text:
      'A Brazilian couple on their honeymoon ask, with the biggest smiles in Gdańsk, ' +
      'if they could try a dessert on the house. “Só um pouquinho?”',
    needs: ['dessertOnMenu'],
    rarity: 'uncommon',
    choices: [
      {
        label: 'Com certeza!',
        effect: {
          cash: 50,
          review: {
            stars: 5,
            texts: [
              'Que delícia! The dessert was a gift, and so was the welcome. Obrigado, Gdańsk!',
              'We came for the amber and stayed for the dessert. Five stars, beijos!',
              'The best honeymoon dinner in Europe. They even gave us dessert. Muito obrigado!',
            ],
            reviewers: ['a honeymoon couple from Rio', 'a honeymoon couple from São Paulo'],
          },
          result: 'They share one spoon, leave a 50 zł tip and write you a five-star review. Que fofos!',
        },
      },
      {
        label: 'Sorry, not today',
        effect: { result: 'They laugh, order two coffees and wave goodbye. Tchau!' },
      },
    ],
  },
  proposal: {
    title: 'A secret proposal',
    text: 'A very nervous young man asks if the kitchen could hide an engagement ring in his girlfriend’s dessert.',
    needs: ['dessertOnMenu'],
    rarity: 'rare',
    choices: [
      {
        label: 'Let’s do it!',
        effect: {
          kitchenPause: 5,
          mood: { who: 'waiting', amount: 8 },
          review: {
            stars: 5,
            texts: [
              'She found the ring in her dessert and said YES! We will celebrate every anniversary here.',
              'The best night of our lives, and the dessert was perfect too. Thank you for keeping the secret!',
            ],
            reviewers: ['a newly engaged couple', 'a very happy fiancée'],
          },
          followUp: { inDays: 7, card: 'engagementDinner' },
          result: 'She finds the ring, she says YES, and the whole room applauds!',
        },
      },
      {
        label: 'Too risky',
        effect: { result: 'He proposes over coffee instead. She still says yes.' },
      },
    ],
  },
  inspector: {
    title: 'Sanepid!',
    text: 'A health inspector walks in unannounced, clipboard in hand. She would like to see the kitchen.',
    needs: [],
    rarity: 'uncommon',
    choices: [
      {
        label: 'Full tour of the kitchen',
        effect: {
          chance: 0.8,
          kitchenPause: 10,
          reputation: { locals: 2, office: 1 },
          result: 'Spotless! Word gets around that yours is the cleanest kitchen in the Old Town.',
          otherwise: {
            kitchenPause: 10,
            cash: -300,
            result: 'One cracked tile behind the fridge. A 300 zł fine, and a promise to fix it.',
          },
        },
      },
      {
        label: 'Come back after lunch?',
        effect: {
          chance: 0.5,
          result: 'She nods and comes back at four. All fine.',
          otherwise: {
            reputation: EVERYONE(-1),
            result: 'She writes something in her notebook. Word gets around.',
          },
        },
      },
    ],
  },
  nonnaBasil: {
    title: 'Nonna Rosa needs basil',
    text: 'Nonna Rosa from the trattoria rushes in, flour on her apron: “Mamma mia, I have no basil left! Can you help me?”',
    needs: ['freeTable'],
    rarity: 'uncommon',
    choices: [
      {
        label: 'Of course, take some',
        effect: {
          cash: -20,
          walkIn: { group: 'locals', size: 3 },
          result: 'She hugs you, and sends three of her guests over: “Go next door, they are good people.”',
        },
      },
      {
        label: 'Sorry, we need it',
        effect: { result: 'She hurries off. She’ll remember that.' },
      },
    ],
  },
  footballer: {
    title: 'A Lechia Gdańsk star',
    text: 'A footballer from Lechia Gdańsk and a friend ask for a quiet corner table. “No fuss, please.”',
    needs: ['freeTable'],
    rarity: 'rare',
    choices: [
      {
        label: 'Right this way',
        effect: {
          cash: 120,
          visitors: { who: 'footballer', group: 'locals', size: 2, minutes: 60 },
          awareness: { students: 5, locals: 4 },
          result: 'Somebody spots him and posts a photo. By the evening half of Gdańsk knows where Lechia eats.',
        },
      },
      {
        label: 'Sorry, we’re full',
        effect: { result: 'He tries the place next door. Their photo is everywhere tomorrow.' },
      },
    ],
  },
  herring: {
    title: 'Herring at half price',
    text: 'Your fishmonger at the Hala Targowa calls: twenty kilos of fresh Baltic herring at half price, if you take it now.',
    needs: [],
    rarity: 'uncommon',
    choices: [
      {
        label: 'We’ll take it all!',
        effect: {
          cash: -300,
          qualityBoost: 5,
          result: 'The kitchen smells of the sea. Everything tastes a little fresher for the rest of the day.',
        },
      },
      {
        label: 'Not today, thanks',
        effect: { result: 'He sells it to the rivals down the street instead.' },
      },
    ],
  },
  babcia: {
    title: 'Babcia’s secret',
    text: 'An elderly lady puts down her spoon: “Your soup is good, but not like my mother’s. Shall I show your chef the secret?”',
    needs: ['soupOnMenu'],
    rarity: 'uncommon',
    choices: [
      {
        label: 'Yes please, show us!',
        effect: {
          kitchenPause: 15,
          qualityBoost: 5,
          reputation: { locals: 2 },
          result: 'A pinch of this, a splash of that. The chef takes notes, and the food is better already.',
        },
      },
      {
        label: 'We like our recipe',
        effect: { result: 'She tuts politely, and finishes every drop anyway.' },
      },
    ],
  },
  dineAndDash: {
    title: 'Dine and dash!',
    text: 'A guest in a hurry slips out of the door without paying!',
    needs: ['guestsIn'],
    rarity: 'uncommon',
    choices: [
      {
        label: 'Run after him!',
        effect: {
          chance: 0.7,
          waiterAway: 10,
          cash: 20,
          result: 'Your waiter catches him on Długa. He goes red, pays, and leaves a 20 zł tip.',
          otherwise: {
            waiterAway: 10,
            cash: -80,
            result: 'He’s too fast. Your waiter comes back out of breath, and the 80 zł bill is gone.',
          },
        },
      },
      {
        label: 'Let him go',
        effect: { cash: -80, result: 'Gone, with an 80 zł bill. At least he looked like he enjoyed it.' },
      },
    ],
  },
  tramStrike: {
    title: 'Tram strike',
    text: 'The trams have stopped all over Gdańsk! Four office workers are stuck in the Old Town and need somewhere to sit.',
    needs: ['freeTable'],
    rarity: 'uncommon',
    choices: [
      {
        label: 'Squeeze them in',
        effect: {
          walkIn: { group: 'office', size: 4 },
          result: 'They take a table and order like they haven’t eaten in days.',
        },
      },
      {
        label: 'Sorry, we’re busy',
        effect: { result: 'They walk on, grumbling about the trams.' },
      },
    ],
  },
  blackout: {
    title: 'Blackout!',
    text: 'Pop! The fuses blow and the lights go out all over the dining room.',
    needs: ['guestsIn'],
    rarity: 'uncommon',
    choices: [
      {
        label: 'Candles everywhere!',
        effect: {
          cash: -50,
          mood: { who: 'waiting', amount: 5 },
          result: 'Candlelight on every table, and the gas stoves keep cooking. The guests think it’s on purpose, and very romantic.',
        },
      },
      {
        label: 'Wait for the electrician',
        effect: { kitchenPause: 10, result: 'He comes after ten minutes. The kitchen waits in the dark until then.' },
      },
    ],
  },
  shantyChoir: {
    title: 'A sea shanty choir',
    text: 'A choir of sailors off the tall ships on the Motława offers to sing for their supper.',
    needs: ['guestsIn', 'tallShipsWeek'],
    rarity: 'common',
    choices: [
      {
        label: 'Sing for us!',
        effect: {
          cash: -120,
          mood: { who: 'waiting', amount: 8 },
          awareness: { tourists: 3 },
          result: '“Hej, ha! Kolejkę nalej!” The whole room sings along, and tourists stop outside to listen.',
        },
      },
      {
        label: 'Maybe another time',
        effect: { result: 'They sing outside anyway. Quite loudly.' },
      },
    ],
  },
  walesa: {
    title: 'A very famous guest',
    text:
      'Three men in black suits and sunglasses check every corner. Then in walks Lech Wałęsa himself, moustache and all, ' +
      'asking for a table. Security says nobody else may come in while he’s here.',
    needs: ['freeTable'],
    rarity: 'veryRare',
    cooldownDays: 28,
    choices: [
      {
        label: 'It’s an honour, Panie Prezydencie!',
        effect: {
          cash: 2500,
          visitors: {
            who: 'walesa',
            group: 'locals',
            size: 4,
            minutes: 180,
            closesDoor: 'everyone',
            reputationAfterwards: { locals: 1.1 },
          },
          result:
            'He stays for three hours, signs the menu and tips 2,500 zł. Nobody else gets in, ' +
            'but once he leaves, every local family will be talking about it.',
        },
      },
      {
        label: 'We can’t close the doors',
        effect: { result: 'He understands completely, makes a V sign and heads off towards Długa.' },
      },
    ],
  },
  heatwaveKompot: {
    title: 'A scorcher on Długa',
    text: 'It’s 33 degrees and the people walking past look like melting ice cream. Hand out free cups of cold kompot at the door?',
    needs: ['heatwave'],
    rarity: 'common',
    choices: [
      {
        label: 'Kompot for everyone!',
        effect: {
          cash: -60,
          mood: { who: 'waiting', amount: 4 },
          awareness: { tourists: 3, locals: 3 },
          result: 'Cold strawberry kompot in paper cups. Half of Długa now knows where to find you.',
        },
      },
      {
        label: 'Too busy today',
        effect: { result: 'People fan themselves with your menu and walk on.' },
      },
    ],
  },
  balticStorm: {
    title: 'A Baltic storm',
    text: 'The sky goes black over the Motława and the rain comes sideways. Four soaked tourists run for your door.',
    needs: ['rainy', 'freeTable'],
    rarity: 'common',
    choices: [
      {
        label: 'Towels and hot tea!',
        effect: {
          cash: -40,
          walkIn: { group: 'tourists', size: 4 },
          mood: { who: 'waiting', amount: 3 },
          result: 'Dry towels, hot tea with lemon, and four very grateful tourists who stay for dinner.',
        },
      },
      {
        label: 'Sorry, we’re full',
        effect: { result: 'They run on down the street, splashing through the puddles.' },
      },
    ],
  },
  fairStallholder: {
    title: 'A stall at the Fair',
    text: 'A stallholder from St. Dominic’s Fair offers to sell your pierogi at his stand on Długi Targ, for a share of the takings.',
    needs: ['duringFair'],
    rarity: 'uncommon',
    choices: [
      {
        label: 'Let’s do it',
        effect: {
          cash: 300,
          awareness: { tourists: 5, locals: 3 },
          result: 'Your pierogi sell out by the evening, and the stall has your name on a little board.',
        },
      },
      {
        label: 'We’re busy enough',
        effect: { result: 'He sells oscypek instead. The Fair smells of smoked cheese.' },
      },
    ],
  },
  engagementDinner: {
    title: 'An engagement dinner',
    text: 'Remember the ring in the dessert? The happy couple are back, with both families, for their engagement dinner. Eight of them!',
    needs: ['roomForSix'],
    rarity: 'common',
    followUpOnly: true,
    choices: [
      {
        label: 'Welcome back!',
        effect: {
          walkIn: { group: 'locals', size: 8 },
          reputation: { locals: 2 },
          review: {
            stars: 5,
            texts: [
              'We celebrated our engagement where it all began. Both families are coming back for the wedding cake tasting!',
              'Where he proposed, we celebrated. The staff remembered us. Perfect.',
            ],
            reviewers: ['a newly engaged couple and their families'],
          },
          result: 'Two families, eight toasts, and a very happy couple. They promise to come back for every anniversary.',
        },
      },
      {
        label: 'Sorry, not tonight',
        effect: { result: 'They go to Nonna Rosa’s instead. She gives them a free tiramisu.' },
      },
    ],
  },
};
