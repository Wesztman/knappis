# Knappis

A 2D browser game that teaches young children (3–6) to use a gamepad.
Owner: Carl, learning game development; explain choices as you make them.

## Read first
- `docs/DESIGN.md` – what the game is and why
- `docs/ROADMAP.md` – milestones with checkboxes; update it when things land
- `docs/TECH.md` – stack, architecture, input notes

## Stack
Phaser 3 + TypeScript + Vite, tests with Vitest (rules) and Playwright
(browser smoke). Code lives in `game/`. Dev server must bind `0.0.0.0` so the
Windows browser can reach WSL.

## Rules of the repo
- Game rules (`game/src/rules/`) never import Phaser; keep them pure and tested.
- Placeholder art is generated in code; do not block on assets.
- Kid-first: no fail states, no small text, feedback on every input.
- Keep `docs/ROADMAP.md` honest; tick boxes in the same commit as the work.
- Commit messages in English, small commits.
