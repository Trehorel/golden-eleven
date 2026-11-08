const app = document.querySelector('#app');
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || d); } catch (e) { return JSON.parse(d); } };

let S = load('g11', 'null');   // carrière en cours
let H = load('g11h', '[]');    // panthéon
let B = load('g11b', '{}');    // badges débloqués
let Q = load('g11q', 'null');  // quêtes du jour
let C = null;                  // création du joueur en cours
let view = 'home';

const save = () => localStorage.setItem('g11', JSON.stringify(S));
const saveQ = () => localStorage.setItem('g11q', JSON.stringify(Q));

// ---------- Clubs et divisions réels (données de ligues.js) ----------
const _seen = new Set(), _lv = {};
D.forEach(d => d.cl.forEach(c => { if (!(c.n in _lv)) _lv[c.n] = c.l; }));
const CDIV = D.map(d => ({
  id: d.id, n: d.n, c: d.c, f: d.f, t: d.t, ucl: d.ucl || 0, uel: d.uel || 0,
  names: d.cl.filter(c => !_seen.has(c.n) && _seen.add(c.n)).map(c => c.n)
}));
const CLUBS = CDIV.flatMap(d => d.names.map(n => ({ n, l: _lv[n], f: d.f, c: d.c }))).sort((a, b) => a.l - b.l);
const memInit = () => Object.fromEntries(CDIV.map(d => [d.id, [...d.names]]));
const divOf = n => CDIV.find(d => S.mem[d.id].includes(n)) || CDIV[0];
const divInit = n => CDIV.find(d => d.names.includes(n)).n;

let _eff = 0;   // niveau effectif de ton club cette saison
const cLv = n => (S && CLUBS[S.club] && n === CLUBS[S.club].n) ? _eff : (_lv[n] ?? 55);
const cSim = (a, b) => {
  const d = (a - b + 3) / 16;
  return [Math.max(0, Math.round(1.35 + d + rnd(-9, 11) / 10)), Math.max(0, Math.round(1.35 - d + rnd(-9, 11) / 10))];
};
// Classement d'une division (championnat aller-retour simulé)
function cRank(names) {
  const tab = {};
  names.forEach(n => tab[n] = { pts: 0, gf: 0, ga: 0 });
  for (let i = 0; i < names.length; i++) for (let j = 0; j < names.length; j++) if (i !== j) {
    const [x, y] = cSim(cLv(names[i]), cLv(names[j])), a = tab[names[i]], b = tab[names[j]];
    a.gf += x; a.ga += y; b.gf += y; b.ga += x;
    if (x > y) a.pts += 3; else if (x < y) b.pts += 3; else { a.pts++; b.pts++; }
  }
  return [...names].sort((p, q) => tab[q].pts - tab[p].pts || (tab[q].gf - tab[q].ga) - (tab[p].gf - tab[p].ga) || tab[q].gf - tab[p].gf);
}
const cKO = a => {
  a = [...a].sort(() => Math.random() - 0.5);
  const w = [];
  for (let i = 0; i + 1 < a.length; i += 2) { const [x, y] = cSim(cLv(a[i]), cLv(a[i + 1])); w.push(x > y || (x === y && Math.random() < 0.5) ? a[i] : a[i + 1]); }
  if (a.length % 2) w.push(a[a.length - 1]);
  return w;
};

// ---------- Création du joueur : nationalité, origine, adolescence, entourage, rêve ----------
const POSTES = { ATT: 'Attaquant', MIL: 'Milieu', DEF: 'Défenseur', GAR: 'Gardien' };
const GOALS = { ATT: 0.5, MIL: 0.2, DEF: 0.06, GAR: 0 };

