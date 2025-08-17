// Jahr
document.getElementById('year').textContent = new Date().getFullYear();

// Parallax Translation (weiche Bewegung der bg-layer & device)
const parallaxEls = document.querySelectorAll('[data-speed]');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  parallaxEls.forEach(el => {
    const speed = parseFloat(el.getAttribute('data-speed')) || 0;
    el.style.transform = `translate3d(0, ${y * speed * -0.06}px, 0)`;
  });
}, { passive: true });

// Logo-Plus dreht sich beim Scrollen
const plus = document.getElementById('plus');
const clamp = (n, min, max) => Math.max(min, Math.min(n, max));

function spinPlus(){
  const y = window.scrollY || 0;
  // sanfte Rotation: 0.18 Grad pro px Scroll, gedeckelt
  const angle = clamp(y * 0.18, 0, 2880); // bis 8 volle Umdrehungen
  // Drehung um die Mitte des SVG (100,100 im 200er ViewBox)
  if (plus) plus.setAttribute('transform', `rotate(${angle} 100 100)`);
}
spinPlus();
window.addEventListener('scroll', spinPlus, { passive: true });

// Tastatur-Navigation (optional)
document.addEventListener('keydown', (e) => {
  if(e.key === 'ArrowDown' || e.key === 'PageDown'){
    e.preventDefault();
    window.scrollBy({ top: window.innerHeight * 0.9, behavior: 'smooth' });
  }
  if(e.key === 'ArrowUp' || e.key === 'PageUp'){
    e.preventDefault();
    window.scrollBy({ top: -window.innerHeight * 0.9, behavior: 'smooth' });
  }
});
