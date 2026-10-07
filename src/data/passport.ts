// The sticker album, "Gdańsk passport" (project.md section 6.14, M7c): stamps for things done over the
// season, collected in the Mewa tab. They're only for collecting: no money, no bonuses. When each is
// earned is decided in sim/passport.ts.

export type StampId =
  | 'firstGuest'
  | 'fiveStars'
  | 'thousandGuests'
  | 'fullHouse'
  | 'threeStarDish'
  | 'secretRecipe'
  | 'pairing'
  | 'marketSpecial'
  | 'friendOfTheHouse'
  | 'walesa'
  | 'happyCritic'
  | 'wedding'
  | 'fair'
  | 'tallShips'
  | 'neptune'
  | 'rainyDay'
  | 'cookOffWon'
  | 'topOfTheTown'
  | 'oldTownFavourite'
  | 'cellar'
  | 'newAddress'
  | 'gulls'
  | 'quickStreak'
  | 'everyWish'
  | 'mewasTreasures';

export type StampGroup = 'First steps' | 'The kitchen' | 'People' | 'Gdańsk' | 'Rivals' | 'The restaurant';

export interface Stamp {
  group: StampGroup;
  /** One of the game's emojis (drawn as an icon), in the middle of the stamp. */
  icon: string;
  name: string;
  /** What earned it, for the passport and the day report. */
  text: string;
  /** How to earn it, shown on the empty spot until it's earned. */
  hint: string;
  /** The stamp's ink. */
  colour: 'red' | 'blue' | 'green' | 'purple' | 'brown';
}

export const STAMP_GROUPS: readonly StampGroup[] = ['First steps', 'The kitchen', 'People', 'Gdańsk', 'Rivals', 'The restaurant'];

export const STAMP_IDS: readonly StampId[] = [
  'firstGuest', 'fiveStars', 'thousandGuests', 'fullHouse',
  'threeStarDish', 'secretRecipe', 'pairing', 'marketSpecial',
  'friendOfTheHouse', 'walesa', 'happyCritic', 'wedding',
  'fair', 'tallShips', 'neptune', 'rainyDay',
  'cookOffWon', 'topOfTheTown',
  'oldTownFavourite', 'cellar', 'newAddress', 'gulls', 'quickStreak', 'everyWish', 'mewasTreasures',
];

/** How many gulls shooed over the whole game earn the gull stamp. */
export const GULLS_FOR_STAMP = 25;
/** Guests served all game for the big stamp. */
export const GUESTS_FOR_STAMP = 1000;
/** Guests served on one rainy day for the rain stamp. */
export const RAINY_DAY_GUESTS = 30;
/** Tables served quickly in a row for the streak stamp. */
export const STREAK_FOR_STAMP = 10;
/** Guests with wishes in one day, every one granted, for the wishes stamp. */
export const WISHES_FOR_STAMP = 5;

