/* ==========================================================================
   Lenis, navegación, reveals, pin del hero, recorridos, consola, app,
   FAQ y onda de voz
   ========================================================================== */

import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

let lenis = null;
export const getLenis = () => lenis;

/* ---------- Utilidades ---------- */

export function offsetIn(el, ancestor) {
  let x = 0;
  let y = 0;
  let node = el;
  while (node && node !== ancestor) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent;
  }
  return { x, y };
}

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/* Curva cúbica horizontal entre dos puntos */
export const curve = (a, b) => {
  const dx = Math.max(40, Math.abs(b.x - a.x) * 0.5);
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} C${(a.x + dx).toFixed(1)} ${a.y.toFixed(1)} ${(b.x - dx).toFixed(1)} ${b.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
};

/* Tablist accesible con roving tabindex */
export function tablist(list, { selector = '[role="tab"]', vertical = false, hover = false, onSelect } = {}) {
  const tabs = [...list.querySelectorAll(selector)];
  let index = Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'));

  function select(i, { focus = false, silent = false } = {}) {
    i = (i + tabs.length) % tabs.length;
    const changed = i !== index;
    index = i;
    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', k === i ? 'true' : 'false');
      t.tabIndex = k === i ? 0 : -1;
    });
    if (focus) tabs[i].focus();
    if (!silent && changed) onSelect?.(i, tabs[i]);
  }

  tabs.forEach((t, k) => {
    t.addEventListener('click', () => select(k));
    t.addEventListener('focus', () => k !== index && select(k));
    if (hover && window.matchMedia('(hover: hover)').matches) t.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && select(k));
  });

  list.addEventListener('keydown', (e) => {
    const next = vertical ? 'ArrowDown' : 'ArrowRight';
    const prev = vertical ? 'ArrowUp' : 'ArrowLeft';
    let to = null;
    if (e.key === next) to = index + 1;
    else if (e.key === prev) to = index - 1;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = tabs.length - 1;
    if (to === null) return;
    e.preventDefault();
    select(to, { focus: true });
  });

  return { select, get index() { return index; }, tabs };
}

/* ---------- Lenis ---------- */

export function initLenis({ gsap, ScrollTrigger, reduced }) {
  if (reduced) return null;
  lenis = new Lenis({ lerp: 0.1, duration: 1.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

/* ---------- Navegación ---------- */

export function initNav({ telon, reduced }) {
  const nav = document.getElementById('nav');
  const burger = document.getElementById('navBurger');
  const overlay = document.getElementById('navOverlay');
  const main = document.getElementById('contenido');
  const footer = document.querySelector('.footer');
  const links = [...nav.querySelectorAll('.nav-links a')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const curtain = document.querySelector('.eh-curtain');

  let ticking = false;

  function probe() {
    ticking = false;
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 40);

    // Sonda a media altura del nav: ¿hay una sección oscura debajo?
    const h = nav.offsetHeight;
    const stack = document.elementsFromPoint(window.innerWidth / 2, h / 2);
    const under = stack.find((el) => !nav.contains(el) && el !== overlay && !overlay.contains(el) && el.id !== 'telon' && !el.closest('#telon'));
    let dark = !!under?.closest('[data-theme="dark"]');
    if (dark && under.closest('#inicio') && curtain && parseFloat(getComputedStyle(curtain).opacity) > 0.5) dark = false;
    nav.classList.toggle('is-dark', dark);

    // Enlace activo: la sección que cruza el 40 % del viewport
    const mark = window.innerHeight * 0.4;
    let active = null;
    sections.forEach((s) => {
      const r = s.getBoundingClientRect();
      if (r.top <= mark && r.bottom > mark) active = s;
    });
    links.forEach((a) => {
      if (active && a.getAttribute('href') === `#${active.id}`) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(probe);
    }
  };
  if (lenis) lenis.on('scroll', onScroll);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  probe();

  /* Menú móvil */
  let open = false;
  function setOpen(v) {
    if (v === open) return;
    open = v;
    burger.setAttribute('aria-expanded', String(v));
    burger.setAttribute('aria-label', v ? 'Cerrar menú' : 'Abrir menú');
    if (v) {
      overlay.hidden = false;
      requestAnimationFrame(() => document.body.classList.add('nav-open'));
      lenis?.stop();
      main.inert = true;
      footer.inert = true;
      overlay.querySelector('a')?.focus();
    } else {
      document.body.classList.remove('nav-open');
      lenis?.start();
      main.inert = false;
      footer.inert = false;
      setTimeout(() => {
        if (!open) overlay.hidden = true;
      }, reduced ? 0 : 360);
    }
  }
  burger.addEventListener('click', () => {
    setOpen(!open);
    if (!open) burger.focus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) {
      setOpen(false);
      burger.focus();
    }
  });
  window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => e.matches && setOpen(false));

  /* Anclas */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    const id = a.getAttribute('href');
    if (id === '#' || a.id === 'bookingBtn') return;
    const target = id === '#contenido' ? document.getElementById('contenido') : document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const wasOpen = open;
    if (wasOpen) setOpen(false);
    goTo(target, { telon, focus: id === '#contenido' });
  });
}

