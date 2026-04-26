// assets/app.js

// Jahr (falls vorhanden)
(function(){
  const y = document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();
})();


// THEME TOGGLE (iOS-like) — sicher, falls Button auf Blog fehlt
const root = document.documentElement;
const toggle = document.getElementById('themeToggle');

function setTheme(t){
  root.setAttribute('data-theme', t);
  localStorage.setItem('swissploit-theme', t);

  // aria-pressed true = dark on (nur wenn Toggle existiert)
  if(toggle) toggle.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
}

(function initTheme(){
  const saved = localStorage.getItem('swissploit-theme');
  if(saved){ setTheme(saved); }
  else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }
})();

if(toggle){
  toggle.addEventListener('click', () => {
    const cur = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(cur);
  });
}


// Dezente Parallax-Translation der BG-Layer
const parallaxEls = document.querySelectorAll('[data-speed]');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  parallaxEls.forEach(el => {
    const speed = parseFloat(el.getAttribute('data-speed')) || 0;
    el.style.transform = `translate3d(0, ${y * speed * -0.06}px, 0)`;
  });
}, { passive: true });


// Reveal Observer
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

  const mobileSectionQuery = window.matchMedia && window.matchMedia('(max-width: 768px)');
  let mobileSectionObserver = null;

  function disconnectMobileSectionObserver() {
    if (mobileSectionObserver) {
      mobileSectionObserver.disconnect();
      mobileSectionObserver = null;
    }
  }

  function applyMobileSectionReveal(isMobile) {
    const sections = Array.from(document.querySelectorAll('section:not(#about)'));
    if (!isMobile) {
      disconnectMobileSectionObserver();
      return;
    }

    sections.forEach(section => section.classList.add('reveal'));
    if (!('IntersectionObserver' in window) || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      sections.forEach(section => section.classList.add('visible'));
      return;
    }

    disconnectMobileSectionObserver();
    mobileSectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        } else {
          entry.target.classList.remove('visible');
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -12% 0px'
    });

    sections.forEach(section => mobileSectionObserver.observe(section));
  }

  if (mobileSectionQuery) {
    applyMobileSectionReveal(mobileSectionQuery.matches);
    if ('addEventListener' in mobileSectionQuery) {
      mobileSectionQuery.addEventListener('change', (event) => applyMobileSectionReveal(event.matches));
    } else if ('addListener' in mobileSectionQuery) {
      mobileSectionQuery.addListener((event) => applyMobileSectionReveal(event.matches));
    }
  }
});


