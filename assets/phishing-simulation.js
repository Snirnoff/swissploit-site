// The landing page stays useful without JavaScript; the game loads on demand.
const start = document.querySelector('[data-phish-start]');
const status = document.getElementById('simulation-status');
let loading = false;

start?.addEventListener('click', async event => {
  event.preventDefault();
  if (loading) return;
  loading = true;
  start.setAttribute('aria-busy', 'true');
  status.textContent = 'Der Ozean wird bereitgemacht …';
  try {
    const { startGame } = await import('./phishing-game.js');
    await startGame(start);
    status.textContent = '';
  } catch {
    status.textContent = 'Die Challenge konnte nicht geladen werden. Die wichtigsten Tipps und das Video findest du direkt unten.';
    document.getElementById('simulation-takeaways').scrollIntoView({ behavior: 'instant' });
  } finally {
    loading = false;
    start.removeAttribute('aria-busy');
  }
});

// No YouTube request, thumbnail request or third-party connection before consent.
document.querySelector('[data-simulation-video]')?.addEventListener('click', event => {
  const frame = document.createElement('iframe');
  frame.src = 'https://www.youtube-nocookie.com/embed/n_2DYwpVsS4';
  frame.title = 'Phishing wirklich erkennen – Swissploit Learn';
  frame.loading = 'lazy';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.allow = 'encrypted-media; picture-in-picture; fullscreen';
  frame.allowFullscreen = true;
  const host = event.currentTarget.closest('.learn-video-frame');
  host.replaceChildren(frame);
  frame.focus();
});
