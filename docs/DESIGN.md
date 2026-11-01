# Knappis – Game Design

> Swedish: "knapp" = button, "-is" = affectionate diminutive. Knappis is a
> little round button with legs who wants to be pressed.

## One-line pitch

A calm, friendly 2D game that teaches young children how to use a gamepad: move with the stick, then press the button that matches the
symbol you are standing on.

## Who it is for

- **Player:** a child who has never (or barely) held a real gamepad. May not
  read. Small hands, imprecise thumbs, short attention span.
- **Co-pilot:** a parent sitting next to them. The game should be pleasant
  for the adult too, and give them obvious moments to cheer.

## Design principles

1. **Feedback is the game.** Every input produces a visible, audible result.
   Success is a celebration. Mistakes are gentle, never a "game over".
2. **One idea at a time.** Each mode introduces exactly one new input.
3. **Big, slow, readable.** Large avatar, slow movement, high-contrast
   symbols, no small text. Nothing requires reading.
4. **The gamepad is on screen.** A drawing of the pad shows which button
   lit up. Borrowed from Astro's Playroom. This also makes debugging easy.
5. **No timers by default.** Pressure is an opt-in setting for older kids.
6. **Short sessions.** A round is 1–3 minutes. Quitting is always fine.

## Core loop (Mode 1: "Hitta knappen" / Find the button)

1. Knappis stands in a bounded room (one screen, no scrolling).
2. Four round floor pads, each a giant version of one face button, laid out
   in the same diamond as on the gamepad: Y top, X left, B right, A bottom.
   The room is a big button cluster, so walking direction matches thumb
   direction.
3. One tile is "asked for": it pulses, and the on-screen pad lights that
   button. Optionally a voice says the colour/letter.
4. The child walks Knappis onto a tile with the left stick or D-pad.
   - Standing on the asked-for pad is unmistakable: the pad grows, a bright
     ring pulses, sparkles fly, Knappis hops and a two-note chime plays.
   - Standing on another pad: it shrinks and dims, wobbles, Knappis shrugs
     and a soft low "hmm" plays. Still no fail state.
5. The child presses a face button.
   - Correct tile **and** correct button → celebration: confetti, jingle,
     Knappis jumps, a star is added to a row at the top.
   - Correct tile, wrong button → the tile wobbles, the on-screen pad shows
     the right button again. No penalty.
   - Not on a tile → Knappis shrugs, small "boing".
6. After N stars (default 5) a short "round complete" dance plays, then the
   next round starts. Pads stay where they are; the fixed layout is the
   lesson. A "mixed-up" mode that shuffles them can come later.

## Supported gamepads

**Only Xbox-style gamepads are supported right now.** That means the Xbox
wireless controller and anything that presents itself as one (most PC pads
in "XInput" mode).

Why only Xbox for now:

- **Windows and browsers treat it as the default.** Windows recognises it
  without drivers, and the browser Gamepad API reports it with the
  "standard" mapping, so button indices are predictable.
- **The symbols are already on the buttons.** A/B/X/Y are colour-coded
  letters, which gives a child two cues (colour and letter) without the game
  having to invent its own icon set.
- **One pad means one set of on-screen pictures.** The on-screen gamepad
  drawing, the floor symbols and the hints all have to match what is in the
  child's hands. Supporting several layouts before the core loop is fun
  would multiply the work and the testing.
- **It is what we have at home to test with.**

PlayStation (×, ○, □, △) and Nintendo (B/A/Y/X, swapped positions) differ in
both symbols and button order. The symbol set is designed as a swappable
theme so these can be added later without touching the game rules. Until
then, a non-Xbox pad may work for movement but the pictures will be wrong.

## Gamepad mapping
- Movement: left stick **and** D-pad both work; whichever the child grabs.
- Dead zone generous (≈0.25) because small thumbs rest on the stick.
- Keyboard fallback (arrow keys move, the letters A/B/X/Y press) so the game
  is testable without a pad and playable in a pinch.

## Free play (Mode 0, shipped)

The first tester asked for it: nothing is asked for. The child walks onto
any pad and presses that pad's button to earn a star. The badge at the top
is hidden; the gamepad in the corner lights the button of whatever pad
Knappis stands on, so the pad itself becomes the prompt. Same stars, same
round-complete dance. Picked in the settings panel.

## Settings (grown-ups only)

A gear on the start screen opens a card with mouse-only choices, remembered
per browser: walking speed (slow / normal / fast; a 3-year-old found the
original speed too fast) and game mode (find the button / free play). A home
button in the room returns to the start screen. The gamepad never operates
the settings: it stays the child's.

## Progression of modes (later)

| Mode | Teaches | Idea |
|------|---------|------|
| 0. Free play | stick + matching pad to button | shipped, see above |
| 1. Hitta knappen | stick + 4 face buttons | described above |
| 2. Två i rad | sequence memory | two symbols shown, press in order (Simon-lite) |
| 3. Axlarna | shoulder buttons / triggers | tiles for LB/RB, LT/RT |
| 4. Hoppa | jump timing | press A to hop over a slow-rolling ball |
| 5. Tillsammans | two players | second pad joins, co-op tiles |

## Art & audio direction

- Flat, chunky shapes, thick outlines, pastel background, saturated symbols.
- Knappis: a circle with two dot eyes, stubby legs, bounces when walking.
- Sounds: short, soft, musical (marimba/xylophone). No harsh buzzers.
- Placeholder art is generated programmatically (Phaser graphics) so the
  game is playable before any assets exist. Real sprites can replace them
  later.

## Accessibility notes

- Colour **and** letter/shape on every symbol (not colour alone).
- Setting to slow movement further.
- Setting to require holding the button briefly (avoids accidental taps).
- Everything reachable with one hand on the gamepad.

## Non-goals (for now)

- Scrolling levels, enemies, scores that can go down, online anything,
  monetisation, mobile touch controls.
