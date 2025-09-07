// Jahr
document.getElementById('year').textContent = new Date().getFullYear();

// THEME TOGGLE (iOS-like)
const root = document.documentElement;
const toggle = document.getElementById('themeToggle');

function setTheme(t){
  root.setAttribute('data-theme', t);
  localStorage.setItem('swissploit-theme', t);
  // aria-pressed true = dark on
  toggle.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
}
(function initTheme(){
  const saved = localStorage.getItem('swissploit-theme');
  if(saved){ setTheme(saved); }
  else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }
})();
toggle.addEventListener('click', () => {
  const cur = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  setTheme(cur);
});

// Dezente Parallax-Translation der BG-Layer
const parallaxEls = document.querySelectorAll('[data-speed]');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  parallaxEls.forEach(el => {
    const speed = parseFloat(el.getAttribute('data-speed')) || 0;
    el.style.transform = `translate3d(0, ${y * speed * -0.06}px, 0)`;
  });
}, { passive: true });

// Shorts-Rail Pfeile
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

// Shorts Rail Buttons
(function(){
  const rail = document.getElementById('shortsRail');
  const prevBtn = document.querySelector('#shorts .rail-btn.prev');
  const nextBtn = document.querySelector('#shorts .rail-btn.next');
  if(!rail || !prevBtn || !nextBtn) return;

  const step = () => Math.min(rail.clientWidth * 0.8, 600);

  function updateButtons(){
    // feststellen, ob links/rechts noch Scroll-Puffer da ist
    const maxScroll = rail.scrollWidth - rail.clientWidth;
    const x = rail.scrollLeft;
    prevBtn.disabled = x <= 2;
    nextBtn.disabled = x >= maxScroll - 2;
  }

  prevBtn.addEventListener('click', () => {
    rail.scrollBy({ left: -step(), behavior: 'smooth' });
  });
  nextBtn.addEventListener('click', () => {
    rail.scrollBy({ left: step(), behavior: 'smooth' });
  });

  rail.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons);
  // Initialzustand
  updateButtons();
})();




document.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target); // nur einmal animieren
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});

// Mailto aus Formular generieren (nur Nachricht)
(function(){
  const form = document.getElementById('contactForm');
  if(!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const msg = (document.getElementById('cf-message')?.value || '').trim();
    const to = 'hello@swissploit.ch';
    const subject = 'Kontaktanfrage Swissploit';
    const body = msg ? msg : '';

    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  });
})();

/* ===== Apple-like Veredelungen ===== */

// A) Header verstärken, sobald gescrollt
(function(){
  const header = document.querySelector('.site-header');
  if(!header) return;
  const onScroll = () => header.classList.toggle('scrolled', (window.scrollY||0) > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

// B) Cursor-Spotlight im Hero (setzt CSS-Variablen --mx/--my)
(function(){
  const hero = document.querySelector('.hero');
  if(!hero) return;
  window.addEventListener('pointermove', (e)=>{
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    document.documentElement.style.setProperty('--mx', x + '%');
    document.documentElement.style.setProperty('--my', y + '%');
  }, { passive: true });
})();

// C) Gestaffelte Reveals für Gruppen (Features, Cards, Shorts)
(function(){
  const groups = document.querySelectorAll('.features, .cards, .shorts-container');
  groups.forEach(group => {
    const items = group.querySelectorAll('.reveal, .feature, .card, .short');
    items.forEach((el, i) => {
      el.style.transitionDelay = (i * 0.06) + 's';
      el.classList.add('reveal'); // sicherstellen, dass Klasse da ist
    });
  });
})();

// D) Optionale „magnetische“ Buttons (füge Klasse .magnetic im HTML hinzu)
(function(){
  const mags = document.querySelectorAll('.btn.magnetic');
  mags.forEach(btn => {
    btn.addEventListener('mousemove', (e)=>{
      const r = btn.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width/2);
      const y = e.clientY - (r.top + r.height/2);
      btn.style.transform = `translate(${x*0.06}px, ${y*0.06}px)`;
    });
    btn.addEventListener('mouseleave', ()=> btn.style.transform = 'translate(0,0)');
  });
})();
