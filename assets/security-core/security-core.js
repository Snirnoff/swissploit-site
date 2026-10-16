/* Shared sculpture: one canvas, stable particles, one animation clock. */
const TAU = Math.PI * 2;
const mix = (a, b, t) => a + (b - a) * t;
const stylesheet = new URL('./security-core.css', import.meta.url).href;
const descriptions = {
  neutral: 'Das Swissploit-S aus digitalen Punkten.',
  shorts: 'Videos: Die Partikel bilden ein Play-Symbol im Kreis.',
  learn: 'Learn: Die Partikel bilden ein aufgeschlagenes Buch.',
  quiz: 'Phishing-Quiz: Die Partikel bilden ein Dokument mit Lupe.',
  game: 'Phishing-Game: Die Partikel bilden einen Fisch.',
  'security-check': 'Security Check: Die Partikel bilden einen Haken mit Scan-Ecken.',
  'datenschutz-care': 'Datenschutz Care: Die Partikel bilden ein Dokument mit Schutzschild.',
  'incident-readiness': 'Incident Readiness: Die Partikel bilden eine Signalsirene.',
  business: 'Für Unternehmen: Die Partikel bilden drei Gebäude.',
  'quiz-games': 'Quiz und Games: Die Partikel bilden ein Fragezeichen im Kreis.'
};
// Paths supply cached coordinates only. Every shape uses the same particle objects.
const outlines = {
  shorts: ['M0 -125A125 125 0 1 1 0 125A125 125 0 1 1 0 -125', 'M-35 -62L68 0L-35 62Z'],
  learn: ['M0 -80Q-60 -125 -125 -98V100Q-65 75 0 120Q65 75 125 100V-98Q60 -125 0 -80V120', 'M-99 -55Q-55 -62 -25 -40M-99 -12Q-55 -19 -25 3M-99 31Q-55 24 -25 46', 'M25 -40Q55 -62 99 -55M25 3Q55 -19 99 -12M25 46Q55 24 99 31'],
  quiz: ['M55 -25V-120H-110V120H-12', 'M-80 -77H20M-80 -36H-10M-80 5H-35', 'M108 38A58 58 0 1 1 -8 38A58 58 0 1 1 108 38M92 80L135 130'],
  game: ['M-135 0Q-42 -135 62 0Q-42 135 -135 0ZM62 0L130 -67V67Z', 'M-64 -27A5 5 0 1 1 -74 -27A5 5 0 1 1 -64 -27', 'M-13 -61L15 -102L27 -37M-13 61L15 102L27 37'],
  'security-check': ['M-70 -120H-120V-70M70 -120H120V-70M-120 70V120H-70M120 70V120H70', 'M-67 0L-15 53L76 -54'],
  'datenschutz-care': ['M35 -32V-120H-115V115H-35', 'M-85 -77H5M-85 -34H-30M-85 9H-45', 'M58 -34L128 -8V45Q124 98 58 130Q-8 98 -12 45V-8ZM23 39L49 65L94 13'],
  'incident-readiness': ['M-80 80V-5A80 80 0 0 1 80 -5V80', 'M-108 80H108V112H-108ZM-48 51V-5Q-48 -39 -23 -48', 'M0 -113V-142M-106 -65L-129 -85M106 -65L129 -85'],
  business: ['M-122 120V-45H-47M-47 120V-125H35V120M35 -75H116V120M-137 120H132', 'M-96 -14H-77M-96 24H-77M-96 62H-77M-22 -87H10M-22 -45H10M-22 -3H10M-22 39H10M-22 81H10M62 -40H90M62 0H90M62 40H90M62 80H90'],
  'quiz-games': ['M0 -125A125 125 0 1 1 0 125A125 125 0 1 1 0 -125', 'M-40 -45C-40 -101 52 -101 52 -45C52 -10 4 -13 4 27', 'M4 66A5 5 0 1 1 4 76A5 5 0 1 1 4 66']
};

