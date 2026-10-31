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
    ui/
      GamepadDiagram.ts     # on-screen pad with highlightable buttons
      StarRow.ts
    themes/
      xbox.ts            # colours, labels for A/B/X/Y
      playstation.ts
    audio/
      Sounds.ts          # thin wrapper; placeholder tones via WebAudio
  tests/
    rules/FindTheButton.test.ts
    e2e/smoke.spec.ts
```

Guiding rule: **game rules never import Phaser.** Scenes read input, call
into the rules object, and render whatever state comes back. This keeps the
interesting logic testable and lets the rendering be swapped later.

## Input handling notes

- **Xbox-style only for now.** Detect via `pad.id` / mapping === "standard";
  anything else gets a notice (see `docs/DESIGN.md#supported-gamepads`).

- Phaser's Gamepad plugin exposes `pad.leftStick`, `pad.A/B/X/Y` and
  `pad.buttons[i]`. Standard mapping indices: A=0, B=1, X=2, Y=3, LB=4,
  RB=5, LT=6, RT=7, D-pad up/down/left/right = 12/13/14/15.
- Browsers only expose a gamepad after the user presses something on it.
  The Connect scene exists partly for that reason.
- Dead zone ≈ 0.25 and movement speed low (~120 px/s on a 1280×720 canvas).
- Edge-detect button presses (down this frame, not held) so a long press
  counts once.

## Rendering on high-DPI screens

The game is designed in 1280×720 units, but the canvas is created at the
physical pixel size of the window (`src/render.ts`). Each scene calls
`setupCamera(this)` which zooms the camera by `RENDER_SCALE` so game code
still thinks in 1280×720. Text uses `CRISP_TEXT` so glyphs are rasterised
at full resolution. Without this, Windows display scaling (125–150 %) makes
everything blurry.

## Conventions

- Game coordinates 1280×720, scaled to fit the window (`Phaser.Scale.FIT`).
- All user-facing strings live in one file; no text is required to play.
- Commit small and often; messages in English.
