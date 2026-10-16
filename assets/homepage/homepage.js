import '/assets/security-core/security-core.js';
import { AlternatingRotation } from './rotation.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const core = $('swissploit-security-core');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const carouselLists = [];
const rotation = new AlternatingRotation({ change: list => list.step(1, false) });
const rotationButton = $('#rotation-toggle');
function syncRotationControl() {
  const unavailable = reduced.matches || !carouselLists.some(list => list.length > 1);
  rotation.pause('reduced', reduced.matches);
  if (reduced.matches) $('#short-content')?.getAnimations({ subtree:true }).forEach(animation => animation.cancel());
  rotationButton.disabled = unavailable;
  const label = reduced.matches ? 'Automatik aus · reduzierte Bewegung' : rotation.reasons.has('user') ? 'Automatik fortsetzen' : 'Automatik pausieren';
  rotationButton.setAttribute('aria-label', label);
  rotationButton.textContent = label;
  rotationButton.setAttribute('aria-pressed', String(rotation.reasons.has('user')));
}
rotationButton.addEventListener('click', () => { rotation.pause('user', !rotation.reasons.has('user')); syncRotationControl(); });
reduced.addEventListener('change', syncRotationControl);
for (const module of $$('.hub-shorts')) {
  module.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') rotation.pause(module, true); });
  module.addEventListener('pointerleave', () => { rotation.interact(); rotation.pause(module, false); });
  module.addEventListener('pointerdown', () => rotation.interact(), { passive: true });
  module.addEventListener('focusin', () => rotation.pause('focus', true));
  module.addEventListener('focusout', () => queueMicrotask(() => {
    rotation.interact(); rotation.pause('focus', !!document.activeElement.closest('.hub-shorts'));
  }));
}
const rotationVisibility = new IntersectionObserver(([entry]) => rotation.pause('offscreen', !entry.isIntersecting));
rotationVisibility.observe($('.hub-updates'));
document.addEventListener('visibilitychange', () => rotation.pause('hidden', document.hidden));
window.addEventListener('navigation:opened', () => rotation.pause('navigation', true));
window.addEventListener('navigation:closed', () => { rotation.interact(); rotation.pause('navigation', false); });
window.addEventListener('pagehide', () => { rotation.pause('page', true); clearTimeout(previewTimer); });
window.addEventListener('pageshow', () => { rotation.pause('page', false); rotation.pause('hidden', document.hidden); });
syncRotationControl();

