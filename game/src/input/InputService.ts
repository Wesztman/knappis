import Phaser from 'phaser';
import {
  classifyGamepad,
  FACE_BUTTONS,
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
 * Keyboard fallback: arrow keys move, the letters A/B/X/Y press the
 * matching face button.
 */
export class InputService {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys | null;
  private readonly letterKeys: Record<FaceButton, Phaser.Input.Keyboard.Key> | null;
  private readonly anyKey: Phaser.Input.Keyboard.Key[];
  private prevPadButtons = new Set<number>();

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
  }

  /** The first connected gamepad, if any. */
  get pad(): Phaser.Input.Gamepad.Gamepad | null {
    const plugin = this.scene.input.gamepad;
    if (!plugin || plugin.total === 0) return null;
    return plugin.getPad(0) ?? null;
  }

  padInfo(): PadInfo | null {
    const pad = this.pad;
    if (!pad) return null;
    const mapping = (pad.pad as Gamepad | undefined)?.mapping ?? '';
    return { id: pad.id, kind: classifyGamepad(pad.id, mapping) };
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
      const ax = pad.axes[0]?.value ?? 0;
      const ay = pad.axes[1]?.value ?? 0;
      stick = applyDeadZone(ax, ay);
      dpad = {
        x: (pad.right ? 1 : 0) - (pad.left ? 1 : 0),
        y: (pad.down ? 1 : 0) - (pad.up ? 1 : 0),
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
