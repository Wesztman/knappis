# Knappis – Game Design

> Swedish: "knapp" = button, "-is" = affectionate diminutive. Knappis is a
> little round button with legs who wants to be pressed.

## One-line pitch

A calm, friendly 2D game that teaches children aged roughly 3–6 how to use a
hand controller: move with the stick, then press the button that matches the
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
4. **The controller is on screen.** A drawing of the pad shows which button
   lit up. Borrowed from Astro's Playroom. This also makes debugging easy.
5. **No timers by default.** Pressure is an opt-in setting for older kids.
6. **Short sessions.** A round is 1–3 minutes. Quitting is always fine.

## Core loop (Mode 1: "Hitta knappen" / Find the button)

1. Knappis stands in a bounded room (one screen, no scrolling).
2. Four floor tiles each show a controller symbol (Xbox: A green, B red,
   X blue, Y yellow).
3. One tile is "asked for": it pulses, and the on-screen pad lights that
   button. Optionally a voice says the colour/letter.
4. The child walks Knappis onto a tile with the left stick or D-pad.
   - Standing on any tile highlights it and makes a soft sound.
5. The child presses a face button.
   - Correct tile **and** correct button → celebration: confetti, jingle,
     Knappis jumps, a star is added to a row at the top.
   - Correct tile, wrong button → the tile wobbles, the on-screen pad shows
     the right button again. No penalty.
   - Not on a tile → Knappis shrugs, small "boing".
6. After N stars (default 5) a short "round complete" dance plays, then the
   next round starts with a shuffled tile layout.

## Controller mapping

- **Primary target: Xbox-style pad** (A/B/X/Y, colour-coded; Windows
  recognises it without drivers).
- Symbol set is a swappable theme so PlayStation shapes (×, ○, □, △) or
  Nintendo (B/A/Y/X) can be added later.
- Movement: left stick **and** D-pad both work; whichever the child grabs.
- Dead zone generous (≈0.25) because small thumbs rest on the stick.
- Keyboard fallback (arrows + Z/X/C/V) so the game is testable without a pad
  and playable in a pinch.

## Progression of modes (later)

| Mode | Teaches | Idea |
|------|---------|------|
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
- Everything reachable with one hand on the controller.

## Non-goals (for now)

- Scrolling levels, enemies, scores that can go down, online anything,
  monetisation, mobile touch controls.