export function goTo(target, { telon, focus = false } = {}) {
  const top = target.getBoundingClientRect().top + window.scrollY;
  const y = Math.max(0, target.id === 'inicio' ? 0 : top - 60);
  const dist = Math.abs(y - window.scrollY);
  const afterArrive = () => {
    if (focus || target.id === 'contenido') {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
    history.replaceState(null, '', `#${target.id}`);
  };
  if (!lenis) {
    window.scrollTo({ top: y, behavior: 'auto' });
    afterArrive();
    return;
  }
  const far = dist > window.innerHeight * 2.5;
  if (far && telon) {
    const name = target.dataset.name || target.querySelector('h2, h1')?.textContent || '';
    telon(name, y > window.scrollY ? 'down' : 'up', () => {
      lenis.scrollTo(y, { immediate: true, force: true });
      afterArrive();
    });
  } else {
    lenis.scrollTo(y, { duration: 1.1, onComplete: afterArrive });
  }
}

/* ---------- Reveals ---------- */

export function initReveals({ reduced }) {
  const reveals = [...document.querySelectorAll('.reveal')];
  const masks = [...document.querySelectorAll('.mask')];
  if (reduced || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('in'));
    masks.forEach((el) => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        if (el.dataset.maskFor !== undefined) {
          el.querySelectorAll(':scope .mask').forEach((m) => m.classList.add('in'));
        } else el.classList.add('in');
        io.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  );
  reveals.forEach((el) => io.observe(el));
  // clip-path esconde la máscara del observer: se observa al padre
  const parents = new Set(masks.map((m) => m.parentElement));
  parents.forEach((p) => {
    p.dataset.maskFor = '';
    io.observe(p);
  });
}

/* ---------- Hero pineado de 4 pasos ---------- */

export function initHeroPin({ gsap, ScrollTrigger, heroConsole, heroPhone, reduced }) {
  const pin = document.getElementById('heroPin');
  const stage = document.getElementById('stage');
  const heroText = document.getElementById('heroText');
  const heroEnd = document.getElementById('heroEnd');
  const steps = [...document.querySelectorAll('.hstep')];
  const svg = document.getElementById('heroLines');
  const mesh = stage.querySelector('.mesh');
  const bounds = [0, 0.2, 0.45, 0.75, 1];

  // Entrada al cargar
  if (!reduced) {
    gsap.from('.hl-in', { y: 16, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.1 });
    gsap.from([heroConsole.el, heroPhone.el], { y: 24, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 0.25 });
  }

  const ZOOMS = {
    tratamientos: [1.5, '100% 25%'],
    pacientes: [1.6, '88% 50%'],
    inventario: [1.15, '100% 10%']
  };

  /* Anclajes de las curvas en coordenadas del stage, con el zoom aplicado */
  function consoleAnchor(screen, markName) {
    const el = heroConsole.mark(screen, markName);
    const inner = heroConsole.inner(screen);
    if (!el || !inner) return { x: 0, y: 0 };
    const o = offsetIn(el, inner);
    const [s, origin] = ZOOMS[screen];
    const [oxp, oyp] = origin.split(' ').map((v) => parseFloat(v) / 100);
    const ox = inner.offsetWidth * oxp;
    const oy = inner.offsetHeight * oyp;
    let x = o.x + el.offsetWidth;
    let y = o.y + el.offsetHeight / 2;
    x = ox + (x - ox) * s;
    y = oy + (y - oy) * s;
    x = clamp(x, 6, inner.offsetWidth - 6);
    y = clamp(y, 6, inner.offsetHeight - 6);
    const base = offsetIn(inner, stage);
    return { x: base.x + x, y: base.y + y };
  }
  function phoneAnchor(markName) {
    const el = heroPhone.mark(markName);
    if (!el) return { x: 0, y: 0 };
    const o = offsetIn(el, stage);
    return { x: o.x, y: o.y + el.offsetHeight / 2 };
  }
  function layoutLines() {
    const w = stage.offsetWidth;
    const h = stage.offsetHeight;
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    [
      ['ln1', consoleAnchor('tratamientos', 'trat'), phoneAnchor('citas')],
      ['ln2', consoleAnchor('pacientes', 'prog'), phoneAnchor('prog')],
      ['ln3', consoleAnchor('inventario', 'row'), phoneAnchor('buy')]
    ].forEach(([id, a, b]) => {
      document.getElementById(id).setAttribute('d', curve(a, b));
      const ca = document.getElementById(`${id}a`);
      const cb = document.getElementById(`${id}b`);
      ca.setAttribute('cx', a.x);
      ca.setAttribute('cy', a.y);
      cb.setAttribute('cx', b.x);
      cb.setAttribute('cy', b.y);
    });
  }

  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    stage.classList.add('is-scripted');
    layoutLines();
    const onRefresh = () => layoutLines();
    ScrollTrigger.addEventListener('refreshInit', onRefresh);

    const shotC = (id) => heroConsole.shot(id);
    const shotP = (id) => heroPhone.shot(id);
    const box = (el) => el?.querySelector('.hl-box') || null;
    const chip = (el) => el?.querySelector('.hl-chip') || null;
    const clean = (...els) => els.flat().filter(Boolean);
    const trat = heroConsole.mark('tratamientos', 'trat');
    const tabs = heroConsole.mark('pacientes', 'tabs');
    const progC = heroConsole.mark('pacientes', 'prog');
    const row = heroConsole.mark('inventario', 'row');
    const appCitas = heroPhone.mark('citas');
    const appBa = heroPhone.mark('ba');
    const appProg = heroPhone.mark('prog');
    const ripple = heroPhone.mark('buy')?.querySelector('.ripple');
    const kpis = heroConsole.shot('inventario').querySelectorAll('[data-kpi]');
    const meshDots = mesh ? [...mesh.querySelectorAll('.m-dot')] : [];
    const maxD = Math.max(1, ...meshDots.map((d) => Number(d.dataset.d)));
    const line = (id) => document.getElementById(id);
    const ends = (id) => [line(`${id}a`), line(`${id}b`)];

    gsap.set(heroConsole.inner('tratamientos'), { transformOrigin: '100% 25%' });
    gsap.set(heroConsole.inner('pacientes'), { transformOrigin: '88% 50%' });
    gsap.set(heroConsole.inner('inventario'), { transformOrigin: '100% 10%' });
    gsap.set(['#ln1', '#ln2', '#ln3'], { strokeDashoffset: 1, opacity: 1 });
    if (mesh) gsap.set(mesh, { autoAlpha: 0 });

    const stageX = () => {
      const left = offsetIn(stage, document.body).x;
      return window.innerWidth / 2 - (left + stage.offsetWidth / 2);
    };

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: pin,
        pin: true,
        start: 'top top',
        end: '+=180%',
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate(self) {
          const pr = self.progress;
          heroConsole.setUrl(pr < 0.27 ? 'hoy' : pr < 0.57 ? 'tratamientos' : pr < 0.82 ? 'pacientes' : 'inventario');
          steps.forEach((s, k) => {
            s.style.setProperty('--p', clamp((pr - bounds[k]) / (bounds[k + 1] - bounds[k])).toFixed(3));
            s.classList.toggle('on', pr >= bounds[k] && (pr < bounds[k + 1] || (k === 3 && pr >= 1)));
          });
        }
      }
    });

    // 01 → 02: el texto sale y el stage pasa al centro
    tl.to(heroText, { y: -40, autoAlpha: 0, duration: 0.1, ease: 'power1.in' }, 0.2)
      .to(stage, { x: stageX, xPercent: 0, yPercent: 0, scale: 1.28, duration: 0.14, ease: 'power2.inOut' }, 0.2)
      // 02: el tratamiento viaja
      .to(shotC('hoy'), { autoAlpha: 0, duration: 0.05 }, 0.25)
      .to(shotC('tratamientos'), { autoAlpha: 1, duration: 0.05 }, 0.25)
      .fromTo(heroConsole.inner('tratamientos'), { scale: 1 }, { scale: 1.5, duration: 0.1, ease: 'power2.inOut' }, 0.27)
      .to(shotP('inicio'), { autoAlpha: 0, duration: 0.05 }, 0.27)
      .to(shotP('citas'), { autoAlpha: 1, duration: 0.05 }, 0.27)
      .to(box(trat), { autoAlpha: 1, duration: 0.02 }, 0.34)
      .fromTo(chip(trat), { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.02 }, 0.35)
      .to(ends('ln1'), { opacity: 1, duration: 0.01 }, 0.36)
      .fromTo('#ln1', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.07, ease: 'power1.inOut' }, 0.36)
      .to(box(appCitas), { autoAlpha: 1, duration: 0.02 }, 0.42)
      // limpieza
      .to(clean(box(trat), chip(trat), box(appCitas), line('ln1'), ends('ln1')), { opacity: 0, duration: 0.02 }, 0.46)
      // 03: antes y después
      .to(shotP('citas'), { autoAlpha: 0, duration: 0.05 }, 0.48)
      .to(shotP('progreso'), { autoAlpha: 1, duration: 0.05 }, 0.48);

    if (mesh) {
      tl.to(mesh, { autoAlpha: 1, duration: 0.01 }, 0.49).fromTo(
        meshDots,
        { scale: 0, opacity: 0, transformOrigin: '50% 50%' },
        { scale: 1, opacity: 1, duration: 0.04, ease: 'power2.out', stagger: (i, el) => (Number(el.dataset.d) / maxD) * 0.16 },
        0.49
      );
    }

    tl.to(shotC('tratamientos'), { autoAlpha: 0, duration: 0.05 }, 0.55)
      .to(shotC('pacientes'), { autoAlpha: 1, duration: 0.05 }, 0.55)
      .fromTo(heroConsole.inner('pacientes'), { scale: 1 }, { scale: 1.6, duration: 0.1, ease: 'power2.inOut' }, 0.55)
      .to(box(tabs), { autoAlpha: 1, duration: 0.02 }, 0.56)
      .fromTo(chip(tabs), { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.02 }, 0.57)
      .to(box(progC), { autoAlpha: 1, duration: 0.02 }, 0.6)
      .set('#ln2', { opacity: 1 }, 0.6)
      .to(ends('ln2'), { opacity: 1, duration: 0.01 }, 0.61)
      .fromTo('#ln2', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.07, ease: 'power1.inOut' }, 0.61)
      .to(box(appProg), { autoAlpha: 1, duration: 0.02 }, 0.67)
      .to(box(appBa), { autoAlpha: 1, duration: 0.02 }, 0.69)
      // limpieza
      .to(clean(box(tabs), chip(tabs), box(progC), box(appProg), box(appBa), line('ln2'), ends('ln2')), { opacity: 0, duration: 0.02 }, 0.75);
    if (mesh) tl.to(mesh, { opacity: 0.35, duration: 0.04 }, 0.75);

    // 04: compra e indicadores
    tl.to(shotP('progreso'), { autoAlpha: 0, duration: 0.05 }, 0.76)
      .to(shotP('tienda'), { autoAlpha: 1, duration: 0.05 }, 0.76);
    if (ripple) tl.fromTo(ripple, { scale: 0.4, opacity: 0.9 }, { scale: 1.6, opacity: 0, duration: 0.05, ease: 'power2.out' }, 0.8);
    tl.to(shotC('pacientes'), { autoAlpha: 0, duration: 0.05 }, 0.8)
      .to(shotC('inventario'), { autoAlpha: 1, duration: 0.05 }, 0.8)
      .fromTo(heroConsole.inner('inventario'), { scale: 1 }, { scale: 1.15, duration: 0.1, ease: 'power2.inOut' }, 0.8)
      .to(box(row), { autoAlpha: 1, duration: 0.02 }, 0.82)
      .set('#ln3', { opacity: 1 }, 0.82)
      .to(ends('ln3'), { opacity: 1, duration: 0.01 }, 0.82)
      .fromTo('#ln3', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.05, ease: 'power1.inOut' }, 0.82)
      .fromTo(chip(row), { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.02 }, 0.85)
      .fromTo(kpis, { scale: 0.94, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 0.03, stagger: 0.02, ease: 'power2.out' }, 0.88)
      .to(stage, { x: 0, scale: 1, duration: 0.08, ease: 'power2.inOut' }, 0.88)
      .fromTo(heroEnd, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.06, ease: 'power2.out' }, 0.92);

    if (tl.duration() < 1) tl.to({}, { duration: 1 - tl.duration() });

    return () => {
      ScrollTrigger.removeEventListener('refreshInit', onRefresh);
      stage.classList.remove('is-scripted');
      heroConsole.setUrl('hoy');
    };
  });

  // Al cruzar 1024 px gsap.matchMedia revierte y reconstruye; se refresca todo
  window.matchMedia('(min-width: 1024px)').addEventListener('change', () => requestAnimationFrame(() => ScrollTrigger.refresh()));
}

