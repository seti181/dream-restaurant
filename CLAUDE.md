# CLAUDE.md

## Project

"Old Town Kitchen" (working title) is a cozy restaurant management game set in Gdańsk's Old Town.

- It is a personal gift, for one player on an Android tablet (Samsung Galaxy Tab A series).
- It is installed as a PWA from GitHub Pages.
- The full design is in `project.md`. Read the relevant section before starting any feature.
- The current milestone is the first unchecked one in `project.md` section 12.

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

These are created in milestone M0.

```bash
npm install        # install dependencies
npm run dev        # local dev server (open the printed URL)
npm run build      # production build into dist/
npm run preview    # serve the production build locally
npm run test       # run Vitest
npm run simulate   # headless full-season balance simulation
```

## Architecture rules

- `src/sim/` is the pure simulation.
  - No React, no DOM, no browser APIs.
  - Deterministic given a seed: use the seeded RNG in `src/sim/rng.ts`, never `Math.random()`.
- `src/data/` holds all content and tunable numbers (`balance.ts`, `dishes.ts`, `groups.ts`, `locations.ts`, `rivals.ts`, `events.ts`).
  - Never hard-code balance numbers in logic.
- `src/ui/` holds React components and screens.
  - The UI reads simulation state and sends player actions.
  - It never changes simulation state directly.
- `src/save/` handles save/load.
  - Saves go to `localStorage`, wrapped in try/catch.
  - Saves carry a `saveVersion` and a migration function.
  - Autosave at the end of every in-game day.
- Game state must be plain serialisable data: no classes with methods inside the saved state.

## Tablet and UI rules

- Landscape only. Layout must work from 1280×800 upwards.
- Touch targets at least 48 px.
- No hover-only interactions.
- Disable pinch-zoom and pull-to-refresh.
- Keep it light for a budget tablet:
  - DOM/CSS and SVG only
  - no heavy canvas or particle effects
  - small total bundle
- All player-facing text is English and cozy in tone.

## Workflow

- Work on one checklist item at a time. When it is done, tick it in `project.md`.
- Run `npm run test` (and `npm run build` for UI or config changes) before saying a task is finished.
- Ask before adding a new dependency.
- Don't add features that aren't in `project.md`. Suggest them instead, and add accepted decisions to the decision log (section 16).
- When changing balance numbers, run `npm run simulate` and report the before and after results.
