# Cloud Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist each signed-in player's stats (games played/won, per-size best times, win streaks, and per-game history) to Firestore and show them in a stats view.

**Architecture:** Pure, fully unit-tested aggregation lives in `public/stats.js` (`emptyStats`, `applyResult`, `formatBest`). `public/progress.js` is the Firestore glue: a lazy `getDb()` (added to `firebase.js`) loads the SDK dynamically; `recordOutcome()` reads the user doc, applies the pure helper, writes it back, and appends a history doc — all fire-and-forget so gameplay never blocks. `game.js` calls `recordOutcome()` on win/solve. `public/stats-ui.js` renders the stats view; `app.js` adds nav between game and stats. `firestore.rules` restricts each user to their own `users/{uid}` tree.

**Tech Stack:** Vanilla HTML/CSS/JS, browser-native ES modules, Firebase modular CDN SDK v12.14.0 (Firestore, loaded via dynamic `import()`).

**Spec:** `docs/superpowers/specs/2026-05-31-queens-cloud-features-design.md` (sub-project 4).

**Firestore data model:**
```
users/{uid} {
  played, won,
  perSize: { "7": {played, won, best}, "8": {...}, "9": {...} },  // best = fastest win ms, null until first win
  currentStreak, longestStreak, updatedAt
}
users/{uid}/games/{gameId} { size, timeMs, result: "win" | "solve", playedAt }
```
A **win** increments played/won + per-size played/won, may lower per-size `best`, increments `currentStreak`, bumps `longestStreak`, appends a `win` history doc. A **solve/give-up** increments played + per-size played, resets `currentStreak` to 0, leaves `won`/`best` untouched, appends a `solve` history doc.

**Manual prerequisites (USER, before browser QA in Task 8):** In the Firebase console for `solve-queens`, (1) **create a Firestore database** (Build → Firestore Database → Create, production mode), and (2) ensure the auth providers from sub-project 3 are enabled. Then deploy the rules from Task 7. Code can be written/committed before this.

**Testing note:** Only `stats.js` is pure and gets `node:test` units (current suite: 24 tests → 31 after Task 1). Firestore/DOM glue (`progress.js`, `stats-ui.js`, `app.js`, `game.js` wiring) is verified by browser QA. New non-pure modules must not be imported by any test file.

---

### Task 1: `stats.js` — pure aggregation helpers (TDD)

Framework-free, immutable helpers. `applyResult` returns a NEW stats object (never mutates
its input) and copies only the known fields, so a Firestore `updatedAt`/`Timestamp` on the
input is dropped (re-added in `progress.js`). This keeps the module pure and Node-testable.