// About section Anime.js reveal
(function(){
  const about = document.getElementById('about');
  if(!about) return;

  const items = Array.from(about.querySelectorAll('.about-anime'));
  if(!items.length) return;

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileQuery = window.matchMedia && window.matchMedia('(max-width: 768px)');
  let observer = null;
  let aboutAnimation = null;
  let hasAnimated = false;

  function shouldAnimate(){
    return !(reducedMotion && reducedMotion.matches) && !(mobileQuery && mobileQuery.matches);
  }

  function disconnectObserver(){
    if(observer){
      observer.disconnect();
      observer = null;
    }
  }

  function stopAboutAnimation(){
    if(aboutAnimation && typeof aboutAnimation.cancel === 'function'){
      aboutAnimation.cancel();
    }
    aboutAnimation = null;
  }

  function showStatic(){
    disconnectObserver();
    stopAboutAnimation();
    items.forEach(item => {
      item.style.opacity = '1';
      item.style.transform = 'none';
      item.style.filter = 'none';
      item.style.willChange = 'auto';
    });
    about.classList.add('is-about-anime-complete');
  }

  function resetForAnimation(){
    items.forEach(item => {
      item.style.removeProperty('opacity');
      item.style.removeProperty('transform');
      item.style.removeProperty('translate');
      item.style.removeProperty('filter');
      item.style.removeProperty('will-change');
    });
    about.classList.remove('is-about-anime-complete');
  }

  function runAboutAnimation(){
    if(hasAnimated) return;
    hasAnimated = true;
    disconnectObserver();

    const animeApi = window.anime;
    if(!animeApi || typeof animeApi.animate !== 'function' || typeof animeApi.stagger !== 'function'){
      showStatic();
      return;
    }

    const { animate, stagger } = animeApi;
    aboutAnimation = animate(items, {
      opacity: [0, 1],
      translateY: [32, 0],
      filter: ['blur(14px)', 'blur(0px)'],
      duration: 1100,
      delay: stagger(120),
      ease: 'outExpo',
      onComplete: () => {
        aboutAnimation = null;
        about.classList.add('is-about-anime-complete');
      }
    });
  }

  function setupAboutReveal(){
    disconnectObserver();

    if(!shouldAnimate() || !('IntersectionObserver' in window)){
      showStatic();
      return;
    }

    if(hasAnimated){
      showStatic();
      return;
    }

    resetForAnimation();
    observer = new IntersectionObserver((entries) => {
      if(entries.some(entry => entry.isIntersecting)){
        runAboutAnimation();
      }
    }, {
      threshold: 0.22,
      rootMargin: '0px 0px -12% 0px'
    });

    observer.observe(about);
  }

  function listenToMediaQuery(query){
    if(!query) return;
    if(query.addEventListener){
      query.addEventListener('change', setupAboutReveal);
    } else if(query.addListener){
      query.addListener(setupAboutReveal);
    }
  }

  setupAboutReveal();
  listenToMediaQuery(mobileQuery);
  listenToMediaQuery(reducedMotion);
})();


const featuredProof = document.querySelector('.featured-proof');

if(featuredProof){
  const featuredCopy = featuredProof.querySelector('.featured-copy');
  const featuredMedia = featuredProof.querySelector('.featured-media');

  const clamp01 = (value) => Math.min(1, Math.max(0, value));
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const updateFeaturedProof = () => {
    const rect = featuredProof.getBoundingClientRect();
    const viewportH = window.innerHeight || document.documentElement.clientHeight;

    const sectionStart = viewportH * 0.88;
    const sectionEnd = viewportH * 0.18;
    const rawProgress = (sectionStart - rect.top) / (sectionStart - sectionEnd);
    const progress = clamp01(rawProgress);

    const copyReveal = easeOutCubic(clamp01((progress - 0.03) / 0.42));
    const videoReveal = easeOutCubic(clamp01((progress - 0.25) / 0.5));

    featuredProof.style.setProperty('--featured-copy-reveal', copyReveal.toFixed(4));
    featuredProof.style.setProperty('--featured-video-reveal', videoReveal.toFixed(4));

    if(progress > 0.42){
      featuredProof.classList.add('is-active');
    } else {
      featuredProof.classList.remove('is-active');
    }
  };

  updateFeaturedProof();
  window.addEventListener('scroll', updateFeaturedProof, { passive: true });
  window.addEventListener('resize', updateFeaturedProof);
}


const shortsSection = document.querySelector('.shorts');

