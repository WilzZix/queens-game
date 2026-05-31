import { countSolutions } from './solver.js';

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Random valid placement: one queen per row/col, no adjacent (consecutive rows).
function placeSolution(n) {
  const sol = new Array(n).fill(-1);
  const usedCols = new Set();

  function bt(r) {
    if (r === n) return true;
    for (const c of shuffle([...Array(n).keys()])) {
      if (usedCols.has(c)) continue;
      if (r > 0 && Math.abs(sol[r - 1] - c) <= 1) continue;
      sol[r] = c;
      usedCols.add(c);
      if (bt(r + 1)) return true;
      sol[r] = -1;
      usedCols.delete(c);
    }
    return false;
  }

  return bt(0) ? sol : null;
}

// Seed one region per queen cell, then grow with randomized BFS until full.
// Guarantees connected regions, each containing exactly one queen.
function growRegions(n, solution) {
  const regions = Array.from({ length: n }, () => new Array(n).fill(-1));
  const frontier = [];
  for (let r = 0; r < n; r++) {
    const c = solution[r];
    regions[r][c] = r; // region id = row index of its queen
    frontier.push([r, c, r]);
  }
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (frontier.length) {
    const i = Math.floor(Math.random() * frontier.length);
    const [r, c, id] = frontier.splice(i, 1)[0];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      if (regions[nr][nc] !== -1) continue;
      regions[nr][nc] = id;
      frontier.push([nr, nc, id]);
    }
  }
  return regions;
}

export function generate(n) {
  for (let attempt = 0; attempt < 2000; attempt++) {
    const solution = placeSolution(n);
    if (!solution) continue;
    const regions = growRegions(n, solution);
    if (countSolutions(regions, 2) === 1) {
      return { regions, solution };
    }
  }
  throw new Error(`Failed to generate a unique ${n}×${n} puzzle`);
}
