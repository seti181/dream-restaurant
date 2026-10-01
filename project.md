# Old Town Kitchen (working title)

A cozy restaurant management game set in Gdańsk's Old Town, made as a gift for **[HER NAME]**.
Inspired by 90s management games like Pizza Syndicate, but gentler: no crime, no sabotage.
The player is up against friendly rivals, fighting only for the city's hungry guests.

- **Platform:** Android tablet (Samsung Galaxy Tab A series), landscape, touch only
- **Language:** English
- **Tone:** cozy, warm, funny, low-stress
- **Length:** one season takes roughly 3–5 hours ("a few evenings"); free play continues afterwards

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
  - Responsive from about 1280×800 upwards.
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
2. **Open:** the day plays out from 11:00 to 22:00 in about 50 seconds at 1× speed. Pause, 2× and 4× are available.
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

- **Season:** 1 April to the end of St. Dominic's Fair (mid-August), about 20 in-game weeks. The in-game year is fixed and fictional so dates are predictable.
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
  - a seasonal permit, available May to September
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
- [ ] Pixel art: Old Town map, food icons and UI icons
- [ ] Restaurant view while planning: a tab next to the Map that shows the restaurant before opening
- [ ] Balancing with the simulator plus playtests on the real tablet
- [ ] Performance check on the tablet

**M6 – Gift day**

- [ ] Final install on her tablet
- [ ] Make a backup save code

## 13. Balancing approach

- All tunables live in `src/data/balance.ts`.
- The headless simulator runs full seasons with scripted strategies ("do nothing", "cheap and fast", "quality focus", "balanced").
- **Targets on Normal:**
  - "do nothing" loses money, like bad decisions do
  - "balanced" becomes profitable by week 3–4
  - a thoughtful player wins the Golden Neptune on the first try, with some tension in the final weeks
- **Pace target:** about 50 seconds per day at 1× speed, which makes a season about 3–5 hours including planning.

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
