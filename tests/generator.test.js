import { test } from 'node:test';
import assert from 'node:assert';
import { generate } from '../public/generator.js';
import { countSolutions } from '../public/solver.js';

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

// Every region must be a single 4-connected blob.
function regionsConnected(regions) {
  const n = regions.length;
  const cellsById = new Map();
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const id = regions[r][c];
      if (!cellsById.has(id)) cellsById.set(id, []);
      cellsById.get(id).push([r, c]);
    }
  }
  for (const [id, cells] of cellsById) {
    const seen = new Set();
    const stack = [cells[0]];
    seen.add(cells[0][0] * n + cells[0][1]);
    while (stack.length) {
      const [r, c] = stack.pop();
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
        if (regions[nr][nc] !== id) continue;
        const key = nr * n + nc;
        if (seen.has(key)) continue;
        seen.add(key);
        stack.push([nr, nc]);
      }
    }
    if (seen.size !== cells.length) return false;
  }
  return true;
}

for (const n of [5, 7, 8, 9]) {
  const { regions, solution } = generate(n);

  test(`generate(${n}) is an n×n board with exactly n regions`, () => {
    assert.strictEqual(regions.length, n);
    assert.ok(regions.every((row) => row.length === n));
    assert.strictEqual(new Set(regions.flat()).size, n);
  });

  test(`generate(${n}) covers every cell with a valid region id`, () => {
    assert.ok(regions.flat().every((id) => id >= 0 && id < n), 'no unassigned cells');
    assert.ok(regionsConnected(regions), 'each region must be 4-connected');
  });

  test(`generate(${n}) is uniquely solvable and its solution is valid`, () => {
    assert.ok(validate(regions, solution), 'returned solution must be valid');
    assert.strictEqual(countSolutions(regions, 2), 1, 'must be unique');
  });
}
