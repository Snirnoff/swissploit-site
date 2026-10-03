// One event-driven frame loop owns the original signet and DOM letters.
(function homeMotion() {
  const intro = document.querySelector('.home-page #intro');
  if (!intro) return;
  const stage = intro.querySelector('.intro-stage');
  const canvas = intro.querySelector('.intro-particles');
  const context = canvas.getContext('2d');
  const wordmark = intro.querySelector('.intro-wordmark');
  const subtitle = intro.querySelector('.intro-subtitle');
  const arrow = intro.querySelector('.intro-arrow');
  const header = document.querySelector('.site-header');
  const stickyCta = document.querySelector('.mobile-sticky-cta');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)');
  const compactParticles = matchMedia('(max-width: 760px), (max-height: 560px), (pointer: coarse)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  let seed = 7419;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  function profile(light) {
    const angle = random() * Math.PI * 2;
    return {
      dx: Math.cos(angle), dy: Math.sin(angle) * (.65 + random() * .7),
      distance: (light ? .65 : .48) + random() * (light ? 1.15 : .75),
      delay: random() * (light ? .12 : .09),
      duration: (light ? .46 : .66) + random() * .38,
      drag: 1 + random() * 3, rotation: (random() - .5) * (light ? 300 : 100),
      scale: (light ? .3 : .65) + random() * .7,
      x: 0, y: 0, vx: 0, vy: 0
    };
  }
  const letters = [...intro.querySelectorAll('.intro-letter')].map(el => ({el, ...profile(false)}));
  let particles = [], mask = [], bounds;
  let width = 0, height = 0, start = 0, frame = 0, lastTime = 0, signetCenter = 0, signetHeight = 0;
  let previousScroll = scrollY, scrollTime = performance.now(), momentum = 0;
  let inView = true;
  const pointer = {x: 0, y: 0, active: false};

  // Integrated acceleration followed by drag; each profile has its own clock.
  function flight(item, progress) {
    const t = Math.max(0, (progress - item.delay) / item.duration);
    const attack = .16;
    const travel = t < attack ? t * t / (2 * attack)
      : attack / 2 + (1 - Math.exp(-item.drag * (t - attack))) / item.drag;
    const normal = attack / 2 + (1 - Math.exp(-item.drag * (1 - attack))) / item.drag;
    const distance = travel / normal * item.distance * (1 + momentum * .1);
    return {x: item.dx * width * distance, y: item.dy * height * distance,
      rotation: item.rotation * travel / normal, scale: 1 + (item.scale - 1) * clamp(t),
      opacity: 1 - smooth((t - .62) / .65)};
  }
  function spring(item, dt, progress, light) {
    let fx = 0, fy = 0;
    const stiffness = light ? item.stiffness : .07;
    const damping = light ? item.damping : .83;
    if (pointer.active && !reduced.matches && progress < .4) {
      const dx = item.homeX + item.x - pointer.x, dy = item.homeY + item.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 155) {
        const force = (1 - distance / 155) ** 2 * (light ? 3.2 : .16) * (1 - progress / .4);
        fx = (distance > .01 ? dx / distance : item.dx) * force;
        fy = (distance > .01 ? dy / distance : item.dy) * force;
      }
    }
    item.vx = (item.vx + (fx - item.x * stiffness) * dt) * damping ** dt;
    item.vy = (item.vy + (fy - item.y * stiffness) * dt) * damping ** dt;
    item.x += item.vx * dt; item.y += item.vy * dt;
    if (!light) { item.x = Math.max(-3, Math.min(3, item.x)); item.y = Math.max(-3, Math.min(3, item.y)); }
    const moving = Math.abs(item.vx) + Math.abs(item.vy) > .008 ||
      Math.hypot(fx - item.x * stiffness, fy - item.y * stiffness) > .008;
    if (!moving && !pointer.active) item.x = item.y = item.vx = item.vy = 0;
    return moving;
  }
  function paused() { return document.hidden || document.body.classList.contains('navigation-open'); }
  function requestUpdate() {
    if (!frame && !paused()) frame = requestAnimationFrame(render);
  }
  function render(time) {
    frame = 0;
    if (paused()) return;
    const y = Math.max(0, scrollY - start);
    const passed = y >= height * .72;
    header?.classList.toggle('is-intro-passed', passed);
    document.body.classList.toggle('intro-passed', passed);
    stickyCta?.classList.toggle('is-visible', mobile.matches && y >= height);
    if (!inView) { lastTime = 0; return; }
    const dt = Math.min(2, (time - (lastTime || time - 16.67)) / 16.67);
    lastTime = time;
    const p = y / (height * .86);
    momentum *= .84 ** dt;
    if (momentum < .001) momentum = 0;
    let moving = momentum > 0;
    if (context) context.clearRect(0, 0, width, height);
    particles.forEach(item => {
      if (!reduced.matches) moving = spring(item, dt, p, true) || moving;
      const f = reduced.matches ? {x:0,y:0,scale:1,rotation:0,opacity:1 - smooth(p)} : flight(item, p);
      if (!context || f.opacity < .005) return;
      context.save();
      context.globalAlpha = item.alpha * f.opacity;
      context.fillStyle = item.color;
      context.translate(item.homeX + item.x + f.x, item.homeY + item.y + f.y);
      if (item.fragment) {
        context.rotate(f.rotation * Math.PI / 180);
        context.fillRect(-item.radius * f.scale, -.6, item.radius * 2 * f.scale, 1.2);
      } else {
        context.beginPath(); context.arc(0, 0, item.radius * f.scale, 0, Math.PI * 2); context.fill();
      }
      context.restore();
    });
    letters.forEach(item => {
      if (!reduced.matches) moving = spring(item, dt, p, false) || moving;
      const f = flight(item, p);
      item.el.style.transform = reduced.matches ? 'none' : 'translate3d(' + (f.x + item.x).toFixed(2) + 'px,' + (f.y + item.y).toFixed(2) + 'px,0) rotate(' + f.rotation.toFixed(2) + 'deg) scale(' + f.scale.toFixed(4) + ')';
      item.el.style.opacity = reduced.matches ? '1' : String(f.opacity);
    });
    wordmark.style.opacity = reduced.matches ? String(1 - smooth(p)) : '1';
    subtitle.style.opacity = String(1 - smooth(p / .48));
    arrow.style.setProperty('opacity', String(1 - smooth(p / .16)), 'important');
    arrow.style.visibility = p >= .16 ? 'hidden' : 'visible';
    if (moving && !reduced.matches) requestUpdate();
    else lastTime = 0;
  }
  function populate() {
    if (!mask.length) return;
    seed = 9173;
    const count = compactParticles.matches ? 250 : 660;
    const scale = signetHeight / bounds.height;
    const pointScale = Math.min(1, Math.max(.5, signetHeight / 220));
    // Stratified samples cover the actual painted area, preserving the original S.
    particles = Array.from({length: count}, (_, index) => {
      const point = mask[Math.min(mask.length - 1, Math.floor((index + random()) * mask.length / count))];
      return {...profile(true), homeX: width / 2 + (point.x - bounds.cx) * scale,
        homeY: signetCenter + (point.y - bounds.cy) * scale,
        stiffness: .022 + (index % 7) * .001, damping: .81 + (index % 5) * .008,
        radius: (random() < .06 ? 2.2 : .9 + random() * .75) * (compactParticles.matches ? .85 : 1) * pointScale,
        alpha: .38 + random() * .4, color: random() < .65 ? '#4ab3c3' : '#8eddea', fragment: random() < .035};
    });
  }
  function refresh() {
    if (paused()) return;
    const rect = stage.getBoundingClientRect();
    width = rect.width; height = rect.height; start = rect.top + scrollY;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    context?.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Measure at rest so resizing mid-explosion cannot move the particle origin.
    letters.forEach(item => { item.el.style.transform = 'none'; item.x = item.y = item.vx = item.vy = 0; });
    const word = wordmark.getBoundingClientRect();
    // CSS reserves the logo's space inside the same centered composition.
    const content = getComputedStyle(intro.querySelector('.intro-content'));
    // Computed lengths resolve clamp()/svh without duplicating responsive rules in JS.
    const resolvedGap = parseFloat(getComputedStyle(wordmark).marginTop);
    signetHeight = parseFloat(content.paddingTop);
    signetCenter = word.top - rect.top - resolvedGap - signetHeight / 2;
    letters.forEach(item => {
      const r = item.el.getBoundingClientRect();
      item.homeX = r.left - rect.left + r.width / 2; item.homeY = r.top - rect.top + r.height / 2;
    });
    pointer.active = false; momentum = 0; lastTime = 0;
    previousScroll = scrollY; scrollTime = performance.now();
    populate(); requestUpdate();
  }
  const logo = new Image();
  logo.onload = () => {
    if (!context) return;
    const sample = document.createElement('canvas'); sample.width = sample.height = 320;
    const ctx = sample.getContext('2d', {willReadFrequently: true});
    if (!ctx) return;
    ctx.drawImage(logo, 0, 0, 320, 320);
    const pixels = ctx.getImageData(0, 0, 320, 320).data;
    let left = 320, right = 0, top = 320, bottom = 0;
    for (let y = 0; y < 320; y++) for (let x = 0; x < 320; x++) {
      if (pixels[(y * 320 + x) * 4 + 3] < 128) continue;
      mask.push({x,y}); left = Math.min(left,x); right = Math.max(right,x); top = Math.min(top,y); bottom = Math.max(bottom,y);
    }
    if (!mask.length) return;
    bounds = {height: bottom - top, cx: (left + right) / 2, cy: (top + bottom) / 2};
    refresh();
  };
  logo.src = '/assets/Swissploit_S_blue2.png';
  stage.addEventListener('pointermove', event => {
    if (!fine.matches || event.pointerType !== 'mouse' || reduced.matches || paused()) return;
    pointer.x = event.clientX; pointer.y = event.clientY + scrollY - start;
    pointer.active = true; requestUpdate();
  }, {passive:true});
  function leave() { pointer.active = false; requestUpdate(); }
  stage.addEventListener('pointerleave', leave);
  stage.addEventListener('pointercancel', leave);
  window.addEventListener('blur', leave);
  window.addEventListener('scroll', () => {
    const now = performance.now(), delta = scrollY - previousScroll;
    if (inView && delta > 0) momentum = Math.min(1, delta / Math.max(16, now - scrollTime) / 3);
    else momentum = 0;
    previousScroll = scrollY; scrollTime = now; pointer.active = false;
    requestUpdate();
  }, {passive:true});
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (!inView) { cancelAnimationFrame(frame); frame = 0; pointer.active = false; momentum = 0; }
      requestUpdate();
    }, {rootMargin:'180px 0px'}).observe(intro);
  }
  if ('ResizeObserver' in window) new ResizeObserver(refresh).observe(stage);
  else window.addEventListener('resize', refresh, {passive:true});
  function resume() { cancelAnimationFrame(frame); frame = 0; refresh(); }
  document.addEventListener('visibilitychange', resume);
  window.addEventListener('navigation:opened', resume);
  window.addEventListener('navigation:closed', resume);
  window.addEventListener('pageshow', resume);
  [reduced, mobile, compactParticles, fine].forEach(query => query.addEventListener('change', resume));
  document.fonts?.ready.then(refresh);
  refresh();
})();

// Each existing icon loop runs only while visible and motion is allowed.
(function productMotion() {
  const motifs = [...document.querySelectorAll('.product-motif')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const visible = new Set();
  function update() {
    motifs.forEach(el => el.classList.toggle('is-running', visible.has(el) && !reduced.matches && !document.hidden && !document.body.classList.contains('navigation-open')));
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(({target,isIntersecting}) => { if (isIntersecting) visible.add(target); else visible.delete(target); });
      update();
    });
    motifs.forEach(el => observer.observe(el));
  }
  document.addEventListener('visibilitychange', update);
  window.addEventListener('navigation:opened', update);
  window.addEventListener('navigation:closed', update);
  reduced.addEventListener('change', update);
})();

