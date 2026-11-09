// MODE MANAGER v3 : vrai manager (âge, parcours, philosophie), offres de clubs, retraite
// (utilise rnd, clamp, load, toast, bar, views, render, NATS, CONT de script.js ; D, PAIRS, COUPES, EU1 de ligues.js)
let M = load('g11m2', 'null');
let MC = null;   // création du manager en cours
const mSave = () => localStorage.setItem('g11m2', JSON.stringify(M));

// Données dérivées (doublons entre divisions : on garde la division supérieure)
const SEEN = new Set(), BASE = {}, HOME = {}, ALL = [], DV = {};
D.forEach(d => {
  d.cl = d.cl.filter(c => !SEEN.has(c.n) && SEEN.add(c.n));
  d.cl.forEach(c => { BASE[c.n] = c.l; HOME[c.n] = d; ALL.push(c.n); });
  DV[d.id] = d;
});
const FOR_SORTED = [...EU1.UCL.f, ...EU1.UEL.f].map(s => { const [n, l] = s.split(':'); BASE[n] = +l; return { n, l: +l }; }).sort((a, b) => b.l - a.l);

// Ancienne sauvegarde : nouvelles divisions + manager par défaut
if (M) D.forEach(d => { if (!M.mem[d.id]) { M.mem[d.id] = d.cl.map(c => c.n); d.cl.forEach(c => M.lv[c.n] = c.l); } });
if (M && !M.mgr) {
  M.mgr = { name: 'Manager', age: 40, natn: 'France', past: 0, ph: 4, rep: 30, clubs: [M.club], seasons: M.s - 1, titles: M.trophies.length };
  M.phase = 'play'; M.offers = []; M.fired = false;
}

const FORMS = {
  '4-4-2': { D: 4, M: 4, A: 2, a: 0, d: 0 }, '4-2-3-1': { D: 4, M: 5, A: 1, a: -0.1, d: 0.2 },
  '4-3-3': { D: 4, M: 3, A: 3, a: 0.3, d: -0.2 }, '3-5-2': { D: 3, M: 5, A: 2, a: 0.1, d: -0.1 },
  '5-3-2': { D: 5, M: 3, A: 2, a: -0.3, d: 0.4 }, '4-1-4-1': { D: 4, M: 5, A: 1, a: -0.2, d: 0.3 },
  '3-4-3': { D: 3, M: 4, A: 3, a: 0.4, d: -0.4 }
};
const PRENOMS = ['Lucas', 'Hugo', 'Enzo', 'Mathis', 'Noah', 'Léo', 'Adam', 'Yanis', 'Théo', 'Rayan', 'Karim', 'Marco', 'Diego', 'Mateo', 'Luca'];
const NOMS = ['Martin', 'Dubois', 'Moreau', 'Lefèvre', 'Silva', 'Rossi', 'Garcia', 'Müller', 'Costa', 'Diallo', 'Kone', 'Petit', 'Fernandez', 'Bernard', 'Larsen'];
const ORDER = { GAR: 0, DEF: 1, MIL: 2, ATT: 3 };
const Z0 = { p: 0, pts: 0, gf: 0, ga: 0 };
const STAGE = { po: 'Barrages', r16: '8es de finale', qf: 'Quarts de finale', sf: 'Demi-finale', f: 'Finale' };
const NEXTSTAGE = { po: 'r16', r16: 'qf', qf: 'sf', sf: 'f', f: 'won' };

// Parcours (réputation de départ) et philosophie de jeu (bonus)
const PAST = [
  { n: 'Ancien joueur professionnel', d: 'Le respect du vestiaire dès le premier jour', rep: 30 },
  { n: 'Entraîneur des jeunes', d: 'Tu as formé des talents pendant des années', rep: 20 },
  { n: 'Ancien joueur amateur', d: 'Un passionné qui part de zéro', rep: 15 },
  { n: 'Analyste vidéo', d: 'Un œil tactique hors du commun', rep: 10 }
];
const PHIL = [
  { n: 'Offensif', d: 'Attaque à outrance : plus de buts marqués', fx: { a: 0.25 } },
  { n: 'Défensif', d: 'Bloc solide : moins de buts encaissés', fx: { d: 0.25 } },
  { n: 'Formateur', d: 'Les jeunes progressent plus vite', fx: { y: 1 } },
  { n: 'Tacticien', d: 'Une équipe mieux organisée : +1 de force', fx: { s: 1 } },
  { n: 'Équilibré', d: 'Un peu d\'attaque, un peu de défense', fx: { a: 0.1, d: 0.1 } }
];
const mPh = () => PHIL[M.mgr.ph].fx;

