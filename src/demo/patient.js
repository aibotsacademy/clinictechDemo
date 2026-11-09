/* App del paciente renderizada como DOM + piezas de arte abstracto
   (mapa de puntos de antes/después y mesh facial). Sin fotos. */

import { store, fee, esc } from './store.js';

/* ---------- Arte abstracto ---------- */

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Mapa de puntos para antes/después: "antes" irregular, "después" uniforme */
export function faceDots(kind = 'antes', w = 120, h = 90) {
  const r = rng(kind === 'antes' ? 7 : 11);
  const cx = w / 2;
  const cy = h * 0.52;
  const rx = h * 0.27;
  const ry = h * 0.38;
  let dots = '';
  const step = h / 15;
  for (let y = cy - ry; y <= cy + ry; y += step) {
    for (let x = cx - rx; x <= cx + rx; x += step) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny > 1) continue;
      const even = kind !== 'antes';
      const jitter = even ? 0.15 : 0.5;
      const px = x + (r() - 0.5) * step * jitter;
      const py = y + (r() - 0.5) * step * jitter;
      const rad = even ? 0.9 + r() * 0.25 : 0.5 + r() * 1.3;
      const op = even ? 0.75 + r() * 0.2 : 0.25 + r() * 0.75;
      const col = even ? '#F0D28B' : r() > 0.55 ? '#C36A55' : '#F0D28B';
      dots += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${rad.toFixed(2)}" fill="${col}" opacity="${op.toFixed(2)}"/>`;
    }
  }
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><ellipse cx="${cx}" cy="${cy}" rx="${rx + 3}" ry="${ry + 3}" fill="none" stroke="rgba(240,210,139,.35)" stroke-width=".5"/>${dots}</svg>`;
}

/* Mesh facial decorativo: anillos elípticos de puntos unidos por líneas */
export function faceMesh(cls = 'mesh') {
  const W = 200;
  const H = 260;
  const cx = 100;
  const cy = 132;
  const rings = [
    { rx: 18, ry: 22, n: 8 },
    { rx: 36, ry: 46, n: 12 },
    { rx: 54, ry: 70, n: 16 },
    { rx: 72, ry: 94, n: 20 },
    { rx: 88, ry: 118, n: 24 }
  ];
  const pts = [{ x: cx, y: cy, ring: -1 }];
  rings.forEach((ring, ri) => {
    for (let k = 0; k < ring.n; k++) {
      const a = (k / ring.n) * Math.PI * 2 + ri * 0.21;
      pts.push({ x: cx + Math.cos(a) * ring.rx, y: cy + Math.sin(a) * ring.ry, ring: ri, k });
    }
  });
  const lines = [];
  let offset = 1;
  rings.forEach((ring, ri) => {
    for (let k = 0; k < ring.n; k++) {
      const a = offset + k;
      const b = offset + ((k + 1) % ring.n);
      lines.push([a, b]);
      if (ri === 0) lines.push([0, a]);
      else {
        const prev = rings[ri - 1];
        const prevOffset = offset - prev.n;
        const j = Math.round((k / ring.n) * prev.n) % prev.n;
        lines.push([a, prevOffset + j]);
      }
    }
    offset += ring.n;
  });
  const lineStr = lines
    .map(([a, b]) => `<line class="m-line" x1="${pts[a].x.toFixed(1)}" y1="${pts[a].y.toFixed(1)}" x2="${pts[b].x.toFixed(1)}" y2="${pts[b].y.toFixed(1)}"/>`)
    .join('');
  const dotStr = pts
    .map((p, i) => {
      const d = Math.hypot(p.x - cx, (p.y - cy) * 0.78);
      return `<circle class="m-dot" data-d="${d.toFixed(1)}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i === 0 ? 2.2 : 1.6}"/>`;
    })
    .join('');
  return `<svg class="${cls}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><g class="m-lines">${lineStr}</g><g class="m-dots">${dotStr}</g></svg>`;
}

/* Frasco decorativo (terracotta-deco) */
export const jar = (tone = '#C36A55') =>
  `<svg class="jar-svg" viewBox="0 0 18 26" aria-hidden="true"><rect x="5" y="1" width="8" height="5" rx="1.5" fill="#3F2127"/><rect x="2" y="6" width="14" height="19" rx="4" fill="${tone}"/><rect x="5" y="12" width="8" height="6" rx="1" fill="#F8F3EC" opacity=".8"/></svg>`;

