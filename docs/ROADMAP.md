# Knappis – Roadmap

Each milestone ends with something playable in the browser. Tick boxes as
they land. Keep this file honest: if a milestone changes, edit it here.

## M0 – Project skeleton
- [ ] Vite + TypeScript + Phaser 3 project in `game/`
- [ ] `npm run dev` serves on `0.0.0.0` so the Windows browser can reach WSL
- [ ] Blank Phaser scene renders a coloured background and "Knappis" text
- [ ] ESLint + Prettier, `npm run check` (typecheck + lint)
- [ ] Vitest wired up with one trivial test
- [ ] Playwright smoke test: page loads, no console errors, canvas present

## M1 – Walk around
- [ ] Knappis avatar drawn with Phaser graphics (circle + eyes + legs)
- [ ] `InputService`: unified movement vector from gamepad left stick, D-pad,
      and keyboard arrows, with dead zone
- [ ] Movement clamped to the room bounds
- [ ] Walk bounce animation
- [ ] "Connect your gamepad" overlay shown until a pad is detected
- [ ] Non-Xbox pad detected → friendly notice that only Xbox-style is supported
      (keyboard dismisses it)

## M2 – Core loop
- [ ] Four symbol tiles placed in the room (Xbox theme)
- [ ] Standing on a tile highlights it + soft sound
- [ ] One tile is "asked for" and pulses
- [ ] On-screen gamepad drawing with the asked-for button lit
- [ ] Correct press → celebration (particles, jingle, star added)
- [ ] Wrong press → gentle wobble, hint repeats
- [ ] 5 stars → round complete dance → reshuffle tiles
- [ ] Unit tests for the game-rules state machine (pure TS, no Phaser)

## M3 – Polish for real kids
- [ ] Sound effects (generated or CC0)
- [ ] Settings scene: movement speed, hold-to-press, timer on/off
- [ ] Symbol theme switch (Xbox / PlayStation) – first non-Xbox support
- [ ] Playtest with an actual child; write findings in `docs/PLAYTESTS.md`

## M4 – More modes
- [ ] Mode 2: two-in-a-row sequence
- [ ] Mode 3: shoulder buttons & triggers
- [ ] Mode select screen with pictures, no text

## Later / maybe
- Two-player mode
- Itch.io or GitHub Pages deploy
- Real sprite art and a proper Knappis character sheet
- Swedish/English voice prompts