/* ---------- Cómo se conectan ---------- */

export function initComo({ gsap, ScrollTrigger, comoConsole, comoPhone, reduced }) {
  const list = document.getElementById('comoTabs');
  const panels = [...document.querySelectorAll('.como-panel')];
  const stageEl = document.querySelector('.como-stage');
  const svg = document.getElementById('jLineSvg');
  const path = document.getElementById('jLine');

  function layout() {
    const w = stageEl.offsetWidth;
    const h = stageEl.offsetHeight;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const c = comoConsole.el;
    const ph = comoPhone.el;
    const co = offsetIn(c, stageEl);
    const po = offsetIn(ph, stageEl);
    const a = { x: co.x + c.offsetWidth * 0.72, y: co.y + c.offsetHeight * 0.42 };
    const b = { x: po.x + 4, y: po.y + ph.offsetHeight * 0.4 };
    path.setAttribute('d', curve(a, b));
  }

  const draw = () => {
    if (reduced) {
      gsap.set(path, { strokeDashoffset: 0 });
      return;
    }
    gsap.fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power1.inOut', overwrite: true });
  };

  function apply(tab) {
    const { console: scr, zoom, origin, app } = tab.dataset;
    comoConsole.CONSOLE_PREV && comoConsole.zoom(1, '50% 50%', comoConsole.CONSOLE_PREV);
    comoConsole.show(scr);
    comoConsole.zoom(Number(zoom), origin, scr);
    comoConsole.CONSOLE_PREV = scr;
    comoPhone.show(app);
  }

  const tl = tablist(list, {
    onSelect(i, tab) {
      panels.forEach((p, k) => (p.hidden = k !== i));
      apply(tab);
      draw();
    }
  });
  apply(tl.tabs[0]);
  layout();
  ScrollTrigger.addEventListener('refreshInit', layout);
  window.addEventListener('resize', layout);

  ScrollTrigger.create({ trigger: stageEl, start: 'top 70%', once: true, refreshPriority: -1, onEnter: draw });
}