if(shortsSection){
  const clamp01 = (value) => Math.min(1, Math.max(0, value));
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const updateShortsSequence = () => {
    const rect = shortsSection.getBoundingClientRect();
    const viewportH = window.innerHeight || document.documentElement.clientHeight;

    const sectionStart = viewportH * 0.9;
    const sectionEnd = viewportH * 0.16;
    const rawProgress = (sectionStart - rect.top) / (sectionStart - sectionEnd);
    const progress = clamp01(rawProgress);

    const copyReveal = easeOutCubic(clamp01((progress - 0.02) / 0.4));
    const trackReveal = easeOutCubic(clamp01((progress - 0.5) / 0.5));

    shortsSection.style.setProperty('--shorts-copy-reveal', copyReveal.toFixed(4));
    shortsSection.style.setProperty('--shorts-track-reveal', trackReveal.toFixed(4));

    if(progress > 0.46){
      shortsSection.classList.add('is-active');
    } else {
      shortsSection.classList.remove('is-active');
    }
  };

  updateShortsSequence();
  window.addEventListener('scroll', updateShortsSequence, { passive: true });
  window.addEventListener('resize', updateShortsSequence);
}
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
  const groups = document.querySelectorAll('.cards, .shorts-container, .blog-grid');
  groups.forEach(group => {
    const items = group.querySelectorAll('.reveal, .card, .short, .blog-card');
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


// ✅ Smooth Anti-Magnet Effekt für Hero + Blog Brand (Swissploit Letter Hover)
(function(){
  const brands = document.querySelectorAll('.hero-brand, .blog-brand');
  if(!brands.length) return;

  const brandItems = Array.from(brands).map(brand => ({
    brand,
    letters: Array.from(brand.querySelectorAll('span'))
  }));

  window.addEventListener('mousemove', (e)=>{
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    brandItems.forEach(({ brand, letters }) => {
      const bRect = brand.getBoundingClientRect();
      const inView =
        bRect.bottom > 0 &&
        bRect.right > 0 &&
        bRect.left < window.innerWidth &&
        bRect.top < window.innerHeight;

      if(!inView) return;

      letters.forEach(letter => {
        const lRect = letter.getBoundingClientRect();
        const dx = mouseX - (lRect.left + lRect.width/2);
        const dy = mouseY - (lRect.top + lRect.height/2);
        const dist = Math.sqrt(dx*dx + dy*dy);

        if(dist < 120){
          const angle = Math.atan2(dy, dx);
          const offset = (120 - dist) * 0.3;
          const x = Math.cos(angle) * -offset;
          const y = Math.sin(angle) * -offset;
          letter.style.transform = `translate(${x}px, ${y}px)`;
        } else {
          letter.style.transform = `translate(0,0)`;
        }
      });
    });
  }, { passive: true });
})();


// Service-Filter (einfach)
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
        card.getBoundingClientRect(); // reflow
        card.style.transition = 'transform .35s cubic-bezier(.2,.8,.2,1)';
        card.style.transform = '';
        card.addEventListener('transitionend', () => {
          card.style.transition = '';
        }, { once: true });
      }
    });
  }

  function applyFilter(cat){
    const first = getRects();

    cards.forEach(card => {
      const cats = (card.getAttribute('data-cat') || '').split(',').map(s => s.trim());
      const match = (cat === 'all') || cats.includes(cat);

      if(!match && !card.classList.contains('is-hidden')) {
        card.classList.add('will-hide');
      }
      if(match && card.classList.contains('is-hidden')) {
        card.classList.remove('is-hidden');
        card.classList.add('will-show');
      }
    });

    flipAnimate(first);

    window.setTimeout(() => {
      cards.forEach(card => {
        if(card.classList.contains('will-hide')) {
          card.classList.remove('will-hide');
          card.classList.add('is-hidden');
        }
      });

      cards.forEach(card => {
        if(card.classList.contains('will-show')) {
          card.getBoundingClientRect();
          card.classList.add('appearing');
          card.classList.remove('will-show');
          card.addEventListener('transitionend', () => {
            card.classList.remove('appearing');
          }, { once: true });
        }
      });
    }, 240);
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => { c.classList.remove('is-active'); c.setAttribute('aria-selected','false'); });
      chip.classList.add('is-active'); chip.setAttribute('aria-selected','true');
      applyFilter(chip.dataset.filter);
    });
  });

  applyFilter('all');
})();


/* =========================================================
   START: SHORTS CAROUSEL (with edge "peek")
   ========================================================= */
