# Knappis – Roadmap

Each milestone ends with something playable in the browser. Tick boxes as
they land. Keep this file honest: if a milestone changes, edit it here.

## M0 – Project skeleton ✅
- [x] Vite + TypeScript + Phaser 3 project in `game/`
- [x] `npm run dev` serves on `0.0.0.0` so the Windows browser can reach WSL
- [x] Blank Phaser scene renders a coloured background and "Knappis" text
- [x] ESLint + Prettier, `npm run check` (typecheck + lint + format + unit tests)
- [x] Vitest wired up with one trivial test
- [x] Playwright smoke test: page loads, no console errors, canvas present

## M1 – Walk around ✅
- [x] Knappis avatar drawn with Phaser graphics (circle + eyes + legs)
- [x] `InputService`: unified movement vector from gamepad left stick, D-pad,
      and keyboard arrows, with dead zone
- [x] Movement clamped to the room bounds
- [x] Walk bounce animation
- [x] "Connect your gamepad" overlay shown until a pad is detected
- [x] Non-Xbox pad detected → friendly notice that only Xbox-style is supported
      (keyboard dismisses it)

## M2 – Core loop ✅
- [x] Four symbol tiles placed in the room (Xbox theme)
- [x] Standing on a tile highlights it + soft sound
- [x] One tile is "asked for" and pulses
- [x] On-screen gamepad drawing with the asked-for button lit
- [x] Correct press → celebration (particles, jingle, star added)
- [x] Wrong press → gentle wobble, hint repeats
- [x] 5 stars → round complete dance → reshuffle tiles
- [x] Unit tests for the game-rules state machine (pure TS, no Phaser)

## M3 – Polish for real kids
- [x] Sound effects (generated WebAudio tones for now; CC0 samples later)
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