const flag = n => HOME[n] ? HOME[n].f : '🌍';
const lvl = n => n === M.club ? mStr() : (M.lv[n] ?? BASE[n] ?? 55);
const shuffle = a => [...a].sort(() => Math.random() - 0.5);
const mDivOf = n => D.find(d => M.mem[d.id].includes(n)).id;
// Trophée du manager (conservé d'un club à l'autre)
const mTro = t => { M.trophies.push({ s: M.s, t, c: M.club }); M.mgr.titles++; };

// ---------- Joueurs ----------
const mVal = p => Math.max(1, Math.round((p.ovr - 45) ** 2 / 12 * (p.age < 24 ? 1.4 : p.age > 31 ? 0.5 : 1)));
const mPlayer = (pos, ovr, age) => ({
  id: M.nid++, pos, age, ovr: clamp(ovr, 40, 97),
  n: PRENOMS[rnd(0, PRENOMS.length - 1)][0] + '. ' + NOMS[rnd(0, NOMS.length - 1)]
});
function mMarket() {
  M.mk = [];
  for (let k = 0; k < 12; k++) M.mk.push(mPlayer(['GAR', 'DEF', 'DEF', 'MIL', 'MIL', 'ATT'][rnd(0, 5)], M.l + rnd(-8, 14), rnd(18, 34)));
}
function mNewSquad() {
  M.sq = [];
  [['GAR', 2], ['DEF', 6], ['MIL', 6], ['ATT', 4]].forEach(([p, k]) => { for (let j = 0; j < k; j++) M.sq.push(mPlayer(p, M.l + rnd(-10, 6), rnd(19, 33))); });
}
function mXI() {
  const f = FORMS[M.f], need = { GAR: 1, DEF: f.D, MIL: f.M, ATT: f.A }, out = [];
  for (const p in need) out.push(...M.sq.filter(x => x.pos === p).sort((a, b) => b.ovr - a.ovr).slice(0, need[p]));
  while (out.length < 11) {
    const r = M.sq.filter(x => !out.includes(x)).sort((a, b) => b.ovr - a.ovr)[0];
    if (!r) break;
    out.push({ ...r, ovr: r.ovr - 10 });
  }
  return out;
}
const mStr = () => { const t = mXI(); return Math.round(t.reduce((a, p) => a + p.ovr, 0) / t.length) + (mPh().s || 0); };

// ---------- Matchs ----------
const mSim = (a, b) => {
  const d = (a - b + 3) / 16;
  return [Math.max(0, Math.round(1.35 + d + rnd(-9, 11) / 10)), Math.max(0, Math.round(1.35 - d + rnd(-9, 11) / 10))];
};
// Match du club géré : renvoie [buts du club, buts de l'adversaire]
const mPlayU = o => {
  const f = FORMS[M.f], ph = mPh(), d = mStr() - lvl(o) + 3;
  return [Math.max(0, Math.round(1.4 + d / 14 + f.a + (ph.a || 0) + rnd(-8, 10) / 10)), Math.max(0, Math.round(1.4 - d / 14 - f.d - (ph.d || 0) + rnd(-8, 10) / 10))];
};
const mWin = (gu, go, o) => gu > go || (gu === go && Math.random() < 0.5 + (mStr() - lvl(o)) / 100);
const sym = (gu, go) => gu > go ? '✅' : gu === go ? '🟰' : '❌';

function mSched(names) {
  const t = [...names]; if (t.length % 2) t.push(null);
  const n = t.length, rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const rd = [];
    for (let i = 0; i < n / 2; i++) { const a = t[i], b = t[n - 1 - i]; if (a && b) rd.push(r % 2 ? [b, a] : [a, b]); }
    rounds.push(rd);
    t.splice(1, 0, t.pop());
  }
  return [...rounds, ...rounds.map(rd => rd.map(([a, b]) => [b, a]))];
}
function mRec(tab, a, b, ga, gb) {
  [[a, ga, gb], [b, gb, ga]].forEach(([n, f, c]) => {
    const x = tab[n] || (tab[n] = { ...Z0 });
    x.p++; x.gf += f; x.ga += c; x.pts += f > c ? 3 : f === c ? 1 : 0;
  });
}
const mRank = (names, tab) => [...names].sort((a, b) => {
  const x = tab[a] || Z0, y = tab[b] || Z0;
  return y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf;
});
function mSimDiv(names) {
  const tab = {};
  mSched(names).forEach(rd => rd.forEach(([a, b]) => { const [x, y] = mSim(lvl(a), lvl(b)); mRec(tab, a, b, x, y); }));
  return tab;
}
const mKO = names => {
  const a = shuffle(names), w = [];
  for (let i = 0; i + 1 < a.length; i += 2) { const [x, y] = mSim(lvl(a[i]), lvl(a[i + 1])); w.push(x > y || (x === y && Math.random() < 0.5) ? a[i] : a[i + 1]); }
  if (a.length % 2) w.push(a[a.length - 1]);
  return w;
};