const JAR_TONES = { vitc: '#C36A55', spf: '#F0D28B', clean: '#DFD2C4', ret: '#80512E', eye: '#F6E0D3', hyal: '#8E6068' };

/* ---------- Pantallas ---------- */

export const PATIENT_SCREENS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'rutina', label: 'Mi rutina' },
  { id: 'citas', label: 'Citas y tratamientos' },
  { id: 'progreso', label: 'Mi progreso' },
  { id: 'tienda', label: 'Tienda' }
];

const TAB_SHORT = { inicio: 'Inicio', rutina: 'Rutina', citas: 'Citas', progreso: 'Progreso', tienda: 'Tienda' };

function shell(id, body, live) {
  const tabs = PATIENT_SCREENS.map((s) => {
    const on = s.id === id ? ' on' : '';
    return live
      ? `<button type="button" class="ap-tab${on}" data-go="${s.id}" aria-label="${esc(s.label)}"><i></i>${TAB_SHORT[s.id]}</button>`
      : `<span class="ap-tab${on}"><i></i>${TAB_SHORT[s.id]}</span>`;
  }).join('');
  return `<div class="ap">
    <div class="ap-status"><span>9:41</span><span>●●● ▮</span></div>
    <div class="ap-head"><span class="ap-brand"><span class="logo-mark"></span>${esc(store.CLINIC)}</span><span class="ap-bell"></span></div>
    <div class="ap-body">${body}</div>
    <nav class="ap-tabbar">${tabs}</nav>
  </div>`;
}

function inicio() {
  const pac = store.patient();
  return `<p class="ap-hello">Hola, ${esc(pac.name.split(' ')[0])}</p>
    <p class="ap-title">Tu próxima cita</p>
    <div class="ap-card dark">
      <small>Martes 12 de noviembre · 10:30</small>
      <div class="big">Bioestimulador · sesión 2</div>
      <div class="ap-row"><small>Dra. Elena Vargas</small><span class="ap-btn">Confirmar</span></div>
    </div>
    <div class="ap-card"><div class="ap-row"><div><small>Mi rutina de hoy</small><b>2 de 6 pasos</b></div><span class="cx-pill ok">Mañana lista</span></div>
      <div class="ap-prog"><i style="width:33%"></i></div></div>
    <div class="ap-card"><small>Tu Glow</small><div class="ap-row"><div class="big">${pac.glow}</div><small>+3 desde septiembre</small></div></div>`;
}

function rutina() {
  const step = (r, i, done) => {
    const p = store.product(r.p);
    return `<div class="ap-step${done ? ' done' : ''}"><span class="k">${done ? '✓' : i + 1}</span><div><b>${esc(p.name)}</b><small>${esc(r.how)}</small></div></div>`;
  };
  return `<p class="ap-title">Mi rutina</p>
    <div class="ap-seg"><span class="on">Mañana</span><span>Noche</span></div>
    <div class="ap-card" data-mark="rutina">${store.ROUTINE.manana.map((r, i) => step(r, i, i < 2)).join('')}</div>
    <div class="ap-card"><small>Noche</small>${store.ROUTINE.noche.map((r, i) => step(r, i, false)).join('')}</div>`;
}

function citas() {
  const items = store.state.plan
    .map((pl, idx) => {
      const t = store.treatment(pl.tid);
      const sess = Array.from({ length: pl.total }, (_, k) => `<i class="${k < pl.done ? 'd' : ''}"></i>`).join('');
      const mark = idx === 0 ? ' data-mark="citas" ' : '';
      return `<div class="ap-card hl-host"${mark}>
        <div class="ap-row"><b>${esc(t.name)}</b>${pl.isNew ? '<span class="cx-pill new">Nuevo</span>' : `<small>${pl.done} de ${pl.total}</small>`}</div>
        <small>${esc(t.zone)} · ${esc(pl.date)}</small>
        <div class="ap-sess">${sess}</div>
        ${idx === 0 ? '<span class="hl-box" aria-hidden="true"></span>' : ''}
      </div>`;
    })
    .join('');
  return `<p class="ap-title">Citas y tratamientos</p>
    <div class="ap-card"><small>Próxima cita</small><b>Mar 12 nov · 10:30</b><small>Bioestimulador · sesión 2</small></div>
    <small class="cx-muted" style="font-size:.72em;font-weight:700;color:var(--label)">Tu plan</small>
    ${items}`;
}