// c = code du pays si ses clubs sont dans le jeu ; fx : o niveau, r réputation, m moral, $ argent (M€)
const NATS = [
  { n: 'France', f: '🇫🇷', c: 'FR', d: 'Rigueur et formation', fx: { o: 1 } },
  { n: 'Angleterre', f: '🇬🇧', c: 'EN', d: 'Intensité et mental', fx: { m: 3 } },
  { n: 'Espagne', f: '🇪🇸', c: 'ES', d: 'Technique et jeu de passes', fx: { o: 1 } },
  { n: 'Italie', f: '🇮🇹', c: 'IT', d: 'Sens tactique', fx: { m: 2, o: 1 } },
  { n: 'Allemagne', f: '🇩🇪', c: 'DE', d: 'Discipline et efficacité', fx: { o: 1, m: 1 } },
  { n: 'Portugal', f: '🇵🇹', c: 'PT', d: 'Talent et élégance', fx: { r: 2 } },
  { n: 'Pays-Bas', f: '🇳🇱', c: null, d: 'École de football totale', fx: { o: 1 } },
  { n: 'Belgique', f: '🇧🇪', c: null, d: 'Génération dorée', fx: { r: 1, o: 1 } },
  { n: 'Brésil', f: '🇧🇷', c: null, d: 'Le football dans le sang', fx: { o: 2, m: -1 } },
  { n: 'Argentine', f: '🇦🇷', c: null, d: 'Fierté et caractère', fx: { o: 1, m: 2 } },
  { n: 'Maroc', f: '🇲🇦', c: null, d: 'Passion et ferveur', fx: { m: 3 } },
  { n: 'Sénégal', f: '🇸🇳', c: null, d: 'Puissance et vitesse', fx: { o: 2 } },
  { n: 'Côte d\'Ivoire', f: '🇨🇮', c: null, d: 'Explosivité', fx: { o: 2 } },
  { n: 'Nigeria', f: '🇳🇬', c: null, d: 'Énergie et audace', fx: { o: 1, r: 1 } },
  { n: 'Croatie', f: '🇭🇷', c: null, d: 'Mental de vainqueur', fx: { m: 3 } },
  { n: 'Japon', f: '🇯🇵', c: null, d: 'Travail et précision', fx: { o: 1, m: 2 } }
];
const ORIGINES = [
  { n: 'Quartier populaire', d: 'Tu as grandi en jouant dans la rue', fx: { o: 3 } },
  { n: 'Famille aisée', d: 'Tout t\'a été facilité', fx: { $: 5 } },
  { n: 'Centre de formation', d: 'Le foot dès le plus jeune âge', fx: { o: 4, $: 1 } },
  { n: 'Petit village', d: 'Loin des projecteurs, près de la nature', fx: { m: 5, o: 1 } },
  { n: 'Famille de footballeurs', d: 'Le foot dans le sang', fx: { o: 2, r: 3 } }
];
const TEENS = [
  { n: 'Études sérieuses', d: 'Le bac d\'abord, le foot ensuite', fx: { m: 5, o: -1 } },
  { n: 'Tout pour le foot', d: 'Entraînement matin et soir', fx: { o: 3, m: -4 } },
  { n: 'Vie sociale', d: 'Amis, sorties et bonne humeur', fx: { m: 4, r: 2, o: -1 } },
  { n: 'Petits boulots', d: 'Tu travailles pour aider ta famille', fx: { m: 2, $: 2 } },
  { n: 'Académie à l\'étranger', d: 'Tu pars très jeune pour progresser', fx: { o: 3, r: 2, m: -3 } }
];
const CIRCLES = [
  { n: 'Famille soudée', d: 'Un soutien de chaque instant', fx: { m: 8 } },
  { n: 'Agent ambitieux', d: 'Il ouvre des portes, mais veut sa part', fx: { r: 5, $: 2, m: -2 } },
  { n: 'Mentor ancien pro', d: 'Il t\'apprend les secrets du métier', fx: { o: 3, r: 1 } },
  { n: 'Amis du quartier', d: 'Ils croient en toi depuis toujours', fx: { m: 4, r: 1 } },
  { n: 'Seul contre tous', d: 'Tu ne comptes que sur toi', fx: { o: 2, m: -4 } }
];
const DREAMS = [
  { n: 'Gagner le Ballon d\'Or', d: 'Être le meilleur joueur du monde', fx: { m: 3 }, f: s => s.bd >= 1 },
  { n: 'Soulever la Ligue des champions', d: 'La plus belle des coupes', fx: { o: 1, m: 1 }, f: s => s.trophies.some(t => t.t === 'Ligue des champions') },
  { n: 'Jouer dans un club mythique', d: 'Porter le maillot d\'un géant', fx: { r: 2 }, f: s => CLUBS[s.club].l >= 88 },
  { n: 'Devenir millionnaire', d: 'Offrir une vie meilleure aux tiens', fx: { m: 2, $: 1 }, f: s => s.money >= 200 },
  { n: 'Devenir une légende', d: 'Atteindre le sommet : 90 de niveau', fx: { m: 3 }, f: s => s.peak >= 90 }
];
const STEPS = [
  { k: 'origin', t: 'Ton origine', q: 'D\'où viens-tu, avant les projecteurs du foot ?', o: ORIGINES },
  { k: 'teen', t: 'Ton adolescence', q: 'Comment as-tu vécu ton adolescence ?', o: TEENS },
  { k: 'circle', t: 'Ton entourage', q: 'Qui t\'entoure sur ta route ?', o: CIRCLES },
  { k: 'dream', t: 'Ton rêve de gosse', q: 'Quel est ton plus grand rêve ?', o: DREAMS }
];

