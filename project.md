# Old Town Kitchen (working title)

A cozy restaurant management game set in Gdańsk's Old Town, made as a gift for **Joana**.
Inspired by 90s management games like Pizza Syndicate, but gentler: no crime, no sabotage.
The player is up against friendly rivals, fighting only for the city's hungry guests.

- **Platform:** Android tablet (Samsung Galaxy Tab A series), landscape, touch only
- **Language:** English
- **Tone:** cozy, warm, funny, low-stress
- **Length:** one season (six weeks in July and August) takes roughly two hours ("two or three evenings"); free play continues afterwards

---

## 1. Vision

You arrive in Gdańsk with a small savings pot and a dream: to run the most loved restaurant in the Old Town.
You start in a tiny place on a quiet street. You then:

- build a menu of dishes
- hire a small team
- decorate the dining room
- win over tourists, students, locals, office workers and foodies

The season runs through the summer holidays until the great St. Dominic's Fair in August. At the end of the Fair, the city awards the **Golden Neptune** to the Old Town's favourite restaurant.

## 2. Design pillars

1. **Cozy, but with stakes.** Mistakes cost money and reputation. Only running out of money ends the game, and a warning comes first.
2. **Every decision has a visible reason.** Customers explain themselves through reviews and reports ("Lovely żurek, but I waited forever").
3. **Gdańsk is a character.** Real streets, real seasons, real festivals, local food, seagulls.
4. **Small but deep.** A few systems that interact well beat many shallow ones.
5. **Made for her.** Personal details, inside jokes, a special ending.

## 3. Platform and technology

- Web game built with **TypeScript + React + Vite**, installed as a **PWA**: an icon on the home screen that opens full screen and works offline.
- Hosted free on **GitHub Pages**. Updates reach the tablet automatically.
- **Layout:** landscape only.
  - Responsive from about 850×530 CSS pixels upwards: Samsung tablets lay the page out smaller than their screen's pixels (the Galaxy Tab A lays it out at 1364×603).
  - Touch targets at least 48 px.
  - Nothing depends on hover.
  - Pinch-zoom and pull-to-refresh disabled.
- **Performance:** must run smoothly on a budget tablet.
  - DOM/CSS UI. Art is pixel art drawn by the game's own code into images (no image files are downloaded), shown as DOM images and scaled up crisply (section 9.1). Light SVG only where it helps; no heavy canvas effects.
  - Aim for under 5 MB total download, with all art under about 2 MB.
- **Saves:** automatic save to browser storage at the end of every in-game day.
  - Save data carries a version number so old saves can be migrated.
  - Export/import of a save code for backups.

## 4. Core loop

```
PLAN  ->  OPEN  ->  WATCH  ->  REVIEW  ->  INVEST  -> (next day)
```

1. **Plan:** adjust menu, prices, staff, marketing and decor. Time is paused.
2. **Open:** the day plays out from 11:00 to 22:00 in about 130 seconds at 1× speed. Pause, 2× and 4× are available.
3. **Watch:** guests arrive, choose a restaurant, order, eat and leave. Small speech bubbles show reactions.
4. **Review:** end-of-day report shows:
   - guests served and guests lost
   - revenue and costs
   - new reviews
   - reputation change for each customer group
   - what the rivals did
5. **Invest:** spend profits on equipment, staff, seats, decor, ads, or a better location.

Weekly rhythm: every Monday brings rent, a weekly summary and a new small goal from Mewa (section 6.11).

## 5. Game structure

- **Season:** six weeks, Monday 8 July to Sunday 18 August, the last day of St. Dominic's Fair (Jarmark Dominikański). The in-game year is fixed and fictional so dates are predictable.
- **Victory:** at the end of the Fair, the restaurant with the highest **Neptune Score** wins the Golden Neptune.
  - Neptune Score = 60% average rating + 40% share of Old Town guests during the Fair.
  - Winning plays a special ending sequence (section 10).
- **After the season:** free play continues with no end date.
- **Game over:** if cash is zero or less at the end of a day, the restaurant closes for good. The player can start a new game or load a save code. A warning appears on the Today tab when money runs low.
- **Difficulty options:**
  - *Relaxed:* more starting cash, calmer rivals
  - *Normal:* the balanced default

## 6. Game systems

### 6.1 Locations (Old Town)

Values below are **starting points**. All tuning lives in `src/data/balance.ts`.

| Location | Rent / day | Foot traffic | Main guests | Notes |
|---|---|---|---|---|
| ul. Ogarna | 600 zł | Low | Locals, students | Starting location: quiet and cheap |
| ul. Piwna | 1,200 zł | Medium | Locals, tourists | Near St. Mary's Basilica |
| ul. Mariacka | 1,800 zł | Medium | Foodies, tourists | Romantic, small premises, great terrace |
| ul. Długa / Długi Targ | 3,000 zł | Very high | Tourists | Neptune Fountain; expensive |
| Długie Pobrzeże | 2,200 zł | High in summer | Tourists | Waterfront by the Crane (Żuraw); terrace boom in good weather |
| Wyspa Spichrzów | 1,600 zł | Medium | Office workers, students, foodies | Modern Granary Island; lunch-heavy |

Rules for locations:

- Each location has its own foot-traffic curve (lunch and dinner peaks), weekday/weekend pattern, and seasonal curve.
- **Relocating** costs a moving fee. Equipment moves with the restaurant, decor is partly lost, and reputation keeps about 70%.
- A **second restaurant** is planned for after the MVP.

### 6.2 Customers

Five customer groups, each with its own tastes.

| Group | Cares most about | Favourite categories / tags | Price sensitivity | Peak times |
|---|---|---|---|---|
| Tourists | Location, Polish classics, terrace | `polish`, `seafood`, desserts | Low–medium | Weekends, summer, festivals |
| Students | Price, big portions | `hearty`, `cheap`, pizza, burgers | High | Evenings, Juwenalia, weekdays |
| Locals and families | Quality, familiarity, kids' options | `polish`, `homemade`, desserts | Medium | Weekends, dinner |
| Office workers | Speed, lunch set | soups, `quick` dishes | Medium | Weekday lunch only |
| Foodies | Creativity, premium quality, ambiance | `premium`, `creative`, `seafood` | Low | Evenings, after good reviews |

- Each group has its own reputation value (0–100) for every restaurant.
- Guests arrive in parties of 1–5, depending on the group.
- People mostly go where they've heard of: only about 30% of the people who'd choose a restaurant they've never heard of walk in anyway (`balance.choice.walkInShare`). Marketing, flyers, regulars and reviews make a place known (section 6.7).

### 6.3 Menu and dishes

The menu is built from **dish templates**. Each template has a category, the equipment it needs, a base prep time, and a set of variant options.

**Categories:** Soups, Mains, Desserts, Drinks.

**Templates in the MVP (about 16):**

- **Soups:** żurek, barszcz, Baltic fish soup, tomato soup
- **Mains:**
  - pierogi (ruskie, meat, mushroom and cabbage, blueberry)
  - pizza (topping choices)
  - pasta
  - burger
  - fried Baltic cod with fries
  - schabowy (breaded pork cutlet)
  - gołąbki (cabbage rolls)
  - salad bowl
- **Desserts:** szarlotka, sernik, ice cream
- **Drinks:** coffee, kompot, lemonade

**Creating a dish:**

1. Pick a template.
2. Choose its variant and up to 3 extras. Each has an ingredient cost and taste tags such as `polish`, `hearty`, `premium`, `creative`, `seafood`, `veggie`, `spicy`, `sweet`, `quick`, `cheap`, `homemade`.
3. Set its price.

**Dish quality** (0–100) is built from:

- base quality of the template
- ingredient supplier tier: *Market* or *Premium*
- chef skill, with a bonus when the chef's specialty matches the cuisine
- hidden **combo bonuses** that reward experimenting (e.g. dill with fish, oscypek with cranberry)
- hidden **clashes** that punish odd pairings (a gentle, funny review hint gives them away)

**Menu size:**

- The menu starts with 6 slots and can be upgraded to 12.
- A bigger menu attracts more groups but slows the kitchen slightly. This is a deliberate trade-off.

**Lunch set ("Obiad dnia"):** a soup plus a main at a fixed price, served 12:00–15:00. Office workers love it.

**Ingredient model:** cost is paid per dish sold, with no stock management in the MVP. Daily fresh deliveries may be added later.

### 6.4 Kitchen and equipment

Equipment unlocks templates and adds capacity.

| Equipment | Cost | Unlocks |
|---|---|---|
| Stove | included | Soups, pierogi, pasta, gołąbki, schabowy |
| Deep fryer | 6,000 zł | Fried cod with fries, side fries |
| Grill | 9,000 zł | Burgers, grilled fish |
| Pizza oven | 18,000 zł | Pizza |
| Espresso machine | 7,000 zł | Coffee (and a small morning bump) |
| Dessert display | 4,000 zł | Cakes, and a desserts impulse-buy bonus |

- The kitchen has a limited number of equipment slots, set by the premises.
- Each chef works one order at a time.

### 6.5 Staff

- **Roles:** Chef, Waiter.
- **Stats:** skill (1–5), speed (1–5), daily wage, and one trait.
- **Traits:** Cheerful, Perfectionist, Speedy, Chatty, Calm.
- **Chefs** have a cuisine specialty: Polish, Italian, Grill, or Pastry.
- **Hiring:** a candidate pool of 3–4 people, refreshed weekly. Each has a name and a short, funny bio.
- **Starting wages:** chef about 650 zł/day, waiter about 450 zł/day. Each covers the whole 11-hour day, seven days a week.
- **Morale, days off and training** (built in M7): every day's work tires people a little, a day off puts them right, fair wages keep them happy, and a one-day course makes someone a level better.

### 6.6 Interior and terrace

- **Seats:** start with 16; buy tables in steps of 4 seats, limited by room size.
- **Decor styles:** Hanseatic, Maritime, Rustic Polish, Modern, and a Portuguese corner (azulejo tiles) unlocked by a choice card.
  - Each decor item adds ambiance points.
  - The room starts cozy, as in the concept picture: plain dark panelling, checked tablecloths, a rug and a fig tree. Bought decor upgrades it (carved oak panelling, Kashubian embroidered cloths).
  - A matching style gives a bonus with certain groups (e.g. Maritime with tourists, Modern with office workers).
- **Summer terrace (ogródek):**
  - a seasonal permit, available April to September (so it can be open from the first day of the game)
  - adds seats outdoors
  - boosts tourists hugely in good weather and is useless in rain

### 6.7 Marketing

| Campaign | Cost | Duration | Target |
|---|---|---|---|
| Flyers | 400 zł | 3 days | Students, locals |
| Tram stop poster | 2,500 zł | 1 week | Locals, office workers |
| Local radio | 6,000 zł | 1 week | Everyone, modest effect |
| Social media push | 1,500 zł | 1 week | Students, foodies |
| Tourist guide listing | 5,000 zł | Rest of season | Tourists |
| Happy hour / lunch discount | Lost margin | Toggle | Price-sensitive groups |

- Marketing raises **awareness** for each group.
- Awareness slowly fades after a campaign ends.

### 6.8 Reputation and reviews

- Every served party produces a **satisfaction** score from:
  - food quality relative to what that group expects
  - value for money (better food than they expected makes a higher price feel fair)
  - waiting time
  - ambiance
  - service
- Satisfaction moves the group's reputation.
- The **star rating** (1–5, on the same scale as reviews) is the reputation with each group, weighed by how many of that group the restaurant has served.
- Some parties leave a **review**: 1–5 stars plus a short line generated from the biggest positive and negative drivers (e.g. "Best pierogi on Piwna, but the waiter vanished.").
- **Food critic events** produce big, rare reviews.

### 6.9 Rivals (friendly)

| Rival | Location | Style | Strong with |
|---|---|---|---|
| Trattoria Nonna Rosa | ul. Mariacka | Italian, high quality, pricey | Foodies, tourists |
| Bar Błyskawica | ul. Długa | Cheap and fast, milk-bar spirit | Students, office workers |
| Karczma pod Żurawiem | Długie Pobrzeże | Traditional Polish tavern | Tourists, families |
| Spichlerz Bistro | Wyspa Spichrzów | Trendy fusion | Foodies, students |

- Each rival has a personality and makes weekly decisions:
  - adjust prices
  - add a seasonal dish
  - run a promotion
  - buy an upgrade
- Rivals react to the player's success (e.g. cutting prices if they lose students).
- They send friendly, teasing messages ("Nonna Rosa sniffs at your pizza. Politely.").
- Rival owners appear in some events, such as a cook-off at the Fair.

### 6.10 Events and calendar

**Fixed calendar events:**

| When | Event | Effect |
|---|---|---|
| April | Easter week | Families |
| 1–3 May | Majówka | Tourist spike |
| Mid-May | Juwenalia | Student spike |
| June | Corpus Christi long weekend | More visitors |
| Late June | Summer holidays begin | Tourist ramp-up |
| July | Tall ships festival (inspired by Baltic Sail) | Waterfront boom |
| Late July – mid-August | St. Dominic's Fair (Jarmark św. Dominika) | Huge crowds; the finale and Golden Neptune |

Since the season became six weeks from 8 July (section 6.14), Easter, Majówka, Juwenalia and Corpus Christi fall outside it; the summer holidays, the tall ships festival and the Fair are in it.

**Weather:** sunny, cloudy, rain or heatwave, generated with a seasonal bias.

- Rain cuts foot traffic and shuts the terrace.
- A heatwave boosts ice cream and lemonade and hurts hot soups.

**Random events (cozy):**

