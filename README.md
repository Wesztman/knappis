# Knappis

A friendly 2D browser game that teaches young children how to use a gamepad. Walk a little button-creature onto a symbol on the floor
and press the matching button on the pad.

**Supported gamepad:** Xbox-style only, for now. See [why](docs/DESIGN.md#supported-gamepads).

**Status:** M0 done (project skeleton boots in the browser). See [`docs/ROADMAP.md`](docs/ROADMAP.md).

- [Design](docs/DESIGN.md) · [Roadmap](docs/ROADMAP.md) · [Tech](docs/TECH.md)

## Running

```bash
cd game
npm install
npm run dev        # open http://localhost:5173 in your Windows browser
```

## Checks

```bash
cd game
npm run check      # typecheck + lint + format + unit tests
npm run test:e2e   # Playwright: boots the game headless, screenshots to test-results/
```

First time only: `npx playwright install chromium`.
