# Knappis

*Knappis, the little button*

A friendly 2D browser game that teaches young children how to use a gamepad. Walk a little button-creature onto a symbol on the floor
and press the matching button on the pad.

**Play it:** https://wesztman.github.io/knappis/ (deployed from `main` by GitHub Actions)

**Supported gamepad:** Xbox-style only, for now. See [why](docs/DESIGN.md#supported-gamepads).

**Status:** first edition (v1.0.0). Walk Knappis onto the pulsing
tile and press the matching button. Five stars completes a round. See [`docs/ROADMAP.md`](docs/ROADMAP.md).

- [Design](docs/DESIGN.md) · [Roadmap](docs/ROADMAP.md) · [Tech](docs/TECH.md)

## Troubleshooting

**The gamepad switches off the moment the game opens.** Seen with an Xbox
gamepad on the Xbox Wireless Adapter in Chrome on Windows (November 2026):
the gamepad died as soon as any page touched the Gamepad API, and would not
turn on again until the batteries were pulled. The game was not at fault; a
pending Chrome update was. Open `chrome://settings/help`, let Chrome update
and relaunch, then try again. Quick ways to tell the two apart: the Xbox
Accessories app working while every gamepad web page kills the pad points at
the browser, not the adapter.

**Nothing happens when a button is pressed.** Chrome only reveals a gamepad
after its first button press, and the page needs a secure context
(`localhost` or `https`). The start screen prints what it sees.

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
