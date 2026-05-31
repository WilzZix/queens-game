// Backtracking over rows. Constraints: one queen per row (implicit),
// distinct columns, distinct regions, and no two queens in adjacent rows
// with |column difference| <= 1 (covers diagonal/vertical adjacency).

export function solve(regions) {
  const n = regions.length;
  const sol = new Array(n).fill(-1);
  const usedCols = new Set();
  const usedRegs = new Set();

  function bt(r) {
    if (r === n) return true;
    for (let c = 0; c < n; c++) {
      if (usedCols.has(c)) continue;
      const rg = regions[r][c];
      if (usedRegs.has(rg)) continue;
      if (r > 0 && Math.abs(sol[r - 1] - c) <= 1) continue;
      sol[r] = c;
      usedCols.add(c);
      usedRegs.add(rg);
      if (bt(r + 1)) return true;
      sol[r] = -1;
      usedCols.delete(c);
      usedRegs.delete(rg);
    }
    return false;
  }

  return bt(0) ? sol.slice() : null;
}

export function countSolutions(regions, limit = 2) {
  const n = regions.length;
  const sol = new Array(n).fill(-1);
  const usedCols = new Set();
  const usedRegs = new Set();
  let count = 0;

  function bt(r) {
    if (count >= limit) return;
    if (r === n) {
      count++;
      return;
    }
    for (let c = 0; c < n; c++) {
      if (usedCols.has(c)) continue;
      const rg = regions[r][c];
      if (usedRegs.has(rg)) continue;
      if (r > 0 && Math.abs(sol[r - 1] - c) <= 1) continue;
      sol[r] = c;
      usedCols.add(c);
      usedRegs.add(rg);
      bt(r + 1);
      sol[r] = -1;
      usedCols.delete(c);
      usedRegs.delete(rg);
      if (count >= limit) return;
    }
  }

  bt(0);
  return count;
}
