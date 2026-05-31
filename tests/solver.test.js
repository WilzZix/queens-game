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

test('solve enforces region constraint and finds the unique solution', () => {
  // 4×4 board. Without regions, the only column+adjacency-valid solutions are
  // [1,3,0,2] and [2,0,3,1]. The region layout below puts both queens of the
  // second solution — cells (0,2) and (1,0) — into region 2, so region
  // uniqueness eliminates it, leaving [1,3,0,2] as the unique solution.
  const board = [
    [0, 0, 2, 0],
    [2, 0, 0, 1],
    [2, 0, 0, 0],
    [0, 0, 3, 0],
  ];
  const sol = solve(board);
  assert.deepStrictEqual(sol, [1, 3, 0, 2]);
  assert.ok(validate(board, sol), 'solution must satisfy all rules');
  assert.strictEqual(countSolutions(board, 2), 1, 'must be the unique solution');
});
