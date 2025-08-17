// Jahr aktualisieren
document.getElementById('year').textContent = new Date().getFullYear();

// Parallax Bewegung
const parallaxEls = document.querySelectorAll('[data-speed]');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  parallaxEls.forEach(el => {
    const speed = parseFloat(el.getAttribute('data-speed')) || 0;
    el.style.transform = `translate3d(0, ${y * speed * -0.06}px, 0)`;
  });
}, { passive: true });

// Scrollytelling
const steps = [...document.querySelectorAll('#steps li')];
const copy = document.getElementById('stickyCopy');
const centerpiece = document.getElementById('centerpiece');

function applyState(step){
  const text = step.dataset.text || '';
  const rot = parseFloat(step.dataset.rotate || '0');
  const scale = parseFloat(step.dataset.scale || '1');
  copy.textContent = text;
  centerpiece.style.transform = `rotate(${rot}deg) scale(${scale})`;
}

if(steps.length){
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting) applyState(entry.target);
    });
  }, { root: null, threshold: 0.6 });
  steps.forEach(s => io.observe(s));
  applyState(steps[0]);
}

// Tastatur-Navigation (Barrierefreiheit)
document.addEventListener('keydown', (e) => {
  if(e.key === 'ArrowDown' || e.key === 'PageDown'){
    e.preventDefault();
    const next = steps.find(s => s.getBoundingClientRect().top > 10);
    if(next) next.scrollIntoView({ behavior:'smooth', block:'start' });
  }
  if(e.key === 'ArrowUp' || e.key === 'PageUp'){
    e.preventDefault();
    const prev = [...steps].reverse().find(s => s.getBoundingClientRect().top < -10);
    if(prev) prev.scrollIntoView({ behavior:'smooth', block:'start' });
  }
});
