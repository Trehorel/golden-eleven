// MODE MANAGER (utilise CLUBS, rnd, clamp, load, toast, views, render de script.js)
let M = load('g11m', 'null');
const mSave = () => localStorage.setItem('g11m', JSON.stringify(M));

// D/M/A : joueurs par ligne ; a : bonus d'attaque ; d : bonus de défense
const FORMS = {
  '4-4-2': { D: 4, M: 4, A: 2, a: 0, d: 0 },
  '4-2-3-1': { D: 4, M: 5, A: 1, a: -0.1, d: 0.2 },
  '4-3-3': { D: 4, M: 3, A: 3, a: 0.3, d: -0.2 },
  '3-5-2': { D: 3, M: 5, A: 2, a: 0.1, d: -0.1 },
  '5-3-2': { D: 5, M: 3, A: 2, a: -0.3, d: 0.4 },
  '4-1-4-1': { D: 4, M: 5, A: 1, a: -0.2, d: 0.3 },
  '3-4-3': { D: 3, M: 4, A: 3, a: 0.4, d: -0.4 }
};
const PRENOMS = ['Lucas', 'Hugo', 'Enzo', 'Mathis', 'Noah', 'Léo', 'Adam', 'Yanis', 'Théo', 'Rayan', 'Karim', 'Marco', 'Diego', 'Mateo', 'Luca'];
const NOMS = ['Martin', 'Dubois', 'Moreau', 'Lefèvre', 'Silva', 'Rossi', 'Garcia', 'Müller', 'Costa', 'Diallo', 'Kone', 'Petit', 'Fernandez', 'Bernard', 'Larsen'];
const ORDER = { GAR: 0, DEF: 1, MIL: 2, ATT: 3 };

const mVal = p => Math.max(1, Math.round((p.ovr - 45) ** 2 / 12 * (p.age < 24 ? 1.4 : p.age > 31 ? 0.5 : 1)));
const mPlayer = (pos, ovr, age) => ({
  id: M.nid++, pos, age, ovr: clamp(ovr, 40, 97),
  n: PRENOMS[rnd(0, PRENOMS.length - 1)][0] + '. ' + NOMS[rnd(0, NOMS.length - 1)]
});

function mMarket() {
  M.mk = [];
  for (let k = 0; k < 12; k++) M.mk.push(mPlayer(['GAR', 'DEF', 'DEF', 'MIL', 'MIL', 'ATT'][rnd(0, 5)], M.l + rnd(-8, 14), rnd(18, 34)));
}

function mStart(i) {
  const c = CLUBS[i];
  M = { club: c.n, i, l: c.l, f: '4-4-2', sq: [], mk: [], nid: 1, budget: Math.round((c.l - 50) ** 2 / 6), s: 1, g: 0, w: 0, d: 0, ls: 0, pts: 0, last: '', msg: '' };
  [['GAR', 2], ['DEF', 6], ['MIL', 6], ['ATT', 4]].forEach(([p, n]) => {
    for (let k = 0; k < n; k++) M.sq.push(mPlayer(p, c.l + rnd(-10, 6), rnd(19, 33)));
  });
  mMarket(); mSave(); render();
}

// Onze de départ automatique selon la composition
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

function mPlay() {
  const f = FORMS[M.f], opp = CLUBS.filter(c => c.n !== M.club)[rnd(0, CLUBS.length - 2)];
  const diff = mStr() - (opp.l + rnd(-5, 5)) + 3;
  const gf = Math.max(0, Math.round(1.4 + diff / 14 + f.a + rnd(-8, 10) / 10));
  const ga = Math.max(0, Math.round(1.4 - diff / 14 - f.d + rnd(-8, 10) / 10));
  M.g++; M.budget += 1; M.msg = '';
  if (gf > ga) { M.w++; M.pts += 3; } else if (gf === ga) { M.d++; M.pts++; } else M.ls++;
  M.last = `${opp.f} ${opp.n} : ${gf}-${ga} ${gf > ga ? '✅' : gf === ga ? '🟰' : '❌'}`;
  if (M.g >= 20) mEnd();
  mSave(); render();
}