// Total des bonus de départ selon tous les choix
function cBase() {
  const t = { o: 0, r: 0, m: 0, $: 0 };
  [NATS[C.nat], ...STEPS.map(s => s.o[C[s.k]])].forEach(x => { for (const k in t) t[k] += (x.fx[k] || 0); });
  return t;
}
// Clubs qui ont repéré le joueur : 4 clubs adaptés à son niveau, ceux de son pays en priorité
function cScout() {
  const ovr = 50 + cBase().o, nc = NATS[C.nat].c;
  let pool = CLUBS.map((c, i) => i).filter(i => CLUBS[i].l <= ovr + 10);
  if (pool.length < 4) pool = CLUBS.map((c, i) => i).slice(0, 8);
  pool.sort(() => Math.random() - 0.5);
  C.clubs = [...pool.filter(i => CLUBS[i].c === nc).slice(0, 2), ...pool.filter(i => CLUBS[i].c !== nc)].slice(0, 4);
}
function cNext() {
  C.name = document.getElementById('nm').value.trim() || 'Joueur';
  C.nat = parseInt(document.getElementById('nt').value, 10);
  C.pos = document.getElementById('ps').value;
  C.step = 1; render();
}
function cPick(i) {
  C[STEPS[C.step - 1].k] = i;
  C.step++;
  if (C.step === STEPS.length + 1) cScout();
  render();
}
function cBack() { C.step = Math.max(0, C.step - 1); render(); }

function newCareer(club) {
  const b = cBase(), p = STEPS.map(s => s.o[C[s.k]].n), ovr = clamp(50 + b.o, 35, 70);
  S = {
    name: C.name, pos: C.pos, nat: C.nat, dream: C.dream, prof: p, origin: p[0],
    age: 16, ovr, rep: clamp(10 + b.r, 0, 100), mor: clamp(60 + b.m, 0, 100), money: Math.max(0, b.$),
    club, v5: 1, mem: memInit(), qual: null, rank: 0,
    goals: 0, bd: 0, trophies: [], phase: 'event', ev: 0, seen: [], visited: [club],
    last: null, offers: [], peak: ovr
  };
  C = null; pickEvent(); save(); go('career');
}

