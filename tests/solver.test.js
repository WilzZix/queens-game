import { test } from 'node:test';
import assert from 'node:assert';
import { solve, countSolutions } from '../public/solver.js';

// Validate a solution against the Queens rules.
function validate(regions, sol) {
  const n = regions.length;
  if (!sol || sol.length !== n) return false;
  const cols = new Set();
  const regs = new Set();
  for (let r = 0; r < n; r++) {
    const c = sol[r];
    if (c < 0 || c >= n) return false;
    if (cols.has(c)) return false;
    cols.add(c);
    const rg = regions[r][c];
    if (regs.has(rg)) return false;
    regs.add(rg);
    if (r > 0 && Math.abs(sol[r - 1] - c) <= 1) return false;
  }
  return regs.size === n;
}

// "one region per row" board: region id == row index.
function rowsBoard(n) {
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, () => r));
}

test('solve returns a valid solution for a solvable board', () => {
  const regions = rowsBoard(5);
  const sol = solve(regions);
  assert.ok(sol, 'expected a solution');
  assert.ok(validate(regions, sol), 'solution must satisfy all rules');
});

test('countSolutions caps at the given limit', () => {
  const regions = rowsBoard(5); // many solutions
  assert.strictEqual(countSolutions(regions, 2), 2);
});

test('solve returns null when no solution exists', () => {
  // n=2: cols {0,1}, any distinct assignment is adjacent -> impossible.
  const regions = [[0, 0], [1, 1]];
  assert.strictEqual(solve(regions), null);
  assert.strictEqual(countSolutions(regions, 2), 0);
});