// ---------- Saison ----------
function mField(k) {
  if (M.s === 1) return [...EU1[k].p, ...EU1[k].f.map(s => s.split(':')[0])];
  const q = M.qual[k], off = k === 'UCL' ? 0 : Math.max(0, 36 - M.qual.UCL.length);
  return [...q, ...FOR_SORTED.slice(off, off + Math.max(0, 36 - q.length)).map(f => f.n)];
}
function mSeason() {
  const names = M.mem[M.div];
  M.sch = mSched(names); M.tab = {};
  names.forEach(n => M.tab[n] = { ...Z0 });
  const c = DV[M.div].c, teams = D.filter(d => d.c === c).flatMap(d => M.mem[d.id]);
  M.cup = { c, alive: teams, r: 0, tot: Math.ceil(Math.log2(teams.length)), out: false };
  M.eu = null;
  ['UCL', 'UEL'].forEach(k => {
    if (M.eu) return;
    const f = mField(k);
    if (f.includes(M.club)) M.eu = { comp: k, field: f, opp: shuffle(f.filter(n => n !== M.club)).slice(0, 8), phase: 'lg', pts: 0, gd: 0, played: 0 };
  });
  // Calendrier : championnat + coupe + Europe
  const N = M.sch.length, at = {}, add = (r, e) => (at[r] = at[r] || []).push(e);
  for (let k = 0; k < 8; k++) add(Math.round((3 + 3 * k) * N / 38), { k: 'E', i: k });
  ['po', 'r16', 'qf', 'sf', 'f'].forEach((s, j) => add(Math.min(N, Math.round([26, 29, 32, 35, 38][j] * N / 38)), { k: 'E', s }));
  for (let k = 0; k < M.cup.tot; k++) add(Math.round(3 + (k + 1) * (N - 8) / (M.cup.tot + 1)), { k: 'C' });
  M.cal = []; M.ci = 0;
  for (let r = 1; r <= N; r++) { M.cal.push({ k: 'L', i: r - 1 }); (at[r] || []).forEach(e => M.cal.push(e)); }
}

// ---------- Création du manager ----------
function mcNext() {
  MC.name = document.getElementById('mn').value.trim() || 'Manager';
  MC.nat = parseInt(document.getElementById('mt').value, 10);
  MC.age = parseInt(document.getElementById('ma').value, 10);
  MC.step = 1; render();
}
function mcPick(i) {
  MC[MC.step === 1 ? 'past' : 'ph'] = i;
  MC.step++;
  if (MC.step === 3) mcScout();
  render();
}
function mcBack() { MC.step = Math.max(0, MC.step - 1); render(); }
// Clubs prêts à te donner ta chance, selon ta réputation (ceux de ton pays en priorité)
function mcScout() {
  const cap = 44 + PAST[MC.past].rep * 0.5 + 4, nc = NATS[MC.nat].c;
  let pool = shuffle(ALL.filter(n => BASE[n] <= cap));
  if (pool.length < 4) pool = [...ALL].sort((a, b) => BASE[a] - BASE[b]).slice(0, 6);
  const home = pool.filter(n => nc && HOME[n].c === nc).slice(0, 2);
  MC.clubs = [...home, ...pool.filter(n => !home.includes(n))].slice(0, 4);
}
function mHire(i) {
  const n = ALL[i], l = BASE[n];
  M = {
    mgr: { name: MC.name, age: MC.age, natn: NATS[MC.nat].n, past: MC.past, ph: MC.ph, rep: PAST[MC.past].rep, clubs: [n], seasons: 0, titles: 0 },
    phase: 'play', offers: [], fired: false,
    club: n, div: HOME[n].id, l, f: '4-4-2', sq: [], mk: [], nid: 1, budget: Math.round(Math.max(0, l - 48) ** 2 / 6),
    s: 1, mem: {}, lv: {}, tab: {}, qual: null, trophies: [], hist: [], last: '', msg: '', sec: 'table'
  };
  D.forEach(d => { M.mem[d.id] = d.cl.map(c => c.n); d.cl.forEach(c => M.lv[c.n] = c.l); });
  mNewSquad(); mMarket(); mSeason();
  MC = null; mSave(); render();
}