// ---------- Événements ----------
// w = condition d'apparition ; effets : o niveau, r réputation, m moral, $ argent (M€)
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
  { id: 'eu', n: 'Le Graal', i: '⭐', d: 'Gagner une coupe d\'Europe', f: s => s.trophies.some(t => t.t === 'Ligue des champions' || t.t === 'Ligue Europa') },
  { id: 'bd', n: 'Joueur d\'Or', i: '🥇', d: 'Gagner le Ballon d\'Or', f: s => s.bd >= 1 },
  { id: 'bd3', n: 'Immortel', i: '👑', d: '3 Ballons d\'Or', f: s => s.bd >= 3 },
  { id: 'g100', n: 'Centurion', i: '⚽', d: '100 buts en carrière', f: s => s.goals >= 100 },
  { id: 'o90', n: 'Élite mondiale', i: '💎', d: 'Atteindre 90 de niveau', f: s => s.ovr >= 90 },
  { id: 'tour', n: 'Globe-trotter', i: '🌍', d: 'Jouer dans 5 clubs', f: s => s.visited.length >= 5 },
  { id: 'rich', n: 'Millionnaire', i: '💰', d: 'Atteindre 200 M€', f: s => s.money >= 200 },
  { id: 'ret', n: 'Fin de carrière', i: '🎖️', d: 'Prendre sa retraite', f: s => s.phase === 'end' }
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
  // Rêve de gosse accompli
  if (S.dream !== undefined && DREAMS[S.dream] && !S.dreamOk && DREAMS[S.dream].f(S)) {
    S.dreamOk = 1; S.rep = clamp(S.rep + 10, 0, 100);
    initQuests(); Q.tokens += 5; saveQ();
    toast('✨ Rêve de gosse accompli : ' + DREAMS[S.dream].n + ' (+5 💎)');
  }
}

function pickEvent() {
  const ok = EVENTS.map((e, i) => i).filter(i => !EVENTS[i].w || EVENTS[i].w(S));
  let pool = ok.filter(i => !S.seen.slice(-3).includes(i));
  if (!pool.length) pool = ok;
  S.ev = pool[rnd(0, pool.length - 1)];
  S.seen.push(S.ev);
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
  const c = CLUBS[S.club], me = c.n, out = [], t0 = S.trophies.length;
  const perf = Math.round(S.ovr + (S.mor - 50) / 10 + rnd(-6, 6));
  const g = Math.max(0, Math.round(GOALS[S.pos] * (perf - 40) / 2 + rnd(-3, 3)));
  const bonus = (perf - 70) / 4;
  S.goals += g;
  _eff = c.l + clamp((perf - c.l) / 4, -6, 8);   // ton niveau tire le club vers le haut (ou le bas)

  // 1. Classement de toutes les divisions
  const rk = {};
  CDIV.forEach(d => rk[d.id] = cRank(S.mem[d.id]));
  const dv = divOf(me), pos = rk[dv.id].indexOf(me) + 1;
  S.rank = pos;
  out.push(`📊 ${pos}e de ${dv.n}`);
  if (pos === 1) { S.trophies.push({ age: S.age, t: 'Champion de ' + dv.n, c: me }); out.push('🏆 Champion de ' + dv.n); }

  // 2. Coupes nationales (une par pays)
  const cupW = {};
  Object.keys(COUPES).forEach(k => {
    let a = CDIV.filter(d => d.c === k).flatMap(d => S.mem[d.id]);
    while (a.length > 1) a = cKO(a);
    cupW[k] = a[0];
  });
  if (cupW[c.c] === me) { S.trophies.push({ age: S.age, t: COUPES[c.c], c: me }); out.push('🏆 ' + COUPES[c.c] + ' remportée'); }

  // 3. Europe (si le club s'est qualifié la saison précédente)
  const eu = S.qual ? (S.qual.UCL.includes(me) ? 'UCL' : S.qual.UEL.includes(me) ? 'UEL' : null) : null;
  if (eu) {
    const tag = eu === 'UCL' ? 'Ligue des champions' : 'Ligue Europa', need = eu === 'UCL' ? 98 : 88;
    const gap = _eff + rnd(-14, 14) + bonus - need;
    if (gap > 0) { S.trophies.push({ age: S.age, t: tag, c: me }); out.push('⭐ ' + tag + ' remportée'); }
    else out.push(`🌍 ${tag} : ${gap > -4 ? 'finaliste' : gap > -9 ? 'demi-finale' : gap > -15 ? 'quart de finale' : gap > -22 ? '8e de finale' : 'phase de ligue'}`);
  }

  // 4. Ballon d'Or
  if (perf >= 92 && S.rep >= 60 && Math.random() < 0.6) { S.bd++; S.trophies.push({ age: S.age, t: 'Ballon d\'Or', c: me }); out.push('🥇 Ballon d\'Or !'); }

  // 5. Qualifications européennes de la saison suivante
  const qual = { UCL: [], UEL: [] };
  CDIV.filter(d => d.t === 1).forEach(d => {
    const r = rk[d.id], u = r.slice(0, d.ucl), w = cupW[d.c], uel = w && !u.includes(w) ? [w] : [];
    r.slice(d.ucl).forEach(x => { if (uel.length < d.uel && !uel.includes(x)) uel.push(x); });
    qual.UCL.push(...u); qual.UEL.push(...uel);
  });
  S.qual = qual;
  if (qual.UCL.includes(me)) out.push('✅ Qualifié pour la Ligue des champions');
  else if (qual.UEL.includes(me)) out.push('✅ Qualifié pour la Ligue Europa');

  // 6. Montées, descentes et barrages
  CDIV.filter(d => d.t === 1).forEach(top => {
    const low = CDIV[CDIV.indexOf(top) + 1], rt = rk[top.id], rl = rk[low.id];
    const down = rt.slice(-2), up = rl.slice(0, 2), bar = rt[rt.length - 3], chal = rl[2];
    const [x, y] = cSim(cLv(bar), cLv(chal)), barWins = x > y || (x === y && Math.random() < 0.55);
    const prom = barWins ? up : [...up, chal], rel = barWins ? down : [...down, bar];
    if (bar === me || chal === me) out.push(`⚪ Barrage ${bar} - ${chal} : ${x}-${y}`);
    S.mem[top.id] = rt.filter(n => !rel.includes(n)).concat(prom);
    S.mem[low.id] = rl.filter(n => !prom.includes(n)).concat(rel);
    if (prom.includes(me)) out.push(`⬆️ Promotion en ${top.n} !`);
    if (rel.includes(me)) out.push(`⬇️ Relégation en ${low.n}`);
  });

  const won = S.trophies.slice(t0);
  S.rep = clamp(S.rep + Math.round((perf - 70) / 6) + won.length * 3, 0, 100);
  S.money += Math.round(c.l / 6 * (1 + S.rep / 100));
  S.peak = Math.max(S.peak, S.ovr);

  // 7. Offres : jusqu'à 3 clubs réels (plus forts ; après 31 ans, aussi des clubs un peu moins forts)
  const lo = S.age >= 31 ? c.l - 12 : c.l + 1, hi = Math.min(c.l + 10, 50 + S.rep * 0.45);
  const cand = CLUBS.map((x, i) => i).filter(i => i !== S.club && CLUBS[i].l >= lo && CLUBS[i].l <= hi);
  cand.sort(() => Math.random() - 0.5);
  S.offers = Math.random() < 0.75 ? cand.slice(0, rnd(1, 3)) : [];

  S.last = { perf, g, out };
  S.phase = 'result';
  track('seasons'); track('goals', g); track('trophies', won.filter(t => t.t !== 'Ballon d\'Or').length);
  checkBadges(); save(); render();
}

