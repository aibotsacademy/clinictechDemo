/* Consola de la clínica renderizada como DOM.
   El mismo marcado sirve para el hero (inerte) y para las vistas vivas. */

import { store, fee, esc } from './store.js';
import { faceDots, jar } from './patient.js';

export const CONSOLE_SCREENS = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'pacientes', label: 'Pacientes' },
  { id: 'tratamientos', label: 'Tratamientos' },
  { id: 'catalogo', label: 'Catálogo' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'facturas', label: 'Facturas' }
];

const URLS = {
  hoy: 'consola.clinicaejemplo.app/hoy',
  agenda: 'consola.clinicaejemplo.app/agenda',
  pacientes: 'consola.clinicaejemplo.app/pacientes/valeria-mendez',
  tratamientos: 'consola.clinicaejemplo.app/tratamientos',
  catalogo: 'consola.clinicaejemplo.app/catalogo',
  inventario: 'consola.clinicaejemplo.app/inventario',
  facturas: 'consola.clinicaejemplo.app/facturas'
};

function side(id, live) {
  const items = CONSOLE_SCREENS.map((s) => {
    const on = s.id === id ? ' on' : '';
    return live
      ? `<button type="button" class="cx-nav${on}" data-go="${s.id}"${on ? ' aria-current="page"' : ''}><i></i>${s.label}</button>`
      : `<span class="cx-nav${on}"><i></i>${s.label}</span>`;
  }).join('');
  return `<aside class="cx-side"><div class="cx-brand"><span class="logo-mark"></span>${esc(store.CLINIC)}</div>${items}</aside>`;
}

const head = (title, sub, right = '') =>
  `<div class="cx-head"><div><div class="cx-title">${title}</div><div class="cx-sub">${sub}</div></div>${right}</div>`;

/* ---------- Pantallas ---------- */

function hoy() {
  const rows = store.TODAY.map(
    (a) =>
      `<div class="cx-li"><span class="t">${a.t}</span><span><span class="n">${esc(a.who)}</span> <span class="s">· ${esc(a.what)}</span></span><span class="cx-pill${a.state === 'Desde la app' ? ' new' : a.state === 'Atendida' ? ' ok' : ''}">${a.state}</span></div>`
  ).join('');
  const max = Math.max(...store.WEEK_SALES);
  const bars = store.WEEK_SALES.map((v, i) => `<i class="${i === 5 ? 'hi' : ''}" style="height:${(v / max) * 100}%"></i>`).join('');
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => `<span>${d}</span>`).join('');
  const pac = store.patient();
  return `${head('Hoy', 'Lunes 11 de noviembre · datos ficticios', '<span class="cx-btn">Nueva cita</span>')}
    <div class="cx-grid2" style="flex:1">
      <div class="cx-card"><h5>Citas de hoy</h5><div class="cx-list">${rows}</div></div>
      <div class="cx-row">
        <div class="cx-card"><h5>Siguiente paciente</h5>
          <div class="cx-person"><span class="cx-avatar">${pac.initials}</span><div><b>${esc(pac.name)}</b><small>10:30 · Bioestimulador · sesión 2</small></div></div>
          <div style="display:flex;gap:.5em;margin-top:.8em"><span class="cx-btn">Abrir ficha</span><span class="cx-btn ghost">Fotos</span></div>
        </div>
        <div class="cx-card"><h5>Ventas de la semana</h5><div class="cx-big">${fee(4380)}</div><div class="cx-muted">Tarifas de ejemplo · +12% vs. la anterior</div><div class="cx-bars">${bars}</div><div class="cx-bars-x">${days}</div></div>
      </div>
    </div>`;
}

function agenda() {
  const hours = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00'];
  const days = ['Lun 11', 'Mar 12', 'Mié 13', 'Jue 14', 'Vie 15'];
  const ev = {
    '0-0': ['Lucía A. · Valoración'],
    '1-1': ['Valeria M. · Bioestimulador'],
    '3-0': ['Camila R. · Toxina'],
    '5-0': ['Sofía B. · Peeling', 'app'],
    '2-2': ['Daniela M. · Control'],
    '0-3': ['Andrea S. · Luz pulsada', 'app'],
    '4-3': ['Lucía A. · Hidratación'],
    '1-4': ['Camila R. · Control', 'app'],
    '3-4': ['Sofía B. · Peeling 2']
  };
  let cells = '<span></span>' + days.map((d) => `<span class="h">${d}</span>`).join('');
  hours.forEach((h, hi) => {
    cells += `<span class="hr">${h}</span>`;
    days.forEach((_, di) => {
      const e = ev[`${hi}-${di}`];
      cells += e ? `<span class="cell ev${e[1] ? ' app' : ''}">${e[0]}</span>` : '<span class="cell"></span>';
    });
  });
  return `${head('Agenda', 'Semana del 11 al 15 de noviembre', '<span class="cx-pill new">3 pedidas desde la app</span>')}
    <div class="cx-card" style="flex:1"><div class="cx-week">${cells}</div></div>`;
}

