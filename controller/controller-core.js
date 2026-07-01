// Shared Gamepad API polling engine used by both the library page and the
// game page. Emits edge-triggered 'button' and 'dir' events so callers don't
// have to deal with per-frame polling themselves.

const DEADZONE = 0.5;
const DIRS = ['up', 'down', 'left', 'right'];

export const XBOX_BUTTON_NAMES = [
  'A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT',
  'View', 'Menu', 'L3', 'R3', 'D-pad ↑', 'D-pad ↓', 'D-pad ←', 'D-pad →', 'Guide',
];

export class GamepadWatcher extends EventTarget {
  constructor() {
    super();
    this.index = null;
    this.buttonState = new Map();
    this.dirState = { up: false, down: false, left: false, right: false };
    this._raf = null;

    window.addEventListener('gamepadconnected', (e) => this._attach(e.gamepad.index));
    window.addEventListener('gamepaddisconnected', (e) => {
      if (e.gamepad.index === this.index) this._detach();
    });

    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const pad of pads) {
      if (pad) { this._attach(pad.index); break; }
    }

    this._loop();
  }

  get connected() {
    return this.index !== null;
  }

  get padLabel() {
    if (this.index === null) return null;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    return pads[this.index]?.id || 'Gamepad';
  }

  _attach(index) {
    if (this.index !== null) return;
    this.index = index;
    this.dispatchEvent(new CustomEvent('connect'));
  }

  _detach() {
    this.index = null;
    for (const [btn, down] of this.buttonState) {
      if (down) this.dispatchEvent(new CustomEvent('button', { detail: { index: btn, down: false } }));
    }
    this.buttonState.clear();
    for (const dir of DIRS) {
      if (this.dirState[dir]) {
        this.dirState[dir] = false;
        this.dispatchEvent(new CustomEvent('dir', { detail: { dir, down: false } }));
      }
    }
    this.dispatchEvent(new CustomEvent('disconnect'));
  }

  _loop() {
    this._raf = requestAnimationFrame(() => this._loop());
    if (this.index === null) return;

    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = pads[this.index];
    if (!pad) { this._detach(); return; }

    for (let i = 0; i < pad.buttons.length && i < 16; i++) {
      const pressed = pad.buttons[i].pressed || pad.buttons[i].value > 0.5;
      const was = this.buttonState.get(i) || false;
      if (pressed !== was) {
        this.buttonState.set(i, pressed);
        this.dispatchEvent(new CustomEvent('button', { detail: { index: i, down: pressed } }));
      }
    }

    const axX = pad.axes[0] || 0;
    const axY = pad.axes[1] || 0;
    const wantDir = {
      up: !!pad.buttons[12]?.pressed || axY < -DEADZONE,
      down: !!pad.buttons[13]?.pressed || axY > DEADZONE,
      left: !!pad.buttons[14]?.pressed || axX < -DEADZONE,
      right: !!pad.buttons[15]?.pressed || axX > DEADZONE,
    };

    for (const dir of DIRS) {
      if (wantDir[dir] !== this.dirState[dir]) {
        this.dirState[dir] = wantDir[dir];
        this.dispatchEvent(new CustomEvent('dir', { detail: { dir, down: wantDir[dir] } }));
      }
    }
  }
}