(The tour bus, the wedding party and the regular's birthday were surprises here until M7b; they are now booking requests to accept or decline, section 6.15 A2.)

- a food critic visits
- a local newspaper feature
- a supplier discount week
- street works reduce traffic
- a seagull steals a pierogi (pure flavour, tiny effect)

### 6.11 Goals and tutorial: Mewa the seagull

- **Mewa** is a cheeky seagull and the player's guide. Her tutorial covers the first 3 days:
  - opening the restaurant
  - setting prices
  - reading the report
  - hiring
- **Weekly goals** (e.g. "Serve 40 office workers this week", "Earn a 5-star review", "Add a soup to the menu") come with small rewards.
- A **help book** explains every stat in plain words.

### 6.12 Finance

- **Starting cash:** 40,000 zł on Normal, 60,000 zł on Relaxed.
- **Daily costs:** wages, ingredients sold, rent.
- **Other costs:** one-off purchases, and a small weekly utilities bill.
- **Reports:** a daily and weekly profit and loss, plus a simple graph of cash and rating over time.

### 6.13 Interactive service (M5b)

While the restaurant is open, the player can help out. Every interaction is optional: a day still plays out if she only watches, and helping makes it go better. There are a few real choices a day, not constant tapping, and the day report says what each one changed.

1. **Choice cards.** Two or three times a day a small card pauses the clock and offers two answers. Each answer has a visible effect (money, guests' mood, reputation, awareness, an extra pair of hands). Moments include:
   - a food blogger asking for a free dessert to photograph
   - a shower over the terrace: bring the guests inside, or hope it passes
   - Pan Cytrynówka buying a round for the whole room ("forgot his wallet")
   - Adrian texting "almost there!!" on a day he didn't turn up
   - Tomek dropping a tray
   - a tour guide asking if a group of six can come in right now
   - a family asking the room to sing "Sto lat" for a birthday
   - a street musician offering to play outside
   - a very merry tourist group wanting only cytrynówka shots: a big tip, but the room gets uncomfortable and nobody new comes in while they're there
   - a Brazilian couple on honeymoon asking for a free dessert: a 50 zł tip and a five-star review
   - a secret proposal (a ring hidden in a dessert), a Sanepid inspection, Nonna Rosa borrowing basil, a Lechia Gdańsk footballer, cheap herring, Babcia's soup secret, a dine-and-dash, a tram strike, a blackout and a sea shanty choir
   - Lech Wałęsa with three bodyguards: a 2,500 zł tip, nobody else gets in for three hours, and locals and families like you 10% more afterwards (at most once every four weeks)

   One to four cards come each day at random times; a card seen in the last three days is less likely to come again.
2. **Tap a waiting guest.** A table showing ⏳ or 😤 can be tapped for a **free drink** (costs a little, buys patience) or **an apology from the chef** (their order jumps the kitchen queue).
3. **Shoo the gulls.** On terrace days a gull sometimes swoops at a plate. Tap it away in time and the guests laugh; miss it and that table loses its food and writes a funny review.
4. **Live happy hour.** Replaces the fixed 15:00–18:00 setting: a button during the day starts a one-hour happy hour, once a day. Drinks and everything else at a discount, and more guests come in. The skill is using it in a quiet hour.
5. **Seat guests yourself** (as built: "show guests to a better table"). Guests are still seated automatically as they arrive. Until their food comes, the player can tap their table, choose "Move them", and tap a free table; they walk over. Each group has favourite spots: tourists the terrace or the window wall, foodies the window wall, locals the quiet back by the stove, office workers and students near the door. Shown to a favourite spot, they're happier. (The first idea, groups waiting at the door until the player seats them, didn't fit the pace: at 1× a group's whole wait for food is about 1.5 seconds, so waiting for the player would have kept every guest waiting longer.)

### 6.14 Shape and polish (M7)

After the playtests of M5b: the game should feel calmer, more varied and more like Gdańsk, and offer more to do over a season.

**1. A slower day.** One day takes 130 seconds at 1× (it was 50; first 100, then 30 more after playtesting), so there is time to look after tables, shoo gulls and move guests. 2× and 4× stay.

**2. A shorter season: about 40 days, ending with St. Dominic's Fair (Jarmark Dominikański).** As built: six full weeks, Monday 8 July to Sunday 18 August (42 days), which keeps the weekly rhythm (rent, Mewa's goal, the rivals' moves and new job candidates every Monday). The season covers the summer holidays, the tall ships festival (11–14 July), the Fair (27 July – 18 August) and the Fair cook-off (10 August). Easter, Majówka, Juwenalia and Corpus Christi fall outside it; the Amber evening on Mariacka (a personal touch) moves into the season. Everything tied to week numbers is rescaled (Tomek and Adrian, the secret recipe, Mewa's goals, rival reactions), and the economy is rebalanced with the simulator so the targets in section 13 still hold. With the slower day, a season is about 70 minutes of service plus planning: two or three evenings.

**3. The tabs during the day.** Map, Menu, Kitchen, Interior, Staff, Marketing and the reports can be opened while the restaurant is open; the clock pauses while a tab is open. Rules (option B, as built): prices, the menu, marketing and the happy hour change straight away; purchases (tables, decor, equipment) are delivered and new staff start the next morning.

**4. Choice cards: more of them, and more random.**
- **Rarity:** common, uncommon, rare and very rare cards (like Lech Wałęsa).
- **Cards rest after they come up** (built first as a shuffled deck, replaced on 2026-10-02): an everyday card waits two weeks while the others have their turn, and one-off events (a film crew, gold letters above the door) happen only once.
- **Cards tied to the calendar and the weather:** the tall ships week, the Fair, a heatwave, a Baltic storm, a rainy evening.
- **Follow-ups:** some answers come back later (the blogger's post brings foodies the next day; the proposal couple returns for their engagement dinner).
- **About 15 new cards with a Gdańsk flavour**, for example an amber seller, a film crew shooting on Długa, a lost tourist looking for Westerplatte, a Lechia derby crowd, a wedding photographer, a Kashubian babcia with a recipe, the Hel ferry cancelled, a TikTok influencer, a pierogi-eating contest, a delivery app offering a partnership, and **a Portuguese exchange student** who unlocks cabrito assado and azulejo tiles (section 10).

**5. The background in manager mode.** The planning screens get a pixel-art background instead of plain cream. Concept art comes first: three or four pixel mock-ups (for example a riverside panorama of Długie Pobrzeże with the Żuraw, a manager's desk with Mewa, a banner of Długa's gabled houses with people strolling, and a version that changes with the season), to choose from before anything is built.

**6. More real Gdańsk in the streets** (based on a photo of ul. Długa):
- ornate Dutch-style gables: curved scroll gables with stone urns and statues, white cornices between floors
- facades in pink, mint, ochre and white with grey trim, white window frames and decorated window surrounds
- light granite paving slabs on the main street, cobbles elsewhere
- shop fronts with awnings (red, beige) and signs, and café umbrellas with tables in front of neighbouring houses
- black double-headed lanterns
- the Town Hall tower with its clock face and golden spire
- small details: flags (Gdańsk's red flag with two crosses and a crown), flower boxes, bikes, pigeons and gulls on the ground, an amber stall, a street musician
- then each of the six streets looks like itself: Mariacka with przedproża and gargoyles, Długa wide and granite with cafés, Pobrzeże by the river with boats, Spichrzów among the granaries, and so on.

**7. More to do over a season:**
- **Named regulars with stories**, like Pan Cytrynówka: a few more guests who come back and whose little stories unfold over the season.
- **Staff growth:** training, morale, days off, and short storylines for the team.
- **Faces for the team:** every card in the Staff tab (the team and the people looking for work) shows that person's pixel portrait, the same chibi style as in the restaurant: chefs in their hats, waiters in aprons, Tomek and Adrian as themselves. Each person gets their own hair colour so no two look alike, and the face can show their mood (tired, in good spirits).
- **Seasonal ingredients and specials:** what's fresh in July and August (strawberries, blueberries, chanterelles, new potatoes, plums) and a "Dziś polecamy" board for today's special.
- **Replying to reviews:** a kind reply can win back an unhappy guest.
- **Attracting passers-by** (C3 in 9.1.1): a waiter offering samples at the door, flyers, a better menu board.
- **Bigger premises:** a cellar room (piwnica), a bar counter, a toilet.
- **A sticker album ("Gdańsk passport"):** achievements as collectible pixel stickers.
- **Mewa's finds:** Mewa brings things she found in town (a piece of amber, a lost key, a recipe card) that unlock decor or small events.

Not now (considered and left out): events the player hosts (workshops, tastings, receptions), an autumn and Christmas-market season, a cook-off against the rivals, postcards. (Lighter versions of hosted events and cook-offs came back in section 6.15.)

### 6.15 A more dynamic season (M7b)

Playtest (2026-10-03): after a few days the game feels repetitive, because one day plays much like the next. Ideas below are taken from tycoon games that keep each day fresh; all of them were chosen. The details of each are settled when it is built, one at a time.

**A. Every day a little different**

1. **Tomorrow's forecast** (Kairosoft games, Two Point Hospital). The day report ends with what tomorrow brings: "A cruise ship docks at Westerplatte: lots of tourists", "Rain all day: locals stay home", "Exams are over: students celebrate". Planning the menu, the special and the team for it starts to matter. It can be wrong now and then, like any forecast.
2. **Bookings and big orders** (Restaurant Empire, Pizza Syndicate). A few requests a week, to accept or decline in the planning screens: "A wedding party of 12 on Saturday at 19:00, they'd love a dessert", "An office on Granary Island orders 30 lunches for Thursday". They pay well, but tie up tables or a chef at that time; turning up short disappoints them.
3. **Daily mini-goals** (Stardew Valley's request board). Next to Mewa's weekly goal, one small goal for the day: "Sell 8 soups before 14:00", "Nobody walks out today", "Make a foodie happy". A small reward when done.
4. **Theme nights** (Kairosoft, Two Point Hospital). Once a week the player picks an evening: Pierogi Night, a Kashubian evening, live accordion, a seafood night. Each brings a different crowd and has a small cost. (A light version of "events the player hosts", left out in section 6.14.)

**B. Progress you can feel**

5. **Dishes level up** (Cafeteria Nipponica). The more a dish is cooked, the better the kitchen gets at it: up to three stars, each a little more quality, and at three stars a new variant or taste tag.
6. **Trends** (Game Dev Tycoon, Cafeteria Nipponica). Every week Gdańsk is crazy about something ("Everyone wants seafood this week", "Sweet tooth week"): one group's tastes shift for a week, shown on the Today tab, so the menu is worth adjusting.
7. **Restaurant rank-ups** (Kairosoft). Milestones of guests served and stars raise the restaurant's rank (for example Bar, Bistro, Restaurant, Old Town Favourite), with a little celebration from Mewa. Each rank unlocks something: decor, a menu slot, new kinds of choice cards.
8. **A weekly Old Town ranking** (Kairosoft's rankings). Every Monday a newspaper top five of the player and the rivals, by rating and guests, so the race for the Golden Neptune is visible all season.

**C. Rivals who do things**

9. **Rival moves to answer** (Pizza Syndicate, Restaurant Empire). Now and then a rival acts against you, gently: Nonna Rosa offers your best chef a job, Bar Błyskawica starts a price war on your street, Karczma copies your special. A card lets the player answer (a raise, a counter-offer, ignoring it).
10. **Cook-off challenges** (Good Pizza, Great Pizza). Sometimes a rival challenges you to a dish duel judged by guests: pick the dish, and its quality and price decide it. Winning brings reputation and awareness. (Different from "a cook-off against the rivals" left out in 6.14: it's a short challenge, not a whole event.)

**D. More to do during service**

11. **Rush hour** (Diner Dash). At the lunch and dinner peaks the player can tap a chef or a waiter to hurry them (with a short rest afterwards), and quick service builds a streak with a small bonus.
12. **Guests with wishes** (Good Pizza, Great Pizza). Now and then a guest shows a wish bubble ("Something without meat?", "Extra dill!"). If the menu has it, they're delighted; if not, it's a hint for tomorrow's menu.
13. **The morning market** (Kairosoft). Ingredient prices change a little each day, with a deal or two ("Cheap herring today!") worth building the special around. Builds on the seasonal produce.

## 7. Simulation model (implementation notes)

The simulation is pure TypeScript with no UI code. It is deterministic given a seed and advances in **ticks of 5 in-game minutes**.

1. **Guest generation.** For each location and tick:
   - base traffic × hour curve × weekday factor × season × weather × event modifiers
   - the result is split into groups by the location's mix
   - Poisson-style random rounding turns it into parties
2. **Choice.** Each party scores every restaurant within walking range:
   - `utility = w_taste·menuMatch + w_price·priceFit + w_rep·reputation + w_aware·awareness + w_dist·proximity + w_amb·ambiance + w_wait·expectedWait + noise`
   - The weights come from the party's group.
   - Being unknown counts as well: the utility also gets `ln(walkInShare + (1 − walkInShare)·awareness)`, so a restaurant nobody has heard of is chosen by only `walkInShare` (30%) of the people who'd otherwise pick it.
   - A "no restaurant" option is always included.
   - The party picks with a softmax (logit) choice.
3. **Service.**
   - A party needs a free table.
   - Orders go into the kitchen queue.
   - Prep time = template time / chef speed, plus a small penalty for a large menu.
   - Waiters affect order and bill time.
   - If waiting exceeds the party's patience, they leave, which is a reputation hit.
4. **Satisfaction and reviews:** see section 6.8. Reputation moves slowly, as an exponential moving average.
5. **Rivals** use the same simulation. Their decisions run on a weekly AI step.
6. **Output.** Every guest outcome is logged, so reports and review text can explain *why* things happened.

All numbers live in `src/data/` (`balance.ts`, `dishes.ts`, `locations.ts`, `rivals.ts`, `events.ts`), never hard-coded in logic.

## 8. Screens and UI

**Persistent HUD:**

- date and weekday
- weather
- cash
- rating stars
- speed controls: pause, 1×, 2×, 4×

**During the day** there is no bar: the restaurant and its street fill the screen, and the same things sit in small pixel-framed panels in its corners (section 9.3, A):

- top left: the clock, date and weather, with how far through the day it is;
- top middle: the day's numbers;
- top right: cash and stars;
- bottom left: round buttons for Manage, Happy hour, Flyers and Who's who;
- bottom right: sound and the speeds;
- under the clock: short notes.

**Screens:**

- **Restaurant view** (main): a cozy isometric pixel-art room with the dining room, kitchen and terrace. Guests and staff are small 2D sprites with reaction bubbles. See section 9.
  - It can also be opened **while planning, before the restaurant opens**, from its own tab next to the Map: the empty room with the team in place, so you can see new tables, decor and equipment straight after buying them.
- **Old Town map:** a pixel-art map of the Old Town with locations, rivals and relocation.
- **Menu:** dish list, dish creator, prices, lunch set.
- **Kitchen:** equipment.
- **Staff:** team and hiring.
- **Interior:** seats, decor, terrace.
- **Marketing:** campaigns and promotions.
- **Reports:** today, this week, graphs, reviews.
- **Goals and help:** Mewa's goals and the help book.
- **Settings:** difficulty, sound, save export/import, reset.

## 9. Art, audio and feel

### 9.1 Art direction: cozy pixel art (chosen 2026-10-01)

> **Superseded on 2026-10-06** by the Kashubian sketchbook look (section 9.5). The pixel art below is what the game has today; it stays until M8 replaces it piece by piece.

The game moves from flat SVG illustration to **cozy pixel art with 2D sprites**. The current flat SVG art stays as the placeholder until the pixel art replaces it piece by piece.

**What we take from each reference image:**

| Reference | What it shows | What we take |
|---|---|---|
| 1. Character sheet | A small chibi character (big head, short body) in many poses: front, back and side, standing and walking. Soft drop shadow, dark-brown outline, 2–3 shades per colour, no blurry edges. | How **guests and staff** look: tiny, cute and readable, with a shadow under each one. |
| 2. "Pixel Art Kitchen Kit" | An isometric kitchen: checkered floor, fridge, sink, stove and oven, extractor hood, pots, microwave, toaster, double doors with round windows, an island, a small dining set, bar stools and a dresser. Clean 1-pixel outlines; pale walls with wooden trim. | The **kitchen**: checkered floor and steel-and-wood furniture, and the **isometric view** with 2:1 floor tiles. |
| 3. Cozy restaurant | An isometric dining room: honey-wood floorboards with a cream tiled path, cream walls with wooden trim, an arched wooden door, windows with cream curtains, warm pendant lamps, lots of potted plants, small wooden tables with two chairs, white plates and tiny plants on the tables. | The **mood and palette** for the dining room: warm wood, cream, soft yellow lamplight and green plants. |

Notes on the references:

- Reference 2 carries a seller's logo, so it comes from an asset pack that is probably paid. Its licence must be checked before any of it is used (see "Sources and licences").
- Reference 3 has a "yeri.ai" watermark, so it is AI-generated. It is a mood reference only, never a game asset.
- References 2 and 3 are **isometric**; reference 1 is drawn for a **straight top-down** game (facing up, down, left and right). In an isometric room, characters face the diagonals. The plan is to draw characters in the reference 1 style, but facing diagonally: one front-diagonal and one back-diagonal pose, mirrored for the other two directions.

**Look and feel:**

- **View:** isometric rooms on a 2:1 tile grid. Since 2026-10-03 the restaurant is drawn at 1.25 pixels to a world unit (a table top is 20 pixels across), and people are 24×37 pixels plus room for hats (section 9.3).
- **Palette:** a small shared palette, warm first. Honey and walnut wood, cream walls, lamp yellow and plant green from reference 3. Gdańsk accents of brick red, amber and sea blue. Steel greys and the checkered floor in the kitchen.
- **Lines and light:** dark-brown or plum outlines (not pure black), 2–3 shades per colour, soft shadows under people and furniture, warm light pools under lamps.
- **Gdańsk stays a character:** windows look out onto gabled Old Town houses; the four decor styles (Hanseatic, Maritime, Rustic Polish, Modern) each get their own pixel-art furniture; Mewa becomes a pixel-art herring gull (grey and white, yellow beak with the red spot).
- **Text and buttons** stay clean and readable: menus and reports keep a normal friendly font, framed with pixel-art borders and icons where it helps.

**What needs drawing:**

- **Rooms:** floor and wall tiles for the dining room, kitchen and terrace; windows with the Old Town view (changing with weather and dusk); the door; the terrace awning. Rooms of different sizes for the six premises.
- **Furniture:** tables for 4, chairs, terrace tables, the communal table.
- **Decor:** all 12 decor items, in their four styles.
- **Equipment:** stove, deep fryer, grill, pizza oven, espresso machine, dessert display.
- **People:** each of the five guest groups recognisable at a glance (tourists with cameras and sun hats, students with backpacks, locals and families, office workers in shirts, foodies with scarves); chefs in white with hats; waiters with aprons; Tomek, Adrian and the Friday regular as special sprites; the food critic.
- **Poses:** standing, walking (2–4 frames), sitting, eating, plus reaction bubbles.
- **Food and icons:** small icons for every dish and drink; UI icons for cash, stars, weather and speed.
- **Map:** a pixel-art Old Town map with the river, Granary Island, landmarks and street markers.

**Technical approach:**

- The pixel art is **drawn by the game itself**, in code (`src/ui/pixel/`), when it's needed: the room as one background picture, and each piece of furniture and each person as a small sprite. Nothing is downloaded, so it works offline and adds almost nothing to the app's size, and decor, equipment, weather and dusk combine freely.
- The pictures are shown as DOM images placed on the isometric grid and stacked back to front. Scaling is by whole device pixels with `image-rendering: pixelated` (crisp); when that would waste a lot of space, an in-between scale is used, which is usual for the day screen since the room grew to the concept's scale. Animations use CSS, with transforms where possible (cheap on the tablet).
- The simulation does not change. The restaurant view keeps reading the same `floorView()` snapshot; only how it is drawn changes.
- If DOM sprites turn out to be too slow on the tablet, a single plain 2D canvas for the restaurant view is the fallback. That would need a change to the CLAUDE.md rules, so it is asked about first.

**Sources and licences** (decided on 2026-10-01: option 3, drawn for this game in code; see the decision log):

1. **Ready-made packs** (e.g. on itch.io): fastest and best looking. The licence must allow use in a non-commercial personal gift. It must also allow the image files to sit in a **public** GitHub repository: GitHub Pages on a free account needs a public repo, and many paid packs forbid sharing the raw files.
2. **CC0 packs** (e.g. Kenney.nl, OpenGameArt CC0): free and safe to use, but mixing several packs risks a patchy style.
3. **Pixel art drawn for this game:** by hand, or written as palette-indexed pixel grids in code. Consistent and licence-free, but more work, and simpler than a professional pack.
4. **AI-generated sprites:** good for trying ideas. Clean pixel grids and consistent animation frames are hard to get, and the service's terms must allow the use.

**Order of work for the pixel art** (one step at a time, each tested in the browser and on the tablet; all done in M5):

1. Pick sources and palette, then build **one sample scene** (a small dining room with two tables, one guest, one waiter, one chef) and approve the look.
2. The restaurant view: rooms, furniture, decor, equipment, terrace.
3. Characters: guests, staff and special characters, with animations and bubbles.
4. The Old Town map, food icons and UI icons.

### 9.1.1 The street around the restaurant (chosen 2026-10-01: A1–A3, B1–B3, C1–C2 and D; built in M5c)

Since 2026-10-01 the restaurant view sits in an Old Town street: cobbles, pavements, rows of gabled houses and the Town Hall spire. Playtest feedback: the sky behind the houses should show the day's forecast, and the restaurant looks as if it stands on the pavement. Proposals below; the chosen ones become roadmap items and decision-log entries.

**A. Weather in the sky behind the houses** (the same weather as the forecast and the window view)

1. **Sun and moon.** A pixel sun over the roofs on sunny days (bigger and hotter-looking in a heatwave, with a warm haze); after 19:30 a moon and a few twinkling stars instead.
2. **Clouds.** Soft pixel clouds that drift slowly across the sky: a few small white ones when sunny, a thick grey layer when cloudy, dark heavy ones in the rain. Moved with CSS, so they cost almost nothing.
3. **Rain.** Falling rain streaks over the whole street (one light animated layer), a darker sky, wet cobbles with a few puddles that reflect the windows, and closed umbrellas on the empty terrace.
4. **Gulls.** Now and then a herring gull glides across the sky above the roofs (Mewa's cousins), more often on sunny days.

**B. The restaurant as a building, not furniture on the pavement**

1. **A raised floor (dollhouse cut).** The room stands on a stone plinth a few pixels high, showing its thickness along the two open sides, like a cut-away dollhouse or diorama. The floor no longer touches the cobbles.
2. **Low cut-away walls on the open sides.** The front and side walls are cut off at knee height (the usual way isometric games show the inside of a building), with the wooden trim, the window sills and the door opening to the street. This makes it read as the inside of a house.
3. **A Gdańsk przedproże for the terrace.** Instead of tables on the bare street, the terrace becomes a raised stone platform in front of the door with a few steps down to the street and a carved stone balustrade, like the ones on ul. Mariacka. Very Gdańsk, and it explains why the terrace sits above the cobbles.
4. **The house in its row.** Neighbouring houses continue the building line on both sides, so the restaurant reads as one house in a street, with the pavement and the cobbled road running in front. The big empty cobbled square to the right of the kitchen becomes a narrow side lane.

**C. Street life** (the street now looks like bare concrete)

1. **Street furniture:** cast-iron lamp posts (lit after 19:30), wooden benches, linden trees in round iron grates, flower tubs, a bike rack, and an A-frame menu board by the door ("Dziś: pierogi!"). Placed along the pavement, never in the way of guests walking in.
2. **People passing by:** a few pedestrians (at most about 8 at once) strolling along the street in both directions, in their group colours, so the player can see who is around: tourists with cameras at lunch, office workers at noon, students in the evening, more on festival days. They reuse the walking-guest sprites and animation, so they cost little.
3. **Later (not now): attracting passers-by.** Making the street interactive, for example tapping a passer-by to hand them a flyer, the menu board tempting a group to come in, or a waiter offering samples at the door. To be designed once the street life is in; it fits M5b ("Interactive service").

**D. Guests come in from the street** (they now walk in from the opposite side)

1. Guests for inside tables arrive along the pavement and come in through a **front door on the street side**. The door on the back wall becomes the kitchen's back door (or a window).
2. Terrace guests come up the przedproże steps (B3) from the street.
3. Guests who leave walk out of the door and off along the street, instead of disappearing.

**Recommendation:** A1, A2 and A3 for the weather (A4 later, with the "shoo the gulls" item in M5b), B1 + B2 + B3 for the building, C1 + C2 for street life, and all of D, since D comes naturally with B2 (the front wall gets its door). B4 needs care so the neighbouring house never hides the kitchen. C3 is for later.

### 9.2 Audio and juice

- **Audio:** soft background music, café ambience, a till "ding", seagull calls. Made in code with Web Audio (no sound files), or CC0 sources only; a mute toggle is required.
- **Juice:** coins popping (the money each table pays floats up from it, with a heart from happy guests), stars appearing, a small celebration when a goal is reached.

### 9.3 Graphics and layout: concepts (chosen 2026-10-02: A, then C, then B)

Playtest wish (2026-10-02): more detailed pixel art and a better layout, measured against the best management games. Three concepts below, with pictures in `art/concepts/v3/`. The "today" pictures show the game as it is now, for comparison. The layout mock-ups (A and B) are the real game restyled with CSS and a few overlays, at the tablet's 1364×603 layout; the art (C) is drawn by the game's own pixel code (`npx tsx scripts/pixel/concepts-v3.ts`).

**What the best management games do:**

| Game | What it does best | What we take |
|---|---|---|
| Stardew Valley | The world fills the screen. The clock, date, weather and money sit together in one small wooden frame in a corner. Menus open as parchment pages in wooden frames, with tabs along the top. Warm window light in the evening. | The small framed corners for the clock and the money (A); wooden frames and ribbon tabs for the menus (B); the evening light (C). |
| Kairosoft games (Cafeteria Nipponica, Game Dev Story) | Tiny people in a small room fill the whole phone screen. Numbers, hearts and sparkles pop up over people's heads all day, so something nice is always happening. | The whole screen for the restaurant, and money and hearts floating up from the tables (A). |
| Two Point Hospital | The hospital fills the screen. The controls are a slim strip of icon buttons along the bottom, and windows open over the world only when they're needed. | Round buttons along the bottom edge (A). The day's numbers stay small, with their lists only on a tap (already in). |
| Theme Hospital, Pizza Syndicate | The cut-away "dollhouse" building, but with a big control panel that takes a large strip of the screen. | Keep the dollhouse (already in); avoid big panels that hide the world (A). |
| Good Pizza, Great Pizza | One customer at a time, with a big, expressive face: you always know how they feel. Made for phones and tablets: large, clear and easy to tap. | Expressive faces and each group's telltale things on every guest (C). |
| Coffee Talk, Moonlighter | Coffee Talk's little café at night: warm lamplight against a blue, rainy evening. Moonlighter's shop: rich detail on every shelf and wall. | The evening look (C, evening picture). |
| Unpacking | Every room is full of small, specific objects that tell you whose home it is. | Jars, a picture of the Żuraw, a chalkboard, a clock and copper pans, so the room feels lived-in and Gdańsk (C). |

**A. The world fills the screen** (`a-world-fills-screen.png`; today: `a-today-day.png`)

- During the day the restaurant and its street fill the whole screen. The red top bar and the white card go, and what they held becomes small pixel-framed panels in the corners, over the sky and the cobbles:
  - top left: the clock, date and weather;
  - top middle: the day's four numbers, still tappable for their lists;
  - top right: cash and stars;
  - bottom left: round buttons for Manage, Happy hour, Flyers (with how many are left) and Who's who (the colour legend, which now takes a whole line, opens on a tap);
  - bottom right: pause and the speeds;
  - left: the notes (who didn't come in, a regular arriving), stacked under the clock, each with its ✕.
- When a table pays, the money floats up from it ("+38 zł"); a delighted guest sends up a heart. This is the "coins popping" from section 9.2.
- **Gain:** the restaurant is drawn about **1.6–1.7 times bigger** (at the tablet's layout the room grows from 544 to 921 pixels wide). People and tables are easier to tap, and the extra detail of C can be seen.
- **Cost:** the corner panels cover a little street and sky (only scenery). The planning screens stay as they are. At the smallest size (850×530) the numbers in the middle would shrink to icons. It's the same DOM as now, so the tablet won't notice.
- **Effort:** medium: the day screen and the top bar, plus the floating money.

**B. Pixel-framed menus** (`b-pixel-frames-staff.png`, `b-pixel-frames-menu.png`; today: `b-today-staff.png`)

- The planning screens look like a page in a wooden frame, as in Stardew Valley, instead of a white web card:
  - a walnut frame with a thin gold line around a parchment page;
  - tabs as ribbon bookmarks, with the open one in brick red;
  - cards for staff, dishes and candidates with square corners, a dark outline and a gold shadow;
  - square, bevelled buttons that look pressable, and "Open the restaurant" in green;
  - headings in a serif, like a printed menu card, while the text stays in today's clean font (section 9.1: readable text);
  - the top bar in dark wood.
- **Gain:** the menus look like part of the same pixel world. It's almost all CSS: no new pictures, nothing to download, and the app hardly grows.
- **Cost:** contrast and readability need checking on every screen. The serif headings use the tablet's own serif font (Noto Serif on Android), so they look a little different from these screenshots, which were made on Windows.
- **Effort:** small to medium: the shared styles in `global.css`, then a check of every tab, the day report and the pop-ups.

**C. Richer pixel art** (`c-richer-art-day.png`, `c-richer-art-evening.png`, `c-people-before-after.png`)

- **A sample dining room** in the same isometric view:
  - **Floor:** honey-coloured planks with grain and joints, a red-and-blue folk rug, and soft shadows under the furniture.
  - **Walls:** textured plaster over wooden panelling. A window looks out onto Gdańsk gables, with curtains and lit windows at dusk. There's a shelf of jars, a print of the Żuraw, a chalkboard menu, a clock, and three brass wall lamps with green shades.
  - **Kitchen:** Delft-blue tiles and copper pans. The stove has a flame and steam, and the chef works behind a pass with plates under a heat lamp.
  - **Tables:** checked tablecloths, plates of pierogi and soup, glasses, and a vase by day or a candle in the evening. A fig tree stands in the corner.
  - **Evening:** the room turns blue and dim, and the lamps and candles throw warm pools of light, just as the street already darkens at dusk.
- **People** are bigger and more detailed: about 20×37 pixels instead of 14×20, not counting hats and tall hair (the comparison picture shows today's people on top).
  - Eyes with a shine, eyebrows and blush.
  - Seven hairstyles: bob, bun, long, short, spiky, bald and a cap.
  - Clothes with folds.
  - The telltale things from section 9.1: tourists' straw hats and cameras, students' backpacks, the locals' jumpers with a Kashubian pattern, office workers' glasses and foodies' scarves.
  - Staff: the waiter in black with a white collar and apron, carrying a tray; the chef in whites and a toque.
- **Gain:** much more charm and more Gdańsk, and the guests are easy to tell apart without the colour legend.
- **Cost:** people nearly twice as tall need furniture that grows with them (the sample's tables are 20 units instead of 16), so the same room needs more of the screen, which A gives. Everything is drawn once and kept as pictures, as now, so the detail costs nothing while the day runs; the code grows by a few KB.
- **Effort:** the biggest of the three. First the room parts and furniture, then the 12 decor items in their styles, then all the people and their poses (sitting, walking, from behind), one step at a time, each checked on the tablet.

**Recommendation:** all three, in this order:

1. **A first.** It makes the restaurant 1.6 times bigger, so the new detail can be seen on the tablet.
2. **C in steps:** the room (floor, walls, window, kitchen), then the furniture and decor, then the people.
3. **B** is quick and doesn't depend on the others, so it can go in at any point.

Chosen on 2026-10-02: all three, in this order (see M7 in the roadmap).

Built: A on 2026-10-02. C on 2026-10-03, first at the old scale and then, after a playtest, as in the concept picture in four steps: its scale, a cozy starting room, the kitchen's pass and people's poses (see the decision log). B follows in M7c, after the more dynamic season (M7b).

### 9.4 A new look: concepts (rounds 4–8, 2026-10-06; chosen: the Kashubian sketchbook, section 9.5)

Playtest wish (2026-10-06): the graphics should evolve, all of them (the restaurant, the street, the menus and the people), because the pixel art reads as something from the 80s or 90s. Three modern directions, drawn as SVG and CSS by `npx tsx scripts/pixel/concepts-v4.ts` (pictures rendered by `node scripts/pixel/shoot.mjs art/concepts/v4/html art/concepts/v4`). Each shows the same moment: the day screen at lunch (`-day.png`), the same at 21:10 with the room dimmed and lamps, candles and the heat lamp glowing (`-evening.png`), the Menu tab with Pani Krystyna's portrait (`-menu.png`) and everyone at a large size (`-people.png`). Compare with the game today: `art/concepts/v3/a-world-fills-screen.png` and the screenshots of section 9.3.

All three are vector art, which the game may draw at runtime (DOM, CSS and SVG). Like today, the room and people would be drawn once into pictures and reused, so the tablet only moves pictures while the day runs. Moving from pixels to vectors means redrawing the art layer (`src/ui/pixel/`): the room and its furniture and decor, the street and map, the people and their poses, the icons, and the menus' styles. That's a milestone of its own, done in steps like Graphics C.

**1. Storybook** (`storybook-*.png`): a painted picture book. Warm paper colours, ink outlines with a slight hand-drawn wobble, a soft paper grain over everything. Stepped Gdańsk gables in sorbet colours. The menus are paper cards with a serif, like a printed menu. Evenings are warm lamplight against blue dusk.
- **Gain:** the coziest and most personal: it looks like a gift, and like Gdańsk. Closest in warmth to today's charm, so the change feels like growing up rather than replacing it.
- **Cost:** the wobble and grain are SVG filters, too slow to run live on a budget tablet, so they're baked into the pictures once (as the room is today). Outlines must stay readable at the tablet's size.

**2. Toy box** (`toy-*.png`): a bright diorama of toys. Saturated colours, no outlines, round heads with a glossy shine, soft drop shadows, chunky rounded buttons that look pressable, as in modern mobile games.
- **Gain:** the most readable and the most "game-like"; big, obvious buttons suit a tablet.
- **Cost:** the least Gdańsk of the three, and it can look generic or childish. Glossy gradients on every person add a little drawing time (once).

**3. Modern flat** (`flat-*.png`): a calm, grown-up illustration. Muted pastels and navy, no outlines, clean shapes, soft shadows, airy white cards and light type, like a stylish travel poster.
- **Gain:** elegant and modern, and the lightest to draw.
- **Cost:** cooler and less cozy; the evening needs care to stay warm rather than grey; the people can look like stock illustrations.

**Recommendation:** Storybook, perhaps with Toy box's chunky, pressable buttons for touch. It keeps the warmth that makes this a gift, and looks the most like Gdańsk.

**Round 4's verdict (2026-10-06):** none of them; they look too simple. Asked what to aim for, the player liked all four of: modern HD pixel art (Eastward, Stardew Valley 1.6, Coffee Talk), hand-painted illustration (Spiritfarer, Cozy Grove), a soft 3D look (Two Point Hospital, Animal Crossing) and detailed cartoon (Good Pizza, Great Pizza; Overcooked). Picture files may be shipped in the app if that makes the art richer (a change to the rule that all art is drawn in code); I can only draw in code myself, so pictures would come from an artist or an image tool.

**Round 5** (`art/concepts/v5/`, `npx tsx scripts/pixel/concepts-v5.ts`): detail first. One scene with far more in it: a bar along the back wall with shelves of bottles, beer taps and a bartender, a regular on a stool, wallpaper with small Kashubian flowers above raised panelling and a dado rail, a cornice, a ship painting and the Żuraw, a chalkboard of today's dishes, a window with mullions, curtains with folds and geraniums on the sill, a shelf of preserves, a coat stand, parquet, a Kashubian rug, round tables with long embroidered cloths, plates of pierogi and żurek, glasses, bread and candles, pendant lamps, a kitchen with Delft tiles, a range hood, a pot on the flame, copper pans and plates on a rack, and the pass with dishes waiting under a heat lamp. People are about 4.5 heads tall with real faces (whites, irises, a shine, brows, nose, ears, mouths that smile, talk or laugh) and poses (eating with a fork, raising a glass, waving, reading the menu, carrying a tray, holding a pan, walking). The street has Długi Targ-style facades with cornices, arched windows, flower boxes and striped awnings, St Mary's and the Town Hall behind, a pavement with a kerb, cobbles stone by stone, lamps, benches and pigeons, and sunlight falls through the window. The same scene in four treatments: `1-pixel.png` (drawn at a third of the size with fewer colours and shown big without smoothing), `2-painted.png` (soft wobbling edges and canvas grain), `3-soft3d.png` (rounded shading and shine), `4-cartoon.png` (bold outlines and two-tone cel shading), and the people up close in all four, `5-people.png`.

Round 5's verdict: not liked either. Both rounds kept the same isometric dollhouse seen from above, so only the paint changed.

**Round 6** (`art/concepts/v6/`, `npx tsx scripts/pixel/concepts-v6.ts`): a different view and a different visual language. The restaurant is seen straight from the front, like a stage or a townhouse on Długi Targ with its front wall taken off. This makes the people about twice as large: a bar with a bartender on the left, two tables of guests under three arched windows onto the street and Neptune, a waiter with a tray, a guest at the door, and the kitchen hatch with the chef on the right. The same scene in three looks: `1-paper.png` (a paper theatre: cut-paper layers with soft shadows between them, paper fibre and sunbeams), `2-folk.png` (Kashubian folk art: wycinanki rosettes, embroidered bands on cloths, aprons and panelling, bold flat colours with dark outlines, rosy folk cheeks, and a painted flower frame), and `3-sketch.png` (an ink-and-watercolour travel sketchbook: wobbly ink lines over washes on grainy paper).

Round 6's verdict: the ink-and-watercolour sketchbook is liked, with some of the Kashubian folk style worked into it.

**Round 7** (`art/concepts/v7/`, `npx tsx scripts/pixel/concepts-v7.ts`): the sketchbook with Kashubian folk art in three strengths. `1-kashubian-details.png` keeps the sketchbook's soft colours and brick edge, and sketches the folk art into the room: tulips and rosettes on the wallpaper, embroidered bands on the cloths, aprons, bar and rug, and flowers stitched on clothes; its panels have a red running stitch. `2-kashubian-colours.png` paints with the seven colours of Kashubian embroidery (three blues, yellow, red, green, dark brown), so the panelling is pale blue and the bar red, with a painted border of tulip and rosette vines in Kashubian blue; its panels are inked in blue with a red stitch and a rosette on the corner. `3-sketchbook-page.png` paints the scene onto a sketchbook page with a ragged watercolour edge, Kashubian tulips and rosettes inked in the margins, handwritten notes, and the panels as paper scraps taped on.

Round 7's verdict: option 3, the page from a Kashubian sketchbook, is the chosen direction, to be polished with more detail.

**Round 8** (`art/concepts/v8/sketchbook-page.png`, `npx tsx scripts/pixel/concepts-v8.ts`): option 3 polished. The regular at the bar sits on a proper stool (legs, knees, a brass footrest) instead of ending at the waist. People have shading and ink hatching down one side of their clothes, rounded arms with cuffs, ink strands in their hair, and soft shadows on the floor. The room has ink hatching under the ceiling, in the corners, under the sills and counters; paper-cut bunting in folk colours; Kashubian painted plates and a shelf of preserves; Mewa perched on the picture frame; steam off the soup and cutlery by the plates; a crate of cabbages, beetroot and carrots from the market; a young fig tree; and a coat stand with a hat and scarf by the door. The windows have clouds, seagulls, St Mary's tower and the Town Hall spire. The page has a note pointing at Mewa, a red ribbon bookmark and a faint coffee ring.

Round 8's verdict: chosen. This is the new look for the whole game, written up as a plan in section 9.5 and built in M8.

### 9.5 The Kashubian sketchbook look (chosen 2026-10-06; built in M8)

The game's new look, replacing the pixel art of section 9.1 everywhere: the restaurant, its people, the street, the map, the icons, the HUD, the menus and the pop-ups. **The reference picture is `art/concepts/v8/sketchbook-page.png`**, and its code, `scripts/pixel/concepts-v8.ts`, is the starting point for the real thing. Built in M8, which comes before everything else still open on the roadmap.

**What it looks like**

- **The view:** straight from the front, like a stage, or a townhouse on Długi Targ with its front wall taken off. This replaces the isometric dollhouse. The room fills the page: the bar on the left, the tables in the middle under tall arched windows onto the street, and the kitchen hatch on the right. A strip of pavement and cobbles runs along the bottom. People are large (a seated guest is about 195 pixels tall at 1364×603), so faces and moods read at a glance.
- **Ink and watercolour:** warm dark-brown ink lines (`#3b2a24`), with a slight hand-drawn wobble. Under them are watercolour washes, set a little off the lines, on grainy cream paper (`#fbf6ea`). Shade is drawn as **ink hatching** (diagonal strokes) rather than dark fills, with soft wash shadows under people, tables and furniture. The palette is the `sketch` palette in `concepts-v8.ts`: soft sorbet facades, warm wood and folk red, blue, yellow and green as accents.
- **Kashubian folk art, as accents:** tulips and rosettes on the wallpaper and in the margins, embroidered bands on tablecloths, aprons, counters and the rug, painted plates on the wall, and paper-cut bunting. The folk colours stay accents, so the room doesn't turn into a pattern sheet.
- **The sketchbook page:** the scene is painted onto a page with a ragged watercolour edge. Ink-drawn vines of tulips and rosettes run down the margins. There are handwritten notes in the margins, a ribbon bookmark and a faint coffee ring. The margin notes can carry real game information: Mewa's comments, a wish that was missed, today's goal.
- **People:** about 4.5 heads tall, facing the front and turned a little left or right (mirrored, not separately drawn). They have simple, friendly faces with rosy cheeks, and each group keeps its telltale things (tourists' sun hats and cameras, students' backpacks, foodies' berets and scarves, and so on). Clothes have shading and hatching down one side, and people have rounded arms with cuffs, ink strands in their hair, and a shadow on the floor.
- **Mewa** lives in the room: perched on the picture frame, the window sill or the bar, and pointed out by notes in the margin.
- **The HUD and buttons:** paper scraps taped onto the page, a little crooked, with handwritten numbers. Buttons are paper tags with a red running stitch, at least 48 px. Longer text (menus, reports, card texts) stays in a clear, readable font; handwriting is for numbers, headings and notes.
- **Evenings:** a blue dusk wash over the page, with the lamps, candles and windows glowing warm.

**The street outside** (added 2026-10-06): the day has a second view, outside the restaurant, switched with a button.
- **The scene:** the restaurant's townhouse on a street like Długi Targ, among tall gabled neighbours in sorbet colours. It has its painted sign, its door and warm lit windows, and the Town Hall spire behind.
- **The terrace** sits on the pavement in front of the house. The terrace tables move here from the room, with their guests eating outside.
- **Passers-by:** people of every group stroll both ways along the street. Tapping one hands them a flyer, as now.
- **Also outside:** the queue at the door, the gull landing on the terrace plates, the musician on live-music theme nights, and the sky, rain and lamps at dusk.
- **The other view:** when something needs the player in the view that isn't showing (a gull, a queue, a table waiting for help), a small badge appears on the switch.

**How it is built**

- **Code:** a new folder, `src/ui/sketch/`, replaces `src/ui/pixel/` piece by piece. It starts from `concepts-v8.ts`: the palette, the painter (the wash plus the ink line), the motifs (rosette, tulip, folk band, hatching, bunting), people (`figure`), Mewa and the page frame. Everything is still drawn by the game in code, as SVG, so nothing is downloaded and decor, weather and dusk combine freely. Picture files are allowed if a piece really needs one (decided 2026-10-06).
- **Baked, not live:** the SVG filters that make the wash, the ink wobble and the grain are far too slow to run live on a budget tablet. So each piece is **baked once into a picture** and cached:
  - the room for a given decor, weather and time of day
  - each person for a given look and pose
  - each icon
  The bake draws the SVG once into an offscreen canvas and keeps the result as an image; that is the only canvas use. During the day only these images move, with CSS transforms. Pictures are baked at the screen's device pixel ratio, so lines stay crisp. Targets on the tablet: under a second of baking when a day starts, and a smooth frame rate with `?perf`.
- **The simulation does not change.** The view keeps reading `floorView()`. A new front-view layout places the tables, seats, door, bar and kitchen on the stage.
- **A handwriting font:** the concepts use Segoe Print, which only exists on Windows, so the tablet would show a fallback. The game bundles one handwriting font with Polish letters (ą, ę, ł, ś, ż …), for example Caveat or Patrick Hand (both under the SIL Open Font Licence). It ships as a `.woff2` file and is precached for offline use. Ask before adding it.
- **The layout** must still work from about 850×530 up: the margins and notes shrink first, and the scene scales to fit.

**Settled while building** (each recorded in the decision log as it is decided)

- The front-view layout for each of the six premises: settled 2026-10-06 (two or three staggered rows, the room as wide as the premises needs; see the decision log). The cellar room of "Bigger premises" (M7c) is still open.
- Where the terrace goes: settled 2026-10-06, in the street outside view (above).
- How the inside and outside views are switched, and what the badge shows: settled 2026-10-06 (a round button by Who's who; see the decision log).
- How people move: settled 2026-10-06 (in through the door in the back wall, along the aisles, seen from behind walking away; each visit on its own timeline a little behind the game; see the decision log).
- What becomes of the street panorama: the street is seen through the windows and along the pavement strip; the isometric street goes.
- How the planning screens use the page: settled 2026-10-06, a notebook with ribbon tabs (see the decision log).

**Where M8 stands** (2026-10-06, for picking it up in a new chat): the foundations, the room and its people, every icon and the street outside are done, and the sketchbook look is now the normal view of the day (`?pixel` on the game's address still shows the old pixel art, until "Retire the pixel art"). The inside view is `src/ui/SketchRoomView.tsx` and the street outside `src/ui/SketchStreetView.tsx`; what both share (visits on their own timeline, walkers, seated parties with their bubbles and help buttons, baking hooks) is in `src/ui/sketchView/shared.tsx`. Their drawing code is in `src/ui/sketch/` (`frontRoom.ts` and `street.ts` layouts and walks, `roomArt.ts` and `streetArt.ts` the pictures, `people.ts` and `cast.ts` people, `sheets.ts` sheets of poses, `icons.ts` drawn icons, `bake.ts` baking). The planning screens were started next, before the light and weather (the player asked for the menus first): the Manage notebook, its top panels and the street behind it are done (`src/ui/SketchBackdrop.tsx`, `PlanScreen.tsx`, the sketchbook section at the end of `src/ui/global.css`, all under the `.sketchbook` class so `?pixel` keeps the old look). The inside of the tabs is done too (cards as paper scraps, taped staff cards, ink tags and bars). Still to do for that item: the day report as a journal page with Mewa's notes in the margin, and the choice cards as notes pinned to the page. Then the light and weather: the street already has a sky for each weather, rain and lit windows at dusk, but the room's windows, the lamps' glow, candles and a dusk wash over people are still to do, inside and outside.

**All the icons** (playtest, 2026-10-06; done the same day, see the decision log; the Old Town map and the street panorama behind the planning screens are still pixel art, and go with their own items): "all the icons" means every one in the game, not only the room's. Still to redo: the emojis in the top panels (weather, coins, stars, today's goal), the round buttons (Manage, Happy hour, Flyers, Who's who), the notes over the room (rush, streak, results), the help panel (move, free drink, apology) and the ⭐ and 🪑 for moving a party; Mewa, whose picture by her tips and on the Mewa tab is still pixel art; the Who's who legend, which shows the guest groups as pixel people; the food icons in the Menu tab; and the emojis in the planning screens, cards, the day report and the game's texts (events, goals, trends, theme nights, bookings and more). About 110 different emojis are used in all (found by searching `src/ui` and `src/data`). The plan: one icon library for everything, extending `src/ui/sketch/icons.ts`, and a small helper that shows any text with its emojis swapped for the drawn icons, so the texts in `src/data` can stay as they are.

**Order of work** (the items of M8, one at a time, each tested in the browser and on the tablet):

1. **Foundations and one still scene:** `src/ui/sketch/` with the palette, painter, motifs and page frame; the bake-and-cache pipeline; the handwriting font. The day screen shows the concept scene as a still picture behind today's UI. Measure baking time and frame rate on the tablet.
2. **The room in the front view:** walls, windows onto the street, bar, kitchen hatch, floor and the tables laid out from `floorView()` for all six premises; the decor items in their four styles; the equipment in the hatch.
3. **People:** the five guest groups, chefs, waiters, Tomek, Adrian, the Friday regular, the food critic and Mewa. They get poses (walk, sit, eat, drink, carry, cook, wave) and simple CSS walking. Bubbles (wishes, patience, rush) become ink speech bubbles, along with the floating coins and hearts.
4. **The street outside:** the second view (above), with the terrace, the queue, passers-by and flyers, the gull and the musician, and a switch with a badge.
5. **Light and weather:** sky, clouds and sun from the day's weather, inside and outside; rain; the evening dusk with glowing lamps, candles and windows.
6. **The HUD and controls:** paper scraps, tape, handwritten numbers and stitched paper-tag buttons. Choice cards and rush prompts become notes pinned to the page.
7. **Planning screens and pop-ups** (replaces Graphics B): Menu, Staff, Kitchen, Interior, Marketing and the cards as sketchbook pages; the day report as a journal page with Mewa's notes in the margin.
8. **The map and icons:** the Old Town map as an ink-and-wash sketch map; food and UI icons in ink and wash.
9. **Retire the pixel art:** remove `src/ui/pixel/` and its tests and tools once nothing uses them; check the bundle size and the tablet's speed.

## 10. Personal touches (fill in)

- Her name: Joana / the restaurant's default name: **[Joana´s Kitchen ]**
- Her favourite dish, which becomes a secret recipe with a perfect combo bonus: **[Aroz de Vitela  ]**
- Places in Gdańsk that mean something to you both (cameos on the map or in events): **[Mariacka ]**
- Inside jokes to hide in reviews, staff bios or rival messages: **[two waiters based on people she knows Tomek Graczyk (cheapest, but low skilled causing drastic drop of reputation) and Adrian Żabka (50%chance not coming to work but highest stats) ]**
- A regular guest based on you: **[he will always shout: give me cytrynowka to my dish!! ]**
- Ending: after winning the Golden Neptune, a personal message / credits: **[Parabéns!!! You passed a test! Now You are ready to open Your dream restaurant in the real WORLD!!!]**
- A Portuguese corner (M7): a choice card with a Portuguese exchange student unlocks **cabrito assado** (roast kid goat, a traditional Portuguese dish) for the dish creator and **azulejo tiles** as decor.

## 11. Scope

**MVP (must have):**

- one restaurant, with relocation
- 6 locations
- 5 customer groups
- about 16 dish templates
- 6 pieces of equipment
- chefs and waiters with traits
- seats, decor and terrace
- 5 marketing options
- 4 rivals with weekly AI
- calendar and weather
- 8 random events
- reviews
- daily and weekly reports
- tutorial and weekly goals
- Golden Neptune ending
- autosave and save export
- PWA install

**After MVP (nice to have):**

- second restaurant
- staff morale and days off (built in M7)
- ingredient stock and deliveries
- festival stall mini-game at the Fair
- more dishes and seasonal menus (seasonal ingredients and a daily special built in M7)
- achievements (the sticker album, planned in M7)
- a Christmas market season

**Out of scope:**

- online features
- multiplayer
- real-money anything
- crime and sabotage

## 12. Roadmap

Work in small steps, and test each step in the browser before moving on.

**M0 – Setup and install pipeline**

- [x] Install Node.js, create the Vite + React + TypeScript project, add Vitest
- [x] Add PWA support (manifest, icons, offline service worker)
- [x] Deploy a "Hello Gdańsk" page to GitHub Pages
- [x] Install it on the tablet via Chrome → "Add to Home screen", and confirm it opens full screen and offline

**M1 – Simulation core (no UI)**

- [x] Seeded RNG, game clock, calendar
- [x] Data files: locations, groups, a few dishes, rivals
- [x] Guest generation, choice model, kitchen queue, satisfaction
- [x] `npm run simulate`: plays a whole season headless with simple strategies and prints results
- [x] Unit tests for the core formulas

**M2 – Playable prototype**

- [x] HUD, speed controls, day start and end flow
- [x] Menu and price screen, staff hiring, daily report
- [x] Autosave and load

**M3 – MVP systems**

- [x] Dish creator, lunch set, equipment, interior and terrace, marketing
- [x] Rival AI, events, weather, reviews
- [x] Map and relocation
- [x] Tutorial, weekly goals, Golden Neptune ending
- [x] Settings: difficulty, save export/import

**M4 – Gdańsk and personal**

- [x] Illustrated map and restaurant view
- [x] Event texts, rival personalities, review lines
- [x] Everything from section 10

**M5 – Polish and balance**

- [x] Art pass, sound, animations (flat SVG art, now the placeholder for the pixel art)
- [x] Pixel art: choose sources and palette, and approve one sample scene (section 9.1)
- [x] Pixel art: restaurant view (rooms, furniture, decor, equipment, terrace)
- [x] Pixel art: characters (guests, staff, Mewa, special characters) with animations, and guests walking in and out
- [x] Pixel art: Old Town map, food icons and UI icons
- [x] Restaurant view while planning: a tab next to the Map that shows the restaurant before opening
- [ ] Balancing with the simulator plus playtests on the real tablet
- [x] Performance check on the tablet

**M5b – Interactive service (section 6.13)**

Each item is tested in the browser and on the tablet before the next one starts.

- [x] Choice cards: 2–3 moments a day that pause the clock and offer two answers
- [x] Tap a waiting guest: free drink or the chef's apology
- [x] Shoo the gulls on the terrace
- [x] Live happy hour: a button during the day instead of the fixed 15:00–18:00 setting
- [x] Seat guests yourself: tap a group, then a table; favourite spots please them

**M5c – The street and the building (section 9.1.1 and section 13)**

- [x] Lost guests: people can see a full restaurant, and a short queue forms at the door
- [x] Guests come in from the street, and the restaurant looks like a building (front door, raised floor, low cut-away walls, przedproże terrace)
- [x] Weather in the sky: sun and moon, drifting clouds, rain
- [x] Street life: lamp posts, benches, trees, a menu board and people passing by

**M7 – Shape and polish (section 6.14)**

Each item is tested in the browser and on the tablet before the next one starts.

- [x] A slower day: 130 seconds at 1× instead of 50
- [x] A shorter season: six weeks ending with St. Dominic's Fair, events moved, rebalanced with the simulator
- [x] The tabs during the day: open any tab while the restaurant is open (the clock pauses); prices, menu and marketing change straight away, purchases and new staff arrive the next morning
- [x] Choice cards: rarity, a shuffled deck, calendar and weather cards, follow-ups
- [x] Choice cards: about 15 new cards, including the Portuguese exchange student (cabrito assado and azulejo tiles)
- [x] Performance check on the tablet with `?perf` (before adding more art)
- [x] Manager-mode background: concept art (3–4 pixel mock-ups) to choose from
- [x] Manager-mode background: build the chosen concept
- [x] The day's numbers open up into lists: tap Guests served, Takings, Walked out or No free table to see who and what (groups, dishes, reasons)
- [x] Gdańsk streets: ornate gables, facade colours and details, granite paving
- [x] Gdańsk streets: shop fronts, awnings, café umbrellas, double lanterns, the Town Hall clock and golden spire, flags, flower boxes, bikes, pigeons, an amber stall, a street musician
- [x] Gdańsk streets: each of the six streets looks like itself
- [x] Named regulars with stories
- [x] Staff growth: morale and days off
- [x] Staff growth: training, and raises for fair wages
- [x] Staff growth: short storylines for the team
- [x] Staff faces: a pixel portrait of each person on their card in the Staff tab
- [x] Seasonal ingredients and a "Dziś polecamy" specials board
- [x] The riverside background during the day too, as on the planning screens
- [x] Replying to reviews
- [x] Attracting passers-by: flyers for people walking past
- [x] Graphics A: the restaurant fills the screen during the day, with small framed panels in the corners (section 9.3)
- [x] Graphics A: money and hearts float up from the tables
- [x] Graphics C: a richer room: floor, walls, window and kitchen
- [x] Graphics C: richer furniture and decor
- [x] Graphics C: bigger, more detailed people
- [x] Graphics C as in the concept: the concept's scale, with the room drawn 1.25 times bigger, tables further apart, taller walls and people at about 24×38 (`art/concepts/v3/c-richer-art-day.png`)
- [x] Graphics C as in the concept: a cozy starting room (plain dark panelling, checked tablecloths with plates and glasses, a rug, a fig tree and a jar shelf); bought decor upgrades them
- [x] Graphics C as in the concept: the kitchen as a long wooden counter (the pass) with plates and a heat lamp
- [x] Graphics C as in the concept: people's details and poses at the new size

**M8 – The Kashubian sketchbook look (section 9.5)**

Chosen on 2026-10-06. **This comes first**, before the rest of M7b and M7c. The restaurant and the street outside come first, alive and animated; then the HUD, menus and pop-ups are restyled to match. Each item is tested in the browser and on the tablet before the next one starts.

- [x] Foundations: `src/ui/sketch/`, the bake-and-cache pipeline, the handwriting font, and the concept scene as a still on the day screen
- [x] The restaurant room in the front view, laid out from `floorView()` for every premises, with decor and equipment
- [x] People: guests, staff, special characters and Mewa, with poses, walking, eating and other animations, and ink speech bubbles
- [x] Every icon drawn: one ink-and-wash icon for each of the game's emojis, shown in place of the emoji wherever a text has one; Mewa, the coins, stars, weather, dishes and the team's portraits redrawn; the Who's who legend with the new people
- [x] The street outside: a second view of the Old Town with the terrace, the queue, passers-by to hand flyers to, the gull and the musician
- [ ] Light and weather: the sky, rain and the evening, inside and outside
- [ ] The HUD and controls as paper scraps and stitched tags
- [ ] Planning screens, cards and pop-ups as sketchbook pages; the day report as a journal page
- [ ] The Old Town map in ink and wash
- [ ] Retire the pixel art, then check the bundle size and the tablet's speed

**M7b – A more dynamic season (section 6.15)**

Comes after M8, before M7c. Each item is tested in the browser and on the tablet before the next one starts. In order of how much each is expected to help:

- [x] Tomorrow's forecast at the end of the day report
- [x] Bookings and big orders to accept or decline
- [x] Dishes level up with use, up to three stars
- [x] Restaurant rank-ups with unlocks
- [x] A weekly Old Town ranking against the rivals
- [x] Rush hour: hurry a chef or waiter, and a quick-service streak
- [x] Daily mini-goals next to Mewa's weekly goal
- [x] Weekly trends in what Gdańsk wants
- [x] Theme nights the player picks
- [x] Rival moves to answer
- [x] Cook-off challenges against a rival
- [x] Guests with wishes
- [ ] The morning market: daily prices and deals

**M7c – The rest of M7's polish (sections 6.14 and 9.3)**

Moved out of M7 on 2026-10-03, so the more dynamic season (M7b) comes first.

- ~~Graphics B: pixel-framed menus and pop-ups~~ (replaced by M8's planning screens, 2026-10-06)
- [ ] Attracting passers-by: a waiter offering samples at the door
- [ ] Bigger premises: cellar room, bar counter, toilet
- [ ] Sticker album ("Gdańsk passport")
- [ ] Mewa's finds

**M6 – Gift day**

- [ ] Final install on her tablet
- [ ] Make a backup save code

## 13. Balancing approach

- All tunables live in `src/data/balance.ts`.
- The headless simulator runs full seasons with scripted strategies ("do nothing", "cheap and fast", "quality focus", "balanced").
- **Targets on Normal:**
  - "do nothing" loses money, like bad decisions do
  - "balanced" becomes profitable by week 2–3
  - a thoughtful player wins the Golden Neptune on the first try, with some tension in the final weeks
- **Pace target:** about 130 seconds per day at 1× speed (calm enough to look after the guests). The season length is set in M7 (section 6.14).

**Fixed issue (playtest, 2026-10-01): too many lost guests.** After a few days the "No free table" counter climbs into the hundreds (for example 179 turned away against 138 served on a June day), which feels unnatural. The simulator shows the same: the balanced strategy turns away about eight people for every one it serves over a season.

- **Why:** when choosing a restaurant, people don't notice that it is full. The expected wait they compare only counts order-taking and cooking, not waiting for a table to free up. So a busy, well-liked restaurant keeps attracting far more people than it can seat, and every one of them is counted as turned away. (Turned-away guests don't cost reputation, so it is mostly a numbers and realism problem, but it makes the counter meaningless.)
- **Fix (built in M5c):**
  1. **People see it's full.** A restaurant with no free table looks less tempting: its expected wait includes the time until the next table frees up, so most people pick somewhere else (or nowhere) before walking over.
  2. **A short queue at the door.** Up to 2–3 parties can wait at the door for a few minutes (within their patience) and are seated when a table frees up; the rest go elsewhere. Visible as people standing by the door, which also fits "Seat guests yourself" (M5b) later.
  3. **Count only who came to the door.** "No free table" then counts parties who actually came and found it full, so it stays a useful hint to buy tables. Target: on the busiest days, turned away stays well below the number served.
  4. Walk-outs (waited too long for food) get the same check in the next simulator run, in case they also pile up on long days.
- Re-run `npm run simulate` before and after, and report the change.

**Quiet until known (playtest, 2026-10-03).** Tables filled up too soon and too often even without advertising, so a restaurant nobody has heard of now gets few walk-ins (`balance.choice.walkInShare`, section 7). `npm run simulate` also reports how much of the opening hours every table is taken. A new restaurant that does nothing now serves about 20 guests on its first day (6–44) and runs out of money in week 5; advertising is what fills the tables.

## 14. Installing on the tablet (summary)

1. Push to GitHub; a GitHub Actions workflow builds and deploys to GitHub Pages.
2. On the tablet, open the game URL in **Chrome**.
3. Open the ⋮ menu and choose **Add to Home screen / Install app**. An icon appears.
4. Launch the game from the icon. It runs full screen and works offline after the first load.
5. Updates: push new code, then close and reopen the app (possibly twice) to get the new version.

## 15. Open questions

- Final game title?
- Should the player choose a restaurant concept at the start (e.g. Polish tavern vs bistro) or build it freely? The current plan is free-form with no fixed concept.
- Portrait support ever? The current plan is landscape only.
- How much text-based humour is wanted in reviews and events? More is more fun, but also more writing.

## 16. Decision log

- 2026-09-30: Restaurant simulator (not pizza only). Cozy tone, no crime. English. Season about 3–5 hours. Web/PWA on Android tablet. TypeScript + React + Vite.
- 2026-09-30: Fictional calendar: no leap years, 1 April is a Monday, and the season lasts exactly 20 weeks, ending on Sunday 18 August (the last day of St. Dominic's Fair).
- 2026-09-30: Game-wide settings live in `balance.ts`. Numbers that belong to one item (a street's rent, a dish's cost, a rival's prices) live next to that item in its own data file.
- 2026-09-30: All desserts, including ice cream, need the dessert display. Dessert menu prices are capped at 50 zł.
- 2026-09-30: `npm run simulate` runs through `tsx`, a dev-only tool that runs TypeScript directly. It never ships to the tablet.
- 2026-10-01: Running out of money is a game over, replacing the no-fail rescues (bank loan, Babcia's envelope). Doing nothing should lose money, just like bad decisions.
- 2026-10-01: The Golden Neptune ending reads "Parabéns!!! You passed a test! Now You are ready to open Your dream restaurant in the real WORLD!!!"
- 2026-10-01: First balancing pass (end of M3). Before it, every restaurant was overbooked all day, so money came too easily. Changes: fewer people eat out ("somewhere else" utility 6 → 7); being unknown matters more (awareness weights doubled); meals take 60 minutes, not 30; wages 650/450 zł a day; rents doubled (Ogarna 600 zł a day); utilities 1,400 zł a week; a table costs 4,000 zł; Mewa's first goal is 300 guests. The simulator's pretend players now invest (tables, staff, decor, terrace, marketing), and "balanced" moves to Długa once it can afford to.
- 2026-10-01: Moving to another street costs 5,000 zł. You keep 70% of your reputation and the best half of your decor.
- 2026-10-01: Relaxed difficulty: 60,000 zł starting cash, and rivals react later, cut prices less and promote themselves less.
- 2026-10-01: Fictional event dates: Easter week 15–21 April, Majówka 1–3 May, Juwenalia 16–19 May, Corpus Christi 20–23 June, tall ships festival 11–14 July, Fair cook-off 10 August.
- 2026-10-01: The Golden Neptune is awarded every summer, so free play gives another chance each year.
- 2026-10-01: Prices invented for M3: a table 4,000 zł (after balancing), decor items 1,200–4,000 zł, terrace permit 3,000 zł, menu board +2 dishes for 3,000 zł, premium supplier +8 quality for 1.5× ingredient cost, happy hour 15:00–18:00 at 20% off.
- 2026-10-01: Staff traits change skill and speed (for example Perfectionist +1 skill −1 speed); a chef's specialty adds 8 quality. The starter team is Pani Krystyna (chef) and Kacper (waiter), with a stove and 16 seats on ul. Ogarna.
- 2026-10-01: "Cheap and fast" going bust in week 4 is fine: bad plans should fail.
- 2026-10-01: Mewa is drawn as a herring gull (white head and body, grey wings with black tips, yellow beak with a red spot, pink legs), in SVG, instead of the 🐦 emoji.
- 2026-10-01: Secret recipe: Arroz de vitela (spelled the Portuguese way), a strong main hidden in the dish creator until Mewa finds the recipe card, at 2 stars or by week 3 at the latest. Its perfect combo is a new extra, a glass of cytrynówka on the side (+20 quality).
- 2026-10-01: The regular guest comes every Friday at 19:00 and shouts "Give me cytrynówka to my dish!!". With cytrynówka on the menu he writes a 5-star review; without it his review says so (at most 3 stars). Shown as "Pan Cytrynówka, your Friday regular" until a real name is chosen.
- 2026-10-01: Tomek Graczyk (from week 2): the cheapest waiter (180 zł a day, skill 1, speed 2), but −2 reputation with every group each day he works. Adrian Żabka (from week 3): skill and speed 5, but a 50% chance each morning of not turning up; paid either way. Both return to the candidates every 3 weeks until hired.
- 2026-10-01: Mariacka cameo: a heart on the map, and "Amber evening on Mariacka" every 20 May (a Monday in the fictional calendar) (more foodies and tourists, a crowd on Mariacka).
- 2026-10-01: Kept: the regular's name "Pan Cytrynówka" and the Arroz de vitela + cytrynówka combo. Adrian's surname is spelled Żabka.
- 2026-10-01: Cytrynówka is also a drink on its own (Drinks, 14 zł). The regular is happy with either the drink or a dish with a glass on the side, and he never gets turned away: with every table taken, he sits at the bar.
- 2026-10-01: Sounds and music are synthesised in the browser (Web Audio) instead of CC0 sound files: nothing to download or license, works offline, adds almost nothing to the app's size. Sound settings are stored on the tablet, separately from the save.
- 2026-10-01: Art direction changes to cozy pixel art with 2D sprites, based on three reference images (a chibi character sheet, an isometric pixel-art kitchen kit, and an AI-generated cozy isometric restaurant used for mood only). The flat SVG art stays as the placeholder until the pixel art replaces it. Details in section 9.1.
- 2026-10-01: Pixel-art sample scene approved ("spot on"). The pixel art is drawn for this game in code (scripts/pixel/), so there are no licence questions. Rooms are isometric, characters are chibi sprites in the style of reference 1. The sample is kept in art/sample/.
- 2026-10-01: The pixel art is drawn by the game in code at runtime (no PNG files shipped). Each street's room size comes from its seats (3 or 4 columns of tables, 2 or 3 rows); every table has four chairs; the open kitchen sits in the far corner; the terrace is a cobbled strip in front with planters. Scaling stays crisp (whole device pixels) unless that would make a big room much smaller.
- 2026-10-01: Guests visibly walk in through the door to their table, and back out when they leave (purely visual; the simulation is unchanged).
- 2026-10-01: While planning (before opening), a tab next to the Map shows the restaurant view: the empty room with the team in place, so purchases can be seen straight away.
- 2026-10-01: Character looks: tourists wear straw sun hats and cameras, students carry backpacks, locals wear Kashubian-patterned jumpers, office workers a shirt and tie, foodies a cream scarf; hair colours vary. Waiters wear white aprons; the food critic a black beret; the Friday regular a lemon shirt and flat cap; Tomek has messy ginger hair and a kompot stain; Adrian wears sunglasses. People are drawn facing us or with their backs to us (not diagonally), with a two-step walk. Guests walk from the door (or the street, for the terrace) to their seat, at about 60 world units a second at 1× speed, and back out; those who gave up leave with a 😠.
- 2026-10-01: Waiters carry the food: when a table's meal is ready, a free waiter walks from their spot by the kitchen to the table with a full tray, pauses to serve, and walks back with the empty tray. If every waiter is already out, the food arrives without a walk.
- 2026-10-01: Pixel art for the map and icons: the Old Town map is drawn in code from above (streets of gabled houses, the Motława, Granary Island, St. Mary's, the Neptune Fountain, the Green Gate, the Żuraw); street markers, names and rival signs stay as large, clearly lettered buttons on top. Every dish and drink has a pixel icon; cash, stars, weather and Mewa use pixel icons too.
- 2026-10-01: The map shows Granary Island with its own streets (one down the middle, four across) and two bridges from the mainland: the Green Bridge straight on from the Green Gate at Długi Targ, and a second bridge by the Żuraw in line with Mariacka.
- 2026-10-01: The day felt too static once the restaurant opened. New milestone M5b, "Interactive service" (section 6.13): choice cards, tapping waiting guests, shooing gulls, a live happy hour button and seating guests yourself. Interactions are optional bonuses; a player who only watches still gets a normal day. They are built and tested one at a time.
- 2026-10-01: Choice cards: 2–3 random cards a day between 11:45 and 20:30, plus Adrian's text at 12:00 (on days he's away) and Pan Cytrynówka's round at 19:30 (Fridays), never more than 3 in a day. Each card comes at most once a day. Cards use their own random generator, so they never change who comes in. The simulator answers every card with the second ("no") answer, like a player who only watches.
- 2026-10-01: New choice card, "A very merry group": four tipsy tourists want only cytrynówka shots. Saying yes earns a 500 zł tip, makes guests waiting for food less happy (−10), and keeps new guests away for the 45 minutes they stay (guests who booked still come in). Saying no changes nothing.
- 2026-10-01: New choice card, "A Brazilian couple": honeymooners ask for a free dessert (only with a dessert on the menu). Yes: a 50 zł tip and a five-star review in the day report (it counts for Mewa's goals). No: nothing happens. The merry group gets a 🥃 bubble.
- 2026-10-01: The terrace is drawn as soon as the permit is bought (tables, chairs and planters), even before it opens in May or on rainy days; guests only sit there on days it is open.
- 2026-10-01: The restaurant view sits in an Old Town street instead of a dark background: cobbles in front, pavements, rows of gabled townhouses behind and beside it, and the Town Hall's green spire over the roofs. It follows the weather and dusk (lit windows in the evening), and fills the whole frame. The terrace flower boxes are separate pieces, so they no longer cover the terrace tables.
- 2026-10-01: Choice cards are more random: 1–4 a day at random times (at least 45 minutes apart) instead of always 2–3 spread evenly. Cards seen in the last 3 days are a quarter as likely to come again; the save remembers the last day each card came up (save version 8, upgraded automatically).
- 2026-10-01: Eleven new cards: the proposal, Sanepid, Nonna Rosa's basil, a Lechia Gdańsk footballer, half-price herring, Babcia's secret, dine and dash, a tram strike, a blackout, a sea shanty choir, and Lech Wałęsa. Wałęsa (white walrus moustache) and three bodyguards (black suits, sunglasses, earpieces) take a table for 3 hours (until closing at the latest), tip 2,500 zł and keep everyone else out, except Pan Cytrynówka, whom everybody knows; when they leave, reputation with locals and families is multiplied by 1.1. He comes at most once every 4 weeks.
- 2026-10-01: Simulator, 10 seasons each, a player who says "no" to every card compared with no cards at all: balanced 367k → 318k zł and wins the Neptune 9/10 instead of 10/10; quality focus goes bust 2/10 instead of 1/10; do nothing 4/10 instead of 2/10. Ignoring the cards costs a little, like doing nothing should. The blackout's "wait" answer was softened from 15 to 10 kitchen minutes after it bankrupted a balanced season in testing. `NO_CARDS=1 npm run simulate` plays without cards.
- 2026-10-01: Accepted from section 9.1.1: A1–A3 (sun and moon, clouds, rain), B1–B3 (raised floor, low cut-away walls, przedproże terrace), C1–C2 (street furniture, people passing by) and D (guests come in from the street), plus the lost-guests fix from section 13. A4 (gulls), B4 (neighbouring houses on both sides) and C3 (attracting passers-by) wait for later. New milestone M5c, built in this order.
- 2026-10-01: Lost guests fixed. Up to 2 parties wait at the door for a table (at most 10 minutes); once every table is taken and the queue is full, the restaurant looks 6 points less tempting (balance.choice.fullPenalty), and people walking by see the latest state after each party sits down. Because guests now go next door when a rival is full, the Old Town got busier, so "somewhere else" went from 7 to 7.5 to keep doing nothing a losing plan. Simulator, 3 seasons, before → after: do nothing 13,852 zł (1/3 bust) → 30,119 zł (0/3; still loses money from 40,000); cheap and fast −98,264 → −69,521 zł (3/3 bust both); quality focus 12,865 → 20,263 zł (1/3 bust both); balanced 313,537 zł, Neptune 3/3 → 284,650 zł, 2/3 (over 5 seasons: 329,417 zł, 4/5). Balanced's lost guests over a season: 278,256 → 32,328, against about 35,000 served. On a busy June day in the test save: 179 turned away against 138 served before, 56–100 against 100–190 after.
- 2026-10-01: The restaurant is drawn as a building: its floor stands 6 units above the street on a granite plinth; the front and side walls are cut away at knee height (ochre plaster, wooden top rail), with the front door's opening on the street side; the terrace is a przedproże of sandstone slabs with a carved stone balustrade and two steps down to the street in front of the door. Guests walk along the street from either side, climb the steps and come in through the front door; parties waiting for a table stand by the door. The arched door on the back wall stays as the back door.
- 2026-10-01: Weather in the sky: the street is drawn in layers (sky, then drifting clouds, then houses and street), so clouds pass behind the roofs and the spire. A sun on sunny days (bigger with a warm halo in a heatwave), the moon and stars after 19:30; clouds by weather (1 in a heatwave, 3 small white when sunny, 7 grey when cloudy, 8 dark in rain), drifting slowly with CSS; in rain, falling streaks over the whole scene (one tile moved with a CSS transform), darker wet cobbles and puddles.
- 2026-10-01: Street life: cast-iron lamp posts (lit after 19:30), benches, linden trees in iron grates, flower tubs and an A-frame chalkboard at the foot of the steps, on the pavements and the open cobbles beside the restaurant, never in front of the room or on anyone's way (checked by a test). Up to 8 people pass by at once while the day runs, in their group colours and by time of day (office workers and tourists at lunch, students and foodies in the evening), walking down the left pavement, past the steps and up the side street on the right. Purely for show; attracting them is for later (C3). Walking is a little faster (90 instead of 60 units a second) and guests set off closer to the steps, so the longer way in through the front door doesn't make them arrive late.
- 2026-10-01: Tapping a waiting table (its ⏳ or 😤 bubble glows amber) opens a small panel. Free drink: 6 zł per guest, 15 more minutes of patience and +3 happiness, once per party. Chef's apology: their order is cooked next and +5 happiness, once per party and 3 times a day. Both are counted in the day report; the drinks' cost is in "Cards and free drinks". Mewa explains it on the second day. The simulator is unchanged (a player who only watches never taps).
- 2026-10-01: Gulls: on days the terrace is open, 1–3 gulls (between 12:00 and 20:30) land on a terrace table that is eating, drawn twice as big inside a red ring, with a banner "A gull is eyeing a plate! Tap it!". While one is about, the clock runs at 1× at most. Tapped within 6 ticks (30 in-game minutes): it flies off and that group's reputation +0.3; too late: it steals the plate, reputation −0.3 and the table writes a funny 2–3 star review. Counted in the day report. Gulls use their own random generator. A first try with ±1 reputation made a passive balanced season go bust; with ±0.3, over 10 seasons a player who never shoos them still ends balanced at 361k zł and wins the Neptune 8/10.
- 2026-10-01: The terrace season starts in April instead of May, so a terrace can be open from the first day; the permit is still bought (3,000 zł). A free permit at the start was tried and rejected: in the simulator it made doing nothing earn 157k zł and kept "cheap and fast" from going bust. With the April start, only strategies that buy the permit change (balanced, 3 seasons: 391,423 → 424,002 zł; the others are unchanged).
- 2026-10-01: Live happy hour: the Marketing tab's daily 15:00–18:00 switch is replaced by a 🍹 "Start happy hour" button on the day screen. Once a day, from the moment it's tapped, for 60 minutes: 20% off everything and +1 appeal from the board outside. It glows amber while on, and the day report says when it ran. Mewa explains it on the third day. Save version 9 drops the old setting. Simulator: only "cheap and fast" used the old switch (now it taps the button at 15:00): −69,521 → −70,884 zł, still bust 3/3; the others are unchanged.
- 2026-10-01: Seat guests yourself, as built: "show guests to a better table". Changed from the first idea (groups waiting at the door for the player) because at 1× five in-game minutes pass in under half a second, so a group's whole wait for its food is only about 1.5 seconds; holding everyone at the door would have made all guests wait longer, and players who only watch would have been worse off. Now guests are seated automatically as before, and the player can move a party (one table, once, before its food arrives) to a free table. Favourite spots (data/groups.ts): tourists the terrace or the window wall, foodies the window wall, locals the back row by the stove, office workers and students the front row by the door; the "window wall" is the column of tables along the wall with the window. A move to a favourite spot adds +6 happiness (balance.seating.favouriteMood). Parties of more than four (two tables) and special guests can't be moved.
- 2026-10-01: Looking after a table is one tap on the table itself (a 52 px target in the middle of it), for any party still waiting for food, even while they are still walking in; pausing first gives all the time needed. The panel offers 🪑 Move them, 🥤 Free drink and 👨‍🍳 Chef's apology, and says what the group likes. Free tables then show ⭐ (a favourite spot) or 🪑; the party walks from its old seat via the front door area to the new one. The day report counts moves and favourite spots. The room's table grid (3 or 4 columns) now comes from the simulation (sim/seating.ts), so the spots match what is drawn. Mewa's day-two tip explains it. The simulator is unchanged (a player who only watches never moves anyone).
- 2026-10-01: M5b "Interactive service" is complete: choice cards, looking after a table (free drink, chef's apology, a better table), gulls, the live happy hour, and seating guests at their favourite spots.
- 2026-10-01: New milestone M7 "Shape and polish" (section 6.14), from playtest feedback: a slower day (×2), a season of about 40 days ending with St. Dominic's Fair, the tabs usable during the day, more and more varied choice cards, a pixel-art background for the planning screens (concept art first), streets that look more like real Gdańsk (ul. Długa), and more to do over a season. M6 (gift day) stays the last milestone.
- 2026-10-01: Personal touch: a Portuguese exchange student (choice card) unlocks cabrito assado and azulejo tiles.
- 2026-10-01: Ideas for longer play accepted: named regulars with stories, staff growth, seasonal ingredients and specials, replying to reviews, attracting passers-by, bigger premises, a sticker album, Mewa's finds. Left out: hosted events, an autumn and Christmas-market season, a cook-off against the rivals, postcards.
- 2026-10-01: A day takes 100 seconds at 1× (was 50). The simulation is unchanged (only how fast real time runs); people passing by set off twice as often per five-minute step, so the street stays as busy.
- 2026-10-01: The season is six weeks: Monday 8 July to Sunday 18 August (42 days), ending with St. Dominic's Fair (27 July – 18 August). The Amber evening on Mariacka moves to Saturday 20 July; Mewa finds the secret recipe by week 2 at the latest (day 7). Easter, Majówka, Juwenalia and Corpus Christi stay in the data but only come round in free play.
- 2026-10-01: Rebalancing for six weeks (simulator, before = the same rules over six weeks without changes, 3 seasons): do nothing ended at 53,801 zł from 40,000 (earning money), cheap and fast at 10,199 zł (not bust), balanced at 90,538 zł with the Neptune 0/3. Changes: weekly utilities 1,400 → 4,200 zł; reputation moves faster (smoothing 0.02 → 0.035) so six weeks matter; "somewhere else" 7.5 → 7.8; the simulator's balanced player buys tables sooner and moves to Długa at 45,000 zł (was 80,000). After, over 10 seasons: do nothing 31,256 zł (loses money, never bust), cheap and fast bust 10/10 in week 4, quality focus 10,017 zł, balanced 46,826 zł and profitable from week 2, but behind Bar Błyskawica in the Golden Neptune (38.6 against 44.2; rating 51.2 against 54.8, Fair share 19.6% against 28.3%), only just behind Karczma (39.0). Tried and dropped: higher starting cash (the simulated player then moved to Długa on day one and went bust), a stronger start for the player (made doing nothing profitable), a smaller Bar Błyskawica (its rating rose). The simulator now prints each restaurant's Neptune rating and Fair share, and can play an "interactive" player (yes to cards, shooing gulls, free drinks). Open question for the player: how hard should the Golden Neptune be in a six-week season?
- 2026-10-01: Guests who booked (the Friday regular, a food critic, a tour bus, a wedding party) go to the front of the queue at the door and wait four times as long (balance.service.bookedWaitFactor), so a full July lunch no longer turns away a booked food critic.
- 2026-10-01: The Golden Neptune's difficulty in the six-week season stays as it is for now and is judged in the tablet playtest (M5): the simulated balanced player comes second, but it uses none of the interactive tools or the secret recipe. If it feels out of reach in play, make it easier then.
- 2026-10-01: The tabs during the day: a 📋 Manage button on the day screen opens Today, Menu, Kitchen, Interior, Staff, Marketing, Map and Mewa over the day, with the clock paused; "Back to the restaurant" brings back the speed it had. The menu, prices, the lunch set and the supplier change today's kitchen straight away; purchases (tables, decor, equipment, the terrace permit), campaigns and new staff are paid at once and arrive the next morning; moving street, the difficulty and starting over stay for before opening (the Restaurant and Settings tabs are hidden during the day). At closing, the restaurant keeps anything bought during the day plus the day's reputation and awareness; wages are for the team that worked that morning, so someone hired at lunchtime starts tomorrow.
- 2026-10-01: Saves from the 20-week calendar keep their day number, so most of them now fall after 18 August (free play). Test with a new game.
- 2026-10-01: Choice cards: each card has a rarity (common 4, uncommon 2, rare 1, very rare 0.3 in balance.moments.rarityWeights; Wałęsa is very rare and still rests four weeks). Cards come from a shuffled deck: a card that came up waits until 80% of the random cards have had their turn (balance.moments.deckRefill), then the deck is shuffled again; only when no fresh card fits the moment can an older one come round. This replaces "less likely for three days". New calendar and weather cards: the sea shanty choir only in the tall ships week, "A scorcher on Długa" in a heatwave, "A Baltic storm" on rainy days, "A stall at the Fair" during St. Dominic's Fair. Follow-ups: the blogger's post brings 40% more foodies and 20% more students the next day (with a line in the morning news); the proposal couple come back seven days later for an engagement dinner (a new follow-up-only card: eight guests, a five-star review). Save version 10 keeps the deck and what's coming up.
- 2026-10-01: Simulator after the deck, 10 seasons, a player who refuses every card: do nothing 31,336 zł, cheap and fast bust 10/10 (week 4), quality focus 10,912 zł, balanced 39,550 zł (was 46,826) with 1 bust in 10 (week 4, right after moving to Długa with little money left), Neptune 37.8 against 44.3. With the deck, every card comes round, including those where saying no costs something, so ignoring them costs a bit more.
- 2026-10-01: Fifteen new cards. The Portuguese corner: "A taste of Portugal", Ana, an Erasmus student from Coimbra, comes on day 8 (Tuesday 16 July) for certain, not at random; saying yes (the kitchen pauses 15 minutes for her lesson) unlocks cabrito assado (a main for the stove, roast kid goat with roast potatoes or oven rice, 🇵🇹 in the dish creator) and azulejo tiles from Coimbra (decor, 2,500 zł, +10 ambiance, a new "Portuguese corner" style loved by tourists and foodies; drawn as a blue-and-white tiled band along the walls) from the next morning, with a line in the news; saying no brings her back three days later. Fourteen with a Gdańsk flavour: Baltic amber on the counter, a film crew on Długa (800 zł, the door closed to walk-ins for an hour, 🎬), the way to Westerplatte, a Lechia–Arka derby night (evenings), wedding photos at the door, Kashubian napkins, no ferry to Hel (eight day-trippers), a TikToker (a gamble), a pierogi-eating contest, a delivery app (more office workers and students for three days), a forgotten phone (a five-star review), a fluffy dog, a coin for Neptune's fountain, gold letters above the door. Unlocked dishes and decor are kept in the save (version 11). Simulator, 10 seasons, refusing every card: do nothing 29,839 zł, cheap and fast bust 10/10, quality focus 10,928 zł, balanced 44,015 zł (2 busts in 10, week 6), Neptune 38.3 against 44.1.
- 2026-10-01: Concept art for the planning-screen background, as full-screen mock-ups at the tablet's size in art/concepts/ (drawn by scripts/pixel/backgrounds.ts): A, a riverside strip of Długie Pobrzeże with the Żuraw and boats under a shorter card; B, the card as a sheet of paper on a wooden desk with a coffee cup, a pencil, receipts, basil and Mewa; C, the top bar as a banner of Długa's gabled houses and the Town Hall spire; D, concept A on a Fair evening (stalls, lanterns, the moon), to show how a background can follow the season and the time of day. The planning card covers almost the whole 1280×800 screen, so A, C and D take some height from it (A and D about 80 pixels, C about 100); B keeps the layout as it is. Waiting for a choice.
- 2026-10-01: Background concepts, second version (feedback: "too simple, needs more detail, more pixel art but higher resolution"): drawn at 640×400 art pixels (twice the detail of the first round), with Gdańsk facades (curved Dutch scroll gables with urns, stepped and attic gables, window surrounds with pediments, cornices, shop awnings and arcades, three shades per colour), the Town Hall with its clock and tiered golden spire, the Żuraw in brick and timber, a tall ship, people and double lanterns on the quay, the Motława reflecting the houses, layered clouds and dithered skies. Each concept comes alone and with the interface placeholder (…-with-ui.png).
- 2026-10-01: Performance on the tablet checked with ?perf: smooth, no problems found (M5 and M7 items ticked).
- 2026-10-01: The day is 30 seconds slower again, 130 seconds at 1× (tapping waiting tables was still too rushed). The simulation is unchanged.
- 2026-10-01: The queue at the door stands on the street in a line beside the steps (with a terrace it used to stand on the przedproże), the first in line shows ⏳, and a party that gives up walks off down the street, cross (😠), instead of vanishing.
- 2026-10-01: Planned (M7): the numbers at the top of the day screen (guests served, takings, walked out, no free table) open into lists when tapped.
- 2026-10-01: Background chosen: A and D both. The planning screen shows the riverside by day (concept A), with the sky by the weather (blue, grey when cloudy, darker in rain, warm in a heatwave); the day report, the Golden Neptune ceremony and the game-over screen show it in the evening (concept D), with lit windows, lanterns and a dusk sky; during St. Dominic's Fair both get the striped stalls and strings of lights on the quay. Drawn by the game (src/ui/pixel/panorama.ts) as a strip along the bottom, 640×164 art pixels shown twice as big; the sky is a CSS gradient behind it. The card leaves the bottom 16% of the screen width free, so the houses, the quay and the river show beneath it.
- 2026-10-01: Fix for landscape on the tablet (menus unreadably small): the browser lays the page out at about 960×600 CSS pixels on the tablet, not 1280×800, and the new panorama space (16% of the width) plus wrapping tabs left the menu about 120 pixels of height. Now the panorama's space follows the screen's height (min(16vw, 15vh), 11vh on short screens); the tabs stay on one row (scrolling sideways if they must, tighter under 900 pixels); short screens (up to 720 pixels high) get a slimmer top bar and less padding; side-by-side panels sit one above the other under 1100 pixels wide (except the map). Checked at 853×533, 960×600 and 1280×800. The ?perf meter now also shows the size the browser lays the page out at.
- 2026-10-01: 1364×603 CSS pixels (the size the tablet reports in landscape) is now the reference size for checking screens; CLAUDE.md says so. Checked every planning tab, the day screen with a card and the numbers lists, and the evening report there: all readable. The Settings text for a new game now gives the season's real first day (8 July) instead of 1 April.
- 2026-10-02: Gdańsk streets, first part (M7): the houses around the restaurant are now drawn as flat Długa-style fronts (src/ui/pixel/townhouse.ts) laid onto the slanted street rows: 2–4 windows across, facades in pink, mint, ochre, cream, white, pale blue and brick red (neighbours never share a colour), white cornices between the floors (grey stone trim on white houses), framed windows with a transom, sills and little pediments (triangle, arch or flat; arched on the top floor), a shop window and door or an arcade on the ground floor, and a gable: Dutch scrolls with stone urns and a gilded finial, steps, a point with an iron finial, or an attic balustrade with urns. Lit windows after dusk are chosen per window. Pavements are light flecked granite slabs everywhere; ul. Długa is granite all the way across, the other streets keep cobbles in the middle.
- 2026-10-02: Gdańsk streets, second part (M7): house fronts get striped awnings (red, beige, green, navy) or painted shop signs with gilded letters, flower boxes on the first-floor sills, and here and there Gdańsk's flag (crown and two white crosses on red) hanging from the top floor. The Town Hall tower has stone bands, tall windows, a blue clock face with gold hands, a white gallery with gold pinnacles, and a spire of green copper and gold tiers up to the gilded king. On the street: black double-headed lanterns instead of single lamps, café tables under square umbrellas (cream and red) on the pavements, city bikes with baskets, pigeons pecking (a small CSS bob), an amber stall with its seller, and an accordion player swaying on the little square. Each street thing has a reach, and a test keeps every guest and passer-by route clear of it.
- 2026-10-02: Gdańsk streets, third part (M7): each street has its own look (src/ui/pixel/streetStyle.ts for paving, landmark, river and houses; STREET_PLANS in room.ts for what stands on it). ul. Ogarna: quiet, plainer houses with flowers, trees and benches, a ginger cat, the Town Hall behind. ul. Piwna: beer-barrel tables with stools outside the pubs, a musician, St. Mary's Basilica behind (the flat-topped brick tower with blind niches, corner turrets and a copper lantern, and the nave's steep roof). ul. Mariacka: ornate scroll and stepped gables, przedproża (raised stone terraces with balustrades, flowers and a gargoyle) on both pavements, the amber stall, St. Mary's. ul. Długa: granite all the way across, cafés on both pavements, awnings and flags, the Neptune Fountain (basin, gilded railing, bronze Neptune with his golden trident) on the square, the Town Hall. Długie Pobrzeże: the Motława in front, with a stone quay, bollards (a gull on one), two motorboats and the tourist galleon bobbing, riverside cafés, and the Żuraw over the roofs (two brick towers under the wide timber crane house). Wyspa Spichrzów: smooth concrete slabs, brick granaries (stepped gables, small windows with green shutters, loading doors up the middle, the hoist beam) among the townhouses, a café and rows of bikes.
- 2026-10-02: Playtest fix: the yellow notes over the restaurant can be closed with a ✕, and the gull warning no longer stays up as long as the gull does: it shows for 5 seconds (the gull itself stays tappable). The other notes (the card's result, the gull's outcome, where guests were seated) already fade by themselves and now have the ✕ too.
- 2026-10-02: Playtest request: "Have a look" on the map. Every street's card on the Map tab has a button that opens the restaurant on that street, drawn like the Restaurant tab, over the screen with a ✕ to close: your own restaurant on your street, the rival's restaurant on a rival's street (their tables, terrace in season, kitchen and staff), and on an empty street your restaurant as it would be after moving there (tables that fit, the decor that comes along). Works before opening and during the day. The logic is in src/sim/preview.ts (reads the game, changes nothing).
- 2026-10-02: Playtest fix: the note at the top of the tabs during the day ("The restaurant waits while you're here...") has a ✕ and stays closed until you go back to the restaurant.
- 2026-10-02: Playtest request: the Settings tab is there during the day too. Sound and "Make a save code" (it holds the game as it was that morning) work as usual; the difficulty, starting a new game and loading a save code can only change before opening, so during the day they're greyed out or replaced by a short note saying so. Same on the Map: during the day "Move here" is greyed out with "You can move before opening, in the morning" instead of doing nothing.
- 2026-10-01: Short screens (up to 720 pixels high, e.g. a tablet at 1364×603): Mewa's tips sit on one line with their buttons beside the text, so the tab's content starts higher.
- 2026-10-01: The day's numbers open into lists: each of Guests served, Takings, Walked out and No free table is a button that opens a live list over the restaurant (groups with their colours and a bar; takings per dish with portions, best sellers first; for walk-outs and no free table, a hint on what helps). Counted by dayBreakdown() in the simulation.
- 2026-10-01: The short notes at the top of the restaurant view (a card's result, a gull, a guest moved, paused) stack one under the other instead of covering each other.
- 2026-10-02: Playtest fix: the cards were still repetitive. Measured with `npx tsx scripts/cards.ts [seasons]` (plays whole seasons and counts every card): nine everyday cards came every 5–6 days, a card came back the very next day 109 times in 10 seasons, and the walk-in cards almost never came. Two causes: the deck was only shuffled again once 80% of all cards had come up, which rarely happened because many cards need rain, the Fair and so on, so once every card that fitted had been drawn it fell back to plain luck by rarity; and walk-in cards needed a free table, while the room is usually full. Now each card rests for 8 days after it comes up (balance.moments.restDays); among the rested cards that fit, rarity decides; if every card that fits is still resting, the one seen longest ago comes back early. Walk-in cards (the tour group, the Hel ferry, derby night, the tram strike, the pierogi contest, the Baltic storm, Nonna's basil, the engagement dinner) only need the door open: with every table taken, the guests wait at the front of the queue, like guests who booked. Special visitors (the merry group, the footballer, the film crew, Wałęsa) still need a free table. Save version 12 drops the deck. After, over 10 seasons: no card the very next day, everyday cards about every 9 days, the walk-in cards 2–5 times a season. Pan Cytrynówka's round stays every Friday at 19:30. Simulator, 10 seasons, before → after: do nothing 29,839 → 31,502 zł; cheap and fast bust 10/10 both; quality focus 10,928 → 10,646 zł; balanced 44,015 zł (2 busts) → 49,713 zł (0 busts), Neptune 38.3 → 40.5 against Bar Błyskawica's 44.0.
- 2026-10-02: Tablet performance checked again by the player: still smooth, no problems (both performance items in section 12 stay ticked).
- 2026-10-02: Named regulars with stories (M7). Four regulars, one for each free weekday next to Pan Cytrynówka's Friday (data/regulars.ts): Marek, an office worker making an app on Granary Island (Thursdays 12:30 from 11 July, wishes for the lunch set); Mr Fletcher from Manchester, a tourist whose long weekend keeps getting longer (Saturdays 13:00 from 13 July, pierogi); Pan Zbigniew, a retired shipyard crane operator (Tuesdays 13:00 from 16 July, a soup); Ola, an art student from the Academy in the Great Armoury (Wednesdays 18:30 from 17 July, a main at most 34 zł). They book like the Friday regular (front of the queue at the door when the room is full, but not squeezed in at the bar), arrive alone, and feel at home (+5 happiness). The morning of their first visit, the news says who has booked, with a hint of their wish. Each visit where they eat tells the next part of their story in the day report (four parts, then an ending); a visit is happy when their wish came true and they were at least 60 happy, worth +1 reputation with their group. With 3 or more happy visits by the ending they become friends of the house (+3 reputation, +10 awareness with their group); otherwise a kind, polite ending. After that they keep coming, with a little moment each week. Missing them (no table, or no food in time) keeps the story for next week. All numbers in balance.regulars. Each has their own pixel look (Marek: grey hoodie, steel glasses, lanyard; Mr Fletcher: sunburn, khaki bucket hat, red shirt, camera; Pan Zbigniew: white hair, navy cap and jumper, white moustache; Ola: pink bob, mustard top, sketchbook, paint on her trousers) and a bubble until their food comes (💻 📖 ⚓ ✏️). A help book entry explains them. Save version 13. Simulator, 10 seasons, before → after: do nothing 31,502 → 30,252 zł; cheap and fast bust 10/10 both; quality focus 10,646 → 11,940 zł; balanced 49,713 → 44,736 zł (no busts, profitable from week 2; Neptune 40.5 → 38.3, within the usual spread between runs). In the simulator, whose players never add a lunch set or a cheap main, Mr Fletcher and Pan Zbigniew mostly have happy visits and often end as friends; Marek and Ola only do if the player offers what they wish for.
- 2026-10-02: Staff growth is split into three roadmap steps (morale and days off; training and raises; storylines), built one at a time.
- 2026-10-02: Staff growth, first step: morale and days off. Everyone has morale from 0 to 100 (starting at 80, also for new hires). Each day worked costs 1.5 (Cheerful people 1); a day off, or a day in bed, gives back 15. From 70 they're in good spirits (it only shows); below 40 they're tired and work half a level slower; below 15 they're worn out, and each morning there's an even chance they stay in bed, but only if someone else can do their job (the only chef always comes in). Days off are given in the Staff tab: today while planning, tomorrow during the day (tap again to take it back); they're paid, and the last chef or the last waiter can't have one ("Someone has to cook"). The Staff tab shows a morale bar and mood for everyone on the team; the day report says who had the day off and when someone is getting tired or worn out; Mewa explains it on day 5 (Friday 12 July), and the help book has an entry. All numbers in balance.staff.morale. Save version 14 gives everyone 80. The simulator's balanced and quality focus players give a day off (Monday to Thursday) to anyone below 55 who can be covered. A first try (2 a day, tired = a level lower in skill and speed, sick even as the only chef, balanced resting everyone weekly) made quality focus go bust 10/10 and balanced 5/10, so it was softened. Simulator, 10 seasons, before → after: do nothing 30,252 → 25,394 zł (loses more); cheap and fast bust 10/10 both; quality focus 11,940 zł (0 busts, lowest 3,550 zł) → 7,080 zł (4 busts in 10, week 6: it runs the season on one chef who gets tired and never hires a second); balanced 44,736 zł (0 busts) → 40,653 zł (1 bust in 10), profitable from week 2, Neptune 38.3 → 37.8.
- 2026-10-02: Staff growth, second step: training and raises. In the Staff tab, each team member can be booked on a one-day course for skill or speed (chefs: a cooking course, or a kitchen rush workshop; waiters: a service and wine course, or a fast floor workshop): today while planning, tomorrow during the day, paid when booked (1,000 zł for each level reached, so 3 → 4 costs 4,000 zł; balance.staff.training), and cancelled with the money back by tapping again. One course at a time, never on a day off, and the last chef or waiter can't go. On the day they're away (and paid); that evening they come back a level better and a little happier (+5), and the day report says so, with their new fair wage. A fair wage is what the usual rate pays for their skill and speed; anyone paid less tires faster (1.5 more a day worked) until the player taps "Raise to …", which pays the fair wage from tomorrow and cheers them up (+10). Tomek's low wage is his own idea, so he is never underpaid. Mewa explains it on day 9 (Wednesday 17 July); the help book has an entry. No save change needed (the course is a new optional field). The simulator's players don't train, so its results are exactly the same as after the first step.
- 2026-10-02: Playtest request, accepted: faces for the team. Each card in the Staff tab shows the person's pixel portrait in the restaurant's chibi style, with their own hair colour, and a face that shows their mood. New M7 roadmap item after the team storylines.
- 2026-10-02: Staff faces built. Every card in the Staff tab (the team and the people looking for work) shows a pixel portrait, head and shoulders, three times as big: the same sprite as in the restaurant. Each chef and waiter has one of six hair colours, picked by their employee number, both on the card and in the restaurant (Pani Krystyna is silver-haired under her chef's hat; Kacper is blond). On the team, the face shows the mood: a big smile in good spirits, heavy eyelids when tired, and a drop of sweat when worn out. New looks, at the player's request, replacing the ones from 2026-10-01: Tomek is bald (with a shine on his head), with happy squinting eyes and a big smile, always (his face doesn't change with his mood), and still the kompot stain; Adrian has spiky blond hair, a longer face (a high forehead and a narrower chin) and rabbit front teeth in a grin, and no longer wears sunglasses. Only the pictures change; the simulator's results are exactly the same.
- 2026-10-02: Staff growth, third step: short storylines for the team (data/teamStories.ts), in the morning news and the day report, counted from the day someone joined. Pani Krystyna: her rolling pin (day 6); on Saturday 20 July she would love Sunday off, as she has made pierogi for her family every Sunday since 1979: with it she comes back with a tin of pierogi (+15 her, +5 the team), without it she sighs (−10); her granddaughter starts cooking school (day 34). Kacper: a tour group's reading list (day 2); his philosophy exam on Thursday 25 July, announced on the Tuesday: with the day off he passes with a 5 and brings cake (+15, team +3), without it he scrapes a 3 (−5); his thesis on the ethics of soup (day 30). Tomek: the barber (2 days after joining); he asks for a course (day 5), and once a skill course makes him better than he started, his mishaps stop for good. Adrian: "When I'm happy at work, I jump out of bed" (day 2): while he's in good spirits, his chance of not turning up halves (personal.ts); his band plays on Długa (day 10). Anyone else who has been on the team a week can have a small moment (a 15% chance each morning; balance.staff.teamMoments): a birthday cake (80 zł, team +5), pączki, a Kashubian song, a kitten named Mewa, a visit from mum, a sunrise walk. A cook-off entry for Pani Krystyna was considered and left out, as the cook-off against the rivals is out of scope. Save version 15 records when everyone joined and who the starter team are. Simulator, 10 seasons, before → after: do nothing 25,394 → 29,249 zł (the small moments cheer up a team that never rests; still loses money); cheap and fast bust 10/10 both; quality focus 7,080 zł (4 busts) → 8,155 zł (2 busts); balanced 40,653 zł (1 bust) → 37,949 zł (2 busts in 10, week 5), profitable from week 2, Neptune 37.8 → 37.2.
- 2026-10-02: Three regulars renamed, because their names clashed with the rival owners (Pan Zbigniew of Karczma pod Żurawiem; Kuba and Ola of Spichlerz Bistro) and with the job candidates' first names: Marek is now Filip, Pan Zbigniew is Pan Henryk, and Ola is Weronika. Their stories and looks are unchanged; save version 16 carries stories in progress over to the new names.
- 2026-10-02: Seasonal ingredients and "Dziś polecamy" (M7). Fresh produce is a kind of extra in the dish creator, with a season (dishes.ts): Kashubian strawberries until 20 July (they already existed and now have a season), new potatoes (młode ziemniaki) until 31 July, blueberries (jagody) in July and August, chanterelles (kurki) from July to September, plums (węgierki) from 15 August, for the Fair. In season, a dish with any of them is 6 quality points better; out of season they're imported at twice the price, with no bonus (balance.seasonal). New pairings: new potatoes and dill, chanterelles and sour cream, blueberries and sour cream, plums on schabowy. The dish creator says "🌱 fresh until …" or "imported, dearer" on each, the menu says which dishes are fresh, and the morning news says when something comes into season or goes out of it. Today's special: a ☆ next to every dish on the Menu tab puts it on the board outside (one at a time; tap again to take it off; changes straight away, also during the day). Guests order the special twice as often as they otherwise would, and the board makes the restaurant a little more tempting to people walking by (+0.25), more with something fresh in season on it (+0.75 in all; balance.specials). The Today tab, the day screen and the day report's best sellers show it. Mewa explains it on day 6 (Sunday 14 July); the help book has an entry. A first try with +0.4/+1.0 made a plain special worth about 5,500 zł a season to the simulated balanced player (5 seasons), too much for a free tap, so it was halved; then a special's effect was within the spread between runs (balanced, 8 seasons: no special 38,386 zł, a special 36,732 zł). The simulator's players use neither, so its results are unchanged.
- 2026-10-02: Playtest request: the day screen has the same riverside background as the planning screens and the Manage tabs (concept A by day, following the weather; concept D's evening from 19:30, when the street lamps light; the Fair's stalls during the Fair), instead of plain cream. It is only a background here: the card keeps its full size (the restaurant view isn't made smaller to show the river), and the sky and houses show around it; checked at 1364×603 and 853×533. Dusk is one shared time (DUSK_MINUTE) for the street and the background.
- 2026-10-02: Replying to reviews (M7). In the day report, an unhappy review (fewer than 3 stars, balance.reviews.replyBelowStars) from a guest whose group is known has a "Reply…" button with three answers (data/reviews.ts): thank them kindly (free, +0.5 reputation with their group), invite them back with dessert on the house (40 zł, +1.5), or stand your ground ("Our food is perfect, actually": −1). Each gives a short, funny account of how the guest took it, the same every time for the same review. One reply per review; the game is saved again straight after. Reviews now remember the guest's group (gull reviews too), and the report shows the critic first, then reviews that can be answered, then the rest (still four at most). The effects are small on purpose: about 1.5 one- or two-star reviews a day for the simulated balanced player, and reputation follows how happy guests are, so a reply is a nudge. Mewa explains it on day 3's report; the help book has an entry. The simulator's players never reply, so its results are unchanged.
- 2026-10-02: Playtest fix: "the same cards keep appearing" (the 1920s film crew, again). Measured with `npx tsx scripts/cards.ts [seasons] [strategy] [yes|no]`, which now plays any of the simulator's players and shows each card's shortest gap: no card came back within 8 days, but every card, one-off events included, came 3–5 times a season, and a player who said no to Ana saw her every 3 days, forever. Changes: (1) fourteen one-off events come up only once a game (`once` in data/moments.ts): the film crew, gold letters, the delivery app, the pierogi contest, Babcia's secret, the Kashubian napkins, the TikToker, the Brazilian honeymooners, the proposal, the Fair stall, derby night, the footballer, the shanty choir and the tram strike; (2) everyday cards rest 14 days instead of 8 (balance.moments.restDays; Wałęsa keeps his own four weeks); (3) when every card that fits is resting, none comes then (it tries again a little later), instead of one coming back early; (4) Ana comes back after a "no" only once (`onlyOnce` on the follow-up); her "no" no longer promises she'll be back. Cards now come about 1.7 times a day instead of 2.6, each everyday card about twice or three times a season; more cards to write would bring the number back up. Simulator, 10 seasons, before → after (players who say no to every card): do nothing 29,249 → 30,659 zł; cheap and fast bust 10/10 both; quality focus 8,155 zł (2 busts) → 8,836 zł (1); balanced 37,949 zł (2 busts) → 43,548 zł (1), profitable from week 2.
- 2026-10-02: Playtest request: "Dziś polecamy" no longer shows on the day screen while the restaurant is open; it's chosen and shown on the Menu tab (and listed on the Today tab).
- 2026-10-02: Playtest fix: the gull warning ("A gull is eyeing a plate on the terrace! Tap it!") is text only, without the bird (as are the notes after a gull is shooed or steals a plate, which keep their green or red edge), and sits higher: the short notes over the restaurant now start across the scene's top edge, over the progress bar, and are a little slimmer, so they hide the sky rather than the room. Checked at 1364×603 and 853×533.
- 2026-10-02: Playtest fix: waiters waiting by the kitchen were hidden behind the first row's chairs. They now wait further back, in a row along the back of the room next to the kitchen (10 apart instead of 12), behind every table; a test checks that no chair hides any of them, in every room size. The communal table moves to the back corner by the window (in front of the tiled stove, if there is one) to leave them room, and waiters going to serve step into the gap in front of it before walking along to their aisle, so they never walk through it.
- 2026-10-02: Attracting passers-by, first part: flyers (sim/flyers.ts). While the restaurant is open, the player can tap someone walking past to hand them a flyer, six a day (balance.flyers). Everyone who takes one has heard of the place (+0.5 awareness with their group); some come in: a 30% chance, plus up to 30% more with their group's reputation. Someone coming in turns with a 😊, walks round the corner of the building to the foot of the steps (never through it, nor through the benches and trees: tested), and there their party, of their group's usual size, comes in like any guest (or joins the queue if every table is taken); someone not coming in waves (👋) and walks on. The legend under the restaurant says how many flyers are left; the day report counts them and the guests they brought in. Flyers use their own random generator, so they never change who else comes in; the simulator's players don't hand any out, so its results are unchanged. Mewa explains it on day 3; the help book has an entry. The item is split in two: a waiter offering samples at the door comes next. A better menu board, the third idea for the item, is already there as the board outside with today's special (Dziś polecamy).
- 2026-10-02: Playtest request: every pop-up can be closed with an ✕. Who didn't turn up today (Adrian's excuses, someone worn out in bed) is now a short note over the restaurant, text only, that closes itself after 15 seconds (instead of a line above the progress bar all day). "Paused" has an ✕ (it comes back with the next pause); the "Choose a table" panel's Cancel became an ✕; Mewa's tips have an ✕ next to "Got it"; and choice cards have an ✕ in the corner, which gives the second answer, the one a player who doesn't get involved would choose. The numbers' lists, the table panel, the other notes and the map's "Have a look" already had one. In the day report, the gulls line shows the white-and-grey pixel herring gull (Mewa's picture) instead of the 🐦 emoji.
- 2026-10-02: Playtest request: guests and people walking past move 20% slower (72 world units a second at 1× instead of 90, with their steps slowed to match; waiters keep 90), and guests stay 15% longer at the table: the meal, from the food arriving to leaving, takes 69 minutes instead of 60 (balance.service.eatingMinutes). Longer meals mean fewer guests per table each day. Simulator, 10 seasons, before → after: do nothing 30,659 → 23,240 zł (still loses money); cheap and fast bust 10/10 both (now in week 3); quality focus 8,836 zł (1 bust) → 6,970 zł (6 busts in 10, week 5: it was already close to the edge); balanced 43,548 → 34,498 zł (1 bust), still profitable from week 2, Neptune 39.6 → 39.4. Tried and dropped: guests who linger ordering 15% more drinks and desserts (balanced 37,092 zł, quality focus still 6 busts; the extra orders also keep the kitchen busier).
- 2026-10-02: Playtest requests: the dish creator no longer has its fourth step, naming the dish (dishes named before keep their names); and half as many people walk past on the street: one in three five-minute steps brings someone along instead of two in three, and at most 4 are out at once instead of 8.
- 2026-10-02: Playtest request: guests and people walking past slow down by another 10%: 65 world units a second at 1× (from 72; waiters keep 90). The 15% longer meals stay.
- 2026-10-02: Playtest requests: 25% fewer people walking past (one in four five-minute steps brings someone along, at most 3 out at once; the choice now uses the hash's top bits, as its last bits repeat from one step to the next), guests and people walking past another 10% slower (58.5 world units a second; waiters keep 90), and meals another 10% longer: 76 minutes instead of 69 (balance.service.eatingMinutes). Simulator, 10 seasons, before → after: do nothing 23,240 → 20,060 zł (still loses money); cheap and fast bust 10/10 both; quality focus 6,970 zł (6 busts) → 1,861 zł (9 busts in 10, week 5); balanced 34,498 → 38,131 zł (1 bust; it bought fewer tables), now profitable from week 3 instead of week 2, still within the target of week 2–3; Neptune 39.4 → 38.4.
- 2026-10-02: With 76-minute meals, a booked food critic could give up at a full door after 40 minutes, just before a table freed up (a test caught it). Guests who booked now wait up to 80 minutes (balance.service.bookedWaitFactor 4 → 8), longer than a meal, so their table always frees up in time. Simulator, 10 seasons, with this: do nothing 19,149 zł; cheap and fast bust 10/10; quality focus 2,333 zł (9 busts in 10); balanced 34,261 zł (2 busts in 10, week 6), profitable from week 3; Neptune 38.5.
- 2026-10-02: Graphics and layout, concept round 3 (section 9.3, pictures in `art/concepts/v3/`, compared with Stardew Valley, Kairosoft's games, Two Point Hospital and others): all three concepts chosen, in this order. A: the restaurant fills the screen during the day, with small framed panels in the corners and money floating up from the tables. C: richer pixel art, the room first, then furniture and decor, then bigger people. B: pixel-framed menus and pop-ups. They are six M7 roadmap items, before the rest of M7.
- 2026-10-02: Graphics A, first part: during the day the restaurant and its street fill the whole screen. The top bar and the white card are gone during the day (they stay on the other screens), and their contents sit in pixel frames in the corners:
  - top left: the clock, date and weather, with how far through the day it is;
  - top middle: the day's four numbers, still tappable for their lists;
  - top right: cash and stars;
  - bottom left, round buttons: Manage; Happy hour; Flyers (how many are left, and a tap explains them); Who's who (the colour legend and what the bubbles mean, which used to take a line under the restaurant);
  - bottom right: sound and the speeds.

  Notes stack under the clock (a gull, who didn't come in, Mewa's tips, a card's result, "Paused"), narrower on small screens. The table helper opens above the round buttons. The restaurant is drawn about 1.6 times bigger (544 → 880 pixels wide at 1364×603). The street now fills the screen, so the riverside background no longer shows during the day. Mewa's tips about the speed and happy hour buttons now say where they are.
- 2026-10-02: Graphics A, second part: the money each table pays floats up from it the moment its food arrives (that's when the party pays). It's gold with a dark outline, lasts 1.8 seconds at any speed, and replaces the little coin. A heart comes with it when the guests are happy with their food (🙂 or 😋, a score of 60 or more). The heart is set at 60, not at 😋's 80: measured over three seasons for each simulated player, no guest reaches 80 with today's numbers (almost all land between 40 and 60, 😐), so 😋 never shows. Worth a look when balancing.
- 2026-10-03: Graphics C, first part: a richer room, drawn by the game's own pixel code as before.
  - **Floor:** honey boards in three tones with grain and the odd knot, and shade where it meets the walls. Soft shadows lie under the tables and the kitchen island, and sunlight falls through the window on bright days.
  - **Walls:** painted plaster with soft flecks, a darker band below a dado rail, a skirting board and a cornice.
  - **Window:** curtains on a rod with red tie-backs, and a proper sill. Outside are stepped and pointed Gdańsk gables whose windows light up in the evening. The sun and moon moved out of the window: through the slanting wall they looked squashed, and the sky over the street already shows them.
  - **On the walls:** a clock above the door (a quarter past one by day, eight in the evening), a chalkboard of today's dishes, and a print of the Żuraw in the bigger rooms. Brass wall lamps with green shades glow warm in the evening; the rope-and-lantern lamps take their place when bought.
  - **Kitchen:** Delft-blue tiles, copper pans on an iron rail, and a flame flickering under each busy chef's pot.

  Drawing the room costs about the same as before (48 instead of 45 ms on a PC), and it's only redrawn when the room changes or dusk falls. `npx tsx scripts/pixel/room-preview.ts <folder>` draws the game's room, with guests and staff, into pictures for working on the art.
- 2026-10-03: Graphics C, second part: richer furniture and decor.
  - **Tables:** wooden tables have boards with grain, a lighter rim, an apron and a pedestal on a cross foot. The embroidered Kashubian cloths hang down the sides, with a red hem and a band of embroidery in blue, red, yellow and green. Terrace tables are white bistro tables on an iron stand.
  - **On every table:** a little vase with a red tulip, or a candle in the evening that warms the table top.
  - **Chairs:** slatted backs under a top rail; rattan chairs with woven seats on the terrace.
  - **Kitchen:** cupboard doors with steel handles under the counter (and under the dessert display), drawers in the island, and a fridge with a freezer door, handles and two magnets. The communal table got the same boards and grain.
  - **Decor:** carved panelling with light and shade on each panel, ships in bottles with corks and a blue sea, a gold compass rose on the sea chart, three clay pots of different heights with cream bands, a plant wall in three greens with a few flowers, and gold frames with a dark edge.
- 2026-10-03: Graphics C, third part: bigger, more detailed people, drawn by the game's code instead of fixed pixel grids.
  - **Size:** people are 18×30 pixels instead of 16×20, not counting hats: a round head, a body down to the waist, legs and two-tone shoes. Sitting, they show down to the waist. The tables stay the same size; the head is about two fifths of a table's width, as in the concept picture.
  - **Faces:** eyes with a shine and rosy cheeks, with a small mouth just under the eyes; about half the guests smile. The face is lit from the front, with a soft shadow under the fringe and a little shade down one edge. The portraits in the Staff tab are the same faces: a big smile when happy, heavy eyelids when tired, and a drop of sweat when worn out.
  - **Playtest, same day:** a first version at 20×36 looked cramped next to the tables, and the people looked creepy and unshaven (wide faces with far-apart eyes and brows, and the jaw drawn in the darker skin shade). It was redrawn smaller, without the brows or the jaw shadow and with the eyes closer together.
  - **Hair:** seven styles: short, bob, long, bun, spiky, bald and a baseball cap, with a shine and a few darker strands. Each group has four looks, so the people at one table never look alike.
  - **What they wear:** tourists wear T-shirts, a straw hat and a camera on a strap. Students have hoodies with drawstrings and a pocket, and a navy backpack. Locals wear jumpers with a band of Kashubian crosses. Office workers have a shirt with a collar and tie, a belt and grey-framed glasses. Foodies wear a cream scarf with a fringe.
  - **The team:** waiters are in black, with a white shirt, a bow tie and a long white apron tied at the back. Chefs wear a double-breasted jacket and a pleated toque.
  - **Poses:** guests sitting towards us rest their arms on the table. Waiters carry the tray at shoulder height, with pierogi and a glass of kompot.
  - The special guests and named regulars keep their looks at the new size.
  - Mewa moved to the other end of the windowsill, where the first table's guests no longer hide the gull. The money floating up from a table starts a little higher, above the taller guests' bubbles.
- 2026-10-03: Playtest: tables filled up too soon and too often, even without advertising. A restaurant nobody has heard of now stays quiet. Only 30% of the people who'd choose it walk in without having heard of it (balance.choice.walkInShare 0.3), and the rest come once marketing, flyers, regulars or reviews have made it known. This matches Mewa's help text ("Nobody visits a place they've never heard of"). Meals stay at 76 minutes. The simulator now also reports how much of the opening hours every table is taken. Simulator, 3 seasons each, before → after:
  - **do nothing** (no advertising): every table taken 34% → 11% of week 1 and 47% → 23% of the season; first full on day 1 at about 15:00 → 18:20 (and on one day in three, never). It now runs out of money in week 5 (final cash 18,066 → −4,810 zł). Doing nothing should lose money; it now loses all of it by the end.
  - **balanced** (advertises, buys tables): 42,627 → 43,824 zł, profitable from week 2 (was week 3). Its tables are still full most of the time (85% → 82%), as advertising is what fills them.
  - **cheap and fast** still goes bust in week 3 (3/3, as before). **quality focus** now goes bust in all three seasons in week 3 (before: two of three, in week 5).
  - Golden Neptune for the balanced player 38.8 → 38.4; Bar Błyskawica still best at 44.5.
- 2026-10-03: Playtest: `art/concepts/v3/c-richer-art-day.png` is what the graphics should look like. Chosen: the full concept rather than only its details. The room, furniture and people are drawn about 1.25 times bigger in pixels, with tables further apart and taller walls, so on the tablet things stay about today's size but get the concept's detail and room to breathe. The street stays around the restaurant. Also chosen: cozy from the start. The starting room gets plain dark panelling, simple checked cloths, a rug and a plant, as in the concept, and bought decor upgrades them (carved oak panelling, Kashubian embroidered cloths), so purchases still show. Done in steps (roadmap, M7), each checked before the next.
- 2026-10-03: Graphics C as in the concept, first step: the concept's scale.
  - **Scale:** the restaurant and its street are drawn 1.25 pixels to a world unit instead of 1 (`ROOM_SCALE` in `room.ts`; the isometric helpers take the scale from the picture's origin). Walls, floor, furniture and the street all grow together, and a table top is now 20 pixels across, as in the concept.
  - **Room to breathe:** tables stand 44 units apart instead of 36, so there's an aisle between them, and the walls are 60 units high instead of 52 (75 pixels, close to the concept's 80).
  - **People:** 24×37 pixels (plus room for hats) instead of 18×30, with the same friendly faces: eyes with a shine, rosy cheeks, a small mouth, no brows and no shadow along the jaw. The Staff tab's portraits are the same faces.
  - On the tablet's 1364×603 the room shows at about 1.8 screen pixels to an art pixel instead of 2.55, so things look about the same size as before but with more detail and space. Drawing the room and the street takes about twice as long as before (on a PC, Ogarna's room 36 → 68 ms and street 31 → 54 ms), but they're only redrawn when the room changes or at dusk.
  - The small hand-drawn sprites (wall lamps, the pot plant, Mewa, the pans) keep their size, as in the concept picture; plants and decor come in the next step.
- 2026-10-03: Graphics C as in the concept, second step: a cozy starting room.
  - **Panelling:** below the dado rail, plain dark wood panelling of narrow upright boards. Carved oak panelling, once bought, is now clearly the upgrade: it reaches higher, up to a moulded rail, in golden oak with raised panels that catch the light.
  - **Tables:** every inside table starts with a red-and-white checked cloth, as in the concept; the Kashubian embroidered cloths replace it when bought. A glass of kompot now stands by each plate.
  - **Rug:** a Kashubian-style rug under the second table: a red border with cream stitches, a cream band and a blue middle with diamonds, with tassels at both ends.
  - **Fig tree:** a big fig in a clay pot in the front corner on the kitchen side, which nobody walks through.
  - **Jar shelf:** a shelf of jars high on the window wall, above the wall lamps: pickles, honey, cherries, sauerkraut and plums, with gold lids.
  - **Chairs:** dark walnut, as in the concept, so they stand out against the honey floor (the communal table's bench too). The terrace keeps its rattan chairs.
- 2026-10-03: Graphics C as in the concept, third step: the kitchen.
  - **The pass:** the steel island became the pass, a long wooden counter between the kitchen and the dining room, with a panelled front and a wooden top. A steel strip runs along the cooks' side, and there's a pot of basil at the far end.
  - **Cooking:** each chef stands behind the pass with a pot of żurek or a pan of pierogi on a burner right in front of them, with the flame and the steam. (Pots on the back counter, as in the concept picture, would hide behind the next chef in this view.)
  - **The pick-up end:** the end of the pass nearest the waiters, with no chef in front of it. A plate waits there for every chef who's busy cooking (up to three), under a heat lamp hanging on two chains. The lamp's red strip warms the wood below, more so in the evening.
  - **Room for the chefs:** the kitchen is 64 units wide instead of 52 (the room grew in the first step), so two chefs stand clear of each other and three still fit. The fryer, grill and espresso machine stay on the back counter, under the copper pans.
  - `npx tsx scripts/pixel/room-preview.ts <folder>` now also draws the kitchen up close, with a third chef in the bigger room.
- 2026-10-03: Graphics C as in the concept, fourth step: people's poses.
  - **Walking:** four frames instead of two: a step, both feet down, a step with the other foot, both feet down. People walk at the same pace as before, more smoothly.
  - **At the table:** guests read the menu card while they order (seen from the front). While they wait for the food their hands rest on the table. Once it comes, they eat: the fork waits in the hand, and now and then comes up to the mouth (from behind, the elbow comes up). Each guest has their own rhythm, about one forkful every 2.6 seconds.
  - **In the kitchen:** a busy chef stirs the pot with a wooden spoon, back and forth; a chef with nothing to cook stands ready.
  - The eating and stirring pictures hold both poses side by side, and the screen shows one at a time by sliding the picture with a CSS transform, which is cheap for the tablet. They keep going while the game is paused, like the steam and the flames.
- 2026-10-03: Mewa's first goal is 250 guests instead of 300 (`data/mewa.ts`). A new restaurant is quieter now: a player who does nothing serves about 235 guests in week one (178–279 over 12 games), so 300 was out of reach without advertising; 250 is reached in 5 of those 12 games with no effort at all, and easily with some. Also kept: the bigger premises are a cellar room, a bar counter and a toilet (not a kids' corner). Simulator, 3 seasons, before → after: do nothing −4,810 → −4,643 zł (one season now earns the 500 zł reward; still out of money in week 5); quality focus −6,355 → −6,022 zł (out of money in week 4 instead of week 3); cheap and fast and balanced unchanged (balanced 43,824 zł, profitable from week 2).
- 2026-10-03: Playtest: after a few days the game feels repetitive. Thirteen ideas from tycoon games were chosen, all of them (section 6.15, milestone M7b): tomorrow's forecast, bookings and big orders, daily mini-goals, theme nights, dishes that level up, weekly trends, restaurant rank-ups, a weekly Old Town ranking, rival moves to answer, cook-off challenges, rush hour, guests with wishes and the morning market. Theme nights and cook-off challenges are lighter versions of ideas left out in section 6.14. M7b comes first; M7's unfinished items (Graphics B, samples at the door, bigger premises, the sticker album, Mewa's finds) move to a new milestone, M7c, after it.
- 2026-10-03: Tomorrow's forecast (M7b, section 6.15 A1), settled as built.
  - **What it says:** the day report ends with a "Tomorrow" box: the weather as forecast, any calendar events, maybe a small happening in town, and whether your street will be busier, about the same or quieter than today. The Today tab shows the same the next morning. Because the box sits at the very bottom of a long report, a one-line teaser under the headline sums it up ("Tomorrow: cloudy and about as busy as today, and food bloggers are out").
  - **Happenings** (`data/happenings.ts`): nine small things that change who is out for one day: a cruise ship at Westerplatte, exam retakes over, a Lechia home match, a conference at AmberExpo, food bloggers on Długi Targ, a beach day at Brzeźno, late trains from Warsaw, an open-air concert on Ołowianka, offices closing early on Friday. One comes up on about half the days; some only on certain weekdays or in certain weather. Happenings are always as forecast.
  - **Only the weather can be wrong:** on about 12% of days it turns as the doors open (sunny to cloudy, cloudy to sunny or rain, rain to cloudy, a heatwave to plain sun), with a note on screen and in that day's report. A happening that needs the weather (the beach day) is called off when the weather turns. Numbers are in `balance.forecast`.
  - **Simulator,** 3 seasons, before → after: do nothing −4,643 → −1,736 zł; cheap and fast −39,238 → −32,224 zł; quality focus −6,022 → −2,465 zł; balanced 43,824 → 40,431 zł (profitable from week 3 instead of 2, lowest cash 7,583 → 11,083 zł). Small shifts from the new dice rolls; the rivals and the Neptune race are unchanged, so nothing was rebalanced.
- 2026-10-05: Bookings and big orders (M7b, section 6.15 A2), settled as built.
  - **Requests** (`data/bookings.ts`, numbers in `balance.bookings`): one may come in each evening (43%, about three a week), for a day one to three days after the morning it arrives, never two for the same day. They wait in a new Bookings box on the Today tab with Accept and Decline, which says whether today's menu has what they want. A request not answered by the evening before its day lapses, with a line in the next morning's news. An accepted booking can't be cancelled. The day report's Tomorrow box (and its teaser) mention a booking for tomorrow and any request waiting for an answer, and a note at opening says who's booked today.
  - **Table bookings:** a wedding party (12–16 locals, Friday or Saturday at 17:00, they'd love a dessert), a tour bus (10–14 tourists at 13:00, something Polish), a birthday table (5–8 locals at 19:00, pierogi), an office leaving-do (6–10 office workers on weekdays at 18:00, something to toast with), a student society (8–12 students at 20:00, something hearty) and a supper club (4–6 foodies at 19:30, something from the sea). Never more guests than the dining room holds. Their tables are held for 45 minutes before they come, and while they wait at the door. Their dishes were agreed ahead, so the kitchen cooks their order twice as fast, and they're 20 minutes more patient. Their wish on the menu makes them a little happier (+5), and missing it less happy (−10). With the wish met and at least 55 satisfaction they tip 25 zł a guest and their group likes you 2 points more; no table or walking out costs 3 points with their group.
  - **Big orders:** 20–30 lunches for an office (weekdays, ready at 12:30, 36 zł each, any main), 15–25 soups for the Crane museum (13:00, 22 zł), 20–30 plates of pierogi for a parish fête (weekends, 15:00, 32 zł) and 20–30 desserts for a summer camp (16:00, 18 zł). A chef cooks them at 2 minutes a portion for an average chef (less for a quick one), starting at the last moment that gets them ready in time, using the dish on the menu that fits with the cheapest ingredients; the ingredients are paid. With nothing on the menu that fits, or nobody cooking, the order falls through: no money, and 3 reputation points lost with that group.
  - **The surprise tour bus, wedding and birthday** became requests (chosen 2026-10-05): the daily chance of a surprise event went from 20% to 12.5%, so the food critic, the newspaper and the rest come as often as before. Saves (version 18) drop any of those three that were running.
  - **Kitchen fix found on the way:** a free but slow chef took an order they couldn't finish before the guests lost patience, and the order was dropped (the guests walked out), even when a quicker chef would be free in a few minutes. Now an order goes to a free chef who can make it in time; failing that it waits for a busy one who can, and later orders go ahead meanwhile; it's only dropped when nobody could. In one simulated season, hiring a slow perfectionist chef had turned 25 walk-outs a day into 130 and the restaurant went bust.
  - **Simulator,** 3 seasons, before → after (balanced and quality focus accept every request; do nothing and cheap and fast never answer): do nothing −1,736 → 4,266 zł (no longer out of money: fewer surprise street works and other dice); cheap and fast −32,224 → −34,756 zł (bust in week 3 as before); quality focus −2,465 → −5,840 zł (bust in week 4 as before); balanced 40,431 → 47,738 zł, rating 50.6 → 54.1, Neptune 37.1 → 39.5 against Bar Błyskawica's 45.0, guests lost 10,824 → 12,533 (walk-ins find tables held). Over 8 seasons, accepting every request against never answering: balanced 36,240 → 42,481 zł, quality focus −3,798 → −3,021 zł. `NO_BOOKINGS=1 npm run simulate` leaves every request unanswered, to compare.
  - **Tuned on the way:** at first (tips 15 zł, tables held an hour, 2.5 minutes a portion, big orders about 20% cheaper) accepting every request cost the balanced restaurant money: its tables are full most of the day, so held tables turn paying walk-ins away.
- 2026-10-05: Dishes level up with use (M7b, section 6.15 B5), settled as built.
  - **What counts:** every portion the player's kitchen serves counts for its kind of dish (all pierogi together, whatever the variant or extras, lunch-set portions too), so changing a recipe keeps its stars. Kept in the save as `dishPractice` (version 19). Only the player's kitchen keeps count: the rivals are established places.
  - **Stars** (`balance.dishLevels`): ★ after 30 portions, ★★ after 120, ★★★ after 300 (first tried at 50, 200 and 500, but a quiet starter kitchen sells only 8–10 of each main a day, so three stars were out of reach in a season; now a quiet kitchen's mains reach ★★★ around week 4–5, a busy one's in weeks 2–3, and drinks sooner, as nearly everyone orders one). Each star adds 3 quality to that kind of dish.
  - **Three stars:** the dish earns the homemade taste tag, or creative if it's homemade already (most Polish classics are, so they become creative, which foodies like). Chosen over new variants, which would need content for every dish.
  - **On screen:** the Menu tab shows ★★☆ under each dish with "40 more served to ★★★" (and the earned tag among its tags), the dish creator shows each kind of dish's stars, and the day report has a line when a star is earned ("Pierogi: ★★! Pani Krystyna could cook it blindfolded now.", with the head chef's name; the lines are in `data/practice.ts`).
  - **Simulator,** 3 seasons, before → after: do nothing 4,266 → −1,010 zł; cheap and fast −34,756 → −36,270 zł (bust in week 3 as before); quality focus −5,840 → 2,235 zł (still bust in week 4, but recovers); balanced 47,738 → 39,630 zł, rating 54.1 → 60.2, Neptune 39.5 → 43.4 against Bar Błyskawica's 44.5, and the Golden Neptune won in 1 of 3 seasons (never before). Over 8 seasons, stars off → on: do nothing −2,518 → −634 zł, quality focus −3,021 → 440 zł, balanced 42,481 → 39,377 zł with rating 54.1 → 59.8, Neptune 39.7 → 43.0, and the Golden Neptune won in 2 of 8. Every strategy's rating rises by 4–6 points; the balanced player reaches its spending and moving thresholds sooner, so it ends with a little less cash. A player who builds up their dishes now has a real chance at the Golden Neptune, which seems right for progress you can feel; nothing was rebalanced.
- 2026-10-05: Restaurant rank-ups (M7b, section 6.15 B7), and a balance pass asked for at the same time ("make 3 stars achievable, work on game balance more").
  - **Ranks** (`data/ranks.ts`): Bar, Bistro (500 guests served and 3.0★), Restaurant (1,500 and 3.2★) and Old Town Favourite (3,500 and 3.4★). Both are needed at once, and a rank is never lost. Bistro adds a menu slot, even beyond the biggest menu board (12 → 13). Restaurant lets three new choice cards come, which need a known place: a TV cooking show (the kitchen stops 30 minutes; awareness, and more locals and foodies for three days), a famous chef from Warsaw (a gamble for foodies' reputation and a five-star review) and the city guidebook (600 zł for tourists' awareness). Old Town Favourite puts a brass plaque on the front door and spreads the word (+5 awareness with every group).
  - **On screen:** on the day of a rank-up the day report opens with confetti, Mewa's line and what it unlocks. The Mewa tab shows the rank and the way to the next one (guests and stars, with a bar), and the Today tab's greeting names it ("Joana's Kitchen, a little bar on ul. Ogarna"). The game now counts guests served by each group all game (`guestsServed`, save version 20; older saves count from now on).
  - **The star rating, made achievable:** it was the plain average of the five groups' reputations divided by 20 (0–5), so groups that hardly ever come (students, office workers and foodies at Ogarna, still near their starting 30) dragged it down: a well-run restaurant stayed at 2.2–2.7★ all season, and the playtest showed 1.7★. Now each group's reputation is weighed by the guests of that group served (plus 20 each, so at the start they count the same; `balance.reputation.ratingPriorGuests`), on the reviews' 1–5 scale (reputation 0 is one star, 50 three, 100 five): a quiet restaurant settles at about 3.0★ and a good one at 3.5–3.7★. Mewa finds the secret recipe at 3.3★ (was 2.0 on the old scale).
  - **Better food is worth more:** guests find a price fair up to 0.6% higher for each quality point above what their group expects (`balance.satisfaction.fairPricePerQualityPoint`), so a premium kitchen, or one with three-star dishes, can charge more without seeming dear.
  - **Costs:** weekly utilities 4,200 → 2,800 zł (section 6.12 calls them small; they had grown as big as Ogarna's rent), and premium ingredients cost 1.3 times the market's instead of 1.5. Doing nothing still loses money (about 30,000 zł over the season) but no longer runs out in week 5; quality focus became viable.
  - **Simulator's balanced player** now moves to Długa at 60,000 zł instead of 45,000: moving the moment it could pay the fee left it short for Długa's first week of rent (21,000 zł) and once sent it bust. The Map tab shows every street's weekly rent, so a real player can see it coming. The simulator now prints the day each rank was reached and the star rating each week.
  - **Simulator,** 3 seasons, before → after: do nothing −1,010 zł (bust 2/3, week 5) → 9,574 zł (never bust), rating at the end of the season 3.0★; cheap and fast −36,270 → −24,266 zł (still bust in week 3: it sells below what it costs); quality focus 2,235 zł (bust 3/3, week 4) → 8,165 zł (bust 1/3, week 6), 3.4★; balanced 39,630 → 54,189 zł, 3.6★, Neptune 43.4 → 43.7 against Bar Błyskawica's 44.8 (no longer won: it stays on Ogarna, where in the before run it sometimes moved to Długa for the Fair crowds). Over 8 seasons: do nothing −634 → 9,163 zł (bust 7/8 → 0/8), quality focus 440 → 9,711 zł (bust 8/8 → 2/8, profitable from week 4), balanced 39,377 → 52,718 zł. Ranks: balanced becomes a Bistro on day 4, a Restaurant on day 12 and an Old Town Favourite on day 25; quality focus a Bistro on day 10 and a Restaurant on day 24; doing nothing a Bistro on day 20.
- 2026-10-05: A weekly Old Town ranking (M7b, section 6.15 B8), settled as built.
  - **What it is:** every Monday from week 2, Dziennik Bałtycki prints the Old Town top five, ranked by the Golden Neptune score so far: 60% the season's average guest happiness, 40% the share of Old Town guests, last week's before the Fair and the Fair's so far once it's on (exactly as the Neptune counts them), with "N days until the Golden Neptune" during the Fair. Not the Monday after the Neptune itself, when the day report has the real result.
  - **On screen:** a newspaper box at the top of the Today tab on Monday: a masthead, a headline that follows the player ("Joana's Kitchen climbs to third!", "Bar Błyskawica holds on to the top spot"; `data/ranking.ts`), and each restaurant's place, stars, guests last week, Neptune score and ▲/▼ since last week, the player's row highlighted. The other days, one line: "📰 Third in this week's Old Town top five". The player's stars are the top bar's; the rivals' are worked out the same way, from their reputation and last week's guests. Kept in the save (version 21) until the next Monday, with the week before's places for the arrows.
  - **Simulator:** prints the player's place each Monday. Nothing else changes (the ranking only reports). Balanced: second most weeks, first in week 4, then second through the Fair (Bar Błyskawica wins the Neptune 43.7 to 44.8); quality focus third; doing nothing fourth or fifth.
- 2026-10-05: Rush hour (M7b, section 6.15 D11), settled as built.
  - **Rushes** (`balance.rush`): lunch 12:00–14:00 and dinner 18:00–20:30, with a note under the clock ("🔥 Lunch rush! Tap ⚡ on a chef or a waiter to hurry them"). Each chef behind the pass and each waiter standing by gets a pulsing ⚡ ring.
  - **Hurrying,** once per person per rush: a chef cooks 1.5 times as fast for 20 minutes (orders started in that time), then takes a 10-minute breather and starts nothing new (☕ over their head); a waiter is two speed levels quicker for 20 minutes, then steps off the floor for 10 minutes. So it pays when orders pile up and costs when it's quiet. First tried with a 15-minute breather: hurrying then gained nothing at all for the simulator's player, as the breather fell in the middle of the rush.
  - **Quick-service streak,** all day: every party whose food comes within half their patience adds one, a slow table or a walk-out resets it. From 5 in a row each party in the streak tips 1 zł a guest, from 10 in a row 2 zł (first tried at 3 and 5 zł: fast kitchens then made 16,000 zł a season from tips, far more than "a small bonus"). From 3 in a row a note shows the streak; the day report says who was hurried and the best streak, and the money table has a line for the tips. Nothing is saved: it all lives only while the day runs.
  - **Simulator:** the balanced player hurries a chef in a rush once three orders are waiting. 3 seasons, before → after: do nothing 9,574 → 9,589 zł; cheap and fast −24,266 → −17,635 zł (fast service, long streaks; still bust in week 3); quality focus 8,165 → 9,012 zł; balanced 54,189 → 51,784 zł, guests served 6,007 → 6,306, Fair share 17.5% → 18.5%, Neptune 43.7 → 43.5 against Bar Błyskawica's 44.5 (the cash differs by a few thousand from season to season with the dice). The `play-day.mjs` check now photographs the first rush of each day (rush-<n>.png) and hurries someone.
- 2026-10-05: Daily mini-goals (M7b, section 6.15 A3), settled as built.
  - **One small goal each morning** (`data/dailyGoals.ts`), shown under Mewa's weekly goal on the Today tab, picked by its own dice from the goals today's menu makes possible, never the same as yesterday's: sell soups before 14:00 (1.25 a table inside, at least 4), nobody walks out, make a foodie happy (one foodie party at 55 or happier), sell portions of today's special (2.5 a table, if there is one), sell desserts (2 a table, with a dessert on the menu), serve guests at dinner from 18:00 (4 a table, at least 12), fill every table at once before 14:00, serve 5 tables quickly in a row (the rush hour streak), take a tenth more than yesterday (500 zł a table on the first day), sell lunch sets (2 a table, with a lunch set). Rewards 150–250 zł, paid at closing.
  - **During the day** a fifth box at the top of the screen shows it ("5/8", a share of the takings, 🤞 while nobody has walked out, ✓ once done); tapping it says what it is and what it pays. The moment it's reached, Mewa's fanfare and a note ("Today's goal done! Mewa will drop 200 zł at the door tonight"). "Nobody walks out" is only settled at closing. The day report says how it went ("Not this time: 3 of 5"). Saved as `dailyGoal` (version 22; older saves get theirs the next morning). Served parties now remember when their food came (`servedAt`), for the goals about times of day.
  - **Tuned on the way** with a new simulator table (how often each goal is done when it comes up): at first the soups goal was done on 10% of quiet days (2 a table) and "make a foodie happy" almost never (65 or happier, and few foodies come to Ogarna), while "every table full" (all day), "takings" (500 zł a table) and "lunch sets" (4) were nearly always done. Now most goals are done on a third to all of the days, depending on the kitchen; beating yesterday's takings is the hard one (a fifth to a third), and a slow kitchen rarely manages five quick tables in a row.
  - **Simulator,** 3 seasons, before → after (the rewards come without any extra play from the scripted players): do nothing 9,589 → 13,489 zł; cheap and fast −17,635 → −11,118 zł (still bust, now in week 4); quality focus 9,012 → 11,621 zł (no longer bust, profitable from week 6); balanced 51,784 → 57,734 zł. Nothing else changes. `play-day.mjs` can now play at another size (`SIZE=850x530`); the day screen's top row, now five boxes, still fits at 850×530.
- 2026-10-05: Weekly trends (M7b, section 6.15 B6), settled as built.
  - **What they are** (`data/trends.ts`): every Monday, and on the first day, Gdańsk goes crazy about something for the week, never last week's again: seafood week (locals and families want anything from the sea), sweet tooth week (students, desserts), pierogi fever (tourists), green week (foodies, veggie), hearty week (office workers), coffee culture (students), Kashubian week (foodies, homemade), ice cream summer (tourists), pizza craze (locals) and soup week (tourists), each with a little story for Monday's news.
  - **What they do** (`balance.trends`): for that group a trending dish counts as a perfect match, so they order it more, and a menu with something on trend tempts them a little more (0.6; the happy hour board is 1). The second part was added as built: a group judges a menu by its three best dishes, so for a group that already loved the menu (locals and the starter's Polish homemade dishes) a trending dish alone changed nothing. The rivals' menus don't change for trends. A trend tempts a few more of its group to eat out, rather than only to switch restaurants.
  - **On screen:** a line on the Today tab all week ("🧶 Kashubian week: Foodies want homemade cooking this week. Until Sunday."), Monday's news, a "📈 trending" tag on matching dishes in the Menu tab, and 📈 by the dishes in the dish creator that could be. Saved as `trend` (version 23; older saves get one next Monday).
  - **Simulator,** 3 seasons, before → after (the scripted menus never change; they happen to have something on trend on 39–67% of days, a new table shows how often): do nothing 13,489 → 16,040 zł; cheap and fast −11,118 → −6,084 zł (still bust in week 4); quality focus 11,621 → 13,337 zł; balanced 57,734 → 61,763 zł, Neptune 43.5 → 43.4 against Bar Błyskawica's 44.3.
- 2026-10-05: Theme nights (M7b, section 6.15 A4), settled as built.
  - **Booking** (Marketing tab, `data/themeNights.ts`): once a week, while planning, pick a theme and an evening this week, paid at once: pierogi night (300 zł; tourists and locals, for pierogi), a Kashubian evening (400 zł; locals and foodies, for homemade cooking), live accordion (500 zł; tourists, and everyone who comes in that evening is a little happier, +5) and a seafood night (400 zł; foodies and tourists, for anything from the sea). A ⚠️ warns when nothing on the menu fits the theme.
  - **The evening** (`balance.themeNights`): from 18:00 the restaurant tempts the theme's groups as much as the happy hour board does (1), and what they came for is a perfect match for them, so they order it. Without it on the menu they still come, but are a little disappointed (−8). The Today tab says when it's on, a note comes at 18:00, the accordion player stands by the front steps all evening, and the day report says how many guests came from 18:00 and how many portions of the theme's dish sold. Saved as `themeNight` (version 24); it only changes the restaurant for that one evening.
  - **Simulator,** 3 seasons, before → after: the balanced player now books a theme night every Friday that its menu fits: 61,763 → 60,018 zł, guests served 6,236 → 6,352, rating 60.2 → 60.7, Neptune 43.4 → 43.9 against Bar Błyskawica's 44.5 (its evenings are already mostly full, so the night barely pays for itself). Tried with quality focus too, whose evenings have room: 13,337 → 18,763 zł, 234 more guests, Neptune 38.6 → 40.0; it pays where there's room. The other strategies are unchanged. `play-day.mjs` can book one for the first evening (`THEME=accordion`) and photographs the Marketing tab and the evening.
- 2026-10-06: Rival moves to answer (M7b, section 6.15 C9), settled as built after a simulation of the design first.
  - **When:** on half of the Mondays from week 2 (`balance.rivalMoves`), one rival acts against the player, gently, never the same move twice running and only when it makes sense. A card at the top of the Today tab (`data/rivalMoves.ts`) offers three answers while planning; open without answering and the card's "let it be" answer is taken.
  - **The moves:** Nonna Rosa wants your best chef (with two chefs or more): match the offer (a 20% raise, morale +25), a heart-to-heart (morale +10, they stay half the time) or wish them well (they go, and cook for Nonna Rosa). A price war at Bar Błyskawica (20% off for a week, and price-sensitive students, office workers and families notice): match it (15% off yours), stay put, or out-cozy them (free kompot: every guest +8 happier and word of it tempts everyone a little, for 2 zł a guest). Karczma copies your special onto its board for a week (with a special on the board): tell everyone it's yours (300 zł, +5 awareness), take it as a compliment (+3 with locals) or let it be. A lunch deal at Spichlerz for office workers for a week: lunchtime flyers (300 zł, +12 office awareness), cut your lunch set price by 20% (only with a lunch set) or let it be. The day report says how it ended on its last day, and the money table shows the kompot.
  - **Simulated before building, and changed:** with the first answers all three answers came out within 1,200 zł of each other over a season, and price wars made Bar Błyskawica, already ahead in the Neptune race, stronger, once on the Fair's last day. So staying put in a price war now loses the price-sensitive guests, free kompot became cheaper and stronger, and there's no price war in the Fair's last week. Over 8 seasons, as the balanced player: no rival moves 57,467 zł and Neptune 42.9; always the first answer 52,508 zł and 42.2; always the second 53,678 zł and 41.6; always the third 53,822 zł and 41.1 (fewer staff by the end). They cost a good restaurant about 4,000–5,000 zł a season; quiet restaurants barely notice them. Bar Błyskawica still gains a little from its price wars (Neptune 44.5 → about 45.3).
  - **Simulator,** 3 seasons, before → after (balanced answers first, the others let it be): do nothing 16,040 → 15,141 zł; cheap and fast −6,084 → 9,383 zł (bust 1 in 3, was 3 in 3: Nonna Rosa takes one of its two expensive chefs, and it can't afford two); quality focus 13,337 → 14,857 zł; balanced 60,018 → 54,518 zł, Neptune 43.9 → 42.9 against Bar Błyskawica's 45.7. `NO_RIVAL_MOVES=1 npm run simulate` plays without them, and the simulator lists the first season's moves and how they came out. Saved as `rivalMove` (version 25).
- 2026-10-06: Cook-off challenges (M7b, section 6.15 C10), settled as built.
  - **The challenge** (`data/cookOffs.ts`, `balance.cookOffs`): on half of the Wednesdays from week 2, a rival challenges the player to a duel judged on Saturday, never the same rival twice running and, when possible, one whose field the player can enter: Karczma for the best soup, Nonna Rosa for the best main, Bar Błyskawica for the best-value plate (value counts double), Spichlerz for the best dessert. A card on the Today tab shows each dish on the menu that can be entered, with its score, next to the rival's hint and entry; pick until the morning of the duel, or decline politely.
  - **Judging,** at the end of the duel day: a dish scores its quality (as the kitchen cooks it, dish stars, chef, supplier, fresh produce and pairings included) plus value for money (40 points times how much cheaper than usual, so 20% cheaper is +8), plus up to 4 points of luck either way. The rival enters its signature dish (Karczma's żurek, Nonna Rosa's pasta, Bar Błyskawica's pierogi, Spichlerz's sernik) with 16 points on top for years of practice. Winning: +1 reputation and +6 awareness with everyone; losing: +3 awareness (everyone talked about it); declining or not entering: the rival gets +4 awareness. The day report gives both scores.
  - **Tuned:** at first rivals entered their best-scoring dish with no bonus, and the balanced player won 8 of 8 without trying (its practised dishes beat the rivals' average chefs); with a signature bonus of 15 it won 3 of 27. With signature dishes and a bonus of 16, a player who enters its best dish without preparing wins about half the time (10 of 21 over 8 seasons); preparing the dish (better ingredients, a pairing, fresh produce, dish stars, the right price) tips it.
  - **Simulator,** 3 seasons, before → after (balanced enters its best dish, the others don't enter): do nothing 15,141 → 17,407 zł; cheap and fast 9,383 → 3,779 zł (bust 2 in 3, from different dice); quality focus 14,857 → 15,797 zł; balanced 54,518 → 54,355 zł, 5 wins in 8, Neptune 42.9 → 42.2 against Bar Błyskawica's 45.8. The simulator shows how many challenges each strategy entered and won. Saved as `cookOff` (version 26).
- 2026-10-06: Guests with wishes (M7b, section 6.15 D12), settled as built.
  - **Who and what** (`data/wishes.ts`, `balance.wishes`): one walk-in party in ten at the player's restaurant hopes for something its group would ask for: something without meat (🌱?, foodies and students), extra dill (🌿!, locals), anything with fish (🐟?), a hot soup (🥣?), something sweet (🍰?), pierogi (🥟!), a coffee (☕?), something spicy (🌶️?), a Polish classic (🇵🇱?) or anything with mushrooms (🍄?, wild mushrooms or chanterelles on a dish, or the mushroom pierogi and gołąbki). Booked parties and regulars bring their own wishes instead. Their own dice, so they never change who comes or what they order.
  - **At the table:** the wish shows as their bubble until the food comes (unless they're losing patience, when ⏳ or 😤 shows instead). It first showed only while ordering, about a second at normal speed, too short to notice. On the menu: ❤️ when the food comes and +8 happiness; missing: 🤷 and −2, a nudge rather than a punishment. The day report sums them up as a hint for tomorrow's menu ("Wishes: 6 of 9 tables found what they hoped for. Asked for but missing: something without meat (×2), extra dill."). Nothing is saved: wishes live only while the day runs. A wish can now be "any one of these" or name an extra or a variant (`MenuWant`), which the mushroom wish needs.
  - **Simulator,** 3 seasons, before → after: do nothing 17,407 → 16,064 zł; cheap and fast 3,779 → 2,405 zł; quality focus 15,797 → 16,165 zł; balanced 54,355 → 57,518 zł, rating 58.9 → 61.6, Neptune 42.2 → 43.9 against Bar Błyskawica's 45.2 (small shifts, mostly the dice). How often wishes were granted: balanced 66%, the others about 40%. Also fixed: the first day's takings goal said "more than yesterday" when there was no yesterday.
- 2026-10-06: A new look for the whole game: the Kashubian sketchbook (section 9.5), built in M8, which now comes before the rest of M7b and M7c.
  - **How it was chosen:** eight rounds of concepts (section 9.4). Rounds 4 and 5 kept the isometric dollhouse and changed only the paint (storybook, toy box, modern flat; then pixel, painted, soft 3D and cartoon), and none was liked. Round 6 turned the camera to a front-on stage with bigger people, in three looks (paper theatre, Kashubian folk art, ink-and-watercolour sketchbook); the sketchbook was liked, with some folk art in it. Round 7 tried three strengths of folk art, and the sketchbook page won. Round 8 polished it (`art/concepts/v8/sketchbook-page.png`).
  - **Rules that change:** the front view replaces the isometric one; the art moves from `src/ui/pixel/` to `src/ui/sketch/`; it is still drawn in code, but baked once into pictures through an offscreen canvas because its SVG filters are too slow to run live; picture files and one bundled handwriting font are allowed. Graphics B (pixel-framed menus) is dropped in favour of M8's sketchbook pages.
- 2026-10-06: The sketchbook look's foundations (M8, section 9.5), settled as built.
  - **Code:** the concept's drawing code now lives in `src/ui/sketch/`: `palette.ts` (colours and the page size, 1364×603 units), `painter.ts` (the wash and ink line, ids, the filters), `motifs.ts` (rosette, tulip, embroidered band, hatching, bunting), `people.ts` (people and Mewa), `scene.ts` (the concept's room), `page.ts` (the sketchbook page and its notes) and `bake.ts`. Tests check the picture is the same every time, has no broken numbers, and that its clip paths have their own ids.
  - **The font:** Kalam (SIL Open Font Licence), regular and bold, each with Polish letters: four `.woff2` files, 69 KB, licence in `src/ui/sketch/fonts/OFL.txt`. A picture drawn from SVG can't use the page's fonts, so the font is packed into each picture as data when it is baked; the page's own text can use it too (`font-family: Kalam`).
  - **The wobble is one filter over the whole picture,** not one per shape. Per shape (1,354 of them), the concept's still took 1.7 s to bake on a desktop; as one filter, 0.2 s, and it looks almost the same, a touch crisper. Floor shadows, clouds and the page's ragged edge keep their own soft wash.
  - **Baking:** the SVG is drawn once into an offscreen canvas at the size it covers the screen, in the screen's own pixels (at most 4096 pixels across), saved as a PNG and cached by a key. In the game on a desktop, the still is ready about 0.9–1.1 s after the day screen opens: 0.02–0.06 s for the font, 0.09–0.16 s to draw, and the rest waiting while the game starts the day. The `?perf` meter shows these three numbers. To be measured on the tablet.
  - **Seen with `?sketch`:** the day screen shows the still behind the clock, numbers, notes and buttons, until the next M8 items make the new view playable; without it the game is unchanged. On narrow screens the still is trimmed at the sides for now; the room item lays the room out to fit.
- 2026-10-06: The restaurant inside, in the sketchbook look (M8, section 9.5), settled as built. Seen with `?sketch`; it becomes the normal view once the street outside is done too.
  - **The room** (`src/ui/sketch/frontRoom.ts`): seen from the front. The back wall faces the street, with the windows (one fewer than columns of tables, so there's wall between them for pictures) and the door; the bar is on the left and the kitchen hatch on the right. Tables stand in two staggered rows (up to 8 tables) or three (10 or 12), so back-row faces show between front-row heads. Each table seats two behind it and one at each end, turned towards it with their knees under the cloth, so only their shoes show under the hem (chosen over crossed legs beside the table, which would have tangled with the next table's guests or meant spreading the tables and drawing everyone smaller). The room is as wide as the premises' most tables need, and as tall as the screen's shape asks; on a taller screen the rows spread out a little and the wall takes the rest. A restaurant with fewer tables than spots has them in the middle.
  - **Sizes:** people are 195 units tall seated and 196 standing, each row nearer us 6% bigger; anyone standing or walking shrinks towards the back wall (82% there). On the tablet a seated guest is about 150–170 pixels tall.
  - **What's drawn** (`roomArt.ts`): the wall with tulip-and-rosette wallpaper and bunting; windows onto Długi Targ with St Mary's, the Town Hall and Neptune, the sky by the weather (sun, clouds, rain) and lit windows at dusk; the bar with bottles and taps; the open door with the chalkboard above it showing today's first three dishes; the kitchen through the hatch, with the clock above it telling the day's time. All 13 decor items have a place: the chandelier, portraits, carved oak panelling, ships in bottles on the bar, lanterns, the sea chart, embroidered tablecloths, clay pots, the tiled stove, brass pendant lamps, the plant wall, the communal table as carved oak trestle tables, and azulejo tiles. So do the six pieces of equipment (espresso machine and cake display on the bar; range, pizza oven, grill and fryer in the kitchen), and the Old Town Favourite's plaque.
  - **People** (`cast.ts`, `sheets.ts`): eight looks for each group (tourists with cameras and sun hats or caps, students with backpacks, locals in embroidery, office workers with ties or lanyards, foodies with scarves and berets); the critic, the Friday regular, Filip, Fletcher, Henryk, Weronika, Wałęsa and his guard, the footballer; waiters, Tomek (bald, beaming, a kompot stain) and Adrian (a messy blond tuft, rabbit teeth); chefs. Each is drawn once in a sheet of poses (a guest: reading the menu, waiting, arms crossed, eating in two steps, the same at a table's end, walking in two steps, standing, and walking away in two steps), facing right, and mirrored to face left. Seen from behind, people show the back of the head and their hair (a braid, a bun, a bald patch with its fringe), hats, backpacks, scarves and the bow of an apron.
  - **Alive:** guests walk in through the door to their table, side by side rather than in single file (two steps and a little bounce, at the game's speed); anyone walking up the room, towards the back wall (out of the door, round to a seat behind a table, a waiter back to the hatch), is seen from behind; sit and order, wait (arms crossed when it's taking too long), and eat (fork up and down); waiters carry plates from the hatch and walk back with the empty tray; chefs toss their pans while cooking; soup steams; ink speech bubbles pop up over tables; the money floats up in handwriting with a heart; parties that give up leave through the door, cross. Every tap still works: looking after a table (tap its bubble or the guests themselves; a first version only caught taps just under the bubble, so waiting tables seemed not to respond), moving a party, hurrying a chef or waiter, and shooing a gull, which shows in the open door until the street outside has its own view. Passers-by, flyers, the terrace and the musician come with that view.
  - **Pictures:** everything is baked once, in the background, one picture at a time; a sheet of poses takes about 15–35 ms to draw on a desktop, and the day runs at 60 fps. Tests cover every premises and screen shape, the walks from the door to every seat, and every picture and person.
  - **For checking:** `npx tsx scripts/pixel/sketch-preview.ts <folder>` draws three full houses (a small room, one with all the decor, the biggest at dusk), and `?sketch&slots=12` lays the room out for that many tables.
- 2026-10-06: The restaurant inside, after a playtest (M8): waiting made clear, the waiter's timing fixed, a button to help, and drawn icons.
  - **The waiter served at once.** The game moves on about five minutes a real second at 1×, guests order within five minutes and often have their food within fifteen; walking in at a stroll across the wide room took 3–8 seconds, so they sat down after their food was ready and the waiter came straight over. A first fix made everyone walk briskly (1.4 s at most), which looked rushed. Now the room shows each visit on its own timeline, a little behind the game and counted in game minutes, so it follows pausing and 2× or 4×: guests stroll in (130 units a second, at most 3.5 s across the biggest room), read the menu for 10 game minutes (2 s at 1×), then wait at least 10 more, longer if the kitchen isn't done, before a waiter sets off from the hatch with their plates (175 units a second, at most 2.2 s). The food only shows on the table, and the money floats up, when the waiter puts it down; a table nobody could serve (every waiter busy) gets its food after 50 minutes. The meal (76 minutes in the game) still leaves about 10 s at 1× of eating on screen.
  - **Waiting is shown:** a bubble with an empty plate and a ring of patience round it, emptying as they wait: green, then amber with an hourglass past half, then red with a cross face and a little shake. Before, waiting showed nothing until they were impatient.
  - **A button to help:** guests getting frustrated (the same moment the old view let them be helped) get a round button beside their bubble, a glass of kompot with a heart, pulsing; it opens the help (a free drink, the chef's apology, another table). Tapping the guests or the bubble still works too.
  - **Drawn icons instead of emojis** in the room (`src/ui/sketch/icons.ts`, one baked sheet): reading the menu, waiting, the hourglass, faces (cross, loved it, happy, so-so, sad), heart and a missed wish; every wish (no meat, dill, fish, soup, something sweet, pierogi, coffee, spicy, a Polish classic, mushrooms); the Friday regular's lemon, the named regulars (laptop, book, anchor, pencil), the special guests (a shot glass, a football, Wałęsa's V, a clapperboard), the critic's pen, the hurry bolt and the coffee break, and a waving hand for later. The emojis in the panels and menus go with the HUD and menus items.
- 2026-10-06: The new look covers every icon in the game, not only the room's: all the emojis (about 110 different ones, in the panels, buttons, notes, help, menus, report and texts) get a drawn icon, shown in place of the emoji wherever it appears; Mewa and the Who's who legend, still pixel art, are redrawn. A new M8 item, "Every icon drawn", after the street outside and the light and weather (section 9.5, "All the icons").
- 2026-10-06: Every icon drawn (M8), settled as built, before the street outside.
  - **One icon sheet** (`src/ui/sketch/icons.ts`): 147 hand-drawn icons in ink and watercolour, in a grid baked once when the game starts (`src/ui/Icon.tsx`), each kept inside its own cell: one for each of the 110 different emojis the game uses (faces, food and drink, things, the weather), the coin and stars (filled and empty), 21 dishes, Mewa, the five guest groups as portraits, and the six streets' markers. `<Icon id size label>` shows one; without a size it sits in a line of text at about the letters' height.
  - **Emojis swap themselves:** the game's JSX runs through its own small runtime (`src/ui/iconJsx`, set in `vite.config.ts` and `tsconfig.json`) that shows any emoji in an element's text as its drawn icon, and the ★ and ☆ the game writes as plain symbols too. So the texts in `src/data` and the screens keep writing emojis, and none reaches the screen; text that can't hold pictures (options, labels read out by screen readers) is left alone. A test checks every emoji anywhere in the game's code has a drawing, and `scripts/emoji-check.mjs` walks every screen (all ten planning tabs, the day, the legend, a card, the report) and lists any emoji still shown as text: none.
  - **Pixel art redrawn:** Mewa (by her tips, on her tab, in the report), the coin, star and weather icons in the panels, the dish icons in the Menu tab and the report, the street markers on the map list, and the team's portraits in the Staff tab (the same look as in the restaurant, laughing when happy, cross-armed when worn out). The Who's who legend shows the five groups as portraits, and explains the menu, the patience ring, the help button and the faces with the room's icons; the guest rows in the day's numbers have portraits too.
- 2026-10-06: The street outside (M8), settled as built. The sketchbook look becomes the normal view of the day; `?pixel` shows the old pixel art until it is retired.
  - **The switch:** a round button after Who's who, "Outside" with the street's marker or "Inside" with a chef's hat. A badge on its corner shows what wants the player on the other side: inside, a table waiting for help; outside, a gull first, then a queue at the door, then a terrace table waiting for help. The Flyers button goes outside too, since that's where people walk past. The day always starts inside.
  - **The scene:** the restaurant's townhouse a little left of the middle, with its stepped gable, rosette, flower boxes, folk band, awning, door on the left, hanging sign with its name in handwriting and a lamp; the chalkboard by the door shows today's special. Gabled neighbours in sorbet colours fill the street both ways, each street always the same. Each street has its own landmark behind: Długa the Town Hall spire and Neptune's fountain on the pavement; Ogarna, Piwna and Mariacka St Mary's tower (Piwna also the Armoury's gable, Mariacka its stone terraces); Długie Pobrzeże the Żuraw at the end of the quay, with the river and a boat in front; the granaries a row of granaries and cranes, also by the river. The sky follows the day's weather, with rain streaks, and at dusk it turns dark blue with a moon and lit windows (the rest of the evening comes with "Light and weather").
  - **The terrace** stands on the pavement to the right of the door: its tables move here from the room (the room shows only the inside tables now). One row, or two staggered rows from four tables up, with striped parasols, open on days the terrace is open, folded otherwise. Its guests walk in along the street, sit, read the menu, wait and are served exactly like inside (the same visit timeline, bubbles, patience rings and help buttons), with the waiter walking out of the door to them and back.
  - **Who walks by:** parties going in and coming out of the door, along the houses; up to three passers-by of every group strolling both ways, some along the houses and some along the front. Tapping one who hasn't had one yet hands them a flyer (as before, everyone who takes one has heard of the place now): if they're tempted, they smile, turn and walk in at the door, and come as a party; if not, they wave and walk on. A short note says which it was ("They took your flyer and they're coming in!", or "Not today, but now they know your name."), and Who's who explains both faces; the wave puzzled the player in the first playtest. The queue for a table waits on the pavement by the door with an hourglass, and leaves cross when it gives up. The gull lands on a terrace table's plates and is shooed with a tap there (the room no longer shows the gull or the queue). On live-music nights the musician plays the accordion to the left of the door, a new person with a flat cap and a moustache, in two frames.
  - **Checked** in the game at 1364×603, with and without a terrace, from morning to dusk; tests cover every street's layout (houses never overlapping, the Żuraw's quay kept clear), the walks, the badges and every street's picture in every weather.
- 2026-10-06: Playtest of the street outside: some tourists in yellow and orange seemed to have beards. Long hair was one block hanging down to the chest, drawn over it, so the part under the chin read as a beard (a white one, on the pale blondes). Long hair now falls in two locks past the shoulders, with the neck and chest showing between them.
- 2026-10-06: The planning screens come before the light and weather (the player asked for the menus next, to match the room). First part, the Manage screen, settled as built:
  - **A notebook with ribbon tabs** (chosen over bookmarks down the side, which would take width from the content): the ten tabs stick out above a cream page as paper bookmarks, each with its drawn icon and a handwritten (Kalam) label, tinted in five folk colours (red, amber, green, blue, rose) with a stripe of the full colour along the top; the open tab is taller, the page's own paper, and joins the page. On narrow screens they scroll sideways, as before.
  - **The page:** cream paper with the same ink line, thin gold line and hard shadow as the day screen's panels; handwritten headings; boxes inside squared off; the buttons as paper tags, the main one red with a stitched edge.
  - **Around it:** the restaurant's own street (with its sign and today's special on the board), washed pale, inside the same page frame with folk flowers as the day screen; at dusk for the day report. The red bar along the top becomes the day screen's panels: the date and weather (and the clock while the day is paused), the money and stars, and the sound and speed buttons.
  - **Also:** the Restaurant tab shows the room in the sketchbook look; the day report, the ceremony and the game-over screen get the same backdrop, paper and buttons; choice cards, Mewa's tips and the map's previews are drawn as sheets of the same paper. The Old Town map itself is still pixel art, for its own item.
- 2026-10-06: The planning screens, second part: the inside of the tabs, settled as built. The cards on the page (shop items, staff, campaigns, choices, the goals, bookings, theme nights, today's news) are scraps of warm paper with a slightly uneven ink outline and a soft shadow, a few with a wash of colour (today's news blue, the goal amber, bookings and theme nights sand, what you own green, what you've chosen blue). The team's cards are taped on with a strip of washi tape, like photos in a scrapbook. The price steppers and small buttons are the day screen's square ink tags; the bars (ambiance, goals, morale) are drawn in ink and filled with hatched watercolour; subheadings are handwritten; tags on dishes are little stitched labels. A choice card's two answers are both handwritten, small enough to stay on one line.