function transfer(i) {
  if (i >= 0) {
    S.club = S.offers[i];
    if (!S.visited.includes(S.club)) S.visited.push(S.club);
    track('transfers');
  }
  S.offers = [];
  checkBadges(); save(); nextSeason();
}

function retire() {
  S.phase = 'end';
  H.unshift({ name: S.name, pos: S.pos, goals: S.goals, bd: S.bd, trophies: S.trophies.length, peak: S.peak, club: CLUBS[S.club].n });
  localStorage.setItem('g11h', JSON.stringify(H));
  checkBadges(); save(); render();
}

// Plus aucune retraite forcée : le joueur s'arrête quand il le décide
function nextSeason() {
  S.age++;
  if (S.age < 24) S.ovr += rnd(2, 5);
  else if (S.age <= 28) S.ovr += rnd(0, 2);
  else if (S.age >= 31) S.ovr -= rnd(1, 3);
  S.ovr = clamp(S.ovr, 30, 99);
  S.phase = 'event'; S.last = null; pickEvent();
  save(); render();
}

const bar = (label, v) => `<div class="stat">${label} : ${Math.round(v)}<div class="bar"><i style="width:${v}%"></i></div></div>`;

const statsCard = () => `
  <div class="card">
    <h2>${S.nat !== undefined && NATS[S.nat] ? NATS[S.nat].f + ' ' : ''}${S.name} <span class="muted" style="font-size:16px">${POSTES[S.pos]} · ${S.age} ans</span></h2>
    <p class="muted">${CLUBS[S.club].f} ${CLUBS[S.club].n} (${divOf(CLUBS[S.club].n).n}) · ${S.money} M€ · ${S.goals} buts · ${S.bd} Ballon(s) d'Or</p>
    ${S.prof ? `<p class="muted" style="font-size:13px">${S.prof.slice(0, 3).join(' · ')}</p>` : ''}
    ${S.dream !== undefined && DREAMS[S.dream] ? `<p style="font-size:13px;margin-top:4px">💭 ${DREAMS[S.dream].n} ${S.dreamOk ? '✅' : ''}</p>` : ''}
    ${bar('Niveau', S.ovr)}${bar('Réputation', S.rep)}${bar('Moral', S.mor)}
    ${S.phase !== 'end' && S.age >= 30 ? `<br><button class="ghost" onclick="if (confirm('Prendre ta retraite ?')) retire()">🏁 Prendre ma retraite</button>` : ''}
  </div>`;

