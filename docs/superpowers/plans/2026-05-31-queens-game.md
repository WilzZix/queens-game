# Queens Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side LinkedIn Queens puzzle game (vanilla JS) with auto-generated, uniquely-solvable n×n puzzles, playable in the browser and deployed to Firebase Hosting.

**Architecture:** Pure client-side. Two dependency-free, UI-independent core modules (`solver.js`, `generator.js`) are unit-tested with Node's built-in test runner. The UI layer (`game.js` + `index.html` + `styles.css`) renders the board, handles clicks, validation, timer, and controls. Generation: place a random valid solution, grow one color region per queen via randomized BFS, then verify uniqueness with the solver.

**Tech Stack:** HTML/CSS/vanilla JS (ES modules), Node `node:test` for unit tests, Firebase Hosting for deploy.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `package.json` | `"type": "module"`, `test` script (`node --test`) |
| `public/solver.js` | `solve(regions)`, `countSolutions(regions, limit)` — backtracking |
| `public/generator.js` | `generate(n)` → `{ regions, solution }`, uniquely solvable |
| `public/game.js` | Game state, rendering, click cycling, validation, timer, controls |
| `public/index.html` | Page structure, loads `game.js` as module |
| `public/styles.css` | Visual style A (colorful, playful) |
| `tests/solver.test.js` | Unit tests for solver |
| `tests/generator.test.js` | Unit tests for generator (uniqueness) |
| `firebase.json` | Firebase Hosting config (`public` dir) |

Constraint model used everywhere: one queen per row, per column, per region; no two queens in adjacent cells (king-move). Because there is exactly one queen per row and columns are distinct, diagonal/vertical adjacency can only occur between **consecutive** rows, so the adjacency check is `Math.abs(sol[r-1] - c) <= 1`.

---

## Task 1: Project scaffold + test runner

**Files:**
- Create: `package.json`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "queens-game",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 2: Verify the test runner works (no tests yet)**

