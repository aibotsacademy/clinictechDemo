/* ==========================================================================
   Clinic Management Tech — punto de entrada
   Fuentes, estilos, montaje de pantallas e inicialización de todo.
   ========================================================================== */

import '@fontsource/belleza/400.css';
import '@fontsource/eb-garamond/400.css';
import '@fontsource/eb-garamond/400-italic.css';
import '@fontsource-variable/manrope';

import './styles/main.css';
import './styles/mockups.css';
import './styles/hero.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { initPrologue } from './hero.js';
import {
  initLenis,
  getLenis,
  initNav,
  initReveals,
  initHeroPin,
  initComo,
  initFeatures,
  initPaciente,
  initFaq,
  initWave,
  tablist,
  offsetIn,
  curve
} from './motion.js';
import { initSectionEntrance, createTelon, initMagnetic, initTilt } from './cine.js';
import { store, esc } from './demo/store.js';
import { mountConsole } from './demo/console.js';
import { mountPatient, faceMesh } from './demo/patient.js';
import services from './demo/services.json';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) document.documentElement.classList.add('is-reduced');

/* 1. Lenis y prólogo primero: el cuadro 000 empieza a cargar de inmediato */
initLenis({ gsap, ScrollTrigger, reduced });
initPrologue({ gsap, getLenis, reduced });

/* 2. Montaje de pantallas (DOM real, sin capturas) */

// Hero
const stage = document.getElementById('stage');
stage.insertAdjacentHTML('afterbegin', faceMesh('mesh'));
const heroConsole = mountConsole(document.getElementById('heroConsole'), { screen: 'hoy' });
const heroPhone = mountPatient(document.getElementById('heroPhone'), { screen: 'inicio' });

// Hero en móvil y otras vistas estáticas
document.querySelectorAll('.hero-mobile [data-console]').forEach((el) => {
  const c = mountConsole(el, { screen: el.dataset.console });
  if (el.dataset.zoom) c.zoom(Number(el.dataset.zoom), el.dataset.origin);
});
document.querySelectorAll('.hero-mobile [data-patient]').forEach((el) => mountPatient(el, { screen: el.dataset.patient }));

// Cómo se conectan
const comoConsole = mountConsole(document.getElementById('comoConsole'), { screen: 'tratamientos' });
const comoPhone = mountPatient(document.getElementById('comoPhone'), { screen: 'citas' });

// Consola navegable
const featConsole = mountConsole(document.getElementById('featConsole'), { screen: 'hoy', live: true, label: 'Consola de la clínica, navegable' });

// App del paciente navegable
const pacBox = document.getElementById('pacPhoneBox');
pacBox.insertAdjacentHTML('afterbegin', faceMesh('mesh'));
const pacPhone = mountPatient(document.getElementById('pacPhone'), { screen: 'inicio', live: true });

// Simulador
const simConsole = mountConsole(document.getElementById('simConsole'), { screen: 'tratamientos', live: true, label: 'Consola del simulador' });
const simPhone = mountPatient(document.getElementById('simPhone'), { screen: 'tienda', live: true });

/* 3. Soluciones (datos de services.json, ficticios) */

function initSoluciones() {
  const areasEl = document.getElementById('solAreas');
  const panelsEl = document.getElementById('solPanels');
  const badgeClass = { disponible: 'badge-ok', validacion: 'badge-val', desarrollo: 'badge-dev' };

  areasEl.innerHTML = services.areas
    .map(
      (a, i) =>
        `<button type="button" class="sol-area" role="tab" id="sa-${a.id}" aria-controls="sp-${a.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span class="sa-name">${esc(a.name)}</span><span class="sa-desc">${esc(a.desc)}</span></button>`
    )
    .join('');

  panelsEl.innerHTML = services.areas
    .map(
      (a, i) => `<div class="sol-panel" role="tabpanel" id="sp-${a.id}" aria-labelledby="sa-${a.id}"${i === 0 ? '' : ' hidden'}>
      ${a.items
        .map(
          (it) => `<details>
          <summary><span class="sn">${esc(it.name)}</span><span class="right"><span class="badge ${badgeClass[it.status]}">${services.status[it.status]}</span><span class="chev" aria-hidden="true"></span></span></summary>
          <dl><dt>Qué resuelve</dt><dd>${esc(it.solves)}</dd><dt>Incluye</dt><dd>${esc(it.includes)}</dd><dt>Depende de</dt><dd>${esc(it.depends)}</dd><dt>Inversión</dt><dd>Por cotizar</dd></dl>
        </details>`
        )
        .join('')}
    </div>`
    )
    .join('');

  const panels = [...panelsEl.querySelectorAll('.sol-panel')];
  tablist(areasEl, {
    vertical: true,
    onSelect(i) {
      panels.forEach((p, k) => (p.hidden = k !== i));
      ScrollTrigger.refresh();
    }
  });
  let t;
  panelsEl.addEventListener(
    'toggle',
    () => {
      clearTimeout(t);
      t = setTimeout(() => ScrollTrigger.refresh(), 120);
    },
    true
  );
}