// ---------- Offres de clubs, retraite ----------
function mOffers(fired) {
  const cur = BASE[M.club], cap = 44 + M.mgr.rep * 0.5 + 6;
  let c = ALL.filter(n => n !== M.club && BASE[n] <= cap && (fired ? BASE[n] <= cur : BASE[n] >= cur - 14));
  if (fired && c.length < 2) c = [...ALL].sort((a, b) => BASE[a] - BASE[b]).slice(0, 4);
  c = shuffle(c).slice(0, fired ? 3 : rnd(1, 3));
  M.offers = (fired || Math.random() < 0.8) ? c : [];
}
function mJoin(i) {
  const n = M.offers[i];
  M.club = n; M.div = mDivOf(n); M.l = Math.round(M.lv[n] ?? BASE[n]);
  M.budget = Math.round(Math.max(0, M.l - 48) ** 2 / 6);
  mNewSquad(); M.mgr.clubs.push(n);
  M.offers = []; M.fired = false; M.phase = 'play'; M.msg = `Nouveau défi : tu diriges maintenant ${n} !`; M.last = '';
  mSeason(); mMarket(); mSave(); render();
}
function mStay() { M.offers = []; M.phase = 'play'; mSave(); render(); }
function mRetire() {
  if (!confirm('Prendre ta retraite de manager ?')) return;
  M.phase = 'end'; mSave(); render();
}
function mNew() { M = null; MC = null; localStorage.removeItem('g11m2'); render(); }

// ---------- Déroulement ----------
function mLeague(i) {
  M.msg = '';
  M.sch[i].forEach(([a, b]) => {
    if (a === M.club || b === M.club) {
      const o = a === M.club ? b : a, [gu, go] = mPlayU(o);
      a === M.club ? mRec(M.tab, a, b, gu, go) : mRec(M.tab, a, b, go, gu);
      M.last = `Journée ${i + 1} · ${flag(o)} ${o} : ${gu}-${go} ${sym(gu, go)}`;
      M.budget += 1;
    } else { const [x, y] = mSim(lvl(a), lvl(b)); mRec(M.tab, a, b, x, y); }
  });
}

function mCup() {
  const C = M.cup, a = shuffle(C.alive), w = [], left = C.tot - C.r;
  const lab = left === 1 ? 'Finale' : left === 2 ? 'Demi-finale' : left === 3 ? 'Quart de finale' : `Tour ${C.r + 1}`;
  M.msg = ''; M.last = `${COUPES[C.c]} · ${lab} : exempt`;
  for (let i = 0; i + 1 < a.length; i += 2) {
    const p = a[i], q = a[i + 1];
    if (p === M.club || q === M.club) {
      const o = p === M.club ? q : p, [gu, go] = mPlayU(o), win = mWin(gu, go, o);
      M.last = `${COUPES[C.c]} · ${lab} : ${flag(o)} ${o} ${gu}-${go}${gu === go ? ' (t.a.b.)' : ''} ${win ? '✅' : '❌'}`;
      w.push(win ? M.club : o);
    } else { const [x, y] = mSim(lvl(p), lvl(q)); w.push(x > y || (x === y && Math.random() < 0.5) ? p : q); }
  }
  if (a.length % 2) w.push(a[a.length - 1]);
  C.alive = w; C.r++;
  if (!w.includes(M.club)) C.out = true;
  else if (w.length === 1) { mTro(COUPES[C.c]); M.msg = `🏆 Tu remportes la ${COUPES[C.c]} !`; }
}

// Retourne true si le club a joué un match européen
function mEuro(e) {
  const E = M.eu, tag = E.comp === 'UCL' ? 'Ligue des champions' : 'Ligue Europa';
  if (e.i !== undefined) {
    if (E.phase !== 'lg') return false;
    const o = E.opp[e.i], [gu, go] = mPlayU(o);
    E.pts += gu > go ? 3 : gu === go ? 1 : 0; E.gd += gu - go; E.played++;
    M.msg = ''; M.last = `${tag} · J${e.i + 1}/8 : ${flag(o)} ${o} ${gu}-${go} ${sym(gu, go)}`;
    if (E.played === 8) {
      const mine = E.pts + E.gd / 100;
      const rank = 1 + E.field.filter(n => n !== M.club).filter(n => {
        let p = 0;
        for (let k = 0; k < 8; k++) { const [x, y] = mSim(lvl(n), lvl(E.field[rnd(0, E.field.length - 1)])); p += x > y ? 3 : x === y ? 1 : 0; }
        return p + rnd(-3, 3) / 100 > mine;
      }).length;
      E.rank = rank; E.phase = rank <= 8 ? 'r16' : rank <= 24 ? 'po' : 'out';
      M.msg = `${tag} : phase de ligue terminée, ${rank}e → ${rank <= 8 ? 'qualifié direct en 8es' : rank <= 24 ? 'barrages' : 'éliminé'}.`;
    }
    return true;
  }
  if (E.phase !== e.s) return false;
  const pool = E.field.filter(n => n !== M.club);
  const o = e.s === 'po' ? pool[rnd(0, pool.length - 1)] : [pool[rnd(0, pool.length - 1)], pool[rnd(0, pool.length - 1)]].sort((a, b) => lvl(b) - lvl(a))[0];
  const [gu, go] = mPlayU(o), win = mWin(gu, go, o);
  E.phase = win ? NEXTSTAGE[e.s] : 'out';
  M.msg = '';
  M.last = `${tag} · ${STAGE[e.s]} : ${flag(o)} ${o} ${gu}-${go}${gu === go ? ' (t.a.b.)' : ''} ${win ? '✅' : '❌'}`;
  if (E.phase === 'won') { mTro(tag); M.msg = `🏆 Tu remportes la ${tag} !`; }
  return true;
}

