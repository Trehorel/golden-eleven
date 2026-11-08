// MODE MANAGER v2 : vrais championnats, coupes, Europe (utilise rnd, clamp, load, toast, views, render de script.js ; D, COUPES, EU1 de ligues.js)
let M = load('g11m2', 'null');
const mSave = () => localStorage.setItem('g11m2', JSON.stringify(M));

// Données dérivées (doublons entre divisions : on garde la division supérieure)
const SEEN = new Set(), BASE = {}, HOME = {}, ALL = [], DV = {};
D.forEach(d => {
  d.cl = d.cl.filter(c => !SEEN.has(c.n) && SEEN.add(c.n));
  d.cl.forEach(c => { BASE[c.n] = c.l; HOME[c.n] = d; ALL.push(c.n); });
  DV[d.id] = d;
});
const FOR_SORTED = [...EU1.UCL.f, ...EU1.UEL.f].map(s => { const [n, l] = s.split(':'); BASE[n] = +l; return { n, l: +l }; }).sort((a, b) => b.l - a.l);

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

const flag = n => HOME[n] ? HOME[n].f : '🌍';
const lvl = n => n === M.club ? mStr() : (M.lv[n] ?? BASE[n] ?? 55);
const shuffle = a => [...a].sort(() => Math.random() - 0.5);

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
const mStr = () => { const t = mXI(); return Math.round(t.reduce((a, p) => a + p.ovr, 0) / t.length); };

