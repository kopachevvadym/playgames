// On the library page there's no game canvas to send keys to, so instead we
// let the D-pad/left stick (and keyboard arrows — see spatial-nav.js) move
// focus between focusable elements and let the A button / Enter "click"
// whatever is focused. This makes the whole site usable from a couch with
// just a controller, aside from picking files (browsers only allow a real
// user gesture to open the native file picker).

import { GamepadWatcher } from './controller-core.js';
import { createBadge, showToast } from './controller-shared-ui.js';
import { moveFocus, initKeyboardNav } from './spatial-nav.js';

function activateFocused() {
  const el = document.activeElement;
  if (!el || el === document.body) return;
  if (el.tagName === 'INPUT' && el.type === 'file') return; // needs a real click
  el.click();
}

function init() {
  initKeyboardNav();

  const watcher = new GamepadWatcher();

  watcher.addEventListener('connect', () => showToast(`🎮 ${watcher.padLabel || 'Контролер'} підключено`));

  watcher.addEventListener('dir', (e) => {
    if (!e.detail.down) return;
    moveFocus(e.detail.dir);
  });

  watcher.addEventListener('button', (e) => {
    if (!e.detail.down) return;
    if (e.detail.index === 0) activateFocused(); // A
    if (e.detail.index === 1) history.back(); // B
  });

  createBadge(watcher, null);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
