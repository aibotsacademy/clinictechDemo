/* ==========================================================================
   Prólogo del Espejo: secuencia de 179 cuadros WebP dibujada en <canvas>
   y controlada por el scroll. Con movimiento reducido se usa el <video>.
   ========================================================================== */

const FRAMES = 179;
const LAST = FRAMES - 1; // 178
const W = 560;
const H = 1218;
const BATCH = 6;
const IDLE_END = 34; // cuadros 0–34: la captura de las dos fotos
const IDLE_FPS = 5;
const MOVING_AT = 0.012;
const LENS_ZOOM = 2.3;

const BASE = import.meta.env.BASE_URL;
const frameUrl = (i) => `${BASE}media/hero/${String(i).padStart(3, '0')}.webp`;
const p = (f) => f / LAST;

export function initPrologue({ gsap, getLenis, reduced }) {
  const section = document.getElementById('inicio');
  if (!section) return null;

  const canvas = document.getElementById('ehCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const lens = document.getElementById('ehLens');
  const lctx = lens.getContext('2d', { alpha: false });
  const video = document.getElementById('ehVideo');
  const phone = document.getElementById('ehPhone');
  const frame = section.querySelector('.eh-frame');
  const copy = section.querySelector('.eh-copy');
  const glow = section.querySelector('.eh-glow');
  const curtain = section.querySelector('.eh-curtain');
  const dotsHost = document.getElementById('ehDots');
  const range = document.getElementById('ehRange');
  const chaps = [...section.querySelectorAll('.eh-chap')];
  const chapStarts = chaps.map((c) => Number(c.dataset.frame));
  const chapBtns = [...section.querySelectorAll('.eh-nav button')];

  /* ---------- Carga de cuadros ---------- */

  const imgs = new Array(FRAMES).fill(null);
  const ready = new Uint8Array(FRAMES);
  let painted = -1;

  function load(i) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      if (i === 0) img.fetchPriority = 'high';
      img.onload = () => {
        const done = () => {
          imgs[i] = img;
          ready[i] = 1;
          resolve();
        };
        img.decode ? img.decode().then(done, done) : done();
      };
      img.onerror = () => resolve();
      img.src = frameUrl(i);
    });
  }

  /* Dibuja el cuadro i o, si aún no llegó, el cargado más cercano hacia atrás */
  function paint(i) {
    let j = Math.max(0, Math.min(LAST, i));
    while (j > 0 && !ready[j]) j--;
    if (!ready[j] || j === painted) return;
    ctx.drawImage(imgs[j], 0, 0, W, H);
    painted = j;
    if (lensOn) drawLens();
  }

  if (reduced) {
    section.classList.add('is-still');
    video.preload = 'metadata';
    return null;
  }

  // Cuadro 000 primero, luego el resto en lotes de 6 en paralelo
  load(0).then(async () => {
    painted = -1;
    paint(Math.round(current));
    for (let start = 1; start < FRAMES; start += BATCH) {
      const batch = [];
      for (let k = start; k < Math.min(start + BATCH, FRAMES); k++) batch.push(load(k));
      await Promise.all(batch);
      if (painted < Math.round(current)) {
        const was = painted;
        painted = -1;
        paint(Math.round(current));
        if (painted === -1) painted = was;
      }
    }
  });

  /* ---------- Estado de reproducción ---------- */

  let progress = 0;
  let current = 0;
  let activeChap = -1;
  let moving = false;

  function setChapter(f) {
    let idx = 0;
    for (let k = 0; k < chapStarts.length; k++) if (chapStarts[k] <= f) idx = k;
    if (idx === activeChap) return;
    activeChap = idx;
    chaps.forEach((c, k) => {
      c.classList.toggle('on', k === idx);
      c.setAttribute('aria-hidden', k === idx ? 'false' : 'true');
    });
    chapBtns.forEach((b, k) => {
      if (k === idx) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
  }

  gsap.ticker.add((time) => {
    const isMoving = progress > MOVING_AT;
    if (isMoving !== moving) {
      moving = isMoving;
      section.classList.toggle('is-moving', moving);
    }
    if (!moving) {
      // Antes de hacer scroll: bucle por los cuadros 0–34 a 5 cuadros/s
      current = Math.floor(time * IDLE_FPS) % (IDLE_END + 1);
    } else {
      const target = progress * LAST;
      current += (target - current) * 0.2;
      if (Math.abs(target - current) < 0.01) current = target;
    }
    const f = Math.round(current);
    paint(f);
    setChapter(f);
  });

  /* ---------- Línea de tiempo con ScrollTrigger ---------- */

  const isMobile = () => window.matchMedia('(max-width: 860px)').matches;

  function absLeft(el) {
    let x = 0;
    let node = el;
    while (node) {
      x += node.offsetLeft;
      node = node.offsetParent;
    }
    return x;
  }
  const phoneToCenter = () => (isMobile() ? 0 : window.innerWidth / 2 - (absLeft(phone) + phone.offsetWidth / 2));

  // 72 puntos en espiral áurea
  const dots = [];
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 72; i++) {
    const d = document.createElement('i');
    const a = i * 2.399963;
    const r = 150 + (i % 9) * 46;
    dots.push({ el: d, x: Math.cos(a) * r * 1.5, y: Math.sin(a) * r });
    frag.appendChild(d);
  }
  dotsHost.appendChild(frag);

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate(self) {
        progress = self.progress;
        if (!dragging) range.value = String(Math.round(self.progress * 1000));
      },
      onRefresh(self) {
        progress = self.progress;
      }
    }
  });

  tl.to(copy, { autoAlpha: 0, y: -28, duration: 0.05 }, 0.015)
    .to(phone, { x: phoneToCenter, scale: 1.04, duration: 0.1 }, 0.02)
    .to(phone, { scale: 1.16, duration: 0.09 }, p(30))
    .to(phone, { scale: 1.02, duration: 0.14 }, p(62))
    .to(phone, { scale: 0.9, y: -16, duration: 0.12 }, p(113))
    .fromTo(glow, { autoAlpha: 0, scale: 0.4, x: 0 }, { autoAlpha: 1, scale: 1, x: () => (isMobile() ? 0 : 240), duration: 0.06 }, p(100))
    .to(glow, { autoAlpha: 0, x: () => (isMobile() ? 0 : 420), duration: 0.05 }, p(113))
    .to(curtain, { opacity: 1, duration: 0.07 }, 0.93);

  dots.forEach((d, i) => {
    tl.fromTo(
      d.el,
      { x: 0, y: 0, scale: 0.3, autoAlpha: 0 },
      { x: d.x, y: d.y, scale: 1, autoAlpha: 1, duration: 0.06, immediateRender: false },
      p(36) + (i % 12) * 0.002
    );
    tl.to(d.el, { x: d.x * 1.25, y: d.y * 1.25, autoAlpha: 0, duration: 0.05 }, p(50));
  });

  // La línea dura exactamente 1.0
  if (tl.duration() < 1) tl.to({}, { duration: 1 - tl.duration() });

  /* ---------- Controles manuales: mueven el scroll real ---------- */

  let dragging = false;

  function scrollToProgress(v, immediate) {
    const top = section.getBoundingClientRect().top + window.scrollY;
    const y = top + v * (section.offsetHeight - window.innerHeight);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, immediate ? { immediate: true } : { duration: 1.1 });
    else window.scrollTo({ top: y, behavior: immediate ? 'auto' : 'smooth' });
  }

  range.addEventListener('pointerdown', () => (dragging = true));
  window.addEventListener('pointerup', () => (dragging = false));
  range.addEventListener('input', () => scrollToProgress(Number(range.value) / 1000, true));

  chapBtns.forEach((b, k) => {
    b.addEventListener('click', () => scrollToProgress(Math.max(p(chapStarts[k]), 0.02), false));
  });

  /* ---------- Inclinación del teléfono ---------- */

  if (window.matchMedia('(hover: hover)').matches) {
    const rx = gsap.quickTo(frame, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = gsap.quickTo(frame, 'rotationY', { duration: 0.6, ease: 'power3' });
    section.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      ry(nx * 12); // ±6°
      rx(-ny * 9); // ±4.5°
    });
    section.addEventListener('pointerleave', () => {
      rx(0);
      ry(0);
    });
  }

  /* ---------- Lupa ---------- */

  let lensOn = false;
  let lp = { x: 0, y: 0 }; // posición del puntero en px de pantalla

  function drawLens() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const size = lens.offsetWidth; // 150 o 110
    const toCanvas = W / rect.width;
    const cx = (lp.x - rect.left) * toCanvas;
    const cy = (lp.y - rect.top) * toCanvas;
    const sw = (size / LENS_ZOOM) * toCanvas;
    lctx.fillStyle = '#000';
    lctx.fillRect(0, 0, lens.width, lens.height);
    lctx.drawImage(canvas, cx - sw / 2, cy - sw / 2, sw, sw, 0, 0, lens.width, lens.height);
    // Posición en coordenadas locales del marco (descontando su escala)
    const fr = frame.getBoundingClientRect();
    const k = frame.offsetWidth / fr.width;
    const lx = (lp.x - fr.left) * k - size / 2;
    const ly = (lp.y - fr.top) * k - size / 2;
    lens.style.transform = `translate(${lx}px, ${ly}px)`;
  }

  function lensShow(e) {
    lp = { x: e.clientX, y: e.clientY };
    lensOn = true;
    lens.classList.add('on');
    drawLens();
  }
  function lensHide() {
    lensOn = false;
    lens.classList.remove('on');
  }

  canvas.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && lensShow(e));
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse' || lensOn) lensShow(e);
  });
  canvas.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && lensHide());
  canvas.addEventListener('pointerdown', (e) => e.pointerType !== 'mouse' && lensShow(e));
  canvas.addEventListener('pointerup', (e) => e.pointerType !== 'mouse' && lensHide());
  canvas.addEventListener('pointercancel', lensHide);

  return { tl };
}
