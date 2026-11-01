# Knappis

*Knappis, the little button*

A friendly 2D browser game that teaches young children how to use a gamepad. Walk a little button-creature onto a symbol on the floor
and press the matching button on the pad.

**Play it:** https://wesztman.github.io/knappis/ (deployed from `main` by GitHub Actions)

**Supported gamepad:** Xbox-style only, for now. See [why](docs/DESIGN.md#supported-gamepads).

**Status:** first edition (v1.0.0) plus the first playtest's fixes. Walk
Knappis onto the glowing pad and press the matching button; one star per
button, four stars complete a round. A gear on the start screen sets walking speed and picks
"find the button" or "free play". See [`docs/ROADMAP.md`](docs/ROADMAP.md)
and [`docs/PLAYTESTS.md`](docs/PLAYTESTS.md).

- [Design](docs/DESIGN.md) · [Roadmap](docs/ROADMAP.md) · [Tech](docs/TECH.md)

## Troubleshooting

**The gamepad switches off the moment the game opens.** Seen in November
2026 with an Xbox gamepad on the Xbox Wireless Adapter in Windows 11: the
gamepad died the instant any browser page (or any program) first opened it,
yet worked on a USB cable, and kept working wirelessly if the page was
already running. The game is not at fault. The cause was a buggy update to
Microsoft's GameInput runtime, the Windows service that programs go through
to discover gamepads. Fix, in a Windows terminal:

```
winget update Microsoft.GameInput
```

Then restart the gamepad and reload. If no update is offered, open
Services, stop "GameInput Service", set its startup type to Disabled and
reboot. Quick way to tell this apart from a hardware fault: a USB cable
works, and the Xbox Accessories app works, while every gamepad web page
kills the pad.

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