/* 4. Historias: acta, plan facial y firma */

function initHistorias() {
  // Acta
  const acta = document.getElementById('acta');
  const pills = [...acta.querySelectorAll('.acta-pill')];
  const text = acta.querySelector('.acta-text');
  const lines = [
    '«Aplicamos toxina en frente y entrecejo, sin reacciones.»',
    'Borrador listo: procedimiento, zonas y observaciones.',
    'Servicio detectado: Toxina botulínica.',
    'Una persona revisa y aprueba el acta.',
    'Stock actualizado y factura creada.'
  ];
  let step = 0;
  const setStep = (k) => {
    step = (k + lines.length) % lines.length;
    pills.forEach((p, i) => p.setAttribute('aria-pressed', String(i === step)));
    text.textContent = lines[step];
    if (!reduced) gsap.fromTo(text, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
  };
  pills.forEach((p, i) => p.addEventListener('click', () => setStep(i)));
  document.getElementById('actaNext').addEventListener('click', () => setStep(step + 1));

  // Plan marcado sobre el rostro
  const out = document.getElementById('planOut');
  const dots = [...document.querySelectorAll('.plan-dot')];
  const renderPlan = () => {
    const on = dots.filter((d) => d.getAttribute('aria-pressed') === 'true');
    out.innerHTML = on.length
      ? `<ol>${on.map((d) => `<li><b>${esc(d.dataset.zone)}</b> · ${esc(d.dataset.tx)}</li>`).join('')}</ol>`
      : '<p class="empty">Toca una zona para agregarla.</p>';
  };
  dots.forEach((d) =>
    d.addEventListener('click', () => {
      d.setAttribute('aria-pressed', String(d.getAttribute('aria-pressed') !== 'true'));
      renderPlan();
    })
  );

  // Firma
  const pad = document.getElementById('signPad');
  const ctx = pad.getContext('2d');
  const status = document.getElementById('signStatus');
  let drawing = false;
  let last = null;
  let signed = false;
  const pos = (e) => {
    const r = pad.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * pad.width, y: ((e.clientY - r.top) / r.height) * pad.height };
  };
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#3F2127';
  ctx.lineWidth = 3;
  pad.addEventListener('pointerdown', (e) => {
    drawing = true;
    last = pos(e);
    pad.setPointerCapture(e.pointerId);
  });
  pad.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
    if (!signed) {
      signed = true;
      status.textContent = 'Firma de prueba lista. Así queda guardada por versión.';
    }
  });
  const stop = () => (drawing = false);
  pad.addEventListener('pointerup', stop);
  pad.addEventListener('pointercancel', stop);
  document.getElementById('signClear').addEventListener('click', () => {
    ctx.clearRect(0, 0, pad.width, pad.height);
    signed = false;
    status.textContent = 'Firma con el dedo o el cursor.';
  });
}

/* 5. Simulador: consola y app vivas sobre el mismo store */

function initSimulador() {
  const grid = document.getElementById('simGrid');
  const svg = document.getElementById('simCableSvg');
  const path = document.getElementById('simCable');
  const log = document.getElementById('simLog');
  const empty = '<p class="empty">Todavía no hay acciones. Prescribe un tratamiento o compra en la tienda.</p>';

  const layout = (fromConsole) => {
    const w = grid.offsetWidth;
    const h = grid.offsetHeight;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const c = simConsole.el;
    const p = simPhone.el;
    const co = offsetIn(c, grid);
    const po = offsetIn(p, grid);
    const a = { x: co.x + c.offsetWidth - 8, y: co.y + c.offsetHeight * 0.45 };
    const b = { x: po.x + 8, y: po.y + p.offsetHeight * 0.45 };
    path.setAttribute('d', fromConsole === false ? curve(b, a) : curve(a, b));
  };

  store.subscribe((state, action) => {
    log.innerHTML = state.log.length ? `<ol>${state.log.slice(0, 6).map((l) => `<li>${esc(l)}</li>`).join('')}</ol>` : empty;
    if (action.type === 'prescribe') {
      simPhone.show('citas');
      layout(true);
    } else if (action.type === 'buy') {
      simConsole.show('inventario');
      layout(false);
    } else if (action.type === 'reset') {
      simConsole.show('tratamientos');
      simPhone.show('tienda');
      gsap.set(path, { strokeDashoffset: 1 });
      return;
    }
    if (reduced) gsap.set(path, { strokeDashoffset: 0 });
    else gsap.fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: 'power1.inOut', overwrite: true });
  });

  document.getElementById('simReset').addEventListener('click', () => store.reset());
}

