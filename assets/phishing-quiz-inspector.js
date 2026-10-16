// One reusable floating surface. Pointer movement only updates its transform;
// content and geometry are read once per inspected object, never per frame.
export function createInspector(root, getPoint) {
  const floating = document.createElement('div');
  floating.id = 'quiz-inspector';
  floating.className = 'pq-floating';
  floating.setAttribute('role', 'tooltip');
  floating.setAttribute('aria-hidden', 'true');
  floating.inert = true;
  floating.innerHTML = '<div class="pq-floating-surface"><span class="pq-floating-label"></span><code class="pq-floating-value"></code></div>';
  document.body.append(floating);
  const label = floating.querySelector('.pq-floating-label');
  const value = floating.querySelector('.pq-floating-value');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let source = null, id = null, pinned = false, mode = 'pointer', pointerInput = '';
  let width = 0, height = 0, x = 0, y = 0, targetX = 0, targetY = 0;
  let frame = 0, leaveTimer = 0, lastFrame = 0;
  let cursor = { x: 0, y: 0 };

  function paint(time) {
    frame = 0;
    const elapsed = lastFrame ? Math.min(time - lastFrame, 40) : 16;
    lastFrame = time;
    const factor = reducedMotion.matches ? 1 : 1 - Math.exp(-elapsed / 35);
    x += (targetX - x) * factor;
    y += (targetY - y) * factor;
    if (Math.abs(targetX - x) < .5 && Math.abs(targetY - y) < .5) { x = targetX; y = targetY; }
    floating.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (source && (x !== targetX || y !== targetY)) frame = requestAnimationFrame(paint);
  }

  function position(immediate = false) {
    if (!source) return;
    const margin = 12;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = innerHeight;
    if (mode === 'pointer') {
      targetX = cursor.x + 20;
      targetY = cursor.y + 22;
      if (targetX + width > viewportWidth - margin) targetX = cursor.x - width - 20;
      if (targetY + height > viewportHeight - margin) targetY = cursor.y - height - 20;
    } else {
      const rect = source.getBoundingClientRect();
      targetX = rect.left;
      targetY = rect.bottom + 10;
      if (targetY + height > viewportHeight - margin) targetY = rect.top - height - 10;
    }
    targetX = Math.max(margin, Math.min(targetX, viewportWidth - width - margin));
    targetY = Math.max(margin, Math.min(targetY, viewportHeight - height - margin));
    // Flip promptly at edges; never sweep the surface across the cursor.
    const crossingCursor = mode === 'pointer' &&
      ((targetX - cursor.x) * (x - cursor.x) < 0 || (targetY - cursor.y) * (y - cursor.y) < 0);
    const cursorInside = mode === 'pointer' && cursor.x >= x - 8 && cursor.x <= x + width + 8 && cursor.y >= y - 8 && cursor.y <= y + height + 8;
    if (immediate || crossingCursor || cursorInside || reducedMotion.matches) {
      x = targetX; y = targetY;
      floating.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    if (!frame) { lastFrame = 0; frame = requestAnimationFrame(paint); }
  }

  function close() {
    clearTimeout(leaveTimer);
    cancelAnimationFrame(frame);
    frame = 0;
    if (source) {
      source.removeAttribute('aria-describedby');
      source.setAttribute('aria-expanded', 'false');
    }
    source = null; id = null; pinned = false;
    floating.classList.remove('is-open');
    floating.setAttribute('aria-hidden', 'true');
    floating.inert = true;
  }

  function show(control, { pin = false, input = 'anchor', event } = {}) {
    const nextId = control.dataset.inspect || control.dataset.preview;
    const point = getPoint(nextId);
    if (!point) return;
    clearTimeout(leaveTimer);
    const changed = source !== control || value.textContent !== point.value;
    if (source && source !== control) {
      source.removeAttribute('aria-describedby');
      source.setAttribute('aria-expanded', 'false');
    }
    source = control; id = nextId; pinned = pin; mode = input;
    if (event) cursor = { x: event.clientX, y: event.clientY };
    // Plain text only: no domain is pre-highlighted and no HTML is accepted.
    label.textContent = point.title;
    value.textContent = point.value;
    source.setAttribute('aria-describedby', floating.id);
    source.setAttribute('aria-expanded', 'true');
    floating.setAttribute('aria-hidden', 'false');
    floating.inert = false;
    if (changed || !floating.classList.contains('is-open')) {
      width = floating.offsetWidth;
      height = floating.offsetHeight;
      position(true);
    } else position();
    floating.classList.add('is-open');
  }

  function toggle(control, touch = false) {
    if (source === control && pinned) { close(); return false; }
    show(control, { pin: true, input: touch || pointerInput !== 'mouse' ? 'anchor' : 'pointer' });
    return true;
  }

  const selector = '[data-inspect], [data-preview]';
  root.addEventListener('pointerdown', event => { pointerInput = event.pointerType; });
  root.addEventListener('keydown', () => { pointerInput = ''; });
  root.addEventListener('pointerover', event => {
    if (event.pointerType === 'touch' || pinned) return;
    const control = event.target.closest(selector);
    if (control && !control.contains(event.relatedTarget)) show(control, { input: 'pointer', event });
  });
  root.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || mode !== 'pointer' || !source || pinned) return;
    if (!source.contains(event.target)) return;
    cursor = { x: event.clientX, y: event.clientY };
    position();
  });
  function leave(event) {
    if (!source || pinned || mode !== 'pointer') return;
    if (source.contains(event.relatedTarget) || floating.contains(event.relatedTarget)) return;
    // The short grace period lets users move into the surface to read it.
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(close, 90);
  }
  root.addEventListener('pointerout', event => {
    if (source?.contains(event.target)) leave(event);
  });
  floating.addEventListener('pointerenter', () => clearTimeout(leaveTimer));
  floating.addEventListener('pointerleave', leave);
  root.addEventListener('focusin', event => {
    const control = event.target.closest(selector);
    if (control && !pointerInput) show(control, { input: 'anchor' });
  });
  root.addEventListener('focusout', event => {
    if (source === event.target && !floating.contains(event.relatedTarget)) close();
  });
  document.addEventListener('pointerdown', event => {
    if (source && !source.contains(event.target) && !floating.contains(event.target)) close();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  // A scrolled or replaced object must not leave a detached tooltip behind.
  window.addEventListener('scroll', close, { passive: true });
  window.addEventListener('resize', close, { passive: true });
  window.addEventListener('blur', close);
  return { close, toggle, get id() { return id; } };
}