function pacientes() {
  const pac = store.patient();
  const list = store.PATIENTS.map(
    (p) =>
      `<div class="cx-li" style="grid-template-columns:auto minmax(0,1fr);${p.id === pac.id ? 'background:var(--blush);border-radius:.6em;' : ''}"><span class="cx-avatar" style="width:2em;height:2em;font-size:.75em">${p.initials}</span><span><span class="n">${esc(p.name)}</span><br><span class="s">${esc(p.last)}</span></span></div>`
  ).join('');
  return `${head('Pacientes', 'Expediente y evolución')}
    <div style="display:grid;grid-template-columns:15em minmax(0,1fr);gap:1em;flex:1;min-height:0">
      <div class="cx-card"><h5>Pacientes</h5><div class="cx-list">${list}</div></div>
      <div class="cx-card" style="display:flex;flex-direction:column;gap:.9em">
        <div class="cx-head"><div class="cx-person"><span class="cx-avatar">${pac.initials}</span><div><b>${esc(pac.name)}</b><small>${pac.age} años · Glow ${pac.glow}</small></div></div><span class="cx-btn">Nueva visita</span></div>
        <div class="cx-tabs hl-host" data-mark="tabs"><span>Resumen</span><span class="on">Antes y después</span><span>Notas</span><span>Fichas firmadas</span><span class="hl-box" aria-hidden="true"></span><span class="hl-chip" aria-hidden="true">Antes / después</span></div>
        <div class="cx-ba"><figure>${faceDots('antes')}<figcaption>Antes · 14 ago</figcaption></figure><figure>${faceDots('despues')}<figcaption>Después · 4 nov</figcaption></figure></div>
        <div class="hl-host" data-mark="prog" style="display:grid;gap:.4em"><div class="cx-head"><span class="cx-muted" style="font-weight:700;color:var(--label)">Bioestimulador · sesión 1 de 3</span><span class="cx-pill ok">Visible en su app</span></div><div class="cx-prog"><i style="width:34%"></i></div><span class="hl-box" aria-hidden="true"></span></div>
      </div>
    </div>`;
}

function tratamientos(live) {
  const cat = store.TREATMENTS.map((t) => {
    const btn = live
      ? `<button type="button" class="cx-btn" data-prescribe="${t.id}">Prescribir</button>`
      : '<span class="cx-btn">Prescribir</span>';
    return `<div class="cx-li" style="grid-template-columns:minmax(0,1fr) auto"><span><span class="n">${esc(t.name)}</span><br><span class="s">${esc(t.zone)} · ${t.sessions} ${t.sessions === 1 ? 'sesión' : 'sesiones'}</span></span>${btn}</div>`;
  }).join('');
  const plan = store.state.plan
    .map((pl, i) => {
      const t = store.treatment(pl.tid);
      const mark = i === 0 ? ' data-mark="trat"' : '';
      return `<div class="cx-li hl-host"${mark} style="grid-template-columns:minmax(0,1fr) auto"><span><span class="n">${esc(t.name)}</span><br><span class="s">Sesión ${pl.done} de ${pl.total} · ${esc(pl.date)}</span></span><span class="cx-pill ${pl.isNew ? 'new' : 'ok'}">${pl.isNew ? 'Nuevo' : 'En curso'}</span>${i === 0 ? '<span class="hl-box" aria-hidden="true"></span><span class="hl-chip" aria-hidden="true">Activo</span>' : ''}</div>`;
    })
    .join('');
  const routine = [...store.ROUTINE.manana.slice(1), store.ROUTINE.noche[1]]
    .map((r) => {
      const p = store.product(r.p);
      return `<div class="cx-li" style="grid-template-columns:minmax(0,1fr) auto"><span class="n">${esc(p.name)}</span><span class="s">${esc(r.how)}</span></div>`;
    })
    .join('');
  const pac = store.patient();
  return `${head('Tratamientos', `Ficha de ${esc(pac.name)}`)}
    <div class="cx-grid2" style="flex:1;min-height:0">
      <div class="cx-card"><h5>Prescribir</h5><div class="cx-list">${cat}</div></div>
      <div class="cx-row" style="align-content:start">
        <div class="cx-card"><h5>Plan activo de ${esc(pac.name.split(' ')[0])}</h5><div class="cx-list">${plan}</div></div>
        <div class="cx-card hl-host" data-mark="rutina"><h5>Rutina en casa · se envía a su app</h5><div class="cx-list">${routine}</div><span class="hl-box" aria-hidden="true"></span></div>
      </div>
    </div>`;
}