async function signetMask() {
  const logo = new Image();
  logo.src = '/assets/Swissploit_S_blue2.png';
  await logo.decode();
  const sample = document.createElement('canvas');
  sample.width = sample.height = 320;
  const ctx = sample.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(logo, 0, 0, 320, 320);
  const pixels = ctx.getImageData(0, 0, 320, 320).data;
  const mask = [];
  let left = 320, right = 0, top = 320, bottom = 0;
  for (let y = 0; y < 320; y++) for (let x = 0; x < 320; x++) {
    if (pixels[(y * 320 + x) * 4 + 3] < 128) continue;
    const edge = [[-2, 0], [2, 0], [0, -2], [0, 2]].some(([dx, dy]) =>
      x + dx < 0 || x + dx >= 320 || y + dy < 0 || y + dy >= 320 || pixels[((y + dy) * 320 + x + dx) * 4 + 3] < 128);
    mask.push({ x, y, edge });
    // Weighted sampling strengthens the contour and central bridge without more particles.
    if (edge || Math.abs(y - 160) < 38) mask.push({ x, y, edge });
    left = Math.min(left, x); right = Math.max(right, x);
    top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  if (!mask.length) throw Error('Empty Swissploit signet');
  return mask.map(p => ({ x: (p.x - (left + right) / 2) * 360 / (bottom - top), y: (p.y - (top + bottom) / 2) * 360 / (bottom - top), edge: p.edge }));
}

// Rejection sampling with a spatial hash: stable blue-noise-like points, no scanlines.
function sampleSignet(mask, count, random, transform) {
  const points = [], cells = new Map();
  const spacing = count > 500 ? 3.6 : 5;
  let minimum = spacing, attempts = 0;
  while (points.length < count) {
    if (++attempts > count * 80) { minimum *= .9; attempts = 0; }
    const pixel = mask[Math.floor(random() * mask.length)];
    const point = transform({ x: pixel.x + (random() - .5), y: pixel.y + (random() - .5), edge: pixel.edge }, points.length);
    const cx = Math.floor(point.x / spacing), cy = Math.floor(point.y / spacing);
    let crowded = false;
    for (let y = cy - 1; y <= cy + 1 && !crowded; y++) for (let x = cx - 1; x <= cx + 1; x++) {
      if (cells.get(`${x},${y}`)?.some(p => Math.hypot(p.x - point.x, p.y - point.y) < minimum)) {
        crowded = true; break;
      }
    }
    if (crowded) continue;
    const key = `${cx},${cy}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(point);
    points.push(point);
  }
  // Sorting only assigns particles to morph paths; it does not position them in rows.
  return points.sort((a, b) => a.y - b.y || a.x - b.x);
}

function sampleOutline(paths, count, random) {
  const segments = paths.map(d => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    return { path, length: path.getTotalLength() };
  });
  const total = segments.reduce((sum, segment) => sum + segment.length, 0);
  return Array.from({ length: count }, (_, i) => {
    let distance = (i + .5) / count * total;
    let segment = segments[0];
    for (const candidate of segments) {
      segment = candidate;
      if (distance <= segment.length) break;
      distance -= segment.length;
    }
    const p = segment.path.getPointAtLength(distance);
    return { x: p.x + (random() - .5) * 6, y: p.y + (random() - .5) * 6 };
  }).sort((a, b) => a.y - b.y || a.x - b.x);
}

export class SwissploitSecurityCore extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }</style>
      <link rel="stylesheet" href="${stylesheet}">
      <div class="stage" role="group" aria-label="Swissploit Partikel-S – interaktive Visualisierung">
        <canvas aria-hidden="true"></canvas>
        <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">${descriptions.neutral}</p>
      </div>`;
    this.canvas = this.shadowRoot.querySelector('canvas');
    this.stage = this.shadowRoot.querySelector('.stage');
    this.ctx = this.canvas.getContext('2d');
    this.status = this.shadowRoot.querySelector('[role="status"]');
    this.nodes = [];
    this.mode = 'neutral';
    this.pointer = { active: false, x: 0, y: 0 };
    this.neutralWeight = 1;
    this.tilt = 0;
    this.elapsed = this.last = this.frame = this.morphStart = 0;
    this.visible = true;
    const css = this.shadowRoot.querySelector('link');
    const styled = new Promise((resolve, reject) => {
      css.addEventListener('load', resolve, { once: true });
      css.addEventListener('error', () => reject(Error('Particle styles unavailable')), { once: true });
    });
    this.ready = Promise.all([signetMask(), styled]).then(([mask]) => {
      this.mask = mask;
      if (this.isConnected && this.ctx) this.measure();
    }).catch(() => {
      this.status.textContent = 'Die Partikelvisualisierung ist derzeit nicht verfügbar.';
      this.loadFailed = true;
    });
  }

  connectedCallback() {
    if (!this.ctx) return;
    this.viewportIntro = this.hasAttribute('viewport-intro');
    this.homeMode = this.getAttribute('shape') in outlines ? this.getAttribute('shape') : 'neutral';
    this.mode = this.homeMode;
    this.status.textContent = descriptions[this.mode];
    this.stage.setAttribute('aria-label', descriptions[this.mode]);
    this.events = new AbortController();
    const on = (target, event, fn) => target.addEventListener(event, fn, { signal: this.events.signal });
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
    this.fine = matchMedia('(hover: hover) and (pointer: fine)');
    this.resize = new ResizeObserver(() => this.measure());
    this.resize.observe(this.stage);
    this.intersection = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.syncLoop();
    });
    this.intersection.observe(this);
    this.themeObserver = new MutationObserver(() => this.syncTheme());
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    this.syncTheme();
    on(document, 'visibilitychange', () => this.syncLoop());
    on(window, 'navigation:opened', () => this.setPaused(true));
    on(window, 'navigation:closed', () => this.setPaused(false));
    const motionChanged = () => {
      if (this.reduced.matches) this.finishIntro();
      this.clearPointer(true); this.updatePositions(true); this.syncLoop();
    };
    on(this.reduced, 'change', motionChanged);
    on(this.fine, 'change', motionChanged);
    on(window, 'resize', () => this.measure());
    if (this.homeMode !== 'neutral') {
      on(this, 'pointermove', event => this.setPointer(event.clientX, event.clientY));
      on(this, 'pointerleave', () => this.clearPointer());
    }
    this.measure();
  }

  disconnectedCallback() {
    this.finishIntro();
    cancelAnimationFrame(this.frame);
    this.frame = this.last = 0;
    this.clearPointer(true);
    this.events?.abort();
    this.resize?.disconnect();
    this.intersection?.disconnect();
    this.themeObserver?.disconnect();
  }

  syncTheme() {
    this.light = document.documentElement.dataset.theme === 'light';
    this.dataset.theme = this.light ? 'light' : 'dark';
    this.request();
  }

  measure() {
    const rect = this.stage.getBoundingClientRect();
    const style = getComputedStyle(this);
    const bleed = parseFloat(style.getPropertyValue('--particle-bleed')) || 0;
    this.width = rect.width; this.height = rect.height + bleed * 2;
    this.scale = Math.min(this.width / 310, rect.height / 410);
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    const count = this.width < 320 || (this.viewportIntro && innerWidth <= 600) ? 460 : 880;
    const sculptureScale = Number(style.getPropertyValue('--sculpture-scale')) || 1;
    const tailAmount = Number(style.getPropertyValue('--particle-tail')) || 0;
    const profileChanged = sculptureScale !== this.sculptureScale || tailAmount !== this.tailAmount;
    this.sculptureScale = sculptureScale;
    this.tailAmount = tailAmount;
    this.clearPointer();
    if (this.mask && (this.nodes.length !== count || profileChanged)) this.populate(count);
    this.sizeCanvas();
    this.request();
  }

  sizeCanvas() {
    this.viewport = this.introActive ? this.canvas.getBoundingClientRect() : null;
    this.canvas.width = Math.round((this.viewport ? this.viewport.width : this.width) * this.dpr);
    this.canvas.height = Math.round((this.viewport ? this.viewport.height : this.height) * this.dpr);
  }

  populate(count) {
    let seed = 9173;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    const neutralPoint = (home, i) => {
      // Sparse tips flow out of the original mask, with a soft density/opacity taper.
      const tail = i % 3 === 0 ? Math.max(0, (Math.abs(home.y) - 138) / 42) ** 1.5 * this.tailAmount : 0;
      return {
        x: home.x * this.sculptureScale + Math.sin(tail * 3) * tail * 10,
        y: home.y * this.sculptureScale + Math.sign(home.y) * tail * (home.y > 0 ? 56 + random() * 20 : 30 + random() * 16),
        tail, edge: home.edge
      };
    };
    this.targets = { neutral: this.viewportIntro ? sampleSignet(this.mask, count, random, neutralPoint) :
      Array.from({ length: count }, (_, i) => neutralPoint(this.mask[Math.floor((i + .5) * this.mask.length / count)], i)) };
    for (const [mode, paths] of Object.entries(outlines)) this.targets[mode] = sampleOutline(paths, count, random);
    const first = !this.introduced;
    const intro = first && !this.reduced.matches && !this.viewportIntro;
    this.introduced = true;
    this.morphDuration = intro ? 1.6 : .78;
    this.nodes = this.targets[this.mode].map((home, i) => {
      const angle = random() * TAU, distance = 180 + random() * 100;
      const x = intro ? home.x + Math.cos(angle) * distance : home.x;
      const y = intro ? home.y + Math.sin(angle) * distance : home.y;
      return {
      x, y, fromX: x, fromY: y,
      offsetX: 0, offsetY: 0, tail: this.targets.neutral[i].tail,
      phase: random() * TAU, z: (random() - .5) * 64,
      radius: random() < .06 ? 2 : .75 + random() * .7,
      alpha: (this.targets.neutral[i].edge ? .64 : .48) + random() * .3, bright: random() > .7
    }; });
    this.introStart = intro ? this.elapsed : -10;
    this.morphStart = intro ? this.elapsed : this.elapsed - .78;
    this.dataset.mode = this.mode;
    if (this.viewportIntro && (first || this.introActive)) this.restartIntro();
  }

  restartIntro() {
    if (!this.viewportIntro || !this.nodes.length) return;
    this.mode = this.homeMode;
    this.dataset.mode = this.mode;
    this.status.textContent = descriptions[this.mode];
    this.clearPointer(true);
    this.neutralWeight = 1;
    this.morphStart = this.elapsed - .78;
    this.morphDuration = .78;
    this.updatePositions(true);
    if (this.reduced.matches) {
      this.finishIntro(); this.introStart = -10; this.request(); return;
    }
    this.introStart = this.elapsed;
    this.introActive = true;
    // Move the existing canvas out of all local clipping/stacking contexts.
    // Body is isolated: -1 draws above its background and behind every UI element.
    this.canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:-1;';
    document.body.append(this.canvas);
    this.sizeCanvas();
    this.nodes.forEach((node, i) => {
      let x = Math.random(), y = Math.random();
      const edge = i % 5;
      if (edge === 0) y = Math.random() * .08;
      if (edge === 1) y = .92 + Math.random() * .08;
      if (edge === 2) x = Math.random() * .08;
      if (edge === 3) x = .92 + Math.random() * .08;
      node.startX = x; node.startY = y;
      node.delay = Math.random() * .18;
      node.duration = 1.55 + Math.random() * .35;
    });
    this.request();
  }

  finishIntro() {
    if (!this.introActive) return;
    this.introActive = false;
    this.canvas.removeAttribute('style');
    this.stage.prepend(this.canvas);
    this.sizeCanvas();
  }

  setPreview(mode = 'neutral') {
    if (!(mode in descriptions) || this.mode === mode) return;
    // Interruptions start at current positions; particle objects are never replaced here.
    this.updatePositions();
    this.nodes.forEach(node => { node.fromX = node.x; node.fromY = node.y; });
    this.mode = mode;
    this.morphDuration = .78;
    this.clearPointer();
    this.dataset.mode = mode;
    this.morphStart = this.elapsed;
    this.status.textContent = descriptions[mode];
    if (this.reduced?.matches) this.updatePositions(true);
    this.request();
  }

  updatePositions(snap = false) {
    if (!this.targets) return;
    const progress = snap ? 1 : Math.min(1, Math.max(0, (this.elapsed - this.morphStart) / (this.morphDuration || .78)));
    const ease = progress * progress * (3 - 2 * progress);
    this.nodes.forEach((node, i) => {
      const target = this.targets[this.mode][i];
      node.x = mix(node.fromX, target.x, ease);
      node.y = mix(node.fromY, target.y, ease);
      if (snap) { node.fromX = node.x; node.fromY = node.y; }
    });
  }

  // Coordinates are supplied by the page's passive pointer listener. The canvas never
  // captures input; only particles within a small radius of the pointer are displaced.
  setPointer(clientX, clientY) {
    if (this.introActive || (this.mode !== 'neutral' && this.mode !== this.homeMode) || this.reduced?.matches || !this.fine?.matches || this.menuOpen) {
      this.clearPointer(); return;
    }
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = (clientX - rect.left - this.width / 2) / this.scale;
    this.pointer.y = (clientY - rect.top - this.height / 2) / this.scale;
    this.pointer.active = this.nodes.some(node => Math.hypot(node.x - this.pointer.x, node.y - this.pointer.y) < 52);
    this.request();
  }

  clearPointer(snap = false) {
    this.pointer.active = false;
    if (snap) {
      this.tilt = 0;
      this.nodes.forEach(node => { node.offsetX = node.offsetY = 0; });
    }
  }

  setPaused(paused) { this.menuOpen = paused; if (paused) this.clearPointer(); this.syncLoop(); }

  syncLoop() {
    cancelAnimationFrame(this.frame);
    this.frame = this.last = 0;
    this.request();
  }

  request() {
    if (!this.frame && this.nodes.length && this.isConnected && (this.visible || this.introActive) && this.ctx && !document.hidden && !this.menuOpen) {
      this.frame = requestAnimationFrame(time => this.render(time));
    }
  }

  render(time) {
    this.frame = 0;
    const dt = this.last ? Math.min((time - this.last) / 1000, .05) : 1 / 60;
    this.last = time;
    const still = this.reduced.matches;
    if (!still) this.elapsed += dt;
    if (this.introActive && (still || this.elapsed - this.introStart >= 2.1)) this.finishIntro();
    this.updatePositions(still);
    this.draw(still, dt);
    if (!still && !this.loadFailed && (this.introActive || this.fine.matches || this.elapsed - this.morphStart < this.morphDuration)) this.request();
  }

  draw(still, dt) {
    if (!this.width || !this.height) return;
    const c = this.ctx, t = still ? 0 : this.elapsed;
    const scale = this.scale;
    const ease = 1 - Math.exp(-dt * 9);
    this.neutralWeight = still ? +(this.mode === 'neutral') : mix(this.neutralWeight, +(this.mode === 'neutral'), ease);
    this.tilt = still ? 0 : mix(this.tilt, this.pointer.active ? this.pointer.x / 180 * .06 : 0, ease);
    const settledFish = this.mode === 'game' && this.elapsed - this.morphStart >= .78;
    const blue = this.light ? '24,109,142' : '111,207,219';
    const highlight = this.light ? '15,86,118' : '194,239,243';
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
    const rect = this.introActive ? this.stage.getBoundingClientRect() : null;
    const centerX = rect ? rect.left + rect.width / 2 - this.viewport.left : this.width / 2;
    const centerY = rect ? rect.top + rect.height / 2 - this.viewport.top : this.height / 2;
    const driftX = still ? 0 : Math.sin(t * .27) * 3, driftY = still ? 0 : Math.sin(t * .36) * 4;
    const roll = still ? 0 : Math.sin(t * .21) * .018;
    const px = this.pointer.x - driftX, py = this.pointer.y - driftY;
    const cursorX = px * Math.cos(roll) + py * Math.sin(roll);
    const cursorY = -px * Math.sin(roll) + py * Math.cos(roll);
    const yaw = still ? 0 : Math.sin(t * .25) * .12 + this.tilt;
    for (const node of this.nodes) {
      let x = node.x * Math.cos(yaw) + node.z * Math.sin(yaw), y = node.y;
      if (!still) {
        x += Math.sin(t * .65 + node.phase) * 1.1;
        y += Math.cos(t * .48 + node.phase) * .9;
        if (settledFish) y += Math.sin(t * 1.4 + node.x / 90) * 2.5;
      }
      let pushX = 0, pushY = 0;
      if (!still && this.pointer.active && (this.mode === 'neutral' || this.mode === this.homeMode)) {
        const dx = x - cursorX, dy = y - cursorY, distance = Math.hypot(dx, dy);
        const force = 15 * Math.max(0, 1 - distance / 52) ** 2;
        pushX = distance > .01 ? dx / distance * force : Math.cos(node.phase) * force;
        pushY = distance > .01 ? dy / distance * force : Math.sin(node.phase) * force;
      }
      node.offsetX = still ? 0 : mix(node.offsetX, pushX, ease);
      node.offsetY = still ? 0 : mix(node.offsetY, pushY, ease);
      const depth = 1 + node.z / 220;
      const arrival = still ? 1 : Math.min(1, Math.max(0, (this.elapsed - this.introStart) / .65));
      const pulse = this.homeMode !== 'neutral' && !still ? .88 + .12 * Math.sin(t * .8 - node.y * .012) : 1;
      const alpha = node.alpha * (1 - this.neutralWeight * node.tail * .7) * arrival * pulse;
      x += node.offsetX; y += node.offsetY;
      let screenX = centerX + (x * Math.cos(roll) - y * Math.sin(roll) + driftX) * scale;
      let screenY = centerY + (x * Math.sin(roll) + y * Math.cos(roll) + driftY) * scale;
      if (this.introActive) {
        const progress = Math.max(0, Math.min(1, (this.elapsed - this.introStart - node.delay) / node.duration));
        const arrivalEase = progress ** 3 * (progress * (progress * 6 - 15) + 10);
        screenX = mix(node.startX * this.viewport.width, screenX, arrivalEase);
        screenY = mix(node.startY * this.viewport.height, screenY, arrivalEase);
      }
      c.beginPath(); c.arc(screenX, screenY, node.radius * depth * scale, 0, TAU);
      c.fillStyle = `rgba(${node.bright ? highlight : blue},${alpha})`;
      c.fill();
    }
  }
}

if (!customElements.get('swissploit-security-core')) customElements.define('swissploit-security-core', SwissploitSecurityCore);