Run: `npm test`
Expected: exits 0 with "tests 0" (no test files found yet, that's fine).

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: scaffold package.json with node:test runner"
```

---

## Task 2: Solver — `solve` and `countSolutions`

**Files:**
- Create: `public/solver.js`
- Test: `tests/solver.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/solver.test.js`:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '../public/solver.js'`.

- [ ] **Step 3: Write minimal implementation**

Create `public/solver.js`:

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all 3 solver tests green.

- [ ] **Step 5: Commit**

```bash
git add public/solver.js tests/solver.test.js
git commit -m "feat: add Queens solver with uniqueness counting"
```

---

## Task 3: Generator — `generate(n)`

**Files:**
- Create: `public/generator.js`
- Test: `tests/generator.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/generator.test.js`:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '../public/generator.js'`.

- [ ] **Step 3: Write minimal implementation**

Create `public/generator.js`:

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all solver + generator tests green.

- [ ] **Step 5: Commit**

```bash
git add public/generator.js tests/generator.test.js
git commit -m "feat: add uniquely-solvable puzzle generator"
```

---

## Task 4: Page structure + styles (visual style A)

**Files:**
- Create: `public/index.html`
- Create: `public/styles.css`

No automated test — verified in browser in Task 5.

- [ ] **Step 1: Create `public/index.html`**

```html
<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Queens — Logic Puzzle</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main class="app">
    <h1 class="title">👑 Queens</h1>

    <div class="sizes" id="sizes">
      <button class="chip" data-size="7">7×7</button>
      <button class="chip active" data-size="8">8×8</button>
      <button class="chip" data-size="9">9×9</button>
    </div>

    <div class="timer" id="timer">⏱ 00:00</div>

    <div class="board-wrap">
      <div class="board" id="board"></div>
      <div class="win-banner hidden" id="win">🎉 G'alaba!</div>
    </div>

    <div class="panel">
      <button class="btn ghost" id="undo">↶ Undo</button>
      <button class="btn ghost" id="clear">✕ Tozalash</button>
      <button class="btn" id="hint">💡 Hint</button>
      <button class="btn" id="solve">👑 Yechib ber</button>
      <button class="btn primary" id="new">🔄 Yangi</button>
    </div>

    <p class="rules">
      Har qator, ustun va rangda bitta 👑. Queen'lar bir-biriga tegmasin.
      Katakni bos: bo'sh → ✕ → 👑 → bo'sh.
    </p>
  </main>

  <script type="module" src="game.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `public/styles.css`**

```css
:root {
  --bg: #f8fafc;
  --ink: #1e293b;
  --indigo: #6366f1;
  --gridline: #cbd5e1;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  background: var(--bg);
  color: var(--ink);
  display: flex;
  justify-content: center;
}

.app {
  width: 100%;
  max-width: 560px;
  padding: 20px 16px 40px;
  text-align: center;
}

.title { font-size: 32px; margin: 8px 0 16px; }

.sizes { display: flex; gap: 8px; justify-content: center; margin-bottom: 14px; }

.chip {
  padding: 6px 16px;
  border: none;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.chip.active { background: var(--indigo); color: #fff; }

.timer { font-size: 24px; font-weight: 700; letter-spacing: 1px; margin-bottom: 12px; color: var(--indigo); }

.board-wrap { position: relative; display: inline-block; }

.board {
  display: grid;
  gap: 3px;
  background: var(--gridline);
  padding: 6px;
  border-radius: 14px;
  touch-action: manipulation;
}

.cell {
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(16px, 6vw, 28px);
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  transition: transform 0.05s ease;
}
.cell:active { transform: scale(0.92); }
.cell.conflict { outline: 3px solid #ef4444; outline-offset: -3px; }

.win-banner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  background: rgba(99, 102, 241, 0.85);
  border-radius: 14px;
}
.hidden { display: none; }

.panel { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin: 18px 0 12px; }

.btn {
  padding: 9px 16px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: var(--indigo);
  color: #fff;
}
.btn.ghost { background: #e2e8f0; color: #334155; }
.btn.primary { background: #10b981; }
.btn:disabled { opacity: 0.5; cursor: default; }

.rules { font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 16px; }
```

- [ ] **Step 3: Commit**

```bash
git add public/index.html public/styles.css
git commit -m "feat: add page structure and style A"
```

---

## Task 5: Game logic + controls (`game.js`)

**Files:**
- Create: `public/game.js`

UI module — verified manually in the browser (Step 2). No automated test (logic it depends on is already tested in Tasks 2–3).

- [ ] **Step 1: Create `public/game.js`**

```js
import { generate } from './generator.js';
import { solve } from './solver.js';

const EMPTY = 0;
const MARK = 1; // ✕
const QUEEN = 2; // 👑

const PALETTE = [
  '#fca5a5', '#fdba74', '#fde047', '#86efac', '#67e8f9',
  '#a5b4fc', '#f0abfc', '#d6d3d1', '#f9a8d4', '#5eead4',
];

const boardEl = document.getElementById('board');
const timerEl = document.getElementById('timer');
const winEl = document.getElementById('win');
const sizesEl = document.getElementById('sizes');

const game = {
  n: 8,
  regions: [],
  solution: [],
  state: [],
  cellEls: [],
  history: [],
  seconds: 0,
  timerId: null,
  running: false,
  won: false,
};

function formatTime(s) {
  const m = String(Math.floor(s / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `⏱ ${m}:${sec}`;
}

function stopTimer() {
  if (game.timerId) clearInterval(game.timerId);
  game.timerId = null;
  game.running = false;
}

function startTimer() {
  if (game.running) return;
  game.running = true;
  game.timerId = setInterval(() => {
    game.seconds++;
    timerEl.textContent = formatTime(game.seconds);
  }, 1000);
}

function glyph(v) {
  if (v === QUEEN) return '👑';
  if (v === MARK) return '✕';
  return '';
}

function newGame(n) {
  stopTimer();
  game.n = n;
  const { regions, solution } = generate(n);
  game.regions = regions;
  game.solution = solution;
  game.state = Array.from({ length: n }, () => new Array(n).fill(EMPTY));
  game.history = [];
  game.seconds = 0;
  game.won = false;
  timerEl.textContent = formatTime(0);
  winEl.classList.add('hidden');
  buildBoard();
  render();
}

function buildBoard() {
  const n = game.n;
  boardEl.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
  boardEl.innerHTML = '';
  game.cellEls = [];
  for (let r = 0; r < n; r++) {
    const row = [];
    for (let c = 0; c < n; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.style.background = PALETTE[game.regions[r][c] % PALETTE.length];
      cell.addEventListener('click', () => onCellClick(r, c));
      boardEl.appendChild(cell);
      row.push(cell);
    }
    game.cellEls.push(row);
  }
}

function onCellClick(r, c) {
  if (game.won) return;
  startTimer();
  game.history.push({ r, c, prev: game.state[r][c] });
  game.state[r][c] = (game.state[r][c] + 1) % 3; // empty -> mark -> queen -> empty
  render();
}

// Returns a Set of "r,c" keys for queens that violate a rule.
function findConflicts() {
  const n = game.n;
  const conflicts = new Set();
  const queens = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (game.state[r][c] === QUEEN) queens.push([r, c]);
    }
  }
  const key = (r, c) => `${r},${c}`;
  const bump = (a, b) => { conflicts.add(key(...a)); conflicts.add(key(...b)); };
  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      const [r1, c1] = queens[i];
      const [r2, c2] = queens[j];
      const sameRow = r1 === r2;
      const sameCol = c1 === c2;
      const sameRegion = game.regions[r1][c1] === game.regions[r2][c2];
      const adjacent = Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;
      if (sameRow || sameCol || sameRegion || adjacent) bump(queens[i], queens[j]);
    }
  }
  return { conflicts, queenCount: queens.length };
}

function render() {
  const n = game.n;
  const { conflicts, queenCount } = findConflicts();
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const cell = game.cellEls[r][c];
      cell.textContent = glyph(game.state[r][c]);
      cell.classList.toggle('conflict', conflicts.has(`${r},${c}`));
    }
  }
  if (queenCount === n && conflicts.size === 0) onWin();
}

function onWin() {
  game.won = true;
  stopTimer();
  winEl.classList.remove('hidden');
}

function undo() {
  if (game.won || game.history.length === 0) return;
  const { r, c, prev } = game.history.pop();
  game.state[r][c] = prev;
  render();
}

function clearBoard() {
  if (game.won) return;
  game.state = Array.from({ length: game.n }, () => new Array(game.n).fill(EMPTY));
  game.history = [];
  render();
}

// Reveal one correct queen not yet placed.
function hint() {
  if (game.won) return;
  startTimer();
  for (let r = 0; r < game.n; r++) {
    const c = game.solution[r];
    if (game.state[r][c] !== QUEEN) {
      game.history.push({ r, c, prev: game.state[r][c] });
      game.state[r][c] = QUEEN;
      render();
      return;
    }
  }
}

function solveAll() {
  const sol = solve(game.regions);
  if (!sol) return;
  game.state = Array.from({ length: game.n }, () => new Array(game.n).fill(EMPTY));
  for (let r = 0; r < game.n; r++) game.state[r][sol[r]] = QUEEN;
  render();
}

document.getElementById('undo').addEventListener('click', undo);
document.getElementById('clear').addEventListener('click', clearBoard);
document.getElementById('hint').addEventListener('click', hint);
document.getElementById('solve').addEventListener('click', solveAll);
document.getElementById('new').addEventListener('click', () => newGame(game.n));

sizesEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  for (const chip of sizesEl.querySelectorAll('.chip')) chip.classList.remove('active');
  btn.classList.add('active');
  newGame(Number(btn.dataset.size));
});

newGame(8);
```

- [ ] **Step 2: Manual browser test**

Run a static server from the project root:
```bash
npx --yes serve public -l 5050
```
Open `http://localhost:5050` and verify:
- Board renders as a square grid with colored regions; default 8×8.
- Clicking a cell cycles empty → ✕ → 👑 → empty.
- Two queens in the same row/column/region or adjacent get a red outline.
- Timer starts on first interaction.
- **Undo** reverts the last click; **Tozalash** clears the board.
- **Hint** places one correct queen; **Yechib ber** fills the full solution.
- Switching 7×7 / 8×8 / 9×9 loads a new board of that size.
- Completing the puzzle correctly shows the "🎉 G'alaba!" banner and stops the timer.

Stop the server with Ctrl+C when done.

- [ ] **Step 3: Commit**

```bash
git add public/game.js
git commit -m "feat: add game UI, validation, timer, and controls"
```

---

## Task 6: Firebase Hosting config

**Files:**
- Create: `firebase.json`

- [ ] **Step 1: Create `firebase.json`**

```json
{
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add firebase.json
git commit -m "chore: add Firebase Hosting config"
```

- [ ] **Step 3: Deploy (manual, requires Firebase auth)**

This step needs the user's Firebase account and an existing/new Firebase project. Do **not** run unattended.
```bash
# One-time: associate a project
npx --yes firebase-tools use --add
# Deploy
npx --yes firebase-tools deploy --only hosting
```
Expected: prints a public `https://<project>.web.app` URL. Confirm the game loads and plays there.

---

## Self-Review Notes

- **Spec coverage:** rules → Tasks 2/5 (validation); sizes 7/8/9 → Task 5 size selector; generation 3-step + uniqueness → Task 3; solver/hint/solve → Tasks 2/5; timer/undo/clear/error-highlight → Task 5; style A → Task 4; Firebase Hosting → Task 6. All covered.
- **Type consistency:** `regions` is `number[][]` (region id per cell), `solution`/`sol` is `number[]` (`sol[row]=col`) everywhere; `generate` returns `{ regions, solution }`; state values use `EMPTY/MARK/QUEEN` constants consistently.
- **Adjacency rule:** solver/generator rely on consecutive-row check (valid because one queen per row + distinct columns); the UI `findConflicts` uses the full king-move check since user placements may violate the one-per-row assumption.