(function shortsCarousel() {
  const car = document.querySelector('.shorts-carousel');
  if (!car) return;

  const viewport = car.querySelector('.sc-viewport');
  const track = car.querySelector('.sc-track');
  const items = Array.from(track.querySelectorAll('.short'));
  const prev = car.querySelector('.sc-btn.prev');
  const next = car.querySelector('.sc-btn.next');

  let index = 0;
  let visible = 3;
  let gapPx = 20;
  let peekPx = 32;

  function readCssPx(el, varName, fallback) {
    const val = getComputedStyle(el).getPropertyValue(varName).trim();
    const n = parseFloat(val || '');
    return Number.isFinite(n) ? n : fallback;
  }

  function computeVisible() {
    const w = viewport.clientWidth;
    if (w < 640) return 1;
    if (w < 1024) return 2;
    return 3;
  }

  function maxIndexFor(count, vis) {
    return Math.max(0, Math.ceil(count / vis) - 1);
  }

  function translateFor(indexVal) {
    const itemW = items[0]?.getBoundingClientRect().width || 0;
    const pageWidth = (itemW * visible) + (gapPx * (visible - 1));
    return -(indexVal * pageWidth);
  }

  function applyLayout() {
    visible = computeVisible();
    car.style.setProperty('--visible', String(visible));
    gapPx = readCssPx(car, '--gap', 20);
    peekPx = readCssPx(car, '--peek', 32);

    const maxIdx = maxIndexFor(items.length, visible);
    if (index > maxIdx) index = maxIdx;

    update(false);
  }

  function update(animate = true) {
    track.style.transition = animate ? 'transform .36s cubic-bezier(.2,.8,.2,1)' : 'none';
    const x = translateFor(index);
    track.style.transform = `translateX(${x}px)`;

    if(prev) prev.disabled = (index === 0);
    if(next) next.disabled = (index >= maxIndexFor(items.length, visible));
  }

  if(prev) prev.addEventListener('click', () => { index = Math.max(0, index - 1); update(); });
  if(next) next.addEventListener('click', () => {
    const maxIdx = maxIndexFor(items.length, visible);
    index = Math.min(maxIdx, index + 1);
    update();
  });

  let dragging = false, startX = 0, startY = 0, curX = 0, startTx = 0;
  let hasDragged = false;
  let suppressTapUntil = 0;
  const tapThreshold = 10;

  function shortUrlFromEmbed(src) {
    const match = /\/embed\/([^?&/]+)/.exec(src || '');
    return match ? `https://youtube.com/shorts/${match[1]}` : src;
  }

  items.forEach((item) => {
    const iframe = item.querySelector('iframe');
    const shortUrl = shortUrlFromEmbed(iframe?.src || '');
    if (shortUrl) item.dataset.shortUrl = shortUrl;

    item.addEventListener('click', (e) => {
      if (performance.now() < suppressTapUntil) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (!window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
      if (!item.dataset.shortUrl) return;

      window.open(item.dataset.shortUrl, '_blank', 'noopener');
    });
  });

  function currentTranslateFromStyle() {
    const m = /translateX\((-?\d+(?:\.\d+)?)px\)/.exec(track.style.transform || '');
    return m ? parseFloat(m[1]) : translateFor(index);
  }

  function onDown(e) {
    dragging = true;
    startX = (e.touches ? e.touches[0].clientX : e.clientX) || 0;
    startY = (e.touches ? e.touches[0].clientY : e.clientY) || 0;
    curX = startX;
    startTx = currentTranslateFromStyle();
    hasDragged = false;
    track.style.transition = 'none';
  }
  function onMove(e) {
    if (!dragging) return;
    const point = e.touches ? e.touches[0] : e;
    curX = point?.clientX || startX;
    const curY = point?.clientY || startY;
    const dx = curX - startX;
    const dy = curY - startY;
    if (!hasDragged && Math.abs(dx) > tapThreshold && Math.abs(dx) > Math.abs(dy)) {
      hasDragged = true;
    }
    track.style.transform = `translateX(${startTx + dx}px)`;
  }
  function onUp() {
    if (!dragging) return;
    dragging = false;
    track.style.transition = 'transform .36s cubic-bezier(.2,.8,.2,1)';

    const dx = (curX - startX) || 0;
    if (hasDragged) suppressTapUntil = performance.now() + 400;
    const threshold = Math.max(60, viewport.clientWidth * 0.15);
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

  viewport.addEventListener('touchstart', onDown, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('touchend', onUp);
  window.addEventListener('touchcancel', onUp);

  const ro = new ResizeObserver(() => applyLayout());
  ro.observe(viewport);

  applyLayout();
})();
/* =========================================================
   END: SHORTS CAROUSEL
   ========================================================= */


/* =========================================================
   page transition (blur/fade)
   ========================================================= */
(function pageTransitions(){
  const body = document.body;

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-transition]');
    if(!a) return;

    const href = a.getAttribute('href');
    if(!href) return;
    if(href.startsWith('#')) return;

    if(a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const url = new URL(href, window.location.href);
    if(url.origin !== window.location.origin) return;

    e.preventDefault();

    body.classList.add('is-leaving');

    window.setTimeout(() => {
      window.location.href = url.href;
    }, 320);
  });
})();

// ===== NAV ACTIVE SECTION (robust: click locks active until anchor jump finishes) =====
(function () {
  const nav = document.querySelector(".site-header .nav");
  if (!nav) return;

  const links = Array.from(nav.querySelectorAll("a"));
  const header = document.querySelector(".site-header");

  const headerOffset = (header ? header.offsetHeight : 72) + 70;

  // Blog pages: keep Blog active
  const p = (location.pathname || "").toLowerCase();
  if (p.includes("blog.html") || p.includes("blog-post.html")) {
    const blogLink = links.find(a => (a.getAttribute("href") || "").toLowerCase().includes("blog.html"));
    links.forEach(a => a.classList.remove("is-active"));
    if (blogLink) blogLink.classList.add("is-active");
    return;
  }

  const items = links
    .map(a => {
      const href = a.getAttribute("href") || "";
      const hash = href.includes("#") ? href.split("#")[1] : "";
      const el = hash ? document.getElementById(hash) : null;
      return el ? { a, el, hash } : null;
    })
    .filter(Boolean);

  if (!items.length) return;

  function clearActive() {
    links.forEach(a => a.classList.remove("is-active"));
  }

  function setActiveLink(a) {
    if (!a) return;
    clearActive();
    a.classList.add("is-active");
  }

  // Lock to prevent updateActive() from overriding click state during anchor jump
  let lockedUntil = 0;
  function lock(ms = 450) {
    lockedUntil = Date.now() + ms;
  }
  function isLocked() {
    return Date.now() < lockedUntil;
  }

  function updateActive() {
    if (isLocked()) return;

    const y = window.scrollY || document.documentElement.scrollTop || 0;

    let active = null;
    for (const it of items) {
      const top = it.el.getBoundingClientRect().top + y;
      if (top <= y + headerOffset) active = it;
    }

    clearActive();
    if (active) active.a.classList.add("is-active");
  }

  // Throttled scroll update
  let raf = 0;
  window.addEventListener("scroll", () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      updateActive();
    });
  }, { passive: true });

  window.addEventListener("resize", () => updateActive());

  // ✅ Click: set active immediately and lock updates until jump is done
  items.forEach(it => {
    it.a.addEventListener("click", () => {
      setActiveLink(it.a);
      lock(650); // long enough for smooth scroll + transition

      // After the browser has moved, unlock & recompute once
      setTimeout(() => {
        lockedUntil = 0;
        updateActive();
      }, 700);
    });
  });

  // ✅ Back/forward: lock briefly so it doesn't flash wrong
  window.addEventListener("hashchange", () => {
    lock(400);
    setTimeout(() => {
      lockedUntil = 0;
      updateActive();
    }, 450);
  });

  // Init
  updateActive();
})();
