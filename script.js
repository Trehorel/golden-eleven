const app = document.querySelector('#app');
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const load = (k, d) => JSON.parse(localStorage.getItem(k) || d);

let S = load('g11', 'null');   // carrière en cours
let H = load('g11h', '[]');    // panthéon
let B = load('g11b', '{}');    // badges débloqués
let Q = load('g11q', 'null');  // quêtes du jour
let view = 'home';

const save = () => localStorage.setItem('g11', JSON.stringify(S));
const saveQ = () => localStorage.setItem('g11q', JSON.stringify(Q));

const CLUBS = [
  { n: 'Académie de Saint-Brieuc', l: 55, f: '🇫🇷' }, { n: 'Angers SCO', l: 58, f: '🇫🇷' },
  { n: 'FC Lorient', l: 60, f: '🇫🇷' }, { n: 'Southampton', l: 62, f: '🇬🇧' },
  { n: 'Getafe', l: 63, f: '🇪🇸' }, { n: 'Genoa', l: 64, f: '🇮🇹' },
  { n: 'Stade Brestois', l: 65, f: '🇫🇷' }, { n: 'Stade Rennais', l: 66, f: '🇫🇷' },
  { n: 'Werder Brême', l: 67, f: '🇩🇪' }, { n: 'Villarreal', l: 68, f: '🇪🇸' },
  { n: 'Feyenoord', l: 69, f: '🇳🇱' }, { n: 'OGC Nice', l: 70, f: '🇫🇷' },
  { n: 'Benfica', l: 71, f: '🇵🇹' }, { n: 'Atalanta', l: 72, f: '🇮🇹' },
  { n: 'LOSC Lille', l: 73, f: '🇫🇷' }, { n: 'Olympique Lyonnais', l: 74, f: '🇫🇷' },
  { n: 'Ajax', l: 75, f: '🇳🇱' }, { n: 'Olympique de Marseille', l: 76, f: '🇫🇷' },
  { n: 'FC Porto', l: 77, f: '🇵🇹' }, { n: 'AS Monaco', l: 78, f: '🇫🇷' },
  { n: 'AC Milan', l: 79, f: '🇮🇹' }, { n: 'Tottenham', l: 80, f: '🇬🇧' },
  { n: 'Borussia Dortmund', l: 81, f: '🇩🇪' }, { n: 'Juventus', l: 82, f: '🇮🇹' },
  { n: 'Atlético de Madrid', l: 83, f: '🇪🇸' }, { n: 'Arsenal', l: 84, f: '🇬🇧' },
  { n: 'Inter Milan', l: 85, f: '🇮🇹' }, { n: 'Bayern Munich', l: 86, f: '🇩🇪' },
  { n: 'Chelsea', l: 87, f: '🇬🇧' }, { n: 'Manchester United', l: 88, f: '🇬🇧' },
  { n: 'FC Barcelone', l: 89, f: '🇪🇸' }, { n: 'Paris Saint-Germain', l: 90, f: '🇫🇷' },
  { n: 'Liverpool', l: 91, f: '🇬🇧' }, { n: 'Real Madrid', l: 92, f: '🇪🇸' },
  { n: 'Manchester City', l: 93, f: '🇬🇧' }
];
const POSTES = { ATT: 'Attaquant', MIL: 'Milieu', DEF: 'Défenseur', GAR: 'Gardien' };
const GOALS = { ATT: 0.5, MIL: 0.2, DEF: 0.06, GAR: 0 };
const ORIGINES = {
  'Quartier populaire': { o: 3, money: 0 },
  'Famille aisée': { o: 0, money: 5 },
  'Centre de formation': { o: 5, money: 1 }
};