function mEnd() {
  const bonus = Math.round(M.pts * 1.5 + (M.pts >= 40 ? 20 : 0)), gone = [];
  M.budget += bonus;
  M.msg = `Saison ${M.s} terminée : ${M.w}V ${M.d}N ${M.ls}D (${M.pts} pts). Prime : +${bonus} M€.`;
  M.sq.forEach(p => {
    p.age++;
    p.ovr = clamp(p.ovr + (p.age < 24 ? rnd(1, 4) : p.age <= 29 ? rnd(-1, 2) : p.age >= 31 ? -rnd(1, 3) : 0), 40, 97);
  });
  // Retraite des joueurs : probabilité croissante dès 36 ans, obligatoire à 39 ans
  M.sq = M.sq.filter(p => {
    const r = p.age >= 39 || (p.age >= 36 && Math.random() < (p.age - 35) * 0.25);
    if (r) gone.push(`${p.n} (${p.age} ans)`);
    return !r;
  });
  if (gone.length) M.msg += ` 🏁 Retraite : ${gone.join(', ')}.`;
  for (let k = 0; k < 2; k++) M.sq.push(mPlayer(['DEF', 'MIL', 'ATT'][rnd(0, 2)], M.l + rnd(-15, -5), rnd(17, 19)));
  while (M.sq.filter(p => p.pos === 'GAR').length < 2) M.sq.push(mPlayer('GAR', M.l - 10, rnd(18, 22)));
  M.g = M.w = M.d = M.ls = M.pts = 0; M.s++; mMarket();
}

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
const mQuit = () => { if (confirm('Quitter ce club et en diriger un autre ?')) { M = null; localStorage.removeItem('g11m'); render(); } };

const mRow = (p, btn) => `<div class="row"><span>${p.pos} · <b>${p.n}</b></span>
  <span class="muted">${p.ovr} · ${p.age} ans · ${mVal(p)} M€</span>${btn}</div>`;

views.manager = () => {
  if (!M) return `<h2>Mode Manager</h2><p class="muted" style="margin-bottom:16px">Choisis le club que tu veux diriger. Plus il est fort, plus son budget est élevé.</p>
    <div class="grid">${CLUBS.map((c, i) => `<button class="ghost" onclick="mStart(${i})">${c.f} ${c.n}<br><small>Niveau ${c.l} · ${Math.round((c.l - 50) ** 2 / 6)} M€</small></button>`).join('')}</div>`;
  const team = mXI(), line = p => `<div class="line">${team.filter(x => x.pos === p).map(x => `<div class="pl">${x.n}<br><b>${x.ovr}</b></div>`).join('')}</div>`;
  return `<div class="card"><h2>${CLUBS[M.i].f} ${M.club}</h2>
      <p class="muted">Saison ${M.s} · Match ${M.g}/20 · 💰 ${M.budget} M€ · ${M.w}V ${M.d}N ${M.ls}D · ${M.pts} pts</p>
      ${M.msg ? `<p>${M.msg}</p>` : ''}${M.last ? `<p>Dernier match : ${M.last}</p>` : ''}<br>
      <button onclick="mPlay()">⚽ Jouer le match ${M.g + 1}/20</button>
      <button class="ghost" onclick="mQuit()">Changer de club</button></div>
    <div class="card"><h2>Composition</h2>
      ${Object.keys(FORMS).map(k => `<button class="sm ${M.f === k ? '' : 'ghost'}" onclick="mForm('${k}')">${k}</button>`).join('')}
      <p class="muted" style="margin:10px 0">Force de l'équipe : <b>${mStr()}</b></p>
      <div class="pitch">${line('ATT')}${line('MIL')}${line('DEF')}${line('GAR')}</div></div>
    <div class="card"><h2>Effectif (${M.sq.length})</h2>
      ${[...M.sq].sort((a, b) => ORDER[a.pos] - ORDER[b.pos] || b.ovr - a.ovr).map(p => mRow(p, `<button class="sm ghost" onclick="mSell(${p.id})">Vendre ${Math.round(mVal(p) * 0.85)} M€</button>`)).join('')}</div>
    <div class="card"><h2>Marché des transferts</h2>
      ${M.mk.map(p => mRow(p, `<button class="sm" onclick="mBuy(${p.id})">Acheter</button>`)).join('') || '<p class="muted">Plus de joueur disponible.</p>'}</div>`;
};