/* 6. Diagnóstico: cuestionario por pasos, sin precios */

function initQuiz() {
  const host = document.getElementById('quiz');
  const QUESTIONS = [
    { q: '¿Cómo llevas hoy los expedientes?', o: ['En papel o archivos sueltos', 'En un sistema que me funciona', 'En un sistema que quiero cambiar'] },
    { q: '¿Dónde quedan las fotos de antes y después?', o: ['En los teléfonos del equipo', 'En una carpeta compartida', 'Dentro del expediente'] },
    { q: '¿Qué pasa con la paciente al salir de la clínica?', o: ['Le explicamos la rutina en persona', 'Le enviamos indicaciones por mensaje', 'Usa una app de la clínica'] },
    { q: '¿Vendes productos de skincare?', o: ['Sí, en la clínica', 'Sí, en la clínica y en línea', 'Todavía no'] },
    { q: '¿Qué quieres resolver primero?', o: ['Ordenar la operación', 'Acompañar a la paciente entre citas', 'Ahorrar tiempo con IA', 'Que me encuentren en buscadores e IA'] }
  ];
  const answers = [];
  let idx = 0;

  const byId = {};
  services.areas.forEach((a) => a.items.forEach((it) => (byId[it.id] = it)));
  const badgeClass = { disponible: 'badge-ok', validacion: 'badge-val', desarrollo: 'badge-dev' };

  function recommend() {
    const rec = new Map(); // id → { stage, why }
    const add = (id, stage, why) => {
      const prev = rec.get(id);
      if (!prev || stage < prev.stage) rec.set(id, { stage, why });
    };
    const [a1, a2, a3, a4, a5] = answers;
    if (a1 === 1) add('crm', 1, 'Conservas tu sistema y evaluamos integrarlo.');
    else add('expediente', 1, 'Un expediente único reemplaza el papel y los archivos sueltos.');
    if (a2 !== 2) add('expediente', 1, 'Las fotos quedan ligadas a cada cita.');
    add('agenda', 1, 'La base para que todo lo demás se conecte.');
    if (a3 !== 2) {
      add('app', a5 === 1 ? 1 : 2, 'La relación sigue entre una cita y la siguiente.');
      add('rutina', a5 === 1 ? 1 : 2, 'La rutina indicada en consulta llega a su app.');
    }
    if (a4 !== 2) {
      add('inventario', a5 === 0 ? 1 : 2, 'Stock por lote y pedidos en un solo lugar.');
      add('tienda', 2, 'Los productos recomendados, sin salir de la app.');
    }
    if (a4 === 1) add('crm', 3, 'Tu tienda en línea puede convivir con la de la app.');
    add('cobros', a5 === 0 ? 1 : 2, 'Los cobros junto a la operación.');
    if (a5 === 2) {
      add('acta', 2, 'Del dictado al acta, el stock y la factura.');
      add('voz', 3, 'Instrucciones por voz que una persona confirma.');
    } else add('acta', 3, 'Menos digitación en cada consulta.');
    if (a5 === 3) {
      add('geo', 1, 'Primero medimos cómo te describen hoy.');
      add('mejoras', 2, 'Cambios verificables, medidos antes y después.');
    }
    add('facial', a5 === 1 ? 2 : 3, 'Un apoyo para explicar proporciones en consulta.');
    return rec;
  }

  function renderResult() {
    const rec = recommend();
    const stages = [1, 2, 3]
      .map((s) => {
        const items = [...rec.entries()].filter(([, v]) => v.stage === s);
        if (!items.length) return '';
        return `<div class="rec-stage"><h4>Etapa ${s}</h4>${items
          .map(([id, v]) => {
            const it = byId[id];
            return `<div class="rec-item"><div><strong>${esc(it.name)}</strong><p class="rec-why">${esc(v.why)}</p></div><div style="text-align:right"><span class="badge ${badgeClass[it.status]}">${services.status[it.status]}</span><p class="rec-price">Por cotizar</p></div></div>`;
          })
          .join('')}</div>`;
      })
      .join('');
    host.innerHTML = `<div class="quiz-step">
      <div class="quiz-top"><span>Tu recomendación</span><span>Listo</span></div>
      <div class="quiz-bar"><i style="transform:scaleX(1)"></i></div>
      <p class="quiz-q">Esto conviene primero en tu clínica.</p>
      <div class="rec">${stages}</div>
      <div class="quiz-nav"><button type="button" class="quiz-back" id="quizRestart">Volver a empezar</button><a class="btn btn-primary" href="#demo">Revisarlo en una demo <span class="arr" aria-hidden="true">→</span></a></div>
    </div>`;
    host.querySelector('#quizRestart').addEventListener('click', () => {
      answers.length = 0;
      idx = 0;
      renderQuestion();
      host.querySelector('.quiz-opt')?.focus();
    });
    ScrollTrigger.refresh();
  }

  function renderQuestion() {
    const Q = QUESTIONS[idx];
    host.innerHTML = `<div class="quiz-step">
      <div class="quiz-top"><span>Pregunta ${idx + 1} de ${QUESTIONS.length}</span><span>Sin precios</span></div>
      <div class="quiz-bar"><i style="transform:scaleX(${idx / QUESTIONS.length})"></i></div>
      <p class="quiz-q" id="quizQ">${esc(Q.q)}</p>
      <div class="quiz-opts" role="group" aria-labelledby="quizQ">${Q.o
        .map((o, k) => `<button type="button" class="quiz-opt" data-k="${k}" aria-pressed="${answers[idx] === k}">${esc(o)}</button>`)
        .join('')}</div>
      <div class="quiz-nav"><button type="button" class="quiz-back" id="quizBack"${idx === 0 ? ' hidden' : ''}>← Anterior</button></div>
    </div>`;
    host.querySelectorAll('.quiz-opt').forEach((b) =>
      b.addEventListener('click', () => {
        answers[idx] = Number(b.dataset.k);
        idx += 1;
        if (idx < QUESTIONS.length) {
          renderQuestion();
          host.querySelector('.quiz-opt')?.focus();
        } else {
          renderResult();
          host.querySelector('.quiz-back')?.focus();
        }
      })
    );
    host.querySelector('#quizBack').addEventListener('click', () => {
      idx = Math.max(0, idx - 1);
      renderQuestion();
      host.querySelector('.quiz-opt')?.focus();
    });
  }

  renderQuestion();
}