**Files:**
- Create: `public/stats.js`
- Test: `tests/stats.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/stats.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyStats, applyResult, formatBest } from "../public/stats.js";

test("emptyStats has zeroed totals and three per-size cells", () => {
  const s = emptyStats();
  assert.equal(s.played, 0);
  assert.equal(s.won, 0);
  assert.equal(s.currentStreak, 0);
  assert.equal(s.longestStreak, 0);
  assert.deepEqual(Object.keys(s.perSize), ["7", "8", "9"]);
  assert.deepEqual(s.perSize["8"], { played: 0, won: 0, best: null });
});

test("applyResult does not mutate its input", () => {
  const s = emptyStats();
  applyResult(s, { size: 8, timeMs: 5000, result: "win" });
  assert.equal(s.played, 0);
  assert.equal(s.perSize["8"].played, 0);
});

test("a win increments totals, sets first best, and bumps streaks", () => {
  const s = applyResult(emptyStats(), { size: 8, timeMs: 5000, result: "win" });
  assert.equal(s.played, 1);
  assert.equal(s.won, 1);
  assert.equal(s.perSize["8"].played, 1);
  assert.equal(s.perSize["8"].won, 1);
  assert.equal(s.perSize["8"].best, 5000);
  assert.equal(s.currentStreak, 1);
  assert.equal(s.longestStreak, 1);
});

test("a faster win lowers best; a slower win does not", () => {
  let s = applyResult(emptyStats(), { size: 8, timeMs: 5000, result: "win" });
  s = applyResult(s, { size: 8, timeMs: 3000, result: "win" });
  assert.equal(s.perSize["8"].best, 3000);
  s = applyResult(s, { size: 8, timeMs: 9000, result: "win" });
  assert.equal(s.perSize["8"].best, 3000);
});

test("a solve increments played only and resets the current streak", () => {
  let s = applyResult(emptyStats(), { size: 8, timeMs: 5000, result: "win" });
  s = applyResult(s, { size: 8, timeMs: 4000, result: "solve" });
  assert.equal(s.played, 2);
  assert.equal(s.won, 1);
  assert.equal(s.perSize["8"].played, 2);
  assert.equal(s.perSize["8"].won, 1);
  assert.equal(s.perSize["8"].best, 5000);
  assert.equal(s.currentStreak, 0);
  assert.equal(s.longestStreak, 1);
});

test("longestStreak retains the peak after a reset", () => {
  let s = emptyStats();
  s = applyResult(s, { size: 7, timeMs: 1000, result: "win" });
  s = applyResult(s, { size: 7, timeMs: 1000, result: "win" });
  s = applyResult(s, { size: 7, timeMs: 1000, result: "solve" });
  s = applyResult(s, { size: 7, timeMs: 1000, result: "win" });
  assert.equal(s.currentStreak, 1);
  assert.equal(s.longestStreak, 2);
});

test("formatBest renders ms as mm:ss, or an em dash for null", () => {
  assert.equal(formatBest(null), "—");
  assert.equal(formatBest(undefined), "—");
  assert.equal(formatBest(65000), "01:05");
  assert.equal(formatBest(5000), "00:05");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd ~/StudioProjects/queens-game && node --test tests/stats.test.js`
Expected: FAIL — cannot find module `../public/stats.js`.

- [ ] **Step 3: Write the implementation**

Create `public/stats.js`:

```js
// A fresh, zeroed stats object. best is null until the first win at that size.
export function emptyStats() {
  return {
    played: 0,
    won: 0,
    perSize: {
      "7": { played: 0, won: 0, best: null },
      "8": { played: 0, won: 0, best: null },
      "9": { played: 0, won: 0, best: null },
    },
    currentStreak: 0,
    longestStreak: 0,
  };
}

// Applies one game result to a stats object and returns a NEW object (pure, immutable).
// Copies only known fields, so any extra fields on the input (e.g. a Firestore updatedAt)
// are intentionally dropped. result is "win" or "solve".
export function applyResult(stats, { size, timeMs, result }) {
  const key = String(size);
  const perSize = { ...stats.perSize };
  const prev = perSize[key] || { played: 0, won: 0, best: null };
  const cell = { played: prev.played + 1, won: prev.won, best: prev.best };
  const next = {
    played: stats.played + 1,
    won: stats.won,
    perSize,
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
  };
  if (result === "win") {
    next.won += 1;
    cell.won += 1;
    if (cell.best === null || timeMs < cell.best) cell.best = timeMs;
    next.currentStreak += 1;
    if (next.currentStreak > next.longestStreak) next.longestStreak = next.currentStreak;
  } else {
    next.currentStreak = 0;
  }
  perSize[key] = cell;
  return next;
}

// Formats a best-time in ms as "mm:ss", or "—" when there is no time yet.
export function formatBest(ms) {
  if (ms === null || ms === undefined) return "—";
  const s = Math.round(ms / 1000);
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${m}:${sec}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd ~/StudioProjects/queens-game && node --test tests/stats.test.js`
Expected: PASS — 7 tests.

- [ ] **Step 5: Confirm the full suite still passes**

Run: `cd ~/StudioProjects/queens-game && node --test`
Expected: 31 pass / 0 fail (24 existing + 7 new).

- [ ] **Step 6: Commit**

```bash
cd ~/StudioProjects/queens-game
git add public/stats.js tests/stats.test.js
git commit -m "feat: pure stats aggregation helpers (applyResult, formatBest)"
```

---

### Task 2: Extend `firebase.js` with a lazy `getDb()`

Mirror of `getAuth()`: a memoized loader that dynamically imports `firebase-firestore` and
returns `{ db, sdk }`. No top-level remote import.