function mNext() {
  while (true) {
    const e = M.cal[M.ci];
    if (!e) { mEndSeason(); break; }
    M.ci++;
    if (e.k === 'L') { mLeague(e.i); break; }
    if (e.k === 'C' && M.cup.alive.includes(M.club) && mCup() === undefined) break;
    if (e.k === 'E' && M.eu && mEuro(e)) break;
  }
  mSave(); render();
}
const mNextLabel = () => {
  for (let j = M.ci; j < M.cal.length; j++) {
    const e = M.cal[j];
    if (e.k === 'L') return `Journée ${e.i + 1}/${M.sch.length}`;
    if (e.k === 'C' && M.cup.alive.includes(M.club)) return COUPES[M.cup.c];
    if (e.k === 'E' && M.eu && (e.i !== undefined ? M.eu.phase === 'lg' : M.eu.phase === e.s)) return M.eu.comp === 'UCL' ? 'Ligue des champions' : 'Ligue Europa';
  }
  return 'Fin de saison';
};

function mEndSeason() {
  const own = M.div, rk = {}, notes = [];
  D.forEach(d => { rk[d.id] = d.id === own ? mRank(M.mem[d.id], M.tab) : mRank(M.mem[d.id], mSimDiv(M.mem[d.id])); });
  const pos = rk[own].indexOf(M.club) + 1, n = rk[own].length;
  // Classement attendu pour ce club (selon son niveau) : sert à juger la saison du manager
  const exp = 1 + M.mem[own].filter(c => c !== M.club && (M.lv[c] ?? BASE[c]) > M.l).length;
  notes.push(`Saison ${M.s} : ${pos}e de ${DV[own].n}.`);
  if (pos === 1) mTro('Champion de ' + DV[own].n);

  // Coupes : on termine toutes les coupes nationales
  const cupW = {};
  Object.keys(COUPES).forEach(c => {
    let alive = c === M.cup.c ? [...M.cup.alive] : D.filter(d => d.c === c).flatMap(d => M.mem[d.id]);
    while (alive.length > 1) alive = mKO(alive);
    cupW[c] = alive[0];
  });
  if (M.cup.out) notes.push(`Éliminé en ${COUPES[M.cup.c]}.`);
  if (M.eu) notes.push(M.eu.phase === 'out' ? `Éliminé en ${M.eu.comp === 'UCL' ? 'Ligue des champions' : 'Ligue Europa'}.` : '');

  // Qualifications européennes de la saison suivante (seulement les championnats qui y ont accès)
  const qual = { UCL: [], UEL: [] };
  D.filter(d => d.ucl).forEach(d => {
    const r = rk[d.id], u = r.slice(0, d.ucl), w = cupW[d.c], uel = w && !u.includes(w) ? [w] : [];
    r.slice(d.ucl).forEach(x => { if (uel.length < d.uel && !uel.includes(x)) uel.push(x); });
    qual.UCL.push(...u); qual.UEL.push(...uel);
  });

  // Montées, descentes et barrages (seulement les pays qui ont deux divisions)
  let relegated = false;
  PAIRS.forEach(top => {
    const low = D[D.indexOf(top) + 1], rt = rk[top.id], rl = rk[low.id];
    const down = rt.slice(-2), up = rl.slice(0, 2), bar = rt[rt.length - 3], chal = rl[2];
    const [x, y] = bar === M.club ? mPlayU(chal) : chal === M.club ? mPlayU(bar).reverse() : mSim(lvl(bar), lvl(chal));
    const barWins = x > y || (x === y && Math.random() < 0.55);
    if (bar === M.club || chal === M.club) notes.push(`Barrage ${bar} - ${chal} : ${x}-${y}.`);
    const prom = barWins ? up : [...up, chal], rel = barWins ? down : [...down, bar];
    M.mem[top.id] = rt.filter(c => !rel.includes(c)).concat(prom);
    M.mem[low.id] = rl.filter(c => !prom.includes(c)).concat(rel);
    if (prom.includes(M.club)) { M.div = top.id; notes.push(`⬆️ Promotion en ${top.n} !`); }
    if (rel.includes(M.club)) { M.div = low.id; relegated = true; notes.push(`⬇️ Relégation en ${low.n}.`); }
  });
  M.qual = qual;

  // Réputation du manager, âge, licenciement éventuel et propositions de clubs
  const won = M.trophies.filter(t => t.s === M.s).length;
  const dRep = clamp(Math.round((exp - pos) * 0.5), -4, 6) + won * 4;
  M.mgr.rep = clamp(M.mgr.rep + dRep, 0, 100);
  M.mgr.age++; M.mgr.seasons++;
  notes.push(`Réputation : ${dRep >= 0 ? '+' : ''}${dRep}.`);
  const fired = relegated || (pos >= n - 1 && exp <= n - 4);
  mOffers(fired);
  M.fired = fired && M.offers.length > 0;
  M.phase = M.offers.length ? 'offers' : 'play';
  if (M.fired) notes.push('❌ Tu es licencié.');

  // Primes, vieillissement des joueurs, retraites, jeunes
  const bonus = Math.round((n - pos + 1) * M.l / 14) + (pos === 1 ? 20 : 0) + (M.eu ? 15 : 0);
  M.budget += bonus; notes.push(`Prime : +${bonus} M€.`);
  const gone = [], y = mPh().y || 0;
  M.sq.forEach(p => { p.age++; p.ovr = clamp(p.ovr + (p.age < 24 ? rnd(1, 4) + y : p.age <= 29 ? rnd(-1, 2) : p.age >= 31 ? -rnd(1, 3) : 0), 40, 97); });
  M.sq = M.sq.filter(p => { const r = p.age >= 39 || (p.age >= 36 && Math.random() < (p.age - 35) * 0.25); if (r) gone.push(`${p.n} (${p.age} ans)`); return !r; });
  if (gone.length) notes.push(`🏁 Retraite : ${gone.join(', ')}.`);
  for (let k = 0; k < 2; k++) M.sq.push(mPlayer(['DEF', 'MIL', 'ATT'][rnd(0, 2)], M.l + rnd(-15, -5), rnd(17, 19)));
  while (M.sq.filter(p => p.pos === 'GAR').length < 2) M.sq.push(mPlayer('GAR', M.l - 10, rnd(18, 22)));
  Object.keys(M.lv).forEach(c => { if (c !== M.club) M.lv[c] = clamp(Math.round(M.lv[c] + (BASE[c] - M.lv[c]) * 0.2 + rnd(-2, 2)), 40, 95); });

  M.hist.push({ s: M.s, d: own, pos });
  M.msg = notes.filter(Boolean).join(' ');
  M.s++; mSeason(); mMarket();
}

