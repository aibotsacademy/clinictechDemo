/* ==========================================================================
   Transición clip-path entre secciones, telón de anclas,
   botones magnéticos e inclinación
   ========================================================================== */

const R = '44px';

/* Entrada de cada sección: recorte redondeado que se abre y .wrap que sube */
export function initSectionEntrance({ gsap }) {
  document.querySelectorAll('.section, .tesis').forEach((sec) => {
    const st = { trigger: sec, start: 'top 96%', end: 'top 38%', scrub: 0.6 };
    gsap.fromTo(
      sec,
      { clipPath: `inset(5% 3.5% 0% 3.5% round ${R})` },
      { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: st }
    );
    const wrap = sec.querySelector(':scope > .wrap');
    if (wrap) gsap.fromTo(wrap, { y: 72 }, { y: 0, ease: 'none', scrollTrigger: { ...st } });
  });
}

/* Telón para anclas lejanas */
export function createTelon({ gsap }) {
  const el = document.getElementById('telon');
  const nameEl = el.querySelector('.telon-name');
  const BOTTOM_HIDDEN = `inset(100% 3.5% 0% 3.5% round ${R} ${R} 0px 0px)`;
  const TOP_HIDDEN = `inset(0% 3.5% 100% 3.5% round 0px 0px ${R} ${R})`;
  const FULL = 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)';
  let running = null;

  return function telon(name, dir, swap) {
    running?.kill();
    nameEl.textContent = name;
    const enterFrom = dir === 'down' ? BOTTOM_HIDDEN : TOP_HIDDEN;
    const exitTo = dir === 'down' ? TOP_HIDDEN : BOTTOM_HIDDEN;
    const inner = el.firstElementChild;
    running = gsap
      .timeline({
        onComplete() {
          gsap.set(el, { visibility: 'hidden' });
          running = null;
        }
      })
      .set(el, { visibility: 'visible', clipPath: enterFrom })
      .to(el, { clipPath: FULL, duration: 0.42, ease: 'power3.inOut' }, 0)
      .fromTo(inner, { y: dir === 'down' ? 28 : -28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }, 0.16)
      .call(swap, null, 0.42)
      .to(el, { clipPath: exitTo, duration: 0.5, ease: 'power3.inOut' }, 0.7)
      .to(inner, { y: dir === 'down' ? -28 : 28, opacity: 0, duration: 0.4, ease: 'power3.in' }, 0.7);
  };
}

/* Botones magnéticos */
export function initMagnetic({ gsap }) {
  if (!window.matchMedia('(hover: hover)').matches) return;
  document.querySelectorAll('.btn-primary').forEach((btn) => {
    const qx = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
    const qy = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
    btn.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = btn.getBoundingClientRect();
      qx((e.clientX - (r.left + r.width / 2)) * 0.22);
      qy((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    btn.addEventListener('pointerleave', () => {
      qx(0);
      qy(0);
    });
  });
}

/* Inclinación con el cursor */
export function initTilt({ gsap }) {
  if (!window.matchMedia('(hover: hover)').matches) return;
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    gsap.set(el, { transformPerspective: 900 });
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3' });
    const area = el.parentElement;
    area.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = area.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      ry(nx * 20); // ±10°
      rx(-ny * 16); // ±8°
    });
    area.addEventListener('pointerleave', () => {
      rx(0);
      ry(0);
    });
  });
}