function catalogo() {
  const prods = store.state.products
    .map(
      (p) =>
        `<div class="cx-card cx-prod"><div class="jar">${jar()}</div><b>${esc(p.name)}</b><small>${esc(p.size)} · ${fee(p.fee)} · visible en la app</small></div>`
    )
    .join('');
  return `${head('Catálogo', 'Lo que tus pacientes ven en su app · tarifas de ejemplo', '<span class="cx-btn">Agregar producto</span>')}
    <div class="cx-tabs"><span class="on">Productos</span><span>Tratamientos</span></div>
    <div class="cx-grid3">${prods}</div>`;
}

function inventario() {
  const s = store.state;
  const appOrders = s.orders.filter((o) => o.state === 'Nuevo').length;
  const low = s.products.filter((p) => p.stock < 8).length;
  const kpis = [
    ['Pedidos de la app', appOrders, 'esta semana'],
    ['Unidades vendidas', s.soldWeek, '+4 vs. semana anterior'],
    ['Stock bajo', low, low === 1 ? 'producto' : 'productos'],
    ['Valor en stock', fee(s.products.reduce((a, p) => a + p.stock * p.fee, 0)), 'tarifa de ejemplo']
  ]
    .map(([k, v, e]) => `<div class="cx-kpi" data-kpi><small>${k}</small><b>${v}</b><em>${e}</em></div>`)
    .join('');
  const orders = s.orders
    .slice(0, 5)
    .map((o, i) => {
      const p = store.product(o.pid);
      const mark = i === 0 ? ' class="hl-host" data-mark="row"' : '';
      return `<tr${mark}><td>${o.id}</td><td>${esc(o.who)}</td><td>${esc(p.name)}</td><td><span class="cx-pill ${o.isNew ? 'new' : 'ok'}">${o.state}</span>${i === 0 ? '<span class="hl-box" aria-hidden="true" style="inset:-.1em -.3em"></span><span class="hl-chip" aria-hidden="true">Nuevo</span>' : ''}</td></tr>`;
    })
    .join('');
  const stock = s.products
    .map((p) => {
      const pct = Math.min(100, (p.stock / 24) * 100);
      return `<tr><td>${esc(p.name)}</td><td>${p.lot}</td><td class="num"><span class="stock-bar"><i class="${p.stock < 8 ? 'low' : ''}" style="width:${pct}%"></i></span>${p.stock}</td></tr>`;
    })
    .join('');
  return `${head('Inventario', 'Stock por lote y pedidos desde la app')}
    <div class="cx-kpis">${kpis}</div>
    <div class="cx-grid2" style="flex:1;min-height:0;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr)">
      <div class="cx-card"><h5>Pedidos de la app</h5><table class="cx-table"><thead><tr><th>Pedido</th><th>Paciente</th><th>Producto</th><th>Estado</th></tr></thead><tbody>${orders}</tbody></table></div>
      <div class="cx-card"><h5>Stock</h5><table class="cx-table"><thead><tr><th>Producto</th><th>Lote</th><th class="num">Unidades</th></tr></thead><tbody>${stock}</tbody></table></div>
    </div>`;
}

