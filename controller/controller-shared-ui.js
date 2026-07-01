// Small DOM helpers shared by controller-play.js and controller-nav.js:
// the connection badge, a generic modal shell, and a toast notification.

export function loadCss() {
  if (document.querySelector('link[data-gp-css]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('controller-ui.css', import.meta.url);
  link.dataset.gpCss = '1';
  document.head.appendChild(link);
}

export function createBadge(watcher, onSettings) {
  loadCss();

  const badge = document.createElement('div');
  badge.className = 'gp-badge';
  badge.innerHTML = `
    <span class="gp-dot"></span>
    <span class="gp-label">Контролер: натисніть будь-яку кнопку</span>
    ${onSettings ? '<button class="gp-settings-btn" title="Налаштування контролера">⚙️</button>' : ''}
  `;
  document.body.appendChild(badge);

  const label = badge.querySelector('.gp-label');

  function refresh() {
    if (watcher.connected) {
      badge.classList.add('gp-connected');
      label.textContent = watcher.padLabel || 'Контролер підключено';
    } else {
      badge.classList.remove('gp-connected');
      label.textContent = 'Контролер: натисніть будь-яку кнопку';
    }
  }

  watcher.addEventListener('connect', refresh);
  watcher.addEventListener('disconnect', refresh);
  refresh();

  if (onSettings) {
    badge.querySelector('.gp-settings-btn').addEventListener('click', onSettings);
  }

  return badge;
}

export function showToast(text) {
  const toast = document.createElement('div');
  toast.className = 'gp-toast';
  toast.textContent = text;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1800);
}

export function openModal(buildBody) {
  loadCss();

  const backdrop = document.createElement('div');
  backdrop.className = 'gp-modal-backdrop';

  const modal = document.createElement('div');
  modal.className = 'gp-modal';
  backdrop.appendChild(modal);

  function close() {
    backdrop.remove();
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  buildBody(modal, close);

  document.body.appendChild(backdrop);
  return { close };
}
