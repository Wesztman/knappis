# Playtest log

Short notes from watching real children play. Newest first. Write down what
happened, not what we think; decisions go in the roadmap.

## 2026-11-01 — first tester, 3 years old (Carl's son)

Setup: v1.0.0 plus the day's tweaks (diamond pads, speaker icon), Xbox
gamepad on the wireless adapter, Chrome on Windows.

What he said and did:

- **Knappis walks too fast.** He overshot pads and could not stop on them.
  → Added a walking-speed setting (slow / normal / fast) and lowered the
  default from 230 to 160 px/s.
- **He wanted to choose the pads himself**: "just walk to the buttons and
  press the right one", without being told which.
  → Added "free play" mode: nothing is asked for, any pad counts, the pad's
  own button is the right one. The gamepad in the corner lights the button
  of whatever pad he stands on.
- **Could not tell whether he was on the right pad.** The small scale-up
  and soft tap were lost on him.
  → Standing on the right pad: pad grows, bright pulsing ring, sparkles,
  Knappis hops, two-note chime. Standing on a wrong pad: pad shrinks and
  dims, wobbles, Knappis shrugs, soft low "hmm". Wrong button: Knappis
  shakes his head.

Open questions for next time:

- Is "normal" speed right, or should slow be the default?
- Does he understand the gamepad hint in the corner at all? (Idea: a thumb
  on the drawn gamepad that pushes the stick toward the target.)
- Does the shrinking pad read as "not this one" or just as broken?