// Événements : w = condition d'apparition ; effets : o niveau, r réputation, m moral, $ argent (M€)
const EVENTS = [
  { t: 'Un grand club vous observe lors d\'un match amical.', w: s => s.age < 22, c: [['Tout donner', { o: 2, r: 3, m: -5 }], ['Jouer collectif', { o: 1, r: 1, m: 5 }]] },
  { t: 'Blessure légère à l\'entraînement.', c: [['Se reposer', { m: 5 }], ['Reprendre vite', { o: 1, r: 2, m: -10 }]] },
  { t: 'Une marque de sport vous propose un contrat.', w: s => s.rep >= 25, c: [['Signer', { r: 4, $: 3 }], ['Refuser et se concentrer', { o: 2, m: 5 }]] },
  { t: 'Le coach propose un programme spécial.', c: [['Travailler dur', { o: 3, m: -5 }], ['Rester tranquille', { m: 8 }]] },
  { t: 'Polémique sur les réseaux sociaux.', w: s => s.rep >= 30, c: [['Répondre', { r: -2, m: -5 }], ['Ignorer', { m: 3 }]] },
  { t: 'Le capitaine vous confie le brassard.', w: s => CLUBS[s.club].l >= 60 && s.rep >= 40, c: [['Accepter', { r: 3, m: 5 }], ['Décliner', { o: 1 }]] },
  { t: 'Le sélectionneur vous appelle en équipe nationale.', w: s => s.rep >= 45, c: [['Répondre présent', { r: 4, o: 1, m: -5 }], ['Se ménager pour le club', { m: 5, o: 1 }]] },
  { t: 'Un coéquipier vous défie ouvertement dans le vestiaire.', w: s => CLUBS[s.club].l >= 60, c: [['Répondre sur le terrain', { o: 2, m: -3 }], ['Calmer le jeu', { m: 4, r: 1 }]] },
  { t: 'Un ancien de la maison vous prend sous son aile.', w: s => s.age < 22, c: [['Écouter ses conseils', { o: 3, m: 3 }], ['Suivre votre instinct', { r: 2, m: 2 }]] },
  { t: 'Un club du Golfe vous offre un salaire colossal.', w: s => s.age >= 28 && s.rep >= 60, c: [['Faire les valises', { $: 40, r: -3, m: 5 }], ['Rester pour la gloire', { r: 3, m: -2 }]] },
  { t: 'Examens de fin d\'année : le lycée ou le terrain ?', w: s => s.age < 19, c: [['Réviser sérieusement', { m: 5, o: -1 }], ['Tout miser sur le foot', { o: 2, m: -5 }]] },
  { t: 'Derby à haute tension : la ville entière vous attend.', w: s => CLUBS[s.club].l >= 70, c: [['Prendre le match à votre compte', { r: 3, m: -4 }], ['Rester discipliné', { o: 1, m: 3 }]] },
  { t: 'Finale de coupe en vue : la pression monte.', w: s => CLUBS[s.club].l >= 78, c: [['Visualiser la victoire', { o: 1, m: 6 }], ['S\'entraîner double', { o: 2, m: -8 }]] },
  { t: 'Votre carrière avance : pensez-vous à l\'après ?', w: s => s.age >= 31, c: [['Passer le diplôme d\'entraîneur', { m: 5, o: -1 }], ['Tout donner jusqu\'au bout', { o: 1, m: -5 }]] },
  { t: 'Un journaliste critique votre dernière prestation.', w: s => s.rep >= 35, c: [['L\'ignorer', { m: 3 }], ['Lui répondre en conférence', { r: 2, m: -4 }]] },
  { t: 'Trêve estivale : comment passez-vous vos vacances ?', c: [['Repos total', { m: 10 }], ['Stage physique intensif', { o: 2, m: -5 }]] },
  { t: 'Un nutritionniste propose de revoir votre alimentation.', c: [['Suivre son plan', { o: 1, m: 2 }], ['Garder vos habitudes', { m: 4 }]] },
  { t: 'Le club organise une journée avec les supporters.', w: s => s.rep >= 20, c: [['Signer des autographes', { r: 3, m: 3 }], ['Rester discret', { m: 5 }]] },
  { t: 'Blessure sérieuse : les médecins hésitent.', w: s => s.age >= 27, c: [['Opération rapide', { o: -2, m: -10 }], ['Rééducation longue', { o: -1, m: 5 }]] },
  { t: 'Un jeune talent arrive à votre poste.', w: s => s.age >= 29, c: [['Le coacher', { r: 2, m: 3 }], ['Le défier à l\'entraînement', { o: 2, m: -3 }]] },
  { t: 'Une vidéo de votre geste technique devient virale.', w: s => s.age < 24, c: [['Surfer sur la vague', { r: 5, m: -3 }], ['Rester concentré', { o: 1, m: 3 }]] },
  { t: 'Le nouvel entraîneur change de système de jeu.', c: [['S\'adapter vite', { o: 2, m: -3 }], ['Demander un rôle sur mesure', { r: 1, m: 3 }]] }
];