// Native dialogs own inertness and Escape; this helper also restores focus and stops media.
function openDialog(dialog, opener) {
  if (dialog.open) return;
  dialog.returnFocus = opener;
  dialog.showModal();
  resetPreview();
  core.setPaused(true);
  rotation.pause('dialog', true);
}
for (const dialog of $$('.hub-dialog')) {
  dialog.querySelector('[data-dialog-close]').addEventListener('click', () => dialog.close());
  let backdropDown = false;
  const outside = event => {
    const r = dialog.getBoundingClientRect();
    return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
  };
  dialog.addEventListener('pointerdown', event => { backdropDown = outside(event); });
  dialog.addEventListener('click', event => {
    if (event.target === dialog && backdropDown && outside(event)) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('button:not(:disabled), a[href], iframe, [tabindex="0"]')]
      .filter(el => el.getClientRects().length && !el.closest('[hidden]') && el.tabIndex >= 0);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  dialog.addEventListener('close', () => {
    if (dialog.id === 'short-dialog') $('#short-player').replaceChildren();
    core.setPaused(false);
    rotation.interact(); rotation.pause('dialog', false);
    dialog.returnFocus?.focus({ preventScroll: true });
  });
}
function plainClick(event) {
  return !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0;
}
// One delegated controller for nav, cards, services and generated content links.
// The latest real pointer movement or keyboard focus owns the target; no mode queue.
let inputSource = null;
let previewTimer = 0;
let pendingMode = 'neutral';
const cards = $$('.core-test-resource');
const previewTarget = node => node instanceof Element ? node.closest('[data-core]') : null;
const activatePreview = (source, node) => {
  inputSource = source;
  const mode = previewTarget(node)?.dataset.core || 'neutral';
  if (source === 'pointer' && mode === pendingMode) return;
  clearTimeout(previewTimer);
  pendingMode = mode;
  if (source === 'keyboard' || mode === 'neutral') core.setPreview(mode);
  else previewTimer = setTimeout(() => core.setPreview(mode), 100);
};
function resetPreview() {
  inputSource = null;
  clearTimeout(previewTimer);
  pendingMode = 'neutral';
  core.clearPointer();
  core.setPreview('neutral');
}
// Reuse the mounted engine on home-to-home activation; modified clicks stay native.
$('.site-brand').addEventListener('click', event => {
  if (!plainClick(event)) return;
  event.preventDefault();
  resetPreview();
  window.scrollTo({ top: 0, behavior: 'instant' });
  core.restartIntro();
});
window.addEventListener('pageshow', event => {
  if (event.persisted) { resetPreview(); core.restartIntro(); }
});
document.addEventListener('pointermove', event => {
  if (!fine.matches || event.pointerType === 'touch') return;
  activatePreview('pointer', event.target);
  if (previewTarget(event.target) || event.target.closest('a, button, dialog')) core.clearPointer();
  else core.setPointer(event.clientX, event.clientY);
}, { passive: true });
document.addEventListener('pointerout', event => {
  if (!event.relatedTarget) resetPreview();
}, { passive: true });
document.addEventListener('pointercancel', resetPreview, { passive: true });
document.addEventListener('focusin', event => {
  if (event.target.matches(':focus-visible')) {
    core.clearPointer();
    activatePreview('keyboard', event.target);
  }
});
document.addEventListener('focusout', () => {
  queueMicrotask(() => {
    if (inputSource === 'keyboard') activatePreview('keyboard', document.activeElement);
  });
});
document.addEventListener('scroll', () => {
  if (inputSource === 'pointer') resetPreview();
}, { passive: true, capture: true });
window.addEventListener('blur', resetPreview);
fine.addEventListener('change', resetPreview);
window.addEventListener('navigation:opened', resetPreview);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') resetPreview();
});
const cardVisibility = new IntersectionObserver(entries => {
  entries.forEach(entry => entry.target.classList.toggle('is-visible', entry.isIntersecting));
});
cards.forEach(card => cardVisibility.observe(card));
document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('motion-paused', document.hidden);
  if (document.hidden) resetPreview();
});

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}
function image(src, width, height) {
  const img = element('img');
  img.src = src; img.alt = ''; img.width = width; img.height = height;
  img.loading = 'lazy'; img.decoding = 'async';
  img.addEventListener('error', () => { img.style.visibility = 'hidden'; }, { once: true });
  return img;
}
// One video carousel. The rotation controller owns all timing and pause reasons.
function carousel({ entries, container, count, buttons, render }) {
  let index = 0;
  let transition;
  const show = (animate = false) => {
    transition?.cancel();
    container.querySelector('.carousel-outgoing')?.remove();
    const previous = animate && !reduced.matches ? element('div', 'carousel-outgoing') : null;
    if (previous) {
      previous.setAttribute('aria-hidden', 'true'); previous.inert = true;
      [...container.children].forEach(child => previous.append(child.cloneNode(true)));
      previous.querySelectorAll('[id]').forEach(child => child.removeAttribute('id'));
    }
    render(entries[index], container);
    if (previous) {
      container.append(previous);
      transition = previous.animate([{ opacity: 1, filter: 'blur(0px)' }, { opacity: 0, filter: 'blur(4px)' }], { duration: 560, easing: 'cubic-bezier(.22,1,.36,1)' });
      [...container.children].filter(child => child !== previous).forEach(child => child.animate(
        [{ opacity: 0, filter: 'blur(4px)', transform: 'translateY(4px)' }, { opacity: 1, filter: 'blur(0px)', transform: 'none' }],
        { duration: 560, easing: 'cubic-bezier(.22,1,.36,1)' }
      ));
      transition.finished.then(() => previous.remove(), () => previous.remove());
    }
    count.textContent = (index + 1) + ' / ' + entries.length;
    count.setAttribute('aria-label', 'Eintrag ' + (index + 1) + ' von ' + entries.length);
    // Warm only the next thumbnail; never preload a player or the whole catalogue.
    if (entries.length > 1) {
      const next = entries[(index + 1) % entries.length], thumbnail = new Image();
      thumbnail.fetchPriority = 'low'; thumbnail.src = next.image || 'https://i.ytimg.com/vi/' + next.id + '/hqdefault.jpg';
    }
  };
  const step = (amount, manual = true) => {
    if (manual) { rotation.pause('user', true); syncRotationControl(); }
    index = (index + amount + entries.length) % entries.length; show(true);
    if (manual) $('#carousel-status').textContent = 'Video ' + (index + 1) + ' von ' + entries.length;
  };
  buttons.forEach(button => {
    button.disabled = entries.length < 2;
    button.addEventListener('click', () => step(Number(button.dataset.shortStep)));
  });
  let start = null, suppressClick = false;
  container.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') { start = { x: event.clientX, y: event.clientY }; suppressClick = false; }
  }, { passive: true });
  container.addEventListener('pointercancel', () => { start = null; });
  container.addEventListener('pointerup', event => {
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    start = null;
    if (entries.length > 1 && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      suppressClick = true; step(dx < 0 ? 1 : -1);
    }
  });
  container.addEventListener('click', event => {
    if (suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); suppressClick = false; }
  }, true);
  show();
  carouselLists.push({ id: container.id, length: entries.length, step });
}
function playShort(video, opener) {
  $('#short-dialog-title').textContent = video.title;
  $('#short-external').href = video.url;
  const iframe = element('iframe');
  iframe.title = video.title;
  iframe.src = 'https://www.youtube-nocookie.com/embed/' + video.id + '?autoplay=1&mute=1&playsinline=1';
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.allowFullscreen = true;
  $('#short-player').replaceChildren(iframe);
  openDialog($('#short-dialog'), opener);
}
function renderShort(video, container) {
  const poster = element('a', 'hub-short-poster');
  poster.dataset.core = 'shorts';
  poster.href = video.url;
  poster.setAttribute('aria-label', video.title + ' – Video ansehen');
  poster.setAttribute('aria-haspopup', 'dialog');
  poster.setAttribute('aria-controls', 'short-dialog');
  poster.append(image('https://i.ytimg.com/vi/' + video.id + '/hqdefault.jpg', 480, 360));
  const play = element('span', 'hub-play', '▶'); play.setAttribute('aria-hidden', 'true'); poster.append(play);
  const copy = element('div', 'hub-short-copy');
  const title = element('h3', '', video.title); title.title = video.title;
  const link = element('a', '', 'Video ansehen');
  link.dataset.core = 'shorts';
  link.href = video.url;
  link.setAttribute('aria-label', video.title + ' – Video ansehen');
  link.setAttribute('aria-haspopup', 'dialog');
  link.setAttribute('aria-controls', 'short-dialog');
  copy.append(title, link);
  [poster, link].forEach(item => item.addEventListener('click', event => {
    if (!plainClick(event)) return;
    event.preventDefault(); playShort(video, item);
  }));
  container.replaceChildren(poster, copy);
}
async function loadVideos() {
  try {
    const response = await fetch('/data/youtube-shorts.json');
    if (!response.ok) throw Error('Videos unavailable');
    const data = await response.json();
    if (!Array.isArray(data)) throw Error('Invalid catalogue');
    const seen = new Set();
    const videos = data.filter(video => {
      if (!video || !/^[A-Za-z0-9_-]{11}$/.test(video.id) || !video.title?.trim() ||
          video.url !== 'https://www.youtube.com/shorts/' + video.id || seen.has(video.id)) return false;
      seen.add(video.id); return true;
    });
    // Only call these "latest" when every entry actually supplies a publication date.
    const dated = videos.length > 0 && videos.every(video => Number.isFinite(Date.parse(video.publishedAt)));
    if (dated) videos.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
    if (!videos.length) throw Error('Empty catalogue');
    $('#short-source').textContent = '';
    carousel({ entries: videos.slice(0, 10), container: $('#short-content'), count: $('#short-count'), buttons: $$('[data-short-step]'), render: renderShort });
  } catch {
    $('#short-source').textContent = 'Vorschau derzeit nicht verfügbar';
    // The initial static link remains a useful, honest fallback.
  }
}
await loadVideos();
rotation.configure(carouselLists);
syncRotationControl();
document.body.dataset.contentReady = 'true';
