const app = document.querySelector('#app');
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const load = (k, d) => JSON.parse(localStorage.getItem(k) || d);

let S = load('g11', 'null');   // carrière en cours
let H = load('g11h', '[]');    // panthéon
let view = 'home';

const save = () => localStorage.setItem('g11', JSON.stringify(S));

const CLUBS = [
  { n: 'Académie de Saint-Brieuc', l: 55 }, { n: 'Stade Brestois', l: 65 },
  { n: 'Olympique Lyonnais', l: 74 }, { n: 'AS Monaco', l: 78 },
  { n: 'Arsenal', l: 84 }, { n: 'FC Barcelone', l: 89 }, { n: 'Real Madrid', l: 92 }
];
const POSTES = { ATT: 'Attaquant', MIL: 'Milieu', DEF: 'Défenseur', GAR: 'Gardien' };
const GOALS = { ATT: 0.5, MIL: 0.2, DEF: 0.06, GAR: 0 };
const ORIGINES = {
  'Quartier populaire': { o: 3, money: 0 },
  'Famille aisée': { o: 0, money: 5 },
  'Centre de formation': { o: 5, money: 1 }
};

// Événements : [libellé, { o: niveau, r: réputation, m: moral }]
const EVENTS = [
  { t: 'Un grand club vous observe lors d\'un match amical.', c: [['Tout donner', { o: 2, r: 3, m: -5 }], ['Jouer collectif', { o: 1, r: 1, m: 5 }]] },
  { t: 'Blessure légère à l\'entraînement.', c: [['Se reposer', { m: 5 }], ['Reprendre vite', { o: 1, r: 2, m: -10 }]] },
  { t: 'Une marque de sport vous propose un contrat.', c: [['Signer', { r: 4 }], ['Refuser et se concentrer', { o: 2, m: 5 }]] },
  { t: 'Le coach propose un programme spécial.', c: [['Travailler dur', { o: 3, m: -5 }], ['Rester tranquille', { m: 8 }]] },
  { t: 'Polémique sur les réseaux sociaux.', c: [['Répondre', { r: -2, m: -5 }], ['Ignorer', { m: 3 }]] },
  { t: 'Le capitaine vous confie le brassard.', c: [['Accepter', { r: 3, m: 5 }], ['Décliner', { o: 1 }]] }
];

function newCareer(name, pos, origin) {
  const o = ORIGINES[origin];
  S = {
    name, pos, origin, age: 16, ovr: 50 + o.o, rep: 10, mor: 60, money: o.money,
    club: 0, goals: 0, bd: 0, trophies: [], phase: 'event',
    ev: rnd(0, EVENTS.length - 1), last: null, offer: null, peak: 50 + o.o
  };
  save(); go('career');
}

function chooseEvent(i) {
  const fx = EVENTS[S.ev].c[i][1];
  S.ovr = clamp(S.ovr + (fx.o || 0), 30, 99);
  S.rep = clamp(S.rep + (fx.r || 0), 0, 100);
  S.mor = clamp(S.mor + (fx.m || 0), 0, 100);
  playSeason();
}

function playSeason() {
  const c = CLUBS[S.club], out = [];
  const perf = Math.round(S.ovr + (S.mor - 50) / 10 + rnd(-6, 6));
  const g = Math.max(0, Math.round(GOALS[S.pos] * (perf - 40) / 2 + rnd(-3, 3)));
  const win = c.l + rnd(-12, 12) + (perf - 70) / 4;
  S.goals += g;
  if (win > 85) { S.trophies.push({ age: S.age, t: 'Championnat', c: c.n }); out.push('🏆 Champion avec ' + c.n); }
  if (c.l >= 74 && win > 95) { S.trophies.push({ age: S.age, t: 'Coupe d\'Europe', c: c.n }); out.push('⭐ Coupe d\'Europe remportée'); }
  if (perf >= 92 && S.rep >= 60 && Math.random() < 0.6) { S.bd++; S.trophies.push({ age: S.age, t: 'Ballon d\'Or', c: c.n }); out.push('🥇 Ballon d\'Or !'); }
  S.rep = clamp(S.rep + Math.round((perf - 70) / 6) + out.length * 3, 0, 100);
  S.money += Math.round(c.l / 6 * (1 + S.rep / 100));
  S.peak = Math.max(S.peak, S.ovr);
  S.offer = (S.rep > (S.club + 1) * 14 && S.club < CLUBS.length - 1) ? S.club + 1 : null;
  S.last = { perf, g, out };
  S.phase = 'result';
  save(); render();
}

function transfer(accept) {
  if (accept) S.club = S.offer;
  S.offer = null;
  save(); nextSeason();
}

function nextSeason() {
  S.age++;
  if (S.age < 24) S.ovr += rnd(2, 5);
  else if (S.age <= 28) S.ovr += rnd(0, 2);
  else if (S.age >= 31) S.ovr -= rnd(1, 3);
  S.ovr = clamp(S.ovr, 30, 99);
  if (S.age >= 35) {
    S.phase = 'end';
    H.unshift({ name: S.name, pos: S.pos, goals: S.goals, bd: S.bd, trophies: S.trophies.length, peak: S.peak, club: CLUBS[S.club].n });
    localStorage.setItem('g11h', JSON.stringify(H));
  } else {
    S.phase = 'event'; S.ev = rnd(0, EVENTS.length - 1); S.last = null;
  }
  save(); render();
}