// Badges (à vie, toutes carrières confondues)
const BADGES = [
  { id: 't1', n: 'Premier titre', i: '🏆', d: 'Remporter un trophée', f: s => s.trophies.length >= 1 },
  { id: 't5', n: 'Collectionneur', i: '🗄️', d: '5 trophées en une carrière', f: s => s.trophies.length >= 5 },
  { id: 'eu', n: 'Le Graal', i: '⭐', d: 'Gagner la Coupe d\'Europe', f: s => s.trophies.some(t => t.t === 'Coupe d\'Europe') },
  { id: 'bd', n: 'Joueur d\'Or', i: '🥇', d: 'Gagner le Ballon d\'Or', f: s => s.bd >= 1 },
  { id: 'bd3', n: 'Immortel', i: '👑', d: '3 Ballons d\'Or', f: s => s.bd >= 3 },
  { id: 'g100', n: 'Centurion', i: '⚽', d: '100 buts en carrière', f: s => s.goals >= 100 },
  { id: 'o90', n: 'Élite mondiale', i: '💎', d: 'Atteindre 90 de niveau', f: s => s.ovr >= 90 },
  { id: 'tour', n: 'Globe-trotter', i: '🌍', d: 'Jouer dans 5 clubs', f: s => s.visited.length >= 5 },
  { id: 'rich', n: 'Millionnaire', i: '💰', d: 'Atteindre 200 M€', f: s => s.money >= 200 },
  { id: 'ret', n: 'Fin de carrière', i: '🎖️', d: 'Aller jusqu\'à la retraite', f: s => s.phase === 'end' }
];

// Quêtes du jour : 3 parmi 8, tirées selon la date
const QUESTS = [
  { id: 'g5', t: 'Marquer 5 buts', k: 'goals', n: 5, tk: 1 },
  { id: 'g12', t: 'Marquer 12 buts', k: 'goals', n: 12, tk: 2 },
  { id: 's3', t: 'Jouer 3 saisons', k: 'seasons', n: 3, tk: 1 },
  { id: 's6', t: 'Jouer 6 saisons', k: 'seasons', n: 6, tk: 2 },
  { id: 'e4', t: 'Faire 4 choix d\'événement', k: 'events', n: 4, tk: 1 },
  { id: 't1', t: 'Remporter un trophée', k: 'trophies', n: 1, tk: 2 },
  { id: 't2', t: 'Remporter 2 trophées', k: 'trophies', n: 2, tk: 3 },
  { id: 'tr', t: 'Réaliser un transfert', k: 'transfers', n: 1, tk: 2 }
];

function initQuests() {
  const day = new Date().toISOString().slice(0, 10);
  if (!Q || Q.day !== day) {
    Q = { day, p: { goals: 0, seasons: 0, events: 0, trophies: 0, transfers: 0 }, done: {}, tokens: Q ? Q.tokens : 0 };
    saveQ();
  }
}
const dailyQuests = () => {
  const h = [...Q.day].reduce((a, c) => a + c.charCodeAt(0), 0);
  return [0, 3, 5].map(d => QUESTS[(h + d) % QUESTS.length]);
};

function toast(m) {
  const d = document.createElement('div');
  d.className = 'toast'; d.textContent = m;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 3500);
}

function track(k, n = 1) {
  initQuests();
  Q.p[k] += n;
  dailyQuests().forEach(q => {
    if (!Q.done[q.id] && Q.p[q.k] >= q.n) {
      Q.done[q.id] = 1; Q.tokens += q.tk;
      toast(`🎯 Quête réussie : ${q.t} (+${q.tk} 💎)`);
    }
  });
  saveQ();
}

function checkBadges() {
  BADGES.forEach(b => {
    if (!B[b.id] && b.f(S)) {
      B[b.id] = 1;
      toast(`${b.i} Badge débloqué : ${b.n}`);
    }
  });
  localStorage.setItem('g11b', JSON.stringify(B));
}

function pickEvent() {
  const pool = EVENTS.map((e, i) => i).filter(i => (!EVENTS[i].w || EVENTS[i].w(S)) && !S.seen.slice(-6).includes(i));
  S.ev = pool[rnd(0, pool.length - 1)];
  S.seen.push(S.ev);
}

