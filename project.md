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

1. **Cozy, never punishing.** Mistakes cost money and reputation, never the game. There is no game over.
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
  - DOM/CSS UI with light SVG art; no heavy canvas effects.
  - Aim for under 5 MB total download.
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
- **No-fail rule:** if cash falls below zero, the player picks one of two rescues:
  - a friendly bank loan with gentle interest
  - once per season, "Babcia's envelope", a gift with no strings attached
- **Difficulty options:**
  - *Relaxed:* more starting cash, calmer rivals
  - *Normal:* the balanced default

## 6. Game systems

### 6.1 Locations (Old Town)

Values below are **starting points**. All tuning lives in `src/data/balance.ts`.

| Location | Rent / day | Foot traffic | Main guests | Notes |
|---|---|---|---|---|
| ul. Ogarna | 300 zł | Low | Locals, students | Starting location: quiet and cheap |
| ul. Piwna | 600 zł | Medium | Locals, tourists | Near St. Mary's Basilica |
| ul. Mariacka | 900 zł | Medium | Foodies, tourists | Romantic, small premises, great terrace |
| ul. Długa / Długi Targ | 1,500 zł | Very high | Tourists | Neptune Fountain; expensive |
| Długie Pobrzeże | 1,100 zł | High in summer | Tourists | Waterfront by the Crane (Żuraw); terrace boom in good weather |
| Wyspa Spichrzów | 800 zł | Medium | Office workers, students, foodies | Modern Granary Island; lunch-heavy |

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
- **Starting wages:** chef about 350 zł/day, waiter about 250 zł/day.
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

- **Restaurant view** (main): a cozy illustrated cross-section of the dining room and kitchen. Guests appear as simple figures with reaction bubbles.
- **Old Town map:** the illustrated map, locations, rivals, relocation.
- **Menu:** dish list, dish creator, prices, lunch set.
- **Kitchen:** equipment.
- **Staff:** team and hiring.
- **Interior:** seats, decor, terrace.
- **Marketing:** campaigns and promotions.
- **Reports:** today, this week, graphs, reviews.
- **Goals and help:** Mewa's goals and the help book.
- **Settings:** difficulty, sound, save export/import, reset.

## 9. Art, audio and feel

- **Style:** warm flat illustration.
  - Colourful Gdańsk gabled houses, brick red, amber, sea blue.
  - Rounded shapes and friendly fonts.
- **Order of work:**
  1. placeholders first (coloured boxes, emoji)
  2. hand-made SVG art later
  3. CC0 assets (e.g. Kenney.nl) where they fit
- **Audio:** soft background music, café ambience, a till "ding", seagull calls. Use CC0 sources only; a mute toggle is required.
- **Juice:** coins popping, stars appearing, a small celebration when a goal is reached.

## 10. Personal touches (fill in)

- Her name: Joana / the restaurant's default name: **[Joana´s Kitchen ]**
- Her favourite dish, which becomes a secret recipe with a perfect combo bonus: **[Aroz de Vitela  ]**
- Places in Gdańsk that mean something to you both (cameos on the map or in events): **[Mariacka ]**
- Inside jokes to hide in reviews, staff bios or rival messages: **[ ]**
- A regular guest based on you: **[give me cytrynowka to my dish ]**
- Ending: after winning the Golden Neptune, a personal message / credits: **[Parabens! Now you are ready to open your dream restaurant ]**

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
- [ ] Guest generation, choice model, kitchen queue, satisfaction
- [ ] `npm run simulate`: plays a whole season headless with simple strategies and prints results
- [ ] Unit tests for the core formulas

**M2 – Playable prototype**

- [ ] HUD, speed controls, day start and end flow
- [ ] Menu and price screen, staff hiring, daily report
- [ ] Autosave and load

**M3 – MVP systems**

- [ ] Dish creator, lunch set, equipment, interior and terrace, marketing
- [ ] Rival AI, events, weather, reviews
- [ ] Map and relocation
- [ ] Tutorial, weekly goals, Golden Neptune ending
- [ ] Settings: difficulty, save export/import

**M4 – Gdańsk and personal**

- [ ] Illustrated map and restaurant view
- [ ] Event texts, rival personalities, review lines
- [ ] Everything from section 10

**M5 – Polish and balance**

- [ ] Art pass, sound, animations
- [ ] Balancing with the simulator plus playtests on the real tablet
- [ ] Performance check on the tablet

**M6 – Gift day**

- [ ] Final install on her tablet
- [ ] Make a backup save code

## 13. Balancing approach

- All tunables live in `src/data/balance.ts`.
- The headless simulator runs full seasons with scripted strategies ("do nothing", "cheap and fast", "quality focus", "balanced").
- **Targets on Normal:**
  - "do nothing" struggles but survives with help
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