**Files:**
- Modify: `public/firebase.js`

- [ ] **Step 1: Append `getDb()` to the end of `public/firebase.js`**

The file currently ends with the closing brace of `getAuth()`:

```js
export function getAuth() {
  if (!authPromise) {
    authPromise = (async () => {
      const app = await getApp();
      const sdk = await import(sdkUrl("auth"));
      return { auth: sdk.getAuth(app), sdk };
    })();
  }
  return authPromise;
}
```

Append below it (after that closing brace):

```js

let dbPromise = null;

// Lazily loads firebase-firestore and the Firestore instance exactly once.
// Resolves to { db, sdk } where sdk is the firebase-firestore module namespace
// (doc, getDoc, setDoc, collection, addDoc, query, orderBy, limit, serverTimestamp, ...).
// Rejects only if the SDK cannot be loaded; callers handle that.
export function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const app = await getApp();
      const sdk = await import(sdkUrl("firestore"));
      return { db: sdk.getFirestore(app), sdk };
    })();
  }
  return dbPromise;
}
```

- [ ] **Step 2: Confirm it imports cleanly in Node without a network call**

Run: `cd ~/StudioProjects/queens-game && node -e "import('./public/firebase.js').then(m => console.log(typeof m.getDb, typeof m.getAuth, typeof m.getApp))"`
Expected: prints `function function function` (no network — `getDb()` is only referenced).

- [ ] **Step 3: Confirm existing tests still pass**

Run: `cd ~/StudioProjects/queens-game && node --test`
Expected: 31 pass / 0 fail.

- [ ] **Step 4: Commit**

```bash
cd ~/StudioProjects/queens-game
git add public/firebase.js
git commit -m "feat: lazy getDb firestore loader in firebase foundation"
```

---

### Task 3: `progress.js` — Firestore reads/writes via the pure helpers

Reads/writes `users/{uid}` and its `games` subcollection. `recordOutcome()` is the
fire-and-forget entry point game code calls: it resolves the current user, and on success
swallows errors (cloud progress is best-effort; local play must never block).

**Files:**
- Create: `public/progress.js`

- [ ] **Step 1: Create `public/progress.js` with exactly this content**

```js
import { getDb } from "./firebase.js";
import { getCurrentUser } from "./session.js";
import { emptyStats, applyResult } from "./stats.js";

// Reads the user's stats doc, or returns a fresh empty stats object if none exists.
export async function loadStats(uid) {
  const { db, sdk } = await getDb();
  const snap = await sdk.getDoc(sdk.doc(db, "users", uid));
  return snap.exists() ? snap.data() : emptyStats();
}

// Returns the most recent games (default 10), newest first.
export async function loadRecentGames(uid, max = 10) {
  const { db, sdk } = await getDb();
  const q = sdk.query(
    sdk.collection(db, "users", uid, "games"),
    sdk.orderBy("playedAt", "desc"),
    sdk.limit(max),
  );
  const snap = await sdk.getDocs(q);
  return snap.docs.map((d) => d.data());
}

// Reads current stats, applies the result, writes the merged user doc, and appends a
// history doc. Returns the new stats object. Throws on failure (callers decide whether to swallow).
export async function recordResult(uid, result) {
  const { db, sdk } = await getDb();
  const userRef = sdk.doc(db, "users", uid);
  const snap = await sdk.getDoc(userRef);
  const current = snap.exists() ? snap.data() : emptyStats();
  const next = applyResult(current, result);
  next.updatedAt = sdk.serverTimestamp();
  await sdk.setDoc(userRef, next);
  await sdk.addDoc(sdk.collection(db, "users", uid, "games"), {
    size: result.size,
    timeMs: result.timeMs,
    result: result.result,
    playedAt: sdk.serverTimestamp(),
  });
  return next;
}

// Fire-and-forget entry point for game code. No-op when logged out; never throws.
export function recordOutcome(result) {
  const user = getCurrentUser();
  if (!user) return;
  recordResult(user.uid, result).catch((err) => console.warn("Progress save failed:", err));
}
```

- [ ] **Step 2: Confirm it imports cleanly in Node without a network call**