// ---------- Actions ----------
function mBuy(id) {
  const p = M.mk.find(x => x.id === id), price = mVal(p);
  if (M.budget < price) return toast('💸 Budget insuffisant');
  if (M.sq.length >= 26) return toast('Effectif complet (26 max)');
  M.budget -= price; M.mk = M.mk.filter(x => x !== p); M.sq.push(p); mSave(); render();
}
function mSell(id) {
  const p = M.sq.find(x => x.id === id);
  if (M.sq.length <= 15) return toast('Effectif minimum : 15 joueurs');
  if (p.pos === 'GAR' && M.sq.filter(x => x.pos === 'GAR').length <= 2) return toast('Garde au moins 2 gardiens');
  M.budget += Math.round(mVal(p) * 0.85); M.sq = M.sq.filter(x => x !== p); mSave(); render();
}
const mForm = k => { M.f = k; mSave(); render(); };
const mSec = s => { M.sec = s; mSave(); render(); };

// ---------- Affichage ----------
const mRow = (p, btn) => `<div class="row"><span>${p.pos} · <b>${p.n}</b></span><span class="muted">${p.ovr} · ${p.age} ans · ${mVal(p)} M€</span>${btn}</div>`;

function mTable() {
  const d = DV[M.div], r = mRank(M.mem[M.div], M.tab), n = r.length;
  const zone = i => d.np ? '' : d.t === 1
    ? (i < d.ucl ? 'z1' : i < d.ucl + d.uel ? 'z2' : i === n - 3 ? 'z3' : i >= n - 2 ? 'z4' : '')
    : (i < 2 ? 'z5' : i === 2 ? 'z3' : '');
  const legend = d.np ? 'Championnat sans relégation (division unique)' : d.t === 1 ? '🔵 Ligue des champions · 🟠 Ligue Europa · ⚪ Barrage · 🔴 Relégation' : '🟢 Promotion · ⚪ Barrage de promotion';
  return `<h2>${d.f} ${d.n}</h2><p class="muted" style="margin-bottom:10px">${legend}</p>` + r.map((c, i) => {
    const x = M.tab[c] || Z0;
    return `<div class="row ${zone(i)} ${c === M.club ? 'me' : ''}"><span>${i + 1}. ${c}</span><span class="muted">${x.p} j · ${x.gf - x.ga > 0 ? '+' : ''}${x.gf - x.ga} · <b>${x.pts} pts</b></span></div>`;
  }).join('');
}
function mCups() {
  const C = M.cup, E = M.eu, tag = E && (E.comp === 'UCL' ? 'Ligue des champions' : 'Ligue Europa');
  return `<h2>${COUPES[C.c]}</h2><p class="muted">${C.out ? 'Éliminé' : C.alive.length === 1 ? 'Vainqueur !' : `Toujours en lice (${C.alive.length} clubs restants)`}</p><br>
    <h2>Europe</h2>` + (E ? `<p><b>${tag}</b> · ${E.phase === 'lg' ? `phase de ligue ${E.played}/8 · ${E.pts} pts` : E.phase === 'out' ? 'éliminé' : E.phase === 'won' ? 'VAINQUEUR 🏆' : 'en phase finale : ' + STAGE[E.phase]}${E.rank ? ` · ${E.rank}e de la phase de ligue` : ''}</p>
      ${E.phase === 'lg' ? `<p class="muted">Adversaires : ${E.opp.map(o => flag(o) + ' ' + o).join(', ')}</p>` : ''}` : '<p class="muted">Non qualifié cette saison. Termine dans les places européennes de ton championnat ou gagne ta coupe !</p>') +
    `<br><h2>Palmarès du manager</h2>` + (M.trophies.length ? M.trophies.map(t => `<div class="row"><span>🏆 ${t.t}${t.c ? ' · ' + t.c : ''}</span><span class="muted">saison ${t.s}</span></div>`).join('') : '<p class="muted">Aucun trophée pour le moment.</p>');
}

