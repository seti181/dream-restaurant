# Old Town Kitchen (working title)

A cozy restaurant management game set in Gdańsk's Old Town, made as a gift for **[HER NAME]**.
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

The season runs from spring until the great St. Dominic's Fair in August. At the end of the Fair, the city awards the **Golden Neptune** to the Old Town's favourite restaurant.

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
  - Responsive from about 850×530 CSS pixels upwards: Samsung tablets lay the page out smaller than their screen's pixels (a 1920×1200 screen is about 960×600 to the browser).
  - Touch targets at least 48 px.
  - Nothing depends on hover.
  - Pinch-zoom and pull-to-refresh disabled.
- **Performance:** must run smoothly on a budget tablet.
  - DOM/CSS UI. Art is pixel-art sprites (small PNG sprite sheets) shown as DOM images, scaled up by whole numbers so the pixels stay crisp. Light SVG only where it helps; no heavy canvas effects.
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
3. Name the dish (optional, for fun).
4. Set its price.

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
- **Morale:** planned for after the MVP (fair wages and days off keep people happy).

### 6.6 Interior and terrace

- **Seats:** start with 16; buy tables in steps of 4 seats, limited by room size.
- **Decor styles:** Hanseatic, Maritime, Rustic Polish, Modern.
  - Each decor item adds ambiance points.
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
  - value for money
  - waiting time
  - ambiance
  - service
- Satisfaction moves the group's reputation.
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

**Weather:** sunny, cloudy, rain or heatwave, generated with a seasonal bias.

- Rain cuts foot traffic and shuts the terrace.
- A heatwave boosts ice cream and lemonade and hurts hot soups.

**Random events (cozy):**

- a tour bus group arrives
- a food critic visits
- a local newspaper feature
- a supplier discount week
- street works reduce traffic
- a wedding party booking
- a regular's birthday
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

**2. A shorter season: about 40 days, ending with St. Dominic's Fair (Jarmark Dominikański).** Proposed: six full weeks, Monday 8 July to Sunday 18 August (42 days), which keeps the weekly rhythm (rent, Mewa's goal, the rivals' moves and new job candidates every Monday). The season covers the summer holidays, the tall ships festival (11–14 July), the Fair (27 July – 18 August) and the Fair cook-off (10 August). Easter, Majówka, Juwenalia and Corpus Christi fall outside it; the Amber evening on Mariacka (a personal touch) moves into the season. Everything tied to week numbers is rescaled (Tomek and Adrian, the secret recipe, Mewa's goals, rival reactions), and the economy is rebalanced with the simulator so the targets in section 13 still hold. With the slower day, a season is about 70 minutes of service plus planning: two or three evenings.

**3. The tabs during the day.** Map, Menu, Kitchen, Interior, Staff, Marketing and the reports can be opened while the restaurant is open; the clock pauses while a tab is open. Proposed rules (option B): prices, the menu, marketing and the happy hour change straight away; purchases (tables, decor, equipment) are delivered and new staff start the next morning.

**4. Choice cards: more of them, and more random.**
- **Rarity:** common, uncommon, rare and very rare cards (like Lech Wałęsa).
- **Cards rest after they come up** (built first as a shuffled deck, replaced on 2026-10-02): a card waits about a week while the others have their turn, instead of only being less likely for three days.
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
- **Seasonal ingredients and specials:** what's fresh in July and August (strawberries, blueberries, chanterelles, new potatoes, plums) and a "Dziś polecamy" board for today's special.
- **Replying to reviews:** a kind reply can win back an unhappy guest.
- **Attracting passers-by** (C3 in 9.1.1): a waiter offering samples at the door, flyers, a better menu board.
- **Bigger premises:** a cellar room (piwnica), a bar counter, a kids' corner.
- **A sticker album ("Gdańsk passport"):** achievements as collectible pixel stickers.
- **Mewa's finds:** Mewa brings things she found in town (a piece of amber, a lost key, a recipe card) that unlock decor or small events.

