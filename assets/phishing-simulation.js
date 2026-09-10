// The landing page stays useful without JavaScript; the game loads on demand.
const starts = document.querySelectorAll('[data-phish-start]');
const status = document.getElementById('simulation-status');
let loading = false;

async function startSimulation(event) {
  event.preventDefault();
  if (loading) return;
  const start = event.currentTarget;
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
}

starts.forEach(start => start.addEventListener('click', startSimulation));
