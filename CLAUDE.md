# CLAUDE.md

## Project

"Old Town Kitchen" (working title) is a cozy restaurant management game set in Gdańsk's Old Town.

- It is a personal gift, for one player on an Android tablet (Samsung Galaxy Tab A series).
- It is installed as a PWA from GitHub Pages.
- The full design is in `project.md`. Read the relevant section before starting any feature.
- The next task is the first unchecked item of M7b in `project.md` section 12, then M7c. M5's "Balancing" item stays open as an ongoing task alongside them, and M6 is the gift day itself.
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
```

Add `?perf` to the game's address to show the performance meter (for checking on the tablet).

## Architecture rules

- `src/sim/` is the pure simulation.
  - No React, no DOM, no browser APIs.
  - Deterministic given a seed: use the seeded RNG in `src/sim/rng.ts`, never `Math.random()`.
- `src/data/` holds all content and tunable numbers (`balance.ts`, `dishes.ts`, `groups.ts`, `locations.ts`, `rivals.ts`, `events.ts` and more).
  - Never hard-code balance numbers in logic.
- `src/ui/` holds React components and screens.
  - The UI reads simulation state and sends player actions.
  - It never changes simulation state directly.
- `src/ui/pixel/` draws all the pixel art in code at runtime (rooms, people, street, map, icons); no image files are shipped. `scripts/pixel/` holds dev-only art tools that never ship.
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
  - DOM/CSS and SVG only (the pixel art is drawn by our code into images shown as DOM `<img>`s)
  - no heavy canvas or particle effects
  - animate with CSS, using transforms where possible
  - small total bundle
- All player-facing text is English and cozy in tone.

## Workflow

- Work on one checklist item at a time. When it is done, tick it in `project.md`.
- Run `npm run test` (and `npm run build` for UI or config changes) before saying a task is finished.
- For pixel-art changes, also look at the pictures from `scripts/pixel/room-preview.ts` and at the game at 1364×603.
- Ask before adding a new dependency.
- Don't add features that aren't in `project.md`. Suggest them instead, and add accepted decisions to the decision log (section 16).
- When changing balance numbers, or adding anything that changes who comes or what they spend, run `npm run simulate` and report the before and after results. For the "before", run it on the last commit in a separate `git worktree` (with a junction to this `node_modules`) rather than stashing the working files.
- For UI changes, look at the screen at 1364×603 with `scripts/play-day.mjs` (above), and read its screenshots.
- When a task is finished and checked, commit it and push to `main` when the user asks (pushing deploys to GitHub Pages through `.github/workflows/deploy.yml`). The `gh` CLI isn't installed.