function facturas() {
  const rows = store.INVOICES.map(
    (f) =>
      `<tr><td>${f.n}</td><td>${esc(f.who)}</td><td>${esc(f.what)}</td><td class="num">${fee(f.fee)}</td><td><span class="cx-pill ${f.state === 'Pagada' ? 'ok' : 'warn'}">${f.state}</span></td></tr>`
  ).join('');
  return `${head('Facturas', 'Cobros y facturas internas · tarifas de ejemplo', '<span class="cx-btn">Nuevo cobro</span>')}
    <div class="cx-kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))">
      <div class="cx-kpi"><small>Cobrado esta semana</small><b>${fee(4380)}</b></div>
      <div class="cx-kpi"><small>Pendiente</small><b>${fee(60)}</b></div>
      <div class="cx-kpi"><small>Facturas emitidas</small><b>18</b></div>
    </div>
    <div class="cx-card" style="flex:1"><table class="cx-table"><thead><tr><th>Factura</th><th>Paciente</th><th>Concepto</th><th class="num">Monto</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}


/* Conserva el foco al volver a pintar una vista viva */
function focusKey(root) {
  const a = document.activeElement;
  if (!a || !root.contains(a)) return null;
  for (const k of ['data-go', 'data-prescribe']) if (a.hasAttribute(k)) return `[${k}="${a.getAttribute(k)}"]`;
  return null;
}

const BUILDERS = { hoy, agenda, pacientes, tratamientos, catalogo, inventario, facturas };

/* Monta la consola en `host`. live: navegable e interactiva. */
export function mountConsole(host, { screen = 'hoy', live = false, label = 'Consola de la clínica' } = {}) {
  host.classList.add('console');
  host.innerHTML = `<div class="console-bar"><span class="console-dots"><i></i><i></i><i></i></span><span class="console-url">${URLS[screen]}</span></div><div class="console-screen"><div class="cs-fit"></div></div>`;
  const fit = host.querySelector('.cs-fit');
  const url = host.querySelector('.console-url');
  if (!live) {
    host.setAttribute('aria-hidden', 'true');
    host.inert = true;
  } else {
    const scr = host.querySelector('.console-screen');
    scr.setAttribute('role', 'region');
    scr.setAttribute('aria-label', label);
  }
  let current = screen;

  function render() {
    const key = focusKey(fit);
    const zooms = {};
    fit.querySelectorAll('.shot').forEach((s) => {
      const inn = s.querySelector('.shot-in');
      if (inn) zooms[s.dataset.screen] = [inn.style.transform, inn.style.transformOrigin];
    });
    fit.innerHTML = CONSOLE_SCREENS.map(
      (s) =>
        `<div class="shot${s.id === current ? ' on' : ''}" data-screen="${s.id}"${s.id === current ? '' : ' aria-hidden="true"'}><div class="shot-in"><div class="cx">${side(s.id, live)}<div class="cx-main">${BUILDERS[s.id](live)}</div></div></div></div>`
    ).join('');
    fit.querySelectorAll('.shot').forEach((s) => {
      const z = zooms[s.dataset.screen];
      if (z) {
        const inn = s.querySelector('.shot-in');
        inn.style.transform = z[0];
        inn.style.transformOrigin = z[1];
      }
    });
    if (key) fit.querySelector(`.on ${key}`)?.focus({ preventScroll: true });
  }

  function show(id) {
    if (!BUILDERS[id]) return;
    current = id;
    url.textContent = URLS[id];
    fit.querySelectorAll('.shot').forEach((el) => {
      const on = el.dataset.screen === id;
      el.classList.toggle('on', on);
      if (on) el.removeAttribute('aria-hidden');
      else el.setAttribute('aria-hidden', 'true');
    });
  }

  /* Zoom de la pantalla actual (CSS transition .9s var(--ease)) */
  function zoom(scale = 1, origin = '50% 50%', id = current) {
    const inn = fit.querySelector(`.shot[data-screen="${id}"] .shot-in`);
    if (!inn) return;
    inn.style.transformOrigin = origin;
    inn.style.transform = scale === 1 ? '' : `scale(${scale})`;
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
      const pr = e.target.closest('[data-prescribe]');
      if (pr) store.prescribe(pr.dataset.prescribe);
    });
    store.subscribe(() => render());
  }

  const api = {
    el: host,
    fit,
    show,
    zoom,
    setUrl: (id) => {
      if (URLS[id] && url.textContent !== URLS[id]) url.textContent = URLS[id];
    },
    get current() {
      return current;
    },
    shot: (id) => fit.querySelector(`.shot[data-screen="${id}"]`),
    inner: (id) => fit.querySelector(`.shot[data-screen="${id}"] .shot-in`),
    mark: (id, name) => fit.querySelector(`.shot[data-screen="${id}"] [data-mark="${name}"]`),
    onNavigate: null
  };
  return api;
}