/* ---------- Consola por módulos ---------- */

export function initFeatures({ featConsole }) {
  const list = document.getElementById('featList');
  const tl = tablist(list, {
    vertical: true,
    hover: true,
    onSelect(i, tab) {
      featConsole.show(tab.dataset.screen);
    }
  });
  featConsole.onNavigate = (id) => {
    const k = tl.tabs.findIndex((t) => t.dataset.screen === id);
    if (k >= 0) tl.select(k, { silent: true });
  };
}

/* ---------- App del paciente ---------- */

export function initPaciente({ gsap, ScrollTrigger, pacPhone, reduced }) {
  const list = document.getElementById('pacTabs');
  const box = document.getElementById('pacPhoneBox');
  const mesh = box.querySelector('.mesh');
  const tl = tablist(list, {
    vertical: true,
    onSelect(i, tab) {
      pacPhone.show(tab.dataset.screen);
    }
  });
  pacPhone.onNavigate = (id) => {
    const k = tl.tabs.findIndex((t) => t.dataset.screen === id);
    if (k >= 0) tl.select(k, { silent: true });
  };

  if (!mesh) return;
  const dots = mesh.querySelectorAll('.m-dot');
  const lines = mesh.querySelectorAll('.m-line');
  if (reduced) return;
  gsap.set(dots, { scale: 0, transformOrigin: '50% 50%' });
  gsap.set(lines, { opacity: 0 });
  ScrollTrigger.create({
    trigger: box,
    start: 'top 75%',
    once: true,
    refreshPriority: -1,
    onEnter() {
      const t = gsap.timeline({ defaults: { ease: 'power2.out' } });
      t.to(dots, { scale: 1, duration: 0.8, stagger: { amount: 0.8, from: 'center' } }, 0).to(lines, { opacity: 0.45, duration: 1.6 }, 0);
    }
  });
}

