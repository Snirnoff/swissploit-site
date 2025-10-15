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



/*
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

*/


document.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target); // nur einmal animieren
      }
    });
  }, { threshold: 0.07 });

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


// Smooth Anti-Magnet Effekt für Hero "Swissploit"
(function(){
  const brand = document.querySelector('.hero-brand');
  if(!brand) return;
  const letters = brand.querySelectorAll('span');

  window.addEventListener('mousemove', (e)=>{
    const rect = brand.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    letters.forEach(letter => {
      const lRect = letter.getBoundingClientRect();
      const dx = mouseX - (lRect.left + lRect.width/2);
      const dy = mouseY - (lRect.top + lRect.height/2);
      const dist = Math.sqrt(dx*dx + dy*dy);

      // nur reagieren, wenn die Maus relativ nahe am Buchstaben ist
      if(dist < 120){
        const angle = Math.atan2(dy, dx);
        const offset = (120 - dist) * 0.3; // Stärke des Ausweichens
        const x = Math.cos(angle) * -offset;
        const y = Math.sin(angle) * -offset;
        letter.style.transform = `translate(${x}px, ${y}px)`;
      } else {
        // langsam zurück
        letter.style.transform = `translate(0,0)`;
      }
    });
  }, { passive: true });
})();

            





// Service-Filter
            (function(){
              const container = document.querySelector('.services .cards');
              const chips = document.querySelectorAll('.service-filters .chip');
              if(!container || !chips.length) return;
            
              const cards = Array.from(container.querySelectorAll('.card'));
            
              function applyFilter(cat){
                cards.forEach(card => {
                  const cats = (card.getAttribute('data-cat') || '').split(',').map(s => s.trim());
                  const match = (cat === 'all') || cats.includes(cat);
                  card.classList.toggle('is-hidden', !match);
                });
              }
            
              chips.forEach(chip => {
                chip.addEventListener('click', () => {
                  chips.forEach(c => { c.classList.remove('is-active'); c.setAttribute('aria-selected','false'); });
                  chip.classList.add('is-active'); chip.setAttribute('aria-selected','true');
                  applyFilter(chip.dataset.filter);
                });
              });
            
              // Initial: "Alle"
              applyFilter('all');
            })();
              // Service-Filter mit FLIP-Animation (Apple-like)
          (function(){
            const container = document.querySelector('.services .cards');
            const chips = document.querySelectorAll('.service-filters .chip');
            if(!container || !chips.length) return;
          
            const cards = Array.from(container.querySelectorAll('.card'));
          
            function getRects() {
              const map = new Map();
              cards.forEach(c => map.set(c, c.getBoundingClientRect()));
              return map;
            }
          
            function flipAnimate(firstRects) {
              const lastRects = getRects();
              cards.forEach(card => {
                const f = firstRects.get(card);
                const l = lastRects.get(card);
                if(!f || !l) return;
                const dx = f.left - l.left;
                const dy = f.top  - l.top;
                if (dx || dy) {
                  card.style.transform = `translate(${dx}px, ${dy}px)`;
                  // reflow erzwingen
                  card.getBoundingClientRect();
                  card.style.transition = 'transform .35s cubic-bezier(.2,.8,.2,1)';
                  card.style.transform = '';
                  card.addEventListener('transitionend', () => {
                    card.style.transition = '';
                  }, { once: true });
                }
              });
            }
          
            function applyFilter(cat){
              // 1) Erste Positionen merken
              const first = getRects();
          
              // 2) Zielzustand markieren (ohne sofort display:none zu setzen)
              cards.forEach(card => {
                const cats = (card.getAttribute('data-cat') || '').split(',').map(s => s.trim());
                const match = (cat === 'all') || cats.includes(cat);
          
                // bereits sichtbare → ggf. ausblenden vorbereiten
                if(!match && !card.classList.contains('is-hidden')) {
                  card.classList.add('will-hide');
                }
          
                // versteckte → einblenden vorbereiten
                if(match && card.classList.contains('is-hidden')) {
                  card.classList.remove('is-hidden');
                  card.classList.add('will-show');
                }
              });
          
              // 3) FLIP: Positionswechsel smooth animieren
              flipAnimate(first);
          
              // 4) Nach kurzer Zeit finalisieren
              //    - will-hide → wirklich entfernen (display:none)
              //    - will-show → sichtbar animieren
              window.setTimeout(() => {
                cards.forEach(card => {
                  if(card.classList.contains('will-hide')) {
                    card.classList.remove('will-hide');
                    card.classList.add('is-hidden');
                  }
                });
          
                // Einblend-Animation fuer neu sichtbare
                cards.forEach(card => {
                  if(card.classList.contains('will-show')) {
                    // reflow, dann appearing fuer fade-in/slide-in
                    card.getBoundingClientRect();
                    card.classList.add('appearing');
                    card.classList.remove('will-show');
                    card.addEventListener('transitionend', () => {
                      card.classList.remove('appearing');
                    }, { once: true });
                  }
                });
              }, 240); // muss groesser als will-hide Transition sein
            }
          
            // UI-Events
            chips.forEach(chip => {
              chip.addEventListener('click', () => {
                chips.forEach(c => { c.classList.remove('is-active'); c.setAttribute('aria-selected','false'); });
                chip.classList.add('is-active'); chip.setAttribute('aria-selected','true');
                applyFilter(chip.dataset.filter);
              });
            });
          
            // Initial: Alle
            applyFilter('all');
          })();