function mWizard() {
  if (!MC) MC = { step: 0 };
  const prog = `<div class="bar" style="margin-bottom:18px"><i style="width:${(MC.step + 1) / 4 * 100}%"></i></div>`;
  if (MC.step === 0) return `<div class="card">${prog}<h2>Crée ton manager</h2><p class="muted">Étape 1/4</p>
    <label>Nom</label><input id="mn" placeholder="Ton nom de manager" maxlength="20" value="${MC.name || ''}">
    <label>Nationalité</label><select id="mt">${Object.entries(CONT).map(([k, v]) => `<optgroup label="${v}">${NATS.map((n, i) => n.k === k ? `<option value="${i}" ${i === MC.nat ? 'selected' : ''}>${n.f} ${n.n}</option>` : '').join('')}</optgroup>`).join('')}</select>
    <label>Âge</label><select id="ma">${Array.from({ length: 33 }, (_, i) => 28 + i).map(a => `<option value="${a}" ${a === (MC.age || 40) ? 'selected' : ''}>${a} ans</option>`).join('')}</select>
    <br><br><button onclick="mcNext()">Suivant →</button></div>`;
  if (MC.step <= 2) {
    const st = MC.step === 1 ? { t: 'Ton parcours', q: 'Comment es-tu arrivé sur un banc de touche ?', o: PAST } : { t: 'Ta philosophie de jeu', q: 'Quel est ton style ?', o: PHIL };
    return `<div class="card">${prog}<h2>${st.t}</h2><p class="muted">Étape ${MC.step + 1}/4 · ${st.q}</p>
      <div class="choices">${st.o.map((o, i) => `<button onclick="mcPick(${i})"><b>${o.n}</b><br><small>${o.d}</small></button>`).join('')}</div>
      <br><button class="ghost" onclick="mcBack()">← Retour</button></div>`;
  }
  return `<div class="card">${prog}<h2>Ils te font confiance !</h2><p class="muted">Étape 4/4 · Quel club vas-tu diriger pour débuter ?</p>
    <div class="choices">${MC.clubs.map(n => `<button onclick="mHire(${ALL.indexOf(n)})">${flag(n)} <b>${n}</b><br><small>${DV[HOME[n].id].n} · niveau ${BASE[n]}</small></button>`).join('')}</div>
    <br><button class="ghost" onclick="mcBack()">← Retour</button></div>`;
}

