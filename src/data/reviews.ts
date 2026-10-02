// Review lines. A review joins what a guest liked most with what they liked least,
// e.g. "Best pierogi on ul. Piwna, but the waiter vanished." See project.md section 6.8.
// {dish} is the dish they ate and {street} is where the restaurant is.

import type { GroupId } from './groups';

export type ReviewFactor = 'quality' | 'value' | 'wait' | 'ambiance' | 'service';

// Lines are written so they work for any dish, singular or plural (pierogi, gołąbki…).

/** Opening praise, without a full stop. */
export const PRAISE: Record<ReviewFactor, string[]> = {
  quality: [
    'Best {dish} on {street}',
    'Real comfort food, that {dish}',
    'I’d come back just for the {dish}',
    'The {dish} tasted like home',
    'The {dish} was the highlight of our trip',
    'Still dreaming about the {dish}',
    'Proper cooking: the {dish} was spot on',
  ],
  value: [
    'Great value for money',
    'Generous portions at fair prices',
    'Fair prices for the Old Town',
    'We ate like kings and paid like students',
    'Honest prices, even with that view',
  ],
  wait: [
    'Our food came in no time',
    'Quick, even at the busiest hour',
    'Barely time to butter the bread before the food arrived',
    'Fast enough to catch our tram',
    'Quicker than the queue at the Neptune Fountain',
  ],
  ambiance: [
    'Such a cosy room',
    'A lovely, warm atmosphere',
    'A proper Gdańsk feel to the place',
    'It felt like eating inside a painting of the Old Town',
    'Cosy enough to stay until closing',
  ],
  service: [
    'Wonderful service',
    'Our waiter was an absolute star',
    'The staff made us feel like regulars',
    'The waiter remembered our names',
    'Friendly faces from start to finish',
  ],
};

/** A complaint, to follow "but". */
export const COMPLAINTS: Record<ReviewFactor, string[]> = {
  quality: [
    'the {dish} tasted a bit bland',
    'the {dish} could have been better',
    'Babcia would have added more salt to the {dish}',
    'the {dish} was more “meh” than “mmm”',
    'the {dish} needed a little more love',
  ],
  value: [
    'it’s a bit pricey',
    'my wallet is still recovering',
    'the prices made my eyes water',
    'the bill was longer than the menu',
    'we paid Długi Targ prices',
  ],
  wait: [
    'we waited forever',
    'the kitchen was so slow',
    'we could have walked to Sopot and back',
    'the seagulls outside got fed faster than we did',
    'my coffee went cold while we waited for the food',
  ],
  ambiance: [
    'the room felt a bit bare',
    'it isn’t very cosy yet',
    'the walls could do with a picture or two',
    'it was rather noisy',
    'the chairs have seen better centuries',
  ],
  service: [
    'the waiter vanished',
    'nobody came to take our order for ages',
    'we had to wave for the bill',
    'our waiter seemed to be on another planet',
    'we had to go and find someone to take our order',
  ],
};

export const WALKOUT_LINES = [
  'Waited and waited, then gave up. We had a kebab instead.',
  'Never got our food. The seagulls ate better than we did.',
  'Forty minutes and not a crumb. We left.',
  'Lovely smell from the kitchen. Shame we never tasted anything.',
  'We gave up and went to Bar Błyskawica. Sorry!',
];

export const SO_SO_LINES = [
  'Perfectly fine. Nothing to write home about.',
  'Nice enough. We might come back.',
  'It was… food. Fine food.',
  'Solid, like the Gdańsk cobbles.',
];

/** Who wrote the review: a few kinds of reviewer for each group. */
export const REVIEWER: Record<GroupId, string[]> = {
  tourists: ['a tourist', 'a tourist from Kraków', 'a family from Berlin', 'a couple from Lisbon', 'a cruise passenger'],
  students: ['a student', 'a student from the Politechnika', 'a hungry first-year', 'a student on a budget'],
  locals: ['a local family', 'a neighbour from across the street', 'a Gdańsk babcia', 'a family from Wrzeszcz'],
  office: ['an office worker', 'someone on their lunch break', 'a manager in a hurry', 'an accountant from Granary Island'],
  foodies: ['a foodie', 'a food blogger', 'a self-declared pierogi expert', 'a chef on her day off'],
};

export const CRITIC_NAME = 'the Baltic Gourmet column';

// ---------- Replying to reviews ----------

export type ReplyId = 'thanks' | 'invite' | 'defend';

export const REPLY_IDS: ReplyId[] = ['thanks', 'invite', 'defend'];

/**
 * Answers to an unhappy review, in the day report. Reputation (and money) changes with the
 * guest's group; `{who}` in a result is the reviewer.
 */
export const REPLIES: Record<ReplyId, { label: string; reply: string; reputation: number; cash?: number; results: string[] }> = {
  thanks: {
    label: 'Thank them kindly',
    reply: '“Thank you for telling us. We’re sorry, and we’ll do better.”',
    reputation: 0.5,
    results: [
      '{who} wrote back: “That’s kind of you. We’ll give you another try.”',
      '{who} gave your reply a little heart.',
      '{who} says it was nice to be listened to.',
    ],
  },
  invite: {
    label: 'Invite them back, dessert on us',
    reply: '“We’re so sorry. Please come back soon: dessert is on us.”',
    reputation: 1.5,
    cash: -40,
    results: [
      '{who} came back for the szarlotka, and added a star.',
      '{who} came back with friends. “The dessert was worth the wait,” they wrote.',
      '{who} came back, had the free dessert, and stayed for coffee.',
    ],
  },
  defend: {
    label: 'Stand your ground',
    reply: '“Our food is perfect, actually.”',
    reputation: -1,
    results: [
      '{who} replied with three exclamation marks. Half of Gdańsk read the thread.',
      'Your reply got more likes than the review. Not in a good way.',
      'Mewa read your reply and quietly flew off.',
    ],
  },
};
