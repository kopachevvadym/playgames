// Bridges the Gamepad API to freej2me-web's own keyboard input path.
//
// src/main.js attaches `handleKeyEvent` directly on the #display canvas and
// reads `e.code` / `e.type` from it (see setListeners() there), so dispatching
// real KeyboardEvent objects at that element reproduces physical-keyboard
// input exactly, including freej2me-web's own key-repeat-while-held logic.
// Codes below are taken from src/key.js's codeMap and from the "Keyboard
// controls" table on the library page (both physical-keyboard paths that are
// confirmed to work, unlike the on-screen "*" button which currently uses a
// code that isn't in codeMap).

import { GamepadWatcher } from './controller-core.js';
import { createBadge, openModal, showToast } from './controller-shared-ui.js';

const STORAGE_KEY = 'j2me.controller.mapping.v1';

const DIR_CODES = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
};

// Directions are always driven by the D-pad + left stick and aren't
// remappable; only these action buttons can be reassigned.
const ACTIONS = [
  { id: 'fire', label: 'Вогонь / OK', code: 'Enter', defaultButton: 0 },
  { id: 'back', label: 'Esc (меню емулятора)', code: 'Escape', defaultButton: 1 },
  { id: 'softL', label: 'Ліва софт-клавіша', code: 'F1', defaultButton: 2 },
  { id: 'softR', label: 'Права софт-клавіша', code: 'F2', defaultButton: 3 },
  { id: 'num7', label: 'Клавіша 7', code: 'Digit7', defaultButton: 4 },
  { id: 'num9', label: 'Клавіша 9', code: 'Digit9', defaultButton: 5 },
  { id: 'num1', label: 'Клавіша 1', code: 'Digit1', defaultButton: 6 },
  { id: 'num3', label: 'Клавіша 3', code: 'Digit3', defaultButton: 7 },
  { id: 'hash', label: '#', code: 'KeyR', defaultButton: 8 },
  { id: 'star', label: '*', code: 'KeyE', defaultButton: 9 },
  { id: 'num0', label: 'Клавіша 0', code: 'Digit0', defaultButton: 10 },
  { id: 'num5', label: 'Клавіша 5', code: 'Digit5', defaultButton: 11 },
];

function loadByAction() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    saved = {};
  }
  const byAction = {};
  for (const a of ACTIONS) {
    byAction[a.id] = Object.prototype.hasOwnProperty.call(saved, a.id) ? saved[a.id] : a.defaultButton;
  }
  return byAction;
}

function saveByAction(byAction) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(byAction));
}

function buildButtonMap(byAction) {
  const map = {};
  for (const a of ACTIONS) {
    const btn = byAction[a.id];
    if (btn !== null && btn !== undefined) map[btn] = a.id;
  }
  return map;
}

function sendKey(display, code, down) {
  display.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', {
    code,
    bubbles: true,
    cancelable: true,
  }));
}

function xboxButtonName(index) {
  const names = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'View', 'Menu', 'L3', 'R3'];
  return names[index] ?? `Кнопка ${index}`;
}

function openSettingsModal(watcher, byAction, onChange) {
  openModal((modal, close) => {
    modal.innerHTML = `
      <h2>Розкладка Xbox-контролера</h2>
      <div class="gp-hint">D-pad і лівий стик завжди керують рухом (стрілки). Натисніть "Змінити" і натисніть потрібну кнопку на контролері.</div>
      <div class="gp-rows"></div>
      <div class="gp-actions">
        <button class="gp-reset">Скинути</button>
        <button class="gp-close">Готово</button>
      </div>
    `;

    const rows = modal.querySelector('.gp-rows');
    let listeningFor = null;

    function render() {
      rows.innerHTML = '';
      for (const a of ACTIONS) {
        const row = document.createElement('div');
        row.className = 'gp-row';
        const btn = byAction[a.id];
        row.innerHTML = `
          <span class="gp-row-label">${a.label}</span>
          <button class="gp-row-btn" data-action="${a.id}">${btn !== null && btn !== undefined ? xboxButtonName(btn) : '—'}</button>
        `;
        rows.appendChild(row);
      }
    }
    render();

    rows.addEventListener('click', (e) => {
      const btnEl = e.target.closest('.gp-row-btn');
      if (!btnEl) return;
      const actionId = btnEl.dataset.action;
      if (listeningFor === actionId) return;
      listeningFor = actionId;
      render();
      const row = [...rows.querySelectorAll('.gp-row-btn')].find(b => b.dataset.action === actionId);
      row.textContent = 'Натисніть кнопку…';
      row.classList.add('gp-listening');
    });

    function onButtonForRemap(e) {
      if (!listeningFor || !e.detail.down) return;
      const btnIndex = e.detail.index;
      // don't allow reserved d-pad indices (12-15) as action buttons
      if (btnIndex >= 12 && btnIndex <= 15) return;

      // clear this button from whatever action previously used it
      for (const id of Object.keys(byAction)) {
        if (byAction[id] === btnIndex) byAction[id] = null;
      }
      byAction[listeningFor] = btnIndex;
      listeningFor = null;
      render();
      onChange({ ...byAction });
    }
    watcher.addEventListener('button', onButtonForRemap);

    modal.querySelector('.gp-reset').addEventListener('click', () => {
      for (const a of ACTIONS) byAction[a.id] = a.defaultButton;
      render();
      onChange({ ...byAction });
    });

    modal.querySelector('.gp-close').addEventListener('click', () => {
      watcher.removeEventListener('button', onButtonForRemap);
      close();
    });
  });
}

function init() {
  const display = document.getElementById('display');
  if (!display) return;

  let byAction = loadByAction();
  let mapping = buildButtonMap(byAction);

  const watcher = new GamepadWatcher();

  watcher.addEventListener('connect', () => showToast(`🎮 ${watcher.padLabel || 'Контролер'} підключено`));

  watcher.addEventListener('dir', (e) => {
    sendKey(display, DIR_CODES[e.detail.dir], e.detail.down);
  });

  watcher.addEventListener('button', (e) => {
    const actionId = mapping[e.detail.index];
    if (!actionId) return;
    const action = ACTIONS.find(a => a.id === actionId);
    if (!action) return;
    sendKey(display, action.code, e.detail.down);
  });

  createBadge(watcher, () => {
    openSettingsModal(watcher, byAction, (updated) => {
      byAction = updated;
      mapping = buildButtonMap(byAction);
      saveByAction(byAction);
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