const bar = (label, v) => `<div class="stat">${label} : ${Math.round(v)}<div class="bar"><i style="width:${v}%"></i></div></div>`;

const statsCard = () => `
  <div class="card">
    <h2>${S.name} <span class="muted" style="font-size:16px">${POSTES[S.pos]} · ${S.age} ans</span></h2>
    <p class="muted">${CLUBS[S.club].n} · ${S.money} M€ · ${S.goals} buts · ${S.bd} Ballon(s) d'Or</p>
    ${bar('Niveau', S.ovr)}${bar('Réputation', S.rep)}${bar('Moral', S.mor)}
  </div>`;

const views = {
  home: () => `
    <section class="hero">
      <h1>Écris ta <span>légende</span></h1>
      <p>De 16 ans à la retraite, chaque choix compte. Transferts, titres, Ballon d'Or : personne ne connaît son destin.</p>
      <button onclick="go('${S && S.phase !== 'end' ? 'career' : 'create'}')">${S && S.phase !== 'end' ? 'Continuer ma carrière' : 'Commencer ma carrière'}</button>
    </section>`,

  create: () => `
    <div class="card">
      <h2>Crée ton joueur</h2>
      <label>Nom</label><input id="nm" placeholder="Ton nom de joueur" maxlength="20">
      <label>Poste</label><select id="ps">${Object.entries(POSTES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
      <label>Origine</label><select id="og">${Object.keys(ORIGINES).map(k => `<option>${k}</option>`).join('')}</select>
      <br><br><button onclick="newCareer(nm.value.trim() || 'Joueur', ps.value, og.value)">Signer mon premier contrat</button>
    </div>`,

  career: () => {
    if (!S) return views.home();
    if (S.phase === 'end') return statsCard() + `
      <div class="card"><h2>Retraite</h2>
      <p>Pic de niveau : <b>${S.peak}</b> · ${S.trophies.length} trophées · ${S.bd} Ballon(s) d'Or.</p>
      <p class="muted">Ta légende est entrée au Panthéon.</p><br>
      <button onclick="go('create')">Rejouer une carrière</button></div>`;
    if (S.phase === 'event') {
      const e = EVENTS[S.ev];
      return statsCard() + `<div class="card"><h2>Saison ${S.age - 15}</h2><p>${e.t}</p>
        <div class="choices">${e.c.map((c, i) => `<button onclick="chooseEvent(${i})">${c[0]}</button>`).join('')}</div></div>`;
    }
    const L = S.last;
    return statsCard() + `<div class="card"><h2>Bilan de saison</h2>
      <div class="big">${L.perf}</div><p class="muted">note de performance · ${L.g} buts</p>
      ${L.out.map(o => `<span class="tag">${o}</span>`).join('') || '<p class="muted">Pas de trophée cette saison.</p>'}
      <br><br>${S.offer !== null
        ? `<p>📩 <b>${CLUBS[S.offer].n}</b> te propose un contrat !</p><div class="choices">
           <button onclick="transfer(true)">Accepter le transfert</button>
           <button onclick="transfer(false)">Rester à ${CLUBS[S.club].n}</button></div>`
        : `<button onclick="nextSeason()">Saison suivante</button>`}</div>`;
  },

  trophies: () => `<h2>Palmarès</h2>` + (S && S.trophies.length
    ? S.trophies.map(t => `<div class="card">🏆 <b>${t.t}</b> <span class="muted">· ${t.c} · à ${t.age} ans</span></div>`).join('')
    : '<div class="card muted">Aucun trophée pour le moment. Continue ta carrière !</div>'),

  pantheon: () => `<h2>Panthéon</h2>` + (H.length
    ? H.map(h => `<div class="card"><b>${h.name}</b> <span class="muted">· ${POSTES[h.pos]} · ${h.club}</span>
        <p class="muted">Pic ${h.peak} · ${h.goals} buts · ${h.trophies} trophées · ${h.bd} Ballon(s) d'Or</p></div>`).join('')
    : '<div class="card muted">Les légendes que tu auras écrites apparaîtront ici.</div>')
};

function render() {
  app.innerHTML = views[view]();
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.v === view));
}
function go(v) { view = v; render(); window.scrollTo(0, 0); }

document.querySelectorAll('nav button').forEach(b => b.onclick = () => go(b.dataset.v));

const themes = ['golden', 'pitch'];
const setTheme = t => { document.documentElement.dataset.theme = t; localStorage.setItem('g11t', t); };
document.querySelector('#theme').onclick = () =>
  setTheme(themes[(themes.indexOf(document.documentElement.dataset.theme) + 1) % 2]);
setTheme(localStorage.getItem('g11t') || 'golden');

render();