// ---------- Matchs ----------
const mSim = (a, b) => {
  const d = (a - b + 3) / 16;
  return [Math.max(0, Math.round(1.35 + d + rnd(-9, 11) / 10)), Math.max(0, Math.round(1.35 - d + rnd(-9, 11) / 10))];
};
// Match du club géré : renvoie [buts du club, buts de l'adversaire]
const mPlayU = o => {
  const f = FORMS[M.f], d = mStr() - lvl(o) + 3;
  return [Math.max(0, Math.round(1.4 + d / 14 + f.a + rnd(-8, 10) / 10)), Math.max(0, Math.round(1.4 - d / 14 - f.d + rnd(-8, 10) / 10))];
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

function mStart(i) {
  const n = ALL[i], l = BASE[n];
  M = { club: n, div: HOME[n].id, l, f: '4-4-2', sq: [], mk: [], nid: 1, budget: Math.round(Math.max(0, l - 48) ** 2 / 6), s: 1, mem: {}, lv: {}, tab: {}, qual: null, trophies: [], hist: [], last: '', msg: '', sec: 'table' };
  D.forEach(d => { M.mem[d.id] = d.cl.map(c => c.n); d.cl.forEach(c => M.lv[c.n] = c.l); });
  [['GAR', 2], ['DEF', 6], ['MIL', 6], ['ATT', 4]].forEach(([p, k]) => { for (let j = 0; j < k; j++) M.sq.push(mPlayer(p, l + rnd(-10, 6), rnd(19, 33))); });
  mMarket(); mSeason(); mSave(); render();
}

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
  else if (w.length === 1) { M.trophies.push({ s: M.s, t: COUPES[C.c] }); M.msg = `🏆 Tu remportes la ${COUPES[C.c]} !`; }
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
  if (E.phase === 'won') { M.trophies.push({ s: M.s, t: tag }); M.msg = `🏆 Tu remportes la ${tag} !`; }
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
  notes.push(`Saison ${M.s} : ${pos}e de ${DV[own].n}.`);
  if (pos === 1) M.trophies.push({ s: M.s, t: 'Champion de ' + DV[own].n });

  // Coupes : on termine toutes les coupes nationales
  const cupW = {};
  Object.keys(COUPES).forEach(c => {
    let alive = c === M.cup.c ? [...M.cup.alive] : D.filter(d => d.c === c).flatMap(d => M.mem[d.id]);
    while (alive.length > 1) alive = mKO(alive);
    cupW[c] = alive[0];
  });
  if (M.cup.out) notes.push(`Éliminé en ${COUPES[M.cup.c]}.`);
  if (M.eu) notes.push(M.eu.phase === 'out' ? `Éliminé en ${M.eu.comp === 'UCL' ? 'Ligue des champions' : 'Ligue Europa'}.` : '');

  // Qualifications européennes de la saison suivante
  const qual = { UCL: [], UEL: [] };
  D.filter(d => d.t === 1).forEach(d => {
    const r = rk[d.id], u = r.slice(0, d.ucl), w = cupW[d.c], uel = w && !u.includes(w) ? [w] : [];
    r.slice(d.ucl).forEach(x => { if (uel.length < d.uel && !uel.includes(x)) uel.push(x); });
    qual.UCL.push(...u); qual.UEL.push(...uel);
  });

  // Montées, descentes et barrages
  D.filter(d => d.t === 1).forEach(top => {
    const low = D[D.indexOf(top) + 1], rt = rk[top.id], rl = rk[low.id];
    const down = rt.slice(-2), up = rl.slice(0, 2), bar = rt[rt.length - 3], chal = rl[2];
    const [x, y] = bar === M.club ? mPlayU(chal) : chal === M.club ? mPlayU(bar).reverse() : mSim(lvl(bar), lvl(chal));
    const barWins = x > y || (x === y && Math.random() < 0.55);
    if (bar === M.club || chal === M.club) notes.push(`Barrage ${bar} - ${chal} : ${x}-${y}.`);
    const prom = barWins ? up : [...up, chal], rel = barWins ? down : [...down, bar];
    M.mem[top.id] = rt.filter(c => !rel.includes(c)).concat(prom);
    M.mem[low.id] = rl.filter(c => !prom.includes(c)).concat(rel);
    if (prom.includes(M.club)) { M.div = top.id; notes.push(`⬆️ Promotion en ${top.n} !`); }
    if (rel.includes(M.club)) { M.div = low.id; notes.push(`⬇️ Relégation en ${low.n}.`); }
  });
  M.qual = qual;

  // Primes, vieillissement, retraites, jeunes
  const bonus = Math.round((n - pos + 1) * M.l / 14) + (pos === 1 ? 20 : 0) + (M.eu ? 15 : 0);
  M.budget += bonus; notes.push(`Prime : +${bonus} M€.`);
  const gone = [];
  M.sq.forEach(p => { p.age++; p.ovr = clamp(p.ovr + (p.age < 24 ? rnd(1, 4) : p.age <= 29 ? rnd(-1, 2) : p.age >= 31 ? -rnd(1, 3) : 0), 40, 97); });
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
const mQuit = () => { if (confirm('Quitter ce club et en diriger un autre ? (la partie en cours sera perdue)')) { M = null; localStorage.removeItem('g11m2'); render(); } };

// ---------- Affichage ----------
const mRow = (p, btn) => `<div class="row"><span>${p.pos} · <b>${p.n}</b></span><span class="muted">${p.ovr} · ${p.age} ans · ${mVal(p)} M€</span>${btn}</div>`;

function mTable() {
  const d = DV[M.div], r = mRank(M.mem[M.div], M.tab), n = r.length;
  const zone = i => d.t === 1
    ? (i < d.ucl ? 'z1' : i < d.ucl + d.uel ? 'z2' : i === n - 3 ? 'z3' : i >= n - 2 ? 'z4' : '')
    : (i < 2 ? 'z5' : i === 2 ? 'z3' : '');
  const legend = d.t === 1 ? '🔵 Ligue des champions · 🟠 Ligue Europa · ⚪ Barrage · 🔴 Relégation' : '🟢 Promotion · ⚪ Barrage de promotion';
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
    `<br><h2>Palmarès</h2>` + (M.trophies.length ? M.trophies.map(t => `<div class="row"><span>🏆 ${t.t}</span><span class="muted">saison ${t.s}</span></div>`).join('') : '<p class="muted">Aucun trophée pour le moment.</p>');
}

views.manager = () => {
  if (!M) return `<h2>Mode Manager</h2><p class="muted" style="margin-bottom:16px">Choisis le club que tu veux diriger. Plus il est fort, plus son budget est élevé.</p>` +
    D.map(d => `<h2 style="margin-top:20px">${d.f} ${d.n}</h2><div class="grid">${d.cl.map(c => `<button class="ghost" onclick="mStart(${ALL.indexOf(c.n)})">${c.n}<br><small>Niveau ${c.l}</small></button>`).join('')}</div>`).join('');
  const d = DV[M.div], team = mXI(), line = p => `<div class="line">${team.filter(x => x.pos === p).map(x => `<div class="pl">${x.n}<br><b>${x.ovr}</b></div>`).join('')}</div>`;
  const sec = {
    table: mTable, cups: mCups,
    comp: () => `<h2>Composition</h2>${Object.keys(FORMS).map(k => `<button class="sm ${M.f === k ? '' : 'ghost'}" onclick="mForm('${k}')">${k}</button>`).join('')}
      <p class="muted" style="margin:10px 0">Force de l'équipe : <b>${mStr()}</b></p><div class="pitch">${line('ATT')}${line('MIL')}${line('DEF')}${line('GAR')}</div>`,
    sq: () => `<h2>Effectif (${M.sq.length})</h2>` + [...M.sq].sort((a, b) => ORDER[a.pos] - ORDER[b.pos] || b.ovr - a.ovr).map(p => mRow(p, `<button class="sm ghost" onclick="mSell(${p.id})">Vendre ${Math.round(mVal(p) * 0.85)} M€</button>`)).join(''),
    mk: () => `<h2>Marché des transferts</h2>` + (M.mk.map(p => mRow(p, `<button class="sm" onclick="mBuy(${p.id})">Acheter</button>`)).join('') || '<p class="muted">Plus de joueur disponible.</p>')
  }[M.sec];
  return `<div class="card"><h2>${d.f} ${M.club}</h2>
      <p class="muted">Saison ${M.s} · ${d.n} · 💰 ${M.budget} M€ · Force ${mStr()}</p>
      ${M.msg ? `<p style="margin-top:8px">${M.msg}</p>` : ''}${M.last ? `<p class="muted" style="margin-top:8px">Dernier match : ${M.last}</p>` : ''}<br>
      <button onclick="mNext()">▶ Jouer : ${mNextLabel()}</button>
      <button class="ghost" onclick="mQuit()">Changer de club</button></div>
    <div>${[['table', 'Classement'], ['cups', 'Coupes & Europe'], ['comp', 'Composition'], ['sq', 'Effectif'], ['mk', 'Marché']].map(([k, l]) => `<button class="sm ${M.sec === k ? '' : 'ghost'}" onclick="mSec('${k}')">${l}</button>`).join('')}</div>
    <div class="card" style="margin-top:12px">${sec()}</div>`;
};
