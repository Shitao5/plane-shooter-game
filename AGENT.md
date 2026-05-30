# Agent Guide

This repo is a small browser game built with Vite, TypeScript, and Canvas 2D. Keep changes scoped and verify with the browser when gameplay or rendering changes.

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

Use `npm run build` before handing off code changes. For visual or interaction work, also run the dev server and inspect `http://127.0.0.1:4173/`.

## Current Architecture

Most game logic lives in `src/main.ts`. This is intentional for the current prototype scale; do not split into many files unless the change clearly benefits from it.

Important areas:

- Type definitions and tuning constants: top of `src/main.ts`
- Difficulty tuning: `DIFFICULTIES`
- Enemy templates: `ENEMIES`
- Weapon behavior: `BULLET_PROFILES`, `fireBullets`
- Power-up behavior: `PowerupMode`, `randomPowerupMode`, `triggerBomb`, `triggerHeal`, `triggerShield`
- Game update loop: `update`
- Rendering: `drawBackground`, `drawPlayer`, `drawEnemy`, `drawPowerups`, `drawHUD`, `drawOverlays`
- Input: `setupInput`
- Startup/reset: `setup`, `startGame`

## Gameplay Rules To Preserve

- Player movement must support both `W/A/S/D` and arrow keys.
- Player fires automatically; do not add a required shoot key unless explicitly requested.
- `Space` starts/restarts/resumes.
- `P` and `Esc` pause/resume.
- Difficulty selection uses `1 / 2 / 3`.
- Game state should remain one of `MENU`, `PLAYING`, `PAUSED`, or `GAME_OVER`.
- Off-screen bullets, enemies, power-ups, and particles must be cleaned up.
- `localStorage` stores the best score under `plane_shooter_high_score_v1`.

## Power-Up Model

`PowerupMode` currently includes:

- `spread`: timed weapon
- `rapid`: timed weapon
- `laser`: timed weapon
- `bomb`: instant screen clear
- `heal`: instant HP recovery or score conversion
- `shield`: timed collision protection

When adding a new power-up, update all of these together:

- `PowerupMode`
- `POWERUP_COLOR_BY_MODE`
- `POWERUP_SYMBOL`
- `randomPowerupMode`
- player-powerup collision handling in `update`
- `drawPowerups`
- menu/HUD copy if the player needs to understand it

## Balance Guidelines

The user specifically disliked crowded screens with oversized enemies. Preserve playable dodge space:

- Avoid increasing `SPRITE_DRAW_SCALE` aggressively.
- Keep heavy enemy visual size under control.
- Avoid fast growth in `maxEnemiesAllowed`.
- Avoid raising double-spawn probability too much.
- If enemy density increases, add counterplay through power-up frequency, shield windows, or player mobility.

## Rendering Notes

The sprite sheet is `public/assets/plane-shooter-sprites.png`.

Sprite mapping is controlled by:

- `SPRITE_CELL_WIDTH`
- `SPRITE_CELL_HEIGHT`
- `SPRITE_SOURCES`
- `SPRITE_DRAW_SCALE`

The generated sprite sheet contains only some explicit icons, so `bomb`, `heal`, and `shield` reuse existing sheet cells with Canvas overlays. If adding a real sprite sheet, keep the overlays or update mapping carefully.

Canvas drawing mutates global context state. Before drawing HUD text, explicitly set:

```ts
ctx.textAlign = 'left';
ctx.textBaseline = 'alphabetic';
```

This avoids text alignment leaks from centered labels in power-up rendering.

## Verification Checklist

Before finishing a gameplay/rendering change:

- `npm run build` passes.
- Start the game from menu with `Space`.
- Select at least one difficulty with `1 / 2 / 3`.
- Move with arrow keys or WASD.
- Confirm auto-fire still works.
- Confirm enemies descend with varied paths.
- Confirm pause/resume with `P` or `Esc`.
- Confirm HUD text does not overlap.
- Check a narrow viewport around `390x844` when layout or text changes.

## Git Hygiene

Do not commit `node_modules`, `dist`, screenshots, or temporary Playwright files. `.gitignore` already excludes the main generated folders; remove temporary artifacts before final handoff.