export const STAMPS: Record<StampId, Stamp> = {
  firstGuest: { group: 'First steps', icon: '🍽️', name: 'Open for business', text: 'Your very first guests ate at your table.', hint: 'Serve your first guests.', colour: 'red' },
  fiveStars: { group: 'First steps', icon: '⭐', name: 'Five stars', text: 'Your first five-star review.', hint: 'Get a five-star review.', colour: 'blue' },
  thousandGuests: { group: 'First steps', icon: '👥', name: 'A thousand guests', text: 'A thousand guests served.', hint: `Serve ${GUESTS_FOR_STAMP.toLocaleString('en-GB')} guests.`, colour: 'green' },
  fullHouse: { group: 'First steps', icon: '🪑', name: 'Full house', text: 'Every table taken at once.', hint: 'Fill every table at once.', colour: 'purple' },
  threeStarDish: { group: 'The kitchen', icon: '🍳', name: 'Practice makes perfect', text: 'A dish the kitchen knows by heart: three stars.', hint: 'Cook one kind of dish until it has three stars.', colour: 'red' },
  secretRecipe: { group: 'The kitchen', icon: '📜', name: 'The secret recipe', text: 'Mewa found the secret recipe card.', hint: 'Mewa is looking for something…', colour: 'brown' },
  pairing: { group: 'The kitchen', icon: '🌿', name: 'Made for each other', text: 'A perfect pairing on the menu.', hint: 'Put two things that go wonderfully together on one dish.', colour: 'green' },
  marketSpecial: { group: 'The kitchen', icon: '🧺', name: 'Fresh from the market', text: 'Today’s special, made with the morning market’s deal.', hint: 'Make a dish with the market’s deal today’s special.', colour: 'blue' },
  friendOfTheHouse: { group: 'People', icon: '💛', name: 'Friend of the house', text: 'A regular became a friend of the house.', hint: 'Make a regular happy, again and again.', colour: 'red' },
  walesa: { group: 'People', icon: '✌️', name: 'A famous guest', text: 'Lech Wałęsa came by.', hint: 'A very famous Gdańsker might drop in one day…', colour: 'purple' },
  happyCritic: { group: 'People', icon: '🧐', name: 'The critic smiled', text: 'A food critic left a glowing review.', hint: 'Win over a food critic.', colour: 'blue' },
  wedding: { group: 'People', icon: '💒', name: 'Sto lat!', text: 'A wedding party left delighted.', hint: 'Accept a wedding party’s booking and make their day.', colour: 'red' },
  fair: { group: 'Gdańsk', icon: '🎪', name: 'Jarmark Dominikański', text: 'Open during St Dominic’s Fair.', hint: 'Be open during St Dominic’s Fair.', colour: 'brown' },
  tallShips: { group: 'Gdańsk', icon: '🚢', name: 'Tall ships', text: 'Open while the tall ships were in.', hint: 'Be open during the tall ships festival.', colour: 'blue' },
  neptune: { group: 'Gdańsk', icon: '🔱', name: 'The Golden Neptune', text: 'The Old Town’s favourite restaurant.', hint: 'Win the Golden Neptune at the end of the Fair.', colour: 'brown' },
  rainyDay: { group: 'Gdańsk', icon: '🌧️', name: 'Gdańsk drizzle', text: `${RAINY_DAY_GUESTS} guests or more on a rainy day.`, hint: `Serve ${RAINY_DAY_GUESTS} guests on a rainy day.`, colour: 'green' },
  cookOffWon: { group: 'Rivals', icon: '⚔️', name: 'Cook-off champion', text: 'Won a cook-off against a rival.', hint: 'Win a cook-off against a rival.', colour: 'red' },
  topOfTheTown: { group: 'Rivals', icon: '📰', name: 'Top of the town', text: 'First in Dziennik Bałtycki’s Old Town top five.', hint: 'Come first in the Monday paper’s top five.', colour: 'blue' },
  oldTownFavourite: { group: 'The restaurant', icon: '🏅', name: 'Old Town Favourite', text: 'The restaurant’s highest rank.', hint: 'Rise to the highest rank.', colour: 'purple' },
  cellar: { group: 'The restaurant', icon: '🕯️', name: 'Down the stairs', text: 'The cellar room opened.', hint: 'Do up the old cellar.', colour: 'brown' },
  newAddress: { group: 'The restaurant', icon: '⚓', name: 'A new address', text: 'Moved to another street in the Old Town.', hint: 'Move to another street.', colour: 'blue' },
  gulls: { group: 'The restaurant', icon: '🐦', name: 'Gull wrangler', text: `${GULLS_FOR_STAMP} gulls shooed off the terrace.`, hint: `Shoo ${GULLS_FOR_STAMP} gulls off the terrace.`, colour: 'green' },
  quickStreak: { group: 'The restaurant', icon: '⚡', name: 'Lightning service', text: `${STREAK_FOR_STAMP} tables served quickly in a row.`, hint: `Serve ${STREAK_FOR_STAMP} tables quickly in a row.`, colour: 'red' },
  mewasTreasures: { group: 'The restaurant', icon: '🐦', name: 'Mewa’s treasure chest', text: 'Everything Mewa found in town.', hint: 'Mewa keeps bringing things she finds in town…', colour: 'brown' },
  everyWish: { group: 'The restaurant', icon: '💭', name: 'Wishes come true', text: `Every guest’s wish granted, on a day with ${WISHES_FOR_STAMP} or more.`, hint: `Grant every wish on a day with ${WISHES_FOR_STAMP} or more.`, colour: 'purple' },
};