Run: `cd ~/StudioProjects/queens-game && node -e "import('./public/progress.js').then(m => console.log(typeof m.loadStats, typeof m.loadRecentGames, typeof m.recordResult, typeof m.recordOutcome))"`
Expected: prints `function function function function` (no network — nothing is invoked).

- [ ] **Step 3: Confirm existing tests still pass**

Run: `cd ~/StudioProjects/queens-game && node --test`
Expected: 31 pass / 0 fail.

- [ ] **Step 4: Commit**

```bash
cd ~/StudioProjects/queens-game
git add public/progress.js
git commit -m "feat: firestore progress reads/writes via pure stats helpers"
```

---

### Task 4: Record outcomes from `game.js`

Call `recordOutcome()` alongside the existing analytics calls — inside the same
`outcomeLogged` guard for wins, and in `solveAll()` for solves.

**Files:**
- Modify: `public/game.js`

- [ ] **Step 1: Add the import**

The imports at the top of `public/game.js` currently are:

```js
import { generate } from './generator.js';
import { solve } from './solver.js';
import { setupThemeToggle } from './theme.js';
import { trackGameStart, trackGameWin, trackGameSolve, trackSizeChange } from './analytics.js';
```

Add a fifth import directly below them:

```js
import { recordOutcome } from './progress.js';
```

- [ ] **Step 2: Record a win in `onWin()`**

`onWin()` currently reads:

```js
function onWin() {
  game.won = true;
  stopTimer();
  winEl.classList.remove('hidden');
  if (!game.outcomeLogged) {
    game.outcomeLogged = true;
    trackGameWin(game.n, game.seconds * 1000);
  }
}
```

Change it to:

```js
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
```

- [ ] **Step 3: Record a solve in `solveAll()`**

`solveAll()` currently contains:

```js
  game.outcomeLogged = true;
  trackGameSolve(game.n);
  render();
}
```

Change it to:

```js
  game.outcomeLogged = true;
  trackGameSolve(game.n);
  recordOutcome({ size: game.n, timeMs: game.seconds * 1000, result: 'solve' });
  render();
}
```

- [ ] **Step 4: Confirm existing tests still pass**

Run: `cd ~/StudioProjects/queens-game && node --test`
Expected: 31 pass / 0 fail (game.js is not imported by tests; regression guard).

- [ ] **Step 5: Commit**

```bash
cd ~/StudioProjects/queens-game
git add public/game.js
git commit -m "feat: record win/solve outcomes to cloud progress"
```

---

### Task 5: Stats view markup, nav buttons, and styles

Add a `#view-stats` section (with an empty `#statsBody` container the renderer fills), a
"Statistika" nav button in the user bar, a "back to game" button, register the new view in
`view.js`, and style it. No JS rendering logic here — that is Task 6.

**Files:**
- Modify: `public/index.html`
- Modify: `public/view.js`
- Modify: `public/styles.css`

- [ ] **Step 1: Add the stats nav button to the user bar in `index.html`**

The user bar currently reads:

```html
    <div class="user-bar hidden" id="userBar">
      <span class="user-email" id="userEmail"></span>
      <button class="link-btn" id="signOutBtn" type="button">Chiqish</button>
    </div>
```

Change it to:

```html
    <div class="user-bar hidden" id="userBar">
      <span class="user-email" id="userEmail"></span>
      <button class="link-btn" id="statsBtn" type="button">Statistika</button>
      <button class="link-btn" id="signOutBtn" type="button">Chiqish</button>
    </div>
```

- [ ] **Step 2: Add the stats view section in `index.html`**

Directly AFTER the closing `</section>` of `#view-game` (the section that ends with the
`.rules` paragraph) and BEFORE the closing `</main>`, insert:

```html
    <section id="view-stats" class="view hidden">
      <h2 class="stats-title">📊 Statistika</h2>
      <div id="statsBody" class="stats-body"></div>
      <button class="btn ghost back-btn" id="backToGameBtn" type="button">← O'yinga qaytish</button>
    </section>
```

- [ ] **Step 3: Register the stats view in `public/view.js`**

The file currently reads:

