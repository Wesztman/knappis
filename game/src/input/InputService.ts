import Phaser from 'phaser';
import {
  classifyGamepad,
  DPAD_INDEX,
  FACE_BUTTONS,
  pickGamepad,
  STANDARD_BUTTON_INDEX,
  type FaceButton,
  type GamepadKind,
} from './buttons';
import { applyDeadZone, combineMoves, type Vec2 } from './deadzone';

export interface PadInfo {
  id: string;
  kind: GamepadKind;
}

export interface InputFrame {
  /** Movement direction, length 0..1. */
  move: Vec2;
  /** Face buttons that went down this frame. */
  justPressed: FaceButton[];
  /** Any gamepad button or keyboard key went down this frame. */
  anyJustPressed: boolean;
  /** The last press came from the keyboard (so audio is already unlocked). */
  keyboardUsed: boolean;
  pad: PadInfo | null;
}

/**
 * One place that reads the gamepad and keyboard and turns them into a
 * simple per-frame snapshot. Scenes never touch Phaser input directly.
 *
 * The gamepad is read straight from the browser's Gamepad API rather than
 * through Phaser's gamepad plugin: we only need the standard mapping, and
 * going direct removes a layer that has had timing quirks across browsers.
 *
 * Keyboard fallback: arrow keys move, the letters A/B/X/Y press the
 * matching face button.
 */
export class InputService {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys | null;
  private readonly letterKeys: Record<FaceButton, Phaser.Input.Keyboard.Key> | null;
  private readonly anyKey: Phaser.Input.Keyboard.Key[];
  private prevPadButtons = new Set<number>();
  private prevPadIndex = -1;

  constructor(private readonly scene: Phaser.Scene) {
    const kb = scene.input.keyboard;
    this.cursors = kb?.createCursorKeys() ?? null;
    this.letterKeys = kb
      ? {
          A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
          B: kb.addKey(Phaser.Input.Keyboard.KeyCodes.B),
          X: kb.addKey(Phaser.Input.Keyboard.KeyCodes.X),
          Y: kb.addKey(Phaser.Input.Keyboard.KeyCodes.Y),
        }
      : null;
    this.anyKey = kb
      ? [
          kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
          kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        ]
      : [];
    // Buttons already held when a scene starts (the press that started it)
    // must not count as new presses on the first frame.
    const pad = this.pad;
    if (pad) {
      this.prevPadIndex = pad.index;
      pad.buttons.forEach((button, index) => {
        if (button.pressed) this.prevPadButtons.add(index);
      });
    }
  }

  /** The first connected gamepad, if any, straight from the browser. */
  get pad(): Gamepad | null {
    if (typeof navigator.getGamepads !== 'function') return null;
    return pickGamepad(navigator.getGamepads());
  }

  padInfo(): PadInfo | null {
    const pad = this.pad;
    if (!pad) return null;
    return { id: pad.id, kind: classifyGamepad(pad.id, pad.mapping) };
  }

  /** Call once per frame. */
  update(): InputFrame {
    const pad = this.pad;
    const justPressed: FaceButton[] = [];
    let anyJustPressed = false;
    let keyboardUsed = false;

    // --- gamepad ---
    let stick: Vec2 = { x: 0, y: 0 };
    let dpad: Vec2 = { x: 0, y: 0 };
    if (pad) {
      if (pad.index !== this.prevPadIndex) {
        // A different device took over; forget the old button state.
        this.prevPadButtons.clear();
        this.prevPadIndex = pad.index;
      }
      stick = applyDeadZone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
      const down = (i: number) => pad.buttons[i]?.pressed ?? false;
      dpad = {
        x: (down(DPAD_INDEX.right) ? 1 : 0) - (down(DPAD_INDEX.left) ? 1 : 0),
        y: (down(DPAD_INDEX.down) ? 1 : 0) - (down(DPAD_INDEX.up) ? 1 : 0),
      };

      const now = new Set<number>();
      pad.buttons.forEach((button, index) => {
        if (button.pressed) now.add(index);
      });
      for (const index of now) {
        if (!this.prevPadButtons.has(index)) {
          anyJustPressed = true;
          const face = FACE_BUTTONS.find((b) => STANDARD_BUTTON_INDEX[b] === index);
          if (face) justPressed.push(face);
        }
      }
      this.prevPadButtons = now;
    } else {
      this.prevPadButtons.clear();
      this.prevPadIndex = -1;
    }

    // --- keyboard ---
    let keys: Vec2 = { x: 0, y: 0 };
    if (this.cursors) {
      keys = {
        x: (this.cursors.right.isDown ? 1 : 0) - (this.cursors.left.isDown ? 1 : 0),
        y: (this.cursors.down.isDown ? 1 : 0) - (this.cursors.up.isDown ? 1 : 0),
      };
    }
    if (this.letterKeys) {
      for (const face of FACE_BUTTONS) {
        if (Phaser.Input.Keyboard.JustDown(this.letterKeys[face])) {
          justPressed.push(face);
          anyJustPressed = true;
          keyboardUsed = true;
        }
      }
    }
    for (const key of this.anyKey) {
      if (Phaser.Input.Keyboard.JustDown(key)) {
        anyJustPressed = true;
        keyboardUsed = true;
      }
    }

    return {
      move: combineMoves(stick, dpad, keys),
      justPressed,
      anyJustPressed,
      keyboardUsed,
      pad: this.padInfo(),
    };
  }
}