Not now (considered and left out): events the player hosts (workshops, tastings, receptions), an autumn and Christmas-market season, a cook-off against the rivals, postcards.

## 7. Simulation model (implementation notes)

The simulation is pure TypeScript with no UI code. It is deterministic given a seed and advances in **ticks of 5 in-game minutes**.

1. **Guest generation.** For each location and tick:
   - base traffic × hour curve × weekday factor × season × weather × event modifiers
   - the result is split into groups by the location's mix
   - Poisson-style random rounding turns it into parties
2. **Choice.** Each party scores every restaurant within walking range:
   - `utility = w_taste·menuMatch + w_price·priceFit + w_rep·reputation + w_aware·awareness + w_dist·proximity + w_amb·ambiance + w_wait·expectedWait + noise`
   - The weights come from the party's group.
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

- **View:** isometric rooms on a 2:1 tile grid (e.g. 32×16-pixel floor tiles); characters about 16×24 to 24×32 pixels.
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
- The pictures are shown as DOM images placed on the isometric grid and stacked back to front. Scaling is by whole device pixels with `image-rendering: pixelated` (crisp); only when that would waste a lot of space (the biggest rooms) an in-between scale is used. Animations use CSS.
- The simulation does not change. The restaurant view keeps reading the same `floorView()` snapshot; only how it is drawn changes.
- If DOM sprites turn out to be too slow on the tablet, a single plain 2D canvas for the restaurant view is the fallback. That would need a change to the CLAUDE.md rules, so it is asked about first.

**Sources and licences** (to decide before drawing starts, see section 15):

1. **Ready-made packs** (e.g. on itch.io): fastest and best looking. The licence must allow use in a non-commercial personal gift. It must also allow the image files to sit in a **public** GitHub repository: GitHub Pages on a free account needs a public repo, and many paid packs forbid sharing the raw files.
2. **CC0 packs** (e.g. Kenney.nl, OpenGameArt CC0): free and safe to use, but mixing several packs risks a patchy style.
3. **Pixel art drawn for this game:** by hand, or written as palette-indexed pixel grids in code. Consistent and licence-free, but more work, and simpler than a professional pack.
4. **AI-generated sprites:** good for trying ideas. Clean pixel grids and consistent animation frames are hard to get, and the service's terms must allow the use.

**Order of work for the pixel art** (one step at a time, each tested in the browser and on the tablet):

1. Pick sources and palette, then build **one sample scene** (a small dining room with two tables, one guest, one waiter, one chef) and approve the look.
2. The restaurant view: rooms, furniture, decor, equipment, terrace.
3. Characters: guests, staff and special characters, with animations and bubbles.
4. The Old Town map, food icons and UI icons.

### 9.1.1 The street around the restaurant: proposals (waiting for a choice)

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
- **Juice:** coins popping, stars appearing, a small celebration when a goal is reached.

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
- staff morale and days off
- ingredient stock and deliveries
- festival stall mini-game at the Fair
- more dishes and seasonal menus
- achievements
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
- [ ] Staff growth: short storylines for the team
- [ ] Seasonal ingredients and a "Dziś polecamy" specials board
- [ ] Replying to reviews
- [ ] Attracting passers-by
- [ ] Bigger premises: cellar room, bar counter, kids' corner
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
- **Proposed fix:**
  1. **People see it's full.** A restaurant with no free table looks less tempting: its expected wait includes the time until the next table frees up, so most people pick somewhere else (or nowhere) before walking over.
  2. **A short queue at the door.** Up to 2–3 parties can wait at the door for a few minutes (within their patience) and are seated when a table frees up; the rest go elsewhere. Visible as people standing by the door, which also fits "Seat guests yourself" (M5b) later.
  3. **Count only who came to the door.** "No free table" then counts parties who actually came and found it full, so it stays a useful hint to buy tables. Target: on the busiest days, turned away stays well below the number served.
  4. Walk-outs (waited too long for food) get the same check in the next simulator run, in case they also pile up on long days.
- Re-run `npm run simulate` before and after, and report the change.

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
