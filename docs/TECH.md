# Knappis – Technical decisions

## Stack

| Concern | Choice | Why |
|---------|--------|-----|
| Engine | **Phaser 3** | Mature 2D browser engine, built-in Gamepad plugin, tweens, particles, audio. Huge example library. |
| Language | **TypeScript** | Types catch mistakes early and let Claude reason about the code reliably. |
| Bundler / dev server | **Vite** | Instant reload, zero config, works well from WSL. |
| Unit tests | **Vitest** | Same config as Vite. Game rules live in plain TS so they can be tested without a browser. |
| Browser tests | **Playwright** | Load the page, screenshot, assert no console errors. Claude can run this to verify its own changes. |
| Lint / format | **ESLint + Prettier** | Keep the code boring and consistent. |
| Package manager | **npm** | Already installed (Node 24, npm 11). |

## Why browser + WSL

Development happens in WSL2 (Linux). The game is played in the Windows
browser at `http://localhost:5173`. The Gamepad API runs in the Windows
browser, so gamepad input works without any USB passthrough into WSL.
A desktop engine (Godot, Unity) running inside WSL would have made
gamepad testing painful.

## Architecture sketch

```
game/
  index.html
  src/
    main.ts              # Phaser.Game config + scene list
    scenes/
      BootScene.ts       # generate placeholder textures, load audio
      ConnectScene.ts    # "press any button" gamepad detection
      PlayScene.ts       # the room: avatar, tiles, HUD
      SettingsScene.ts
    input/
      InputService.ts    # gamepad + keyboard → { move: Vector2, pressed: Set<Button> }
      buttons.ts         # Button enum, Xbox/PS mapping tables
    rules/
      FindTheButton.ts   # pure state machine for Mode 1 (unit-tested)
      types.ts
    entities/
      Knappis.ts         # the character, drawn in code
    ui/
      GamepadDiagram.ts  # on-screen pad with highlightable buttons
      Tile.ts            # floor tile that looks like a giant face button
      StarRow.ts
    themes/
      xbox.ts            # colours, labels for A/B/X/Y
      playstation.ts
    audio/
      Sounds.ts          # placeholder tones via WebAudio
    debug.ts             # window.__knappis hooks for e2e tests (dev only)
    strings.ts           # all user-facing text (English; name stays Swedish)
  tests/
    unit/rules/FindTheButton.test.ts
    unit/input/*.test.ts
    e2e/smoke.spec.ts
    e2e/gameplay.spec.ts
```

Guiding rule: **game rules never import Phaser.** Scenes read input, call
into the rules object, and render whatever state comes back. This keeps the
interesting logic testable and lets the rendering be swapped later.

## Input handling notes

- **Xbox-style only for now.** Detect via `pad.id` / mapping === "standard";
  anything else gets a notice (see `docs/DESIGN.md#supported-gamepads`).

- The gamepad is read directly from `navigator.getGamepads()` each frame in
  `InputService`, not via Phaser's gamepad plugin (fewer moving parts, no
  timestamp quirks). Standard mapping indices: A=0, B=1, X=2, Y=3, LB=4,
  RB=5, LT=6, RT=7, D-pad up/down/left/right = 12/13/14/15.
- The Gamepad API needs a secure context: `http://localhost` is fine, a raw
  IP such as `http://172.x.x.x:5173` is not. The Connect screen shows a
  warning in that case.
- Browsers only expose a gamepad after the user presses something on it.
  The Connect scene exists partly for that reason.
- Dead zone ≈ 0.25 and movement speed low (~120 px/s on a 1280×720 canvas).
- Edge-detect button presses (down this frame, not held) so a long press
  counts once.
- Keyboard fallback: arrow keys move, letters A/B/X/Y press. Enter/Space
  also count as "any button" on the Connect screen.
- Audio can only start after a click or key press (browser autoplay rules);
  gamepad presses do not count. `Sounds.unlock()` is called on those events.
  The speaker icon always shows the player's on/off choice; while audio is
  still blocked it pulses softly as a "tap me once" hint, with no text.
- Headless Chromium (Playwright) runs at a low frame rate, so e2e tests use
  the `window.__knappis` debug hooks (dev builds only) to teleport and read
  state instead of timing key holds.

## Rendering on high-DPI screens

The game is designed in 1280×720 units, but the canvas is created at the
physical pixel size of the window (`src/render.ts`). Each scene calls
`setupCamera(this)` which zooms the camera by `RENDER_SCALE` so game code
still thinks in 1280×720. Text uses `CRISP_TEXT` so glyphs are rasterised
at full resolution. Without this, Windows display scaling (125–150 %) makes
everything blurry.

## Gamepad drawing

`GamepadDiagram` draws the pad from `gamepadSilhouette.ts`, an outline traced
from a straight-on photo of an Xbox Series controller with
`tools/trace-silhouette.cjs` (headless Chromium thresholds the photo and
reads the per-column top/bottom edges, plus the centroids of the coloured
letters for the face-button positions). To re-trace from a new photo:

```bash
cd game && NODE_PATH=node_modules node ../tools/trace-silhouette.cjs photo.png
```

## Hosting

Static site on GitHub Pages at https://wesztman.github.io/knappis/.
`.github/workflows/deploy.yml` runs on every push to `main`: install, checks,
Playwright e2e, `vite build` with `BASE_PATH=/knappis/`, then deploy. The
version shown in the start-screen footer comes from `game/package.json`.
Releases are git tags (`v1.0.0` = first edition).

## Conventions

- Game coordinates 1280×720, scaled to fit the window (`Phaser.Scale.FIT`).
- All user-facing strings live in one file, in English; no text is required to
  play. The name Knappis stays Swedish.
- Commit small and often; messages in English.