function mOffersView() {
  return `<div class="card"><h2>${M.fired ? '❌ Tu as été licencié' : '📩 Des clubs te contactent'}</h2>
    <p class="muted" style="margin-bottom:12px">${M.msg}</p>
    <div class="choices">${M.offers.map((n, i) => `<button onclick="mJoin(${i})">${flag(n)} <b>${n}</b><br><small>${DV[mDivOf(n)].n} · niveau ${Math.round(M.lv[n] ?? BASE[n])}</small></button>`).join('')}
    ${M.fired ? '' : `<button onclick="mStay()">Rester à ${M.club}</button>`}</div></div>`;
}

function mEndView() {
  const g = M.mgr, nat = NATS.find(n => n.n === g.natn);
  return `<div class="card"><h2>🏁 Retraite du manager</h2>
    <p><b>${nat ? nat.f + ' ' : ''}${g.name}</b> · ${g.age} ans · ${g.seasons} saisons · ${g.titles} trophée(s)</p>
    <p class="muted" style="margin:8px 0">Clubs dirigés : ${g.clubs.map(c => flag(c) + ' ' + c).join(' → ')}</p>
    ${M.trophies.length ? M.trophies.map(t => `<div class="row"><span>🏆 ${t.t}${t.c ? ' · ' + t.c : ''}</span><span class="muted">saison ${t.s}</span></div>`).join('') : '<p class="muted">Aucun trophée.</p>'}
    <br><button onclick="mNew()">Nouvelle carrière de manager</button></div>`;
}

views.manager = () => {
  if (!M) return mWizard();
  if (M.phase === 'offers') return mOffersView();
  if (M.phase === 'end') return mEndView();
  const g = M.mgr, nat = NATS.find(n => n.n === g.natn), d = DV[M.div], team = mXI();
  const line = p => `<div class="line">${team.filter(x => x.pos === p).map(x => `<div class="pl">${x.n}<br><b>${x.ovr}</b></div>`).join('')}</div>`;
  const sec = {
    table: mTable, cups: mCups,
    comp: () => `<h2>Composition</h2>${Object.keys(FORMS).map(k => `<button class="sm ${M.f === k ? '' : 'ghost'}" onclick="mForm('${k}')">${k}</button>`).join('')}
      <p class="muted" style="margin:10px 0">Force de l'équipe : <b>${mStr()}</b></p><div class="pitch">${line('ATT')}${line('MIL')}${line('DEF')}${line('GAR')}</div>`,
    sq: () => `<h2>Effectif (${M.sq.length})</h2>` + [...M.sq].sort((a, b) => ORDER[a.pos] - ORDER[b.pos] || b.ovr - a.ovr).map(p => mRow(p, `<button class="sm ghost" onclick="mSell(${p.id})">Vendre ${Math.round(mVal(p) * 0.85)} M€</button>`)).join(''),
    mk: () => `<h2>Marché des transferts</h2>` + (M.mk.map(p => mRow(p, `<button class="sm" onclick="mBuy(${p.id})">Acheter</button>`)).join('') || '<p class="muted">Plus de joueur disponible.</p>')
  }[M.sec];
  return `<div class="card"><h2>${d.f} ${M.club}</h2>
      <p class="muted">👔 ${nat ? nat.f + ' ' : ''}${g.name} · ${g.age} ans · ${PHIL[g.ph].n}</p>
      <p class="muted">Saison ${M.s} · ${d.n} · 💰 ${M.budget} M€ · Force ${mStr()}</p>
      ${bar('Réputation du manager', g.rep)}
      ${M.msg ? `<p style="margin-top:8px">${M.msg}</p>` : ''}${M.last ? `<p class="muted" style="margin-top:8px">Dernier match : ${M.last}</p>` : ''}<br>
      <button onclick="mNext()">▶ Jouer : ${mNextLabel()}</button>
      ${g.age >= 55 ? '<button class="ghost" onclick="mRetire()">🏁 Prendre ma retraite</button>' : ''}</div>
    <div>${[['table', 'Classement'], ['cups', 'Coupes & Europe'], ['comp', 'Composition'], ['sq', 'Effectif'], ['mk', 'Marché']].map(([k, l]) => `<button class="sm ${M.sec === k ? '' : 'ghost'}" onclick="mSec('${k}')">${l}</button>`).join('')}</div>
    <div class="card" style="margin-top:12px">${sec()}</div>`;
};