/* ---------- FAQ ---------- */

export function initFaq({ gsap, ScrollTrigger, reduced }) {
  const items = [...document.querySelectorAll('#faqList details')];
  const close = (d, done) => {
    const ans = d.querySelector('.ans');
    if (reduced) {
      d.open = false;
      return done?.();
    }
    gsap.to(ans, {
      height: 0,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete() {
        d.open = false;
        gsap.set(ans, { clearProps: 'height,opacity' });
        ScrollTrigger.refresh();
        done?.();
      }
    });
  };
  const openIt = (d) => {
    d.open = true;
    if (reduced) return;
    const ans = d.querySelector('.ans');
    gsap.fromTo(
      ans,
      { height: 0, opacity: 0 },
      {
        height: 'auto',
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out',
        onComplete() {
          gsap.set(ans, { clearProps: 'height,opacity' });
          ScrollTrigger.refresh();
        }
      }
    );
  };
  items.forEach((d) => {
    d.querySelector('summary').addEventListener('click', (e) => {
      e.preventDefault();
      if (d.open) close(d);
      else {
        items.filter((o) => o !== d && o.open).forEach((o) => close(o));
        openIt(d);
      }
    });
  });
}

/* ---------- Onda de voz ---------- */

export function initWave({ reduced }) {
  const wave = document.getElementById('wave');
  if (!wave) return;
  wave.innerHTML = Array.from({ length: 18 }, (_, k) => `<i style="--k:${k}"></i>`).join('');
  if (reduced || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((en) => en.forEach((e) => wave.classList.toggle('is-live', e.isIntersecting)), { threshold: 0.2 });
  io.observe(wave);
}