```js
const VIEW_IDS = { auth: "view-auth", game: "view-game" };

// Shows exactly one view ("auth" or "game") and hides the rest.
export function setView(name) {
  for (const [key, id] of Object.entries(VIEW_IDS)) {
    const elView = document.getElementById(id);
    if (elView) elView.classList.toggle("hidden", key !== name);
  }
}
```

Change it to:

```js
const VIEW_IDS = { auth: "view-auth", game: "view-game", stats: "view-stats" };

// Shows exactly one view ("auth", "game", or "stats") and hides the rest.
export function setView(name) {
  for (const [key, id] of Object.entries(VIEW_IDS)) {
    const elView = document.getElementById(id);
    if (elView) elView.classList.toggle("hidden", key !== name);
  }
}
```

- [ ] **Step 4: Append stats styles to `public/styles.css`**

Add to the end of `public/styles.css`:

```css
.stats-title { font-size: 24px; margin: 8px 0 18px; }

.stats-totals {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--chip-bg);
  color: var(--chip-ink);
  border-radius: 12px;
  padding: 12px 14px;
  min-width: 84px;
}
.stat-value { font-size: 22px; font-weight: 800; }
.stat-label { font-size: 12px; opacity: 0.85; margin-top: 2px; }

.stats-persize { display: flex; flex-direction: column; gap: 8px; max-width: 360px; margin: 0 auto 8px; }

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--gridline);
  border-radius: 10px;
  font-size: 14px;
}
.stat-size { font-weight: 700; }
.stat-detail { color: var(--rules-ink); }

.stats-subtitle { font-size: 16px; margin: 20px 0 10px; }

.stats-history { display: flex; flex-direction: column; gap: 6px; max-width: 360px; margin: 0 auto; }

.hist-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--btn-ghost-bg);
  color: var(--btn-ghost-ink);
  font-size: 13px;
}

.stats-empty { color: var(--rules-ink); font-size: 14px; }

.back-btn { margin-top: 22px; }
```

- [ ] **Step 5: Confirm tests still pass (regression guard)**

Run: `cd ~/StudioProjects/queens-game && node --test`
Expected: 31 pass / 0 fail.

- [ ] **Step 6: Commit**

```bash
cd ~/StudioProjects/queens-game
git add public/index.html public/view.js public/styles.css
git commit -m "feat: stats view markup, nav button, and styles"
```

---

### Task 6: `stats-ui.js` — render the stats view; wire nav in `app.js`

`stats-ui.js` builds the stats DOM from a stats object + recent games (using `formatBest`).
`app.js` tracks the current uid, loads + renders stats when "Statistika" is clicked, and
returns to the game on "back".

**Files:**
- Create: `public/stats-ui.js`
- Modify: `public/app.js`

- [ ] **Step 1: Create `public/stats-ui.js` with exactly this content**

```js
import { formatBest } from "./stats.js";

const SIZES = ["7", "8", "9"];

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function statCard(label, value) {
  const card = el("div", "stat-card");
  card.appendChild(el("div", "stat-value", String(value)));
  card.appendChild(el("div", "stat-label", label));
  return card;
}

// Renders stats + recent games into #statsBody. Pass stats=null to show a load-error notice.
export function renderStats(stats, games) {
  const body = document.getElementById("statsBody");
  if (!body) return;
  body.innerHTML = "";

  if (!stats) {
    body.appendChild(el("p", "stats-empty", "Statistikani yuklab bo'lmadi."));
    return;
  }

  const winRate = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;
  const totals = el("div", "stats-totals");
  totals.appendChild(statCard("O'ynalgan", stats.played));
  totals.appendChild(statCard("Yutilgan", stats.won));
  totals.appendChild(statCard("Foiz", winRate + "%"));
  totals.appendChild(statCard("Joriy seriya", stats.currentStreak));
  totals.appendChild(statCard("Eng uzun", stats.longestStreak));
  body.appendChild(totals);

  const perSize = el("div", "stats-persize");
  for (const size of SIZES) {
    const ps = (stats.perSize && stats.perSize[size]) || { played: 0, won: 0, best: null };
    const row = el("div", "stat-row");
    row.appendChild(el("span", "stat-size", size + "×" + size));
    row.appendChild(el("span", "stat-detail", "Eng yaxshi: " + formatBest(ps.best)));
    row.appendChild(el("span", "stat-detail", ps.won + "/" + ps.played));
    perSize.appendChild(row);
  }
  body.appendChild(perSize);

  body.appendChild(el("h3", "stats-subtitle", "So'nggi o'yinlar"));
  if (!games || games.length === 0) {
    body.appendChild(el("p", "stats-empty", "Hali o'yinlar yo'q."));
    return;
  }
  const list = el("div", "stats-history");
  for (const g of games) {
    const row = el("div", "hist-row");
    const label = g.result === "win" ? "👑 " + formatBest(g.timeMs) : "🏳 Yechib berildi";
    row.appendChild(el("span", "hist-size", g.size + "×" + g.size));
    row.appendChild(el("span", "hist-result", label));
    list.appendChild(row);
  }
  body.appendChild(list);
}
```

