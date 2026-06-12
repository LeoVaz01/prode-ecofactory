// Motor de puntajes del Prode 2026
export const ROUND_POINTS = { R32: 3, R16: 5, QF: 7, SF: 8, "3P": 9, F: 10 };

export function roundOfMatch(mid) {
  const n = parseInt(String(mid).replace(/^M/, ""), 10);
  if (n >= 73 && n <= 88) return "R32";
  if (n >= 89 && n <= 96) return "R16";
  if (n >= 97 && n <= 100) return "QF";
  if (n >= 101 && n <= 102) return "SF";
  if (n === 103) return "3P";
  if (n === 104) return "F";
  return null;
}

const sign = (a, b) => (a > b ? "L" : a < b ? "V" : "E"); // Local / Visitante / Empate

export function normalizeResultados(rows) {
  const groups = {}, koWinners = {};
  for (const r of rows || []) {
    const id = r.match_id;
    if (!id) continue;
    if (id.startsWith("G-")) {
      if (r.goles_local != null && r.goles_visitante != null)
        groups[id] = { gl: Number(r.goles_local), gv: Number(r.goles_visitante) };
    } else if (id.startsWith("M")) {
      if (r.ganador) koWinners[id] = r.ganador;
    }
  }
  return { groups, koWinners };
}

// Devuelve { pts, exactos, detail }.
// Grupos: 1 punto por acertar el SIGNO. 'exactos' = marcadores exactos (DESEMPATE, no suma puntos).
export function scoreOne(pred, resultados) {
  const detail = { grupos: 0, R32: 0, R16: 0, QF: 0, SF: 0, "3P": 0, F: 0 };
  let pts = 0, exactos = 0;

  const partidosG = pred?.fase_grupos?.partidos || [];
  for (const p of partidosG) {
    const r = resultados.groups[p.id];
    if (!r) continue;
    const pl = Number(p.goles_local), pv = Number(p.goles_visitante);
    if (sign(pl, pv) === sign(r.gl, r.gv)) { pts += 1; detail.grupos += 1; }
    if (pl === r.gl && pv === r.gv) exactos += 1;
  }

  const userByRound = { R32: new Set(), R16: new Set(), QF: new Set(), SF: new Set(), "3P": new Set(), F: new Set() };
  for (const p of (pred?.fase_eliminatoria?.partidos || [])) {
    if (p.ganador && userByRound[p.ronda]) userByRound[p.ronda].add(p.ganador);
  }
  const realByRound = { R32: new Set(), R16: new Set(), QF: new Set(), SF: new Set(), "3P": new Set(), F: new Set() };
  for (const [mid, team] of Object.entries(resultados.koWinners)) {
    const R = roundOfMatch(mid);
    if (R && team) realByRound[R].add(team);
  }
  for (const R of ["R32", "R16", "QF", "SF", "3P", "F"]) {
    let hits = 0;
    for (const t of userByRound[R]) if (realByRound[R].has(t)) hits++;
    const add = hits * ROUND_POINTS[R];
    pts += add; detail[R] += add;
  }

  return { pts, exactos, detail };
}
