// Jahr
document.getElementById('year').textContent = new Date().getFullYear();

// THEME TOGGLE
const root = document.documentElement;
const toggle = document.getElementById('themeToggle');

function applyTheme(t){
  root.setAttribute('data-theme', t);
  localStorage.setItem('swissploit-theme', t);
}
(function initTheme(){
  const saved = localStorage.getItem('swissploit-theme');
  if(saved){ applyTheme(saved); }
  else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
})();
toggle.addEventListener('click', () => {
  const cur = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(cur);
});

// Dezente Parallax-Übersetzung der BG-Layer
const parallaxEls = document.querySelectorAll('[data-speed]');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  parallaxEls.forEach(el => {
    const speed = parseFloat(el.getAttribute('data-speed')) || 0;
    el.style.transform = `translate3d(0, ${y * speed * -0.06}px, 0)`;
  });
}, { passive: true });

// Shorts Rail – Buttons scrollen die Leiste
const rail = document.getElementById('shortsRail');
const prevBtn = document.querySelector('.rail-btn.prev');
const nextBtn = document.querySelector('.rail-btn.next');
const scrollAmount = () => Math.min(rail.clientWidth * 0.8, 600);

prevBtn.addEventListener('click', () => {
  rail.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
});
nextBtn.addEventListener('click', () => {
  rail.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
});
