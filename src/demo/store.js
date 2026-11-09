/* Estado ficticio compartido entre consola, app del paciente y simulador.
   Todos los nombres son inventados y los montos son tarifas de ejemplo. */

const CLINIC = 'Clínica Ejemplo';

const TREATMENTS = [
  { id: 'tox', name: 'Toxina botulínica', zone: 'Frente y entrecejo', sessions: 1, fee: 280 },
  { id: 'bio', name: 'Bioestimulador de colágeno', zone: 'Pómulos y mandíbula', sessions: 3, fee: 420 },
  { id: 'ah', name: 'Ácido hialurónico', zone: 'Labios', sessions: 1, fee: 350 },
  { id: 'peel', name: 'Peeling químico suave', zone: 'Rostro completo', sessions: 4, fee: 95 },
  { id: 'ipl', name: 'Luz pulsada intensa', zone: 'Manchas y rojeces', sessions: 3, fee: 160 },
  { id: 'hid', name: 'Hidratación profunda', zone: 'Rostro y cuello', sessions: 4, fee: 70 }
];

const PRODUCTS = [
  { id: 'vitc', name: 'Sérum vitamina C', size: '30 ml', fee: 48, stock: 18, lot: 'L-2611' },
  { id: 'spf', name: 'Protector solar SPF 50', size: '50 ml', fee: 32, stock: 24, lot: 'L-2604' },
  { id: 'clean', name: 'Limpiador suave', size: '150 ml', fee: 22, stock: 9, lot: 'L-2598' },
  { id: 'ret', name: 'Crema retinol nocturna', size: '30 ml', fee: 56, stock: 6, lot: 'L-2615' },
  { id: 'eye', name: 'Contorno de ojos', size: '15 ml', fee: 38, stock: 12, lot: 'L-2602' },
  { id: 'hyal', name: 'Hidratante con ácido hialurónico', size: '50 ml', fee: 41, stock: 15, lot: 'L-2609' }
];

const PATIENTS = [
  { id: 'vm', name: 'Valeria Méndez', initials: 'VM', age: 38, last: 'Hace 3 semanas', glow: 84 },
  { id: 'la', name: 'Lucía Arce', initials: 'LA', age: 45, last: 'Hace 2 meses', glow: 77 },
  { id: 'cr', name: 'Camila Rojas', initials: 'CR', age: 31, last: 'Hace 5 días', glow: 88 },
  { id: 'sb', name: 'Sofía Brenes', initials: 'SB', age: 52, last: 'Hace 1 mes', glow: 72 },
  { id: 'dm', name: 'Daniela Mora', initials: 'DM', age: 29, last: 'Hace 6 semanas', glow: 90 },
  { id: 'as', name: 'Andrea Solís', initials: 'AS', age: 41, last: 'Hace 4 meses', glow: 79 }
];

const TODAY = [
  { t: '09:00', who: 'Lucía Arce', what: 'Valoración facial', state: 'Atendida' },
  { t: '10:30', who: 'Valeria Méndez', what: 'Bioestimulador · sesión 2', state: 'En sala' },
  { t: '12:00', who: 'Camila Rojas', what: 'Toxina botulínica', state: 'Confirmada' },
  { t: '15:00', who: 'Sofía Brenes', what: 'Peeling químico suave', state: 'Desde la app' },
  { t: '16:30', who: 'Daniela Mora', what: 'Control', state: 'Confirmada' }
];

const WEEK_SALES = [6, 9, 7, 11, 8, 13, 10];

const ROUTINE = {
  manana: [
    { p: 'clean', how: 'Rostro húmedo, 30 segundos' },
    { p: 'vitc', how: '3 gotas sobre la piel seca' },
    { p: 'spf', how: 'Cada 3 horas si sales' }
  ],
  noche: [
    { p: 'clean', how: 'Retira el protector primero' },
    { p: 'ret', how: 'Una capa fina, 3 noches por semana' },
    { p: 'eye', how: 'Toques suaves, sin arrastrar' }
  ]
};

const INVOICES = [
  { n: 'F-0148', who: 'Valeria Méndez', what: 'Bioestimulador · sesión 1', fee: 420, state: 'Pagada' },
  { n: 'F-0147', who: 'Camila Rojas', what: 'Sérum vitamina C', fee: 48, state: 'Pagada' },
  { n: 'F-0146', who: 'Lucía Arce', what: 'Valoración facial', fee: 60, state: 'Pendiente' },
  { n: 'F-0145', who: 'Sofía Brenes', what: 'Peeling químico suave', fee: 95, state: 'Pagada' },
  { n: 'F-0144', who: 'Daniela Mora', what: 'Hidratación profunda', fee: 70, state: 'Pagada' }
];

function initial() {
  return {
    activePatient: 'vm',
    products: PRODUCTS.map((p) => ({ ...p })),
    plan: [{ tid: 'bio', done: 1, total: 3, date: '12 nov', isNew: false }],
    orders: [
      { id: 'P-031', who: 'Valeria Méndez', pid: 'vitc', qty: 1, when: 'Hoy 08:42', state: 'Nuevo', isNew: true },
      { id: 'P-030', who: 'Lucía Arce', pid: 'spf', qty: 2, when: 'Ayer', state: 'Entregado', isNew: false },
      { id: 'P-029', who: 'Camila Rojas', pid: 'hyal', qty: 1, when: 'Lun', state: 'Entregado', isNew: false }
    ],
    soldWeek: 21,
    log: []
  };
}

let state = initial();
const listeners = new Set();
let orderSeq = 32;

function emit(action) {
  listeners.forEach((fn) => fn(state, action));
}

export const store = {
  CLINIC,
  TREATMENTS,
  PATIENTS,
  TODAY,
  WEEK_SALES,
  ROUTINE,
  INVOICES,
  get state() {
    return state;
  },
  product(id) {
    return state.products.find((p) => p.id === id);
  },
  treatment(id) {
    return TREATMENTS.find((t) => t.id === id);
  },
  patient(id = state.activePatient) {
    return PATIENTS.find((p) => p.id === id);
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  prescribe(tid) {
    const t = this.treatment(tid);
    if (!t) return;
    state.plan.forEach((p) => (p.isNew = false));
    const existing = state.plan.find((p) => p.tid === tid);
    if (existing) {
      existing.total += t.sessions;
      existing.isNew = true;
    } else {
      state.plan.unshift({ tid, done: 0, total: t.sessions, date: 'Por agendar', isNew: true });
    }
    const pac = this.patient();
    const line = `Consola: prescribiste ${t.name} a ${pac.name}. En su app aparece en Citas y tratamientos.`;
    state.log.unshift(line);
    emit({ type: 'prescribe', tid, line });
  },
  buy(pid) {
    const p = this.product(pid);
    if (!p || p.stock <= 0) return;
    p.stock -= 1;
    state.soldWeek += 1;
    state.orders.forEach((o) => (o.isNew = false));
    const pac = this.patient();
    const id = `P-0${orderSeq++}`;
    state.orders.unshift({ id, who: pac.name, pid, qty: 1, when: 'Ahora', state: 'Nuevo', isNew: true });
    const line = `App: ${pac.name} pidió ${p.name}. Llegó a Inventario › Pedidos de la app y el stock bajó a ${p.stock}.`;
    state.log.unshift(line);
    emit({ type: 'buy', pid, line });
  },
  reset() {
    state = initial();
    orderSeq = 32;
    emit({ type: 'reset' });
  }
};

/* Formato de montos de ejemplo */
export const fee = (n) => `$${n.toLocaleString('es-CR')}`;

/* Escapa texto para innerHTML */
export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