const views = {
  home: () => `
    <section class="hero">
      <h1>Écris ta <span>légende</span></h1>
      <p>De 16 ans à la retraite, chaque choix compte. Transferts, titres, Ballon d'Or : personne ne connaît son destin.</p>
      <button onclick="go('${S && S.phase !== 'end' ? 'career' : 'create'}')">${S && S.phase !== 'end' ? '▶ Continuer ma carrière' : '⚽ Commencer ma carrière'}</button>
    </section>
    <div class="feats">
      <div class="feat" onclick="go('career')" style="animation-delay:.05s"><div class="ic">⚽</div><b>Carrière</b><span>Du centre de formation au Ballon d'Or</span></div>
      <div class="feat" onclick="go('manager')" style="animation-delay:.15s"><div class="ic">📋</div><b>Manager</b><span>Dirige un club, ses transferts et sa tactique</span></div>
      <div class="feat" onclick="go('quests')" style="animation-delay:.25s"><div class="ic">🎯</div><b>Quêtes</b><span>De nouveaux défis chaque jour</span></div>
    </div>`,

  create: () => {
    if (!C) C = { step: 0 };
    const prog = `<div class="bar" style="margin-bottom:18px"><i style="width:${(C.step + 1) / 6 * 100}%"></i></div>`;
    if (C.step === 0) return `<div class="card">${prog}<h2>Crée ton joueur</h2><p class="muted">Étape 1/6</p>
      <label>Nom</label><input id="nm" placeholder="Ton nom de joueur" maxlength="20" value="${C.name || ''}">
      <label>Nationalité</label><select id="nt">${NATS.map((n, i) => `<option value="${i}" ${i === C.nat ? 'selected' : ''}>${n.f} ${n.n}</option>`).join('')}</select>
      <label>Poste</label><select id="ps">${Object.entries(POSTES).map(([k, v]) => `<option value="${k}" ${k === C.pos ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <br><br><button onclick="cNext()">Suivant →</button></div>`;
    if (C.step <= STEPS.length) {
      const st = STEPS[C.step - 1];
      return `<div class="card">${prog}<h2>${st.t}</h2><p class="muted">Étape ${C.step + 1}/6 · ${st.q}</p>
        <div class="choices">${st.o.map((o, i) => `<button onclick="cPick(${i})"><b>${o.n}</b><br><small>${o.d}</small></button>`).join('')}</div>
        <br><button class="ghost" onclick="cBack()">← Retour</button></div>`;
    }
    return `<div class="card">${prog}<h2>Ils t'ont repéré !</h2><p class="muted">Étape 6/6 · Quel club vas-tu rejoindre ?</p>
      <div class="choices">${C.clubs.map(i => `<button onclick="newCareer(${i})">${CLUBS[i].f} <b>${CLUBS[i].n}</b><br><small>${divInit(CLUBS[i].n)} · niveau ${CLUBS[i].l}</small></button>`).join('')}</div>
      <br><button class="ghost" onclick="cBack()">← Retour</button></div>`;
  },

  career: () => {
    if (!S) return views.create();
    if (S.phase === 'end') return statsCard() + `
      <div class="card"><h2>Retraite</h2>
      <p>Pic de niveau : <b>${S.peak}</b> · ${S.trophies.length} trophées · ${S.bd} Ballon(s) d'Or.</p>
      <p class="muted">Ta légende est entrée au Panthéon.</p><br>
      <button onclick="C = null; go('create')">Rejouer une carrière</button></div>`;
    if (S.phase === 'event') {
      const e = EVENTS[S.ev];
      return statsCard() + `<div class="card"><h2>Saison ${S.age - 15}</h2><p>${e.t}</p>
        <div class="choices">${e.c.map((c, i) => `<button onclick="chooseEvent(${i})">${c[0]}</button>`).join('')}</div></div>`;
    }
    const L = S.last, offers = S.offers || [];
    return statsCard() + `<div class="card"><h2>Bilan de saison</h2>
      <div class="big">${L.perf}</div><p class="muted">note de performance · ${L.g} buts</p>
      ${L.out.map(o => `<span class="tag">${o}</span>`).join('')}
      <br><br>${offers.length
        ? `<p>📩 ${offers.length > 1 ? 'Plusieurs clubs te contactent' : 'Un club te contacte'} :</p><div class="choices">
           ${offers.map((o, i) => `<button onclick="transfer(${i})">${CLUBS[o].f} ${CLUBS[o].n} <span class="muted">(${divOf(CLUBS[o].n).n} · niveau ${CLUBS[o].l})</span></button>`).join('')}
           <button onclick="transfer(-1)">Rester à ${CLUBS[S.club].n}</button></div>`
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
  try {
    if (typeof views[view] !== 'function') {
      app.innerHTML = `<div class="card"><h2>Page introuvable</h2>
        <p class="muted">${view === 'manager'
          ? 'Le mode Manager n\'est pas chargé : vérifie que ligues.js et manager.js sont dans le même dossier et ajoutés dans index.html.'
          : 'Cette page n\'existe pas.'}</p><br>
        <button onclick="go('home')">Retour à l'accueil</button></div>`;
    } else {
      app.innerHTML = views[view]();
    }
  } catch (e) {
    app.innerHTML = `<div class="card"><h2>Oups, une erreur est survenue</h2>
      <p class="muted">${e.message}</p><br>
      <button onclick="go('home')">Retour à l'accueil</button></div>`;
    console.error(e);
  }
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
if (S) { S.seen = S.seen || []; S.offers = S.offers || []; }

// Migration : ancienne liste de clubs fictifs -> vrai club de niveau le plus proche
if (S && !S.v3 && !S.v4 && !S.v5) {
  const oldLevel = i => i < 3 ? [55, 58, 60][i] : 59 + i;
  const nearest = l => CLUBS.reduce((b, c, i) => Math.abs(c.l - l) < Math.abs(CLUBS[b].l - l) ? i : b, 0);
  const old = Array.isArray(S.visited) ? S.visited : [S.club];
  S.visited = [...new Set(old.map(i => nearest(oldLevel(i))))];
  S.club = nearest(oldLevel(S.club)); S.offers = [];
}
// Migration : divisions dynamiques (montées / descentes)
if (S && !S.v4 && !S.v5) { S.mem = memInit(); S.qual = null; S.rank = 0; S.v4 = 1; save(); }

// Sécurité : répare une sauvegarde incohérente au lieu de planter
if (S && (!CLUBS[S.club] || !Array.isArray(S.visited) || S.visited.some(i => !CLUBS[i]) || !S.mem)) {
  S.club = CLUBS[S.club] ? S.club : 0; S.visited = [S.club]; S.offers = []; S.mem = S.mem || memInit(); save();
}
if (S && S.phase === 'event' && !EVENTS[S.ev]) { pickEvent(); save(); }

initQuests();
render();