- [ ] **Step 2: Wire nav into `public/app.js`**

`app.js` currently reads:

```js
import "./game.js";
import { initSession, signOutUser } from "./session.js";
import { mountAuthUi } from "./auth-ui.js";
import { setView } from "./view.js";

const userBar = document.getElementById("userBar");
const userEmail = document.getElementById("userEmail");
const signOutBtn = document.getElementById("signOutBtn");

mountAuthUi();

if (signOutBtn) {
  signOutBtn.addEventListener("click", async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.warn("Sign out failed:", err);
    }
  });
}

initSession((user) => {
  if (user) {
    setView("game");
    if (userBar) userBar.classList.remove("hidden");
    if (userEmail) userEmail.textContent = user.email || "Hisob";
  } else {
    setView("auth");
    if (userBar) userBar.classList.add("hidden");
    if (userEmail) userEmail.textContent = "";
  }
});
```

Replace the ENTIRE file with:

```js
import "./game.js";
import { initSession, signOutUser } from "./session.js";
import { mountAuthUi } from "./auth-ui.js";
import { setView } from "./view.js";
import { loadStats, loadRecentGames } from "./progress.js";
import { renderStats } from "./stats-ui.js";

const userBar = document.getElementById("userBar");
const userEmail = document.getElementById("userEmail");
const signOutBtn = document.getElementById("signOutBtn");
const statsBtn = document.getElementById("statsBtn");
const backToGameBtn = document.getElementById("backToGameBtn");

let currentUid = null;

mountAuthUi();

if (signOutBtn) {
  signOutBtn.addEventListener("click", async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.warn("Sign out failed:", err);
    }
  });
}

if (statsBtn) {
  statsBtn.addEventListener("click", async () => {
    if (!currentUid) return;
    setView("stats");
    try {
      const [stats, games] = await Promise.all([
        loadStats(currentUid),
        loadRecentGames(currentUid),
      ]);
      renderStats(stats, games);
    } catch (err) {
      console.warn("Stats load failed:", err);
      renderStats(null, []);
    }
  });
}

if (backToGameBtn) {
  backToGameBtn.addEventListener("click", () => setView("game"));
}

initSession((user) => {
  currentUid = user ? user.uid : null;
  if (user) {
    setView("game");
    if (userBar) userBar.classList.remove("hidden");
    if (userEmail) userEmail.textContent = user.email || "Hisob";
  } else {
    setView("auth");
    if (userBar) userBar.classList.add("hidden");
    if (userEmail) userEmail.textContent = "";
  }
});
```

- [ ] **Step 3: Confirm `stats-ui.js` imports cleanly in Node without a network call**

Run: `cd ~/StudioProjects/queens-game && node -e "import('./public/stats-ui.js').then(m => console.log(typeof m.renderStats))"`
Expected: prints `function` (import does not touch the DOM — `renderStats` is not called).

- [ ] **Step 4: Confirm existing tests still pass**

Run: `cd ~/StudioProjects/queens-game && node --test`
Expected: 31 pass / 0 fail.

- [ ] **Step 5: Commit**

```bash
cd ~/StudioProjects/queens-game
git add public/stats-ui.js public/app.js
git commit -m "feat: render stats view and wire game/stats navigation"
```

---