function newCareer(name, pos, origin) {
  const o = ORIGINES[origin];
  S = {
    name, pos, origin, age: 16, ovr: 50 + o.o, rep: 10, mor: 60, money: o.money,
    club: 0, v2: 1, goals: 0, bd: 0, trophies: [], phase: 'event', ev: 0, seen: [], visited: [0],
    last: null, offer: null, peak: 50 + o.o
  };
  pickEvent(); save(); go('career');
}

function chooseEvent(i) {
  const fx = EVENTS[S.ev].c[i][1];
  S.ovr = clamp(S.ovr + (fx.o || 0), 30, 99);
  S.rep = clamp(S.rep + (fx.r || 0), 0, 100);
  S.mor = clamp(S.mor + (fx.m || 0), 0, 100);
  S.money += fx.$ || 0;
  track('events');
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

  // Offre de transfert : un club plus fort (jusqu'à +10 de niveau), plafonné par la réputation
  const cur = c.l;
  const cand = CLUBS.map((x, i) => i).filter(i => CLUBS[i].l > cur && CLUBS[i].l <= Math.min(cur + 10, 55 + S.rep * 0.42));
  S.offer = cand.length && Math.random() < 0.6 ? cand[rnd(0, cand.length - 1)] : null;

  S.last = { perf, g, out };
  S.phase = 'result';
  track('seasons'); track('goals', g); track('trophies', out.filter(o => !o.includes('Ballon')).length);
  checkBadges(); save(); render();
}

function transfer(accept) {
  if (accept) {
    S.club = S.offer;
    if (!S.visited.includes(S.club)) S.visited.push(S.club);
    track('transfers');
  }
  S.offer = null;
  checkBadges(); save(); nextSeason();
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
    checkBadges();
  } else {
    S.phase = 'event'; S.last = null; pickEvent();
  }
  save(); render();
}

const bar = (label, v) => `<div class="stat">${label} : ${Math.round(v)}<div class="bar"><i style="width:${v}%"></i></div></div>`;

const statsCard = () => `
  <div class="card">
    <h2>${S.name} <span class="muted" style="font-size:16px">${POSTES[S.pos]} · ${S.age} ans</span></h2>
    <p class="muted">${CLUBS[S.club].f} ${CLUBS[S.club].n} · ${S.money} M€ · ${S.goals} buts · ${S.bd} Ballon(s) d'Or</p>
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
        ? `<p>📩 <b>${CLUBS[S.offer].f} ${CLUBS[S.offer].n}</b> te propose un contrat !</p><div class="choices">
           <button onclick="transfer(true)">Accepter le transfert</button>
           <button onclick="transfer(false)">Rester à ${CLUBS[S.club].n}</button></div>`
        : `<button onclick="nextSeason()">Saison suivante</button>`}</div>`;
  },

  quests: () => {
    initQuests();
    return `<h2>Quêtes du jour</h2>
      <p class="muted" style="margin-bottom:16px">Nouvelles quêtes chaque jour · Jetons : <b>${Q.tokens} 💎</b></p>` +
      dailyQuests().map(q => {
        const p = Math.min(Q.p[q.k], q.n);
        return `<div class="card quest ${Q.done[q.id] ? 'done' : ''}"><div style="flex:1">
          <b>${Q.done[q.id] ? '✅ ' : '🎯 '}${q.t}</b> <span class="muted">· +${q.tk} 💎</span>
          <div class="bar"><i style="width:${p / q.n * 100}%"></i></div></div>
          <span class="muted">${p}/${q.n}</span></div>`;
      }).join('');
  },

  trophies: () => `<h2>Badges</h2><div class="badges">${BADGES.map(b => `
      <div class="badge ${B[b.id] ? '' : 'off'}"><div class="ic">${b.i}</div><b>${b.n}</b><small>${b.d}</small></div>`).join('')}</div>
    <h2>Armoire à trophées</h2>` + (S && S.trophies.length
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

// Compatibilité avec les anciennes sauvegardes
if (S) { S.seen = S.seen || []; S.visited = S.visited || [S.club]; }

// Migration : l'ancienne liste de 7 clubs vers la nouvelle liste de 34
if (S && !S.v2) {
  const OLD = ['Académie de Saint-Brieuc', 'Stade Brestois', 'Olympique Lyonnais', 'AS Monaco', 'Arsenal', 'FC Barcelone', 'Real Madrid'];
  const m = i => CLUBS.findIndex(c => c.n === OLD[i]);
  S.club = m(S.club); S.visited = S.visited.map(m); S.offer = null; S.v2 = 1; save();
}

initQuests();
render();