/* =========================================================
   START: SHORTS CAROUSEL (with edge "peek")
   - zeigt 3/2/1 Karten (Desktop/Tablet/Mobile)
   - Peeking links/rechts via Viewport-Padding
   - Buttons + Swipe/Drag
   ========================================================= */
(function shortsCarousel() {
  const car = document.querySelector('.shorts-carousel');
  if (!car) return;

  const viewport = car.querySelector('.sc-viewport');
  const track = car.querySelector('.sc-track');
  const items = Array.from(track.querySelectorAll('.short'));
  const prev = car.querySelector('.sc-btn.prev');
  const next = car.querySelector('.sc-btn.next');

  let index = 0;        // aktuelle "Seite"
  let visible = 3;      // 3/2/1 – wird dynamisch ermittelt
  let gapPx = 20;       // aus CSS --gap
  let peekPx = 32;      // aus CSS --peek

  // liest eine CSS-Variable (px) vom Element und gibt Number zurück
  function readCssPx(el, varName, fallback) {
    const val = getComputedStyle(el).getPropertyValue(varName).trim();
    const n = parseFloat(val || '');
    return Number.isFinite(n) ? n : fallback;
  }

  // 3/2/1 je nach Containerbreite (wie Services)
  function computeVisible() {
    const w = viewport.clientWidth;
    if (w < 640) return 1;
    if (w < 1024) return 2;
    return 3;
  }

  // Gesamtseitenzahl
  function maxIndexFor(count, vis) {
    return Math.max(0, Math.ceil(count / vis) - 1);
  }

  // Translate berechnen: seitenweise in PX schieben (robust mit Peek/Gaps)
  function translateFor(indexVal) {
    // Breite einer Karte inkl. Gap ausmessen
    const itemW = items[0]?.getBoundingClientRect().width || 0;
    const pageWidth = (itemW * visible) + (gapPx * (visible - 1));
    return -(indexVal * pageWidth);
  }

  function applyLayout() {
    visible = computeVisible();
    car.style.setProperty('--visible', String(visible));
    gapPx = readCssPx(car, '--gap', 20);
    peekPx = readCssPx(car, '--peek', 32);

    // Index ggf. clampen
    const maxIdx = maxIndexFor(items.length, visible);
    if (index > maxIdx) index = maxIdx;

    update(false);
  }

  function update(animate = true) {
    // optional Animation
    track.style.transition = animate ? 'transform .36s cubic-bezier(.2,.8,.2,1)' : 'none';
    const x = translateFor(index);
    track.style.transform = `translateX(${x}px)`;

    // Buttons
    prev.disabled = (index === 0);
    next.disabled = (index >= maxIndexFor(items.length, visible));
  }

  // Buttons
  prev.addEventListener('click', () => { index = Math.max(0, index - 1); update(); });
  next.addEventListener('click', () => {
    const maxIdx = maxIndexFor(items.length, visible);
    index = Math.min(maxIdx, index + 1);
    update();
  });

  // Swipe/Drag
  let dragging = false, startX = 0, curX = 0, startTx = 0;

  function currentTranslateFromStyle() {
    const m = /translateX\((-?\d+(?:\.\d+)?)px\)/.exec(track.style.transform || '');
    return m ? parseFloat(m[1]) : translateFor(index);
  }

  function onDown(e) {
    dragging = true;
    startX = (e.touches ? e.touches[0].clientX : e.clientX) || 0;
    startTx = currentTranslateFromStyle();
    track.style.transition = 'none';
  }
  function onMove(e) {
    if (!dragging) return;
    curX = (e.touches ? e.touches[0].clientX : e.clientX) || startX;
    const dx = curX - startX;
    track.style.transform = `translateX(${startTx + dx}px)`;
  }
  function onUp() {
    if (!dragging) return;
    dragging = false;
    track.style.transition = 'transform .36s cubic-bezier(.2,.8,.2,1)';

    const dx = (curX - startX) || 0;
    const threshold = Math.max(60, viewport.clientWidth * 0.15); // ~15% oder min 60px
    if (dx > threshold) index = Math.max(0, index - 1);
    else if (dx < -threshold) {
      const maxIdx = maxIndexFor(items.length, visible);
      index = Math.min(maxIdx, index + 1);
    }
    update();
  }

  viewport.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp);

  // Touch Fallback (ältere iOS)
  viewport.addEventListener('touchstart', onDown, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('touchend', onUp);

  // Re-Layout bei Resize (auch Schriftgrößenwechsel etc.)
  const ro = new ResizeObserver(() => applyLayout());
  ro.observe(viewport);

  // Init
  applyLayout();
})();
 /* =========================================================
    END: SHORTS CAROUSEL
    ========================================================= */

