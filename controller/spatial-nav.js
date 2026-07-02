// Geometric focus navigation shared by the gamepad d-pad (controller-nav.js)
// and keyboard arrows. Unlike simple index-based traversal, this picks the
// nearest focusable element in the requested direction, so it works correctly
// on a 2D grid of game cards, not just vertical lists.

export function focusableElements() {
  return [...document.querySelectorAll(
    'a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])'
  )].filter(el =>
    el.offsetParent !== null && !el.disabled &&
    getComputedStyle(el).visibility !== 'hidden'
  );
}

export function moveFocus(dir) {
  const els = focusableElements();
  if (els.length === 0) return false;

  const current = document.activeElement;
  if (!current || current === document.body || !els.includes(current)) {
    els[0].focus();
    els[0].scrollIntoView({ block: 'nearest' });
    return true;
  }

  const cr = current.getBoundingClientRect();
  const cx = cr.left + cr.width / 2;
  const cy = cr.top + cr.height / 2;

  // Two passes: prefer the nearest candidate whose extent overlaps ours on
  // the perpendicular axis (what a d-pad user expects — "the thing right
  // below me"), and only fall back to a distance+misalignment score when
  // nothing lines up. Without the overlap pass, a far-but-centered element
  // can win over a near column of cards.
  let bestOverlap = null, bestOverlapDist = Infinity;
  let best = null, bestScore = Infinity;

  for (const el of els) {
    if (el === current || current.contains(el) || el.contains(current)) continue;
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const dx = x - cx;
    const dy = y - cy;

    // gap between facing edges, center misalignment, perpendicular overlap
    let forward, aside, overlaps;
    switch (dir) {
      case 'up':
        forward = cr.top - r.bottom; aside = Math.abs(dx);
        overlaps = r.right > cr.left && r.left < cr.right;
        break;
      case 'down':
        forward = r.top - cr.bottom; aside = Math.abs(dx);
        overlaps = r.right > cr.left && r.left < cr.right;
        break;
      case 'left':
        forward = cr.left - r.right; aside = Math.abs(dy);
        overlaps = r.bottom > cr.top && r.top < cr.bottom;
        break;
      case 'right':
        forward = r.left - cr.right; aside = Math.abs(dy);
        overlaps = r.bottom > cr.top && r.top < cr.bottom;
        break;
      default: return false;
    }

    if (forward < -8) continue; // small tolerance for adjacent elements

    if (overlaps && forward < bestOverlapDist) {
      bestOverlapDist = forward;
      bestOverlap = el;
    }

    const score = Math.max(forward, 0) + aside * 2.5;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }

  if (bestOverlap) best = bestOverlap;

  if (best) {
    best.focus();
    best.scrollIntoView({ block: 'nearest' });
    return true;
  }
  return false;
}

// Arrow-key navigation for pages without a game canvas. Skips form fields
// that use arrows themselves (text inputs, selects, textareas).
export function initKeyboardNav() {
  const DIRS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  };

  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (!DIRS[e.key]) return;

    const t = e.target;
    if (t.closest && t.closest('input, select, textarea')) return;

    if (moveFocus(DIRS[e.key])) {
      e.preventDefault();
    }
  });
}