### Task 7: `firestore.rules` + `firebase.json` Firestore config

Lock each user to their own `users/{uid}` document and `games` subcollection, and register
the rules file so `firebase deploy` includes it.

**Files:**
- Create: `firestore.rules`
- Modify: `firebase.json`

- [ ] **Step 1: Create `firestore.rules` with exactly this content**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;

      match /games/{gameId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```

- [ ] **Step 2: Add a `firestore` block to `firebase.json`**

The file currently is:

```json
{
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  }
}
```

Change it to (add the `firestore` key; keep `hosting` exactly as is):

```json
{
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  },
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

- [ ] **Step 3: Verify `firebase.json` is valid JSON**

Run: `cd ~/StudioProjects/queens-game && node -e "console.log(JSON.parse(require('fs').readFileSync('firebase.json','utf8')).firestore.rules)"`
Expected: prints `firestore.rules`.

- [ ] **Step 4: Confirm tests still pass (regression guard)**

Run: `cd ~/StudioProjects/queens-game && node --test`
Expected: 31 pass / 0 fail.

- [ ] **Step 5: Commit**

```bash
cd ~/StudioProjects/queens-game
git add firestore.rules firebase.json
git commit -m "feat: firestore security rules restricting each user to their own data"
```

---

### Task 8: Browser QA + guide Firestore setup & deploy (controller / user)

- [ ] **Step 1: USER creates the Firestore database**

In the Firebase console for `solve-queens`: Build → Firestore Database → Create database →
production mode → pick a location. (Without this, reads/writes fail and the stats view shows
"Statistikani yuklab bo'lmadi." while gameplay stays unaffected.)

- [ ] **Step 2: USER deploys the rules**

```bash
cd ~/StudioProjects/queens-game
npx --yes firebase-tools deploy --only firestore:rules
```

(Hosting can be deployed in the same pass with `--only hosting,firestore:rules`.)

- [ ] **Step 3: Serve and load the page**

Start the preview (Claude Preview `preview_start` "queens", or `npx --yes serve public -l 5050`).

- [ ] **Step 4: Sign in, play a game to a win, and verify it persists**

Log in (email/password or Google). Play a board to completion (or use Hint repeatedly to
place the full solution) so a win fires. Click **Statistika**: confirm O'ynalgan/Yutilgan
increment, the per-size best time shows for the size you won, the streak shows 1, and the
win appears under "So'nggi o'yinlar". Reload the page, sign in again, open Statistika, and
confirm the numbers persisted (proving the Firestore round-trip).

- [ ] **Step 5: Verify a solve resets the streak**

Start a new game, click **Yechib ber** (solve). Open Statistika: O'ynalgan increments,
Yutilgan does not, Joriy seriya is 0, and a "🏳 Yechib berildi" row appears in history.

- [ ] **Step 6: Verify isolation + resilience**

Confirm the console shows no uncaught errors during all of the above. Confirm that with no
network (or before the DB exists) the game still plays fully and only the stats view degrades
to the load-error notice — gameplay is never blocked.

- [ ] **Step 7:** No code is committed in this task unless QA found and fixed a defect.

---

## Notes for the implementer

- Do NOT add a top-level `import ... from "https://..."` anywhere. Firestore loads via the
  dynamic `getDb()` seam so the game still runs offline; `recordOutcome` is fire-and-forget.
- `getDb()` resolves to `{ db, sdk }`. Call Firestore functions as `sdk.doc(db, ...)`,
  `sdk.getDoc(ref)`, `sdk.setDoc(ref, data)`, `sdk.addDoc(collRef, data)`,
  `sdk.serverTimestamp()`, `sdk.query/orderBy/limit/getDocs`.
- All write-time aggregation goes through the pure `applyResult` from `stats.js` — do not
  reimplement the math inline. `progress.js` only adds `updatedAt`/`playedAt` server timestamps.
- `best` is the fastest WIN time in ms and is null until the first win at that size; a solve
  never changes `best` or `won`.
- Keep `stats.js` pure (no DOM, no Firebase) so its `node:test` units stay valid.
- The stats view is reachable only when logged in (the "Statistika" button lives in the user
  bar, which is hidden when logged out).