function progreso() {
  return `<p class="ap-title">Mi progreso</p>
    <div class="ap-ba hl-host" data-mark="ba">
      <figure>${faceDots('antes', 90, 120)}<figcaption>Antes · ago</figcaption></figure>
      <figure>${faceDots('despues', 90, 120)}<figcaption>Después · nov</figcaption></figure>
      <span class="hl-box" aria-hidden="true"></span>
    </div>
    <div class="ap-card hl-host" data-mark="prog"><div class="ap-row"><small>Plan de bioestimulador</small><small>1 de 3</small></div><div class="ap-prog"><i style="width:34%"></i></div><span class="hl-box" aria-hidden="true"></span></div>
    <p class="ap-note">«La textura se ve más uniforme. Seguimos con la sesión 2 y el sérum por la mañana.» — Dra. Elena Vargas</p>`;
}

function tienda(live) {
  const prods = ['vitc', 'spf', 'ret', 'hyal']
    .map((id, i) => {
      const p = store.product(id);
      const out = p.stock <= 0;
      const btn = live
        ? `<button type="button" class="ap-btn" data-buy="${p.id}"${out ? ' disabled' : ''}>${out ? 'Agotado' : 'Comprar'}</button>`
        : `<span class="ap-btn"${i === 0 ? ' data-mark="buy"' : ''}>Comprar${i === 0 ? '<span class="ripple"></span>' : ''}</span>`;
      return `<div class="ap-prod"><div class="jar">${jar(JAR_TONES[p.id])}</div><b>${esc(p.name)}</b><small>${fee(p.fee)} · tarifa de ejemplo</small>${btn}</div>`;
    })
    .join('');
  return `<p class="ap-title">Tienda</p><small class="cx-muted" style="font-size:.72em">Recomendados por tu clínica</small><div class="ap-shop">${prods}</div>`;
}


/* Conserva el foco al volver a pintar una vista viva */
function focusKey(root) {
  const a = document.activeElement;
  if (!a || !root.contains(a)) return null;
  for (const k of ['data-go', 'data-buy']) if (a.hasAttribute(k)) return `[${k}="${a.getAttribute(k)}"]`;
  return null;
}

const BUILDERS = { inicio, rutina, citas, progreso, tienda };

/* Monta la app en `host`. live: navegable e interactiva. */
export function mountPatient(host, { screen = 'inicio', live = false } = {}) {
  host.classList.add('phone-wrap');
  host.innerHTML = `<div class="phone"><div class="phone-screen"><div class="ps-fit"></div></div></div>`;
  const fit = host.querySelector('.ps-fit');
  if (!live) {
    host.setAttribute('aria-hidden', 'true');
    host.inert = true;
  } else {
    const scr = host.querySelector('.phone-screen');
    scr.setAttribute('role', 'region');
    scr.setAttribute('aria-label', `App del paciente de ${store.CLINIC}`);
  }
  let current = screen;

  function render() {
    const key = focusKey(fit);
    fit.innerHTML = PATIENT_SCREENS.map(
      (s) => `<div class="pshot${s.id === current ? ' on' : ''}" data-screen="${s.id}"${s.id === current ? '' : ' aria-hidden="true"'}>${shell(s.id, BUILDERS[s.id](live), live)}</div>`
    ).join('');
    if (key) fit.querySelector(`.on ${key}`)?.focus({ preventScroll: true });
  }

  function show(id) {
    if (!BUILDERS[id]) return;
    current = id;
    fit.querySelectorAll('.pshot').forEach((el) => {
      const on = el.dataset.screen === id;
      el.classList.toggle('on', on);
      if (on) el.removeAttribute('aria-hidden');
      else el.setAttribute('aria-hidden', 'true');
    });
  }

  render();

  if (live) {
    fit.addEventListener('click', (e) => {
      const go = e.target.closest('[data-go]');
      if (go) {
        show(go.dataset.go);
        api.onNavigate?.(go.dataset.go);
        return;
      }
      const buy = e.target.closest('[data-buy]');
      if (buy && !buy.disabled) store.buy(buy.dataset.buy);
    });
    store.subscribe(() => render());
  }

  const api = {
    el: host,
    fit,
    show,
    get current() {
      return current;
    },
    shot: (id) => fit.querySelector(`.pshot[data-screen="${id}"]`),
    mark: (name) => fit.querySelector(`[data-mark="${name}"]`),
    onNavigate: null
  };
  return api;
}
