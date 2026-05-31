import { generate } from './generator.js';
import { solve } from './solver.js';
import { setupThemeToggle } from './theme.js';
import { trackGameStart, trackGameWin, trackGameSolve, trackSizeChange } from './analytics.js';
import { recordOutcome } from './progress.js';

const EMPTY = 0;
const MARK = 1; // ✕
const QUEEN = 2; // 👑

const PALETTE = [
  '#fca5a5', '#fdba74', '#fde047', '#86efac', '#67e8f9',
  '#a5b4fc', '#f0abfc', '#d6d3d1', '#f9a8d4', '#5eead4',
];

const WIN_TEXT = "🎉 G'alaba!";
const SOLVED_TEXT = '👑 Yechildi';

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
  outcomeLogged: false,
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
  let puzzle;
  try {
    puzzle = generate(n);
  } catch (err) {
    winEl.textContent = '⚠️ Jumboq yaratilmadi, qayta urining';
    winEl.classList.remove('hidden');
    return;
  }
  game.regions = puzzle.regions;
  game.solution = puzzle.solution;
  game.state = Array.from({ length: n }, () => new Array(n).fill(EMPTY));
  game.history = [];
  game.seconds = 0;
  game.won = false;
  game.outcomeLogged = false;
  timerEl.textContent = formatTime(0);
  winEl.textContent = WIN_TEXT;
  winEl.classList.add('hidden');
  buildBoard();
  render();
  trackGameStart(n);
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

// Returns a Set of "r,c" keys for queens that violate a rule, plus the queen count.
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
  if (!game.outcomeLogged) {
    game.outcomeLogged = true;
    trackGameWin(game.n, game.seconds * 1000);
    recordOutcome({ size: game.n, timeMs: game.seconds * 1000, result: 'win' });
  }
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
  if (game.won) return;
  const sol = solve(game.regions);
  if (!sol) return;
  game.state = Array.from({ length: game.n }, () => new Array(game.n).fill(EMPTY));
  game.history = [];
  for (let r = 0; r < game.n; r++) game.state[r][sol[r]] = QUEEN;
  stopTimer();
  winEl.textContent = SOLVED_TEXT;
  game.outcomeLogged = true;
  trackGameSolve(game.n);
  recordOutcome({ size: game.n, timeMs: game.seconds * 1000, result: 'solve' });
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
  const size = Number(btn.dataset.size);
  trackSizeChange(size);
  newGame(size);
});

setupThemeToggle(document.getElementById('themeToggle'));

newGame(8);
