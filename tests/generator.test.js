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

for (const n of [5, 7, 8, 9]) {
  test(`generate(${n}) is an n×n board with exactly n regions`, () => {
    const { regions } = generate(n);
    assert.strictEqual(regions.length, n);
    assert.ok(regions.every((row) => row.length === n));
    assert.strictEqual(new Set(regions.flat()).size, n);
  });

  test(`generate(${n}) is uniquely solvable and its solution is valid`, () => {
    const { regions, solution } = generate(n);
    assert.ok(validate(regions, solution), 'returned solution must be valid');
    assert.strictEqual(countSolutions(regions, 2), 1, 'must be unique');
  });
}
