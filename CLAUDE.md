# CLAUDE.md

## Project

"Old Town Kitchen" (working title) is a cozy restaurant management game set in Gdańsk's Old Town.

- It is a personal gift, for one player on an Android tablet (Samsung Galaxy Tab A series).
- It is installed as a PWA from GitHub Pages.
- The full design is in `project.md`. Read the relevant section before starting any feature.
- **The priority is the new look: M8, "The Kashubian sketchbook look".** The next task is the first unchecked item of M8 in `project.md` section 12: **light and weather**, the sky, rain and the evening, inside and outside. The plan is in section 9.5 ("Light and weather", and "Where M8 stands" says what the street already has), the reference picture is `art/concepts/v8/sketchbook-page.png`, and the decision log (section 16, 2026-10-06) records how the inside and the street outside were built. Propose a small design first, then build it.
- Every icon is drawn (done 2026-10-06): emojis written anywhere in the game's text show as drawn icons, because the game's JSX swaps them (`src/ui/iconJsx`, `src/ui/Icon.tsx`). A new emoji needs a drawing and an entry in `FROM_EMOJI` in `src/ui/sketch/icons.ts` (a test fails otherwise); for an icon on its own, use `<Icon id="..." size={...} />`. Check with `node scripts/emoji-check.mjs <folder>`.
- The sketchbook look is the normal view of the day (since the street outside, 2026-10-06); `?pixel` on the game's address shows the old pixel art until it is retired. The inside is `src/ui/SketchRoomView.tsx`, the street outside `src/ui/SketchStreetView.tsx` (a round button switches them, with a badge for what needs the player on the other side), what they share is in `src/ui/sketchView/shared.tsx`, and their drawing code is in `src/ui/sketch/`. Visits run on their own timeline, a little behind the game (see the decision log), so the views can show walking in, reading the menu, waiting and being served.
- After M8: the last item of M7b (the morning market), then M7c. M5's "Balancing" item stays open as an ongoing task alongside them, and M6 is the gift day itself.
- M7b's ideas are described in section 6.15, but only in outline: the details of each are settled when it is built. Look at the code first, propose a small design, and once it is built, record what was settled in the decision log (section 16), as was done for "Tomorrow's forecast".

## About the developer

The developer is new to game development and new to this stack. For every task:

- Explain what you did in plain language.
- Say how to see or test it in the browser.
- Keep changes small and focused on one checklist item.

## Stack

- TypeScript (strict), React, Vite
- vite-plugin-pwa for the manifest and service worker
- Vitest for tests
- Zustand for UI state that wraps the simulation state
- No backend. No network calls at runtime. Everything must work offline.

## Commands

```bash
npm install        # install dependencies
npm run dev        # local dev server (open the printed URL)
npm run build      # production build into dist/
npm run preview    # serve the production build locally
npm run test       # run Vitest
npm run simulate   # headless full-season balance simulation
SEEDS=1 npm run simulate                        # a quicker run with one seed
npx tsx scripts/pixel/room-preview.ts <folder>  # draw the restaurant, its kitchen and everyone in it into PNGs
npx vite preview --port 4179 --strictPort       # serve the build for play-day.mjs (after npm run build)
node scripts/play-day.mjs <folder> [days]       # play days in headless Edge at 1364x603 and screenshot the screens and day reports
npx tsx scripts/pixel/concepts-v8.ts            # write the sketchbook concept page to art/concepts/v8/html
node scripts/pixel/shoot.mjs <html|folder> <png|folder> [w] [h]  # render HTML/SVG pages to PNGs in headless Edge
npx tsx scripts/pixel/sketch-preview.ts <folder>  # draw full houses and the six streets in the sketchbook look (then shoot.mjs <folder>/html <folder>)
node scripts/catch-moment.mjs <url> <selector> <out.png> [speed] [seconds]  # play until something shows (e.g. ".sk-ring"), pause, screenshot
node scripts/emoji-check.mjs <folder> [url]  # walk every screen, list any emoji still shown as text, screenshot each
```

Add `?perf` to the game's address to show the performance meter (for checking on the tablet). Add `?pixel` to see the old pixel-art day screen until M8 retires it; `?slots=12` lays the sketchbook room out for that many tables.

## Architecture rules

- `src/sim/` is the pure simulation.
  - No React, no DOM, no browser APIs.
  - Deterministic given a seed: use the seeded RNG in `src/sim/rng.ts`, never `Math.random()`.
- `src/data/` holds all content and tunable numbers (`balance.ts`, `dishes.ts`, `groups.ts`, `locations.ts`, `rivals.ts`, `events.ts` and more).
  - Never hard-code balance numbers in logic.
- `src/ui/` holds React components and screens.
  - The UI reads simulation state and sends player actions.
  - It never changes simulation state directly.
- `src/ui/sketch/` (new in M8) draws the Kashubian sketchbook art in code as SVG: rooms, people, street, map, icons, the page frame. Its SVG filters (wash, ink wobble, grain) are too slow to run live, so every piece is baked once into a picture (through an offscreen canvas) and cached; only the baked pictures move during the day.
- `src/ui/pixel/` draws today's pixel art. M8 replaces it piece by piece and then removes it, so don't extend it.
- Art is drawn in code where possible. Picture files and one bundled handwriting font (with Polish letters, precached for offline use) are allowed since 2026-10-06; ask before adding one. `scripts/pixel/` holds dev-only art tools that never ship.
- `src/save/` handles save/load.
  - Saves go to `localStorage`, wrapped in try/catch.
  - Saves carry a `saveVersion` and a migration function.
  - Autosave at the end of every in-game day.
- Game state must be plain serialisable data: no classes with methods inside the saved state.

## Tablet and UI rules

- Landscape only. The tablet lays the page out at 1364×603 CSS pixels: check every screen there. Layout must also work from about 850×530 upwards.
- Touch targets at least 48 px.
- No hover-only interactions.
- Disable pinch-zoom and pull-to-refresh.
- Keep it light for a budget tablet:
  - DOM/CSS and SVG only (the art is drawn by our code into images shown as DOM `<img>`s)
  - no live canvas drawing or particle effects; a canvas may only be used once, to bake a picture
  - no live SVG filters: bake them into pictures
  - animate with CSS, using transforms where possible
  - small total bundle
- All player-facing text is English and cozy in tone.

## Workflow

- Work on one checklist item at a time. When it is done, tick it in `project.md`.
- Run `npm run test` (and `npm run build` for UI or config changes) before saying a task is finished.
- For art changes, look at the game at 1364×603 and compare it with `art/concepts/v8/sketchbook-page.png`. For the old pixel art, `scripts/pixel/room-preview.ts` draws preview pictures. For the new art, check how long baking takes and the frame rate with `?perf`.
- Ask before adding a new dependency.
- Don't add features that aren't in `project.md`. Suggest them instead, and add accepted decisions to the decision log (section 16).
- When changing balance numbers, or adding anything that changes who comes or what they spend, run `npm run simulate` and report the before and after results. For the "before", run it on the last commit in a separate `git worktree` (with a junction to this `node_modules`) rather than stashing the working files.
- For UI changes, look at the screen at 1364×603 with `scripts/play-day.mjs` (above), and read its screenshots. For the outside view, click the round button labelled "Outside"; for moments that come and go, use `scripts/catch-moment.mjs`; for the art itself, `scripts/pixel/sketch-preview.ts`.
- When a task is finished and checked, commit it and push to `main` when the user asks (pushing deploys to GitHub Pages through `.github/workflows/deploy.yml`). The `gh` CLI isn't installed.