/* 7. Demo: URL de reserva desde VITE_BOOKING_URL */

function initBooking() {
  const url = import.meta.env.VITE_BOOKING_URL;
  const btn = document.getElementById('bookingBtn');
  if (url) {
    btn.href = url;
  } else {
    btn.parentElement.hidden = true;
    document.getElementById('bookingOff').hidden = false;
  }
}

/* 8. Inicialización */

initSoluciones();
initHistorias();
initSimulador();
initQuiz();
initBooking();

const telon = reduced ? null : createTelon({ gsap });
initNav({ telon, reduced });
initReveals({ reduced });
initHeroPin({ gsap, ScrollTrigger, heroConsole, heroPhone, reduced });
initComo({ gsap, ScrollTrigger, comoConsole, comoPhone, reduced });
initFeatures({ featConsole });
initPaciente({ gsap, ScrollTrigger, pacPhone, reduced });
initFaq({ gsap, ScrollTrigger, reduced });
initWave({ reduced });

if (!reduced) {
  initSectionEntrance({ gsap });
  initMagnetic({ gsap });
  initTilt({ gsap });
}

// Recalcular cuando cargan las fuentes y al terminar de cargar la página
document.fonts?.ready.then(() => ScrollTrigger.refresh());
window.addEventListener('load', () => ScrollTrigger.refresh());

// Si la página abre con un ancla, ir a ella después de montar
if (location.hash && location.hash.length > 1) {
  const target = document.querySelector(location.hash);
  if (target) requestAnimationFrame(() => setTimeout(() => getLenis()?.scrollTo(target, { offset: -60, immediate: true }), 60));
}
