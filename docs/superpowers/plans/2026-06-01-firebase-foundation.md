# Firebase Foundation + Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a resilient Firebase foundation (project init) and Google Analytics key-event tracking to the Queens game, without breaking the game when Firebase/CDN is unavailable.

**Architecture:** `public/firebase.js` owns the committed `firebaseConfig` and a memoized, lazy `getApp()` that **dynamically imports** the Firebase SDK (so the game's static module graph never depends on a reachable CDN). `public/analytics.js` lazily initializes Analytics (guarded by `isSupported()`) and exposes fire-and-forget `track*` wrappers that never throw. `game.js` calls those wrappers at four points: new game, win, solve, size change. Auth and Firestore are NOT added here — they come in later sub-projects and will extend `firebase.js`.

**Tech Stack:** Vanilla HTML/CSS/JS, browser-native ES modules, Firebase modular CDN SDK v12.14.0 (loaded via dynamic `import()`), Firebase Hosting.

**Spec:** `docs/superpowers/specs/2026-05-31-queens-cloud-features-design.md` (sub-project 2).

**Note on testing:** This sub-project is thin glue over the Firebase SDK and the DOM with no pure logic worth a `node:test` unit (the SDK is remote and browser-only). Verification is therefore by browser inspection, not new unit tests. The existing 19 tests must continue to pass (the new modules must not be imported by any test).

**Firebase project (already created by the user):** `solve-queens`. The web `firebaseConfig` is in Task 1 verbatim — it is safe to commit (web API keys are public; access is governed by Auth + Firestore rules added later).

---

### Task 1: `firebase.js` — config + lazy `getApp()`

A memoized loader that dynamically imports `firebase-app` and initializes the app exactly
once. No top-level remote import, so importing this file never fails offline; only awaiting
`getApp()` can reject (and callers handle that).

**Files:**
- Create: `public/firebase.js`

- [ ] **Step 1: Create `public/firebase.js` with exactly this content**

```js
const firebaseConfig = {
  apiKey: "AIzaSyCBbLr3tiQXt4Hr_gEMmStvRo318QOd72E",
  authDomain: "solve-queens.firebaseapp.com",
  projectId: "solve-queens",
  storageBucket: "solve-queens.firebasestorage.app",
  messagingSenderId: "628545384806",
  appId: "1:628545384806:web:40a9a2b10f82879553d8a7",
  measurementId: "G-VNG2BJW0TZ",
};

const SDK_VERSION = "12.14.0";

// URL for a Firebase modular SDK sub-module, e.g. sdkUrl("auth").
export const sdkUrl = (module) =>
  `https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-${module}.js`;

let appPromise = null;

// Lazily loads firebase-app and initializes the FirebaseApp exactly once.
// Returns a promise for the app. Rejects only if the SDK cannot be loaded.
export function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const { initializeApp } = await import(sdkUrl("app"));
      return initializeApp(firebaseConfig);
    })();
  }
  return appPromise;
}
```

- [ ] **Step 2: Confirm the file imports cleanly in Node (static graph has no remote import)**

Run: `cd ~/StudioProjects/queens-game && node -e "import('./public/firebase.js').then(m => console.log(typeof m.getApp, m.sdkUrl('auth')))"`
Expected: prints `function https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js`
(It must NOT attempt a network fetch — `getApp()` is not called here, only `sdkUrl`.)

- [ ] **Step 3: Confirm the existing test suite is unaffected**

Run: `cd ~/StudioProjects/queens-game && node --test`
Expected: 19 pass / 0 fail (no test imports firebase.js).

- [ ] **Step 4: Commit**

```bash
cd ~/StudioProjects/queens-game
git add public/firebase.js
git commit -m "feat: firebase foundation with lazy getApp loader"
```

---

### Task 2: `analytics.js` — lazy Analytics + track wrappers

Lazily initializes Analytics on first use, guarded by `isSupported()` (some browsers/contexts
disallow it). All wrappers are fire-and-forget and never throw, so a missing/blocked Analytics
never affects gameplay.

**Files:**
- Create: `public/analytics.js`

- [ ] **Step 1: Create `public/analytics.js` with exactly this content**

```js
import { getApp, sdkUrl } from "./firebase.js";

let analyticsPromise = null;

// Lazily initializes Analytics. Resolves to { analytics, logEvent } when available,
// or null when Analytics is unsupported or the SDK fails to load. Never throws.
function loadAnalytics() {
  if (!analyticsPromise) {
    analyticsPromise = (async () => {
      try {
        const app = await getApp();
        const { getAnalytics, isSupported, logEvent } = await import(sdkUrl("analytics"));
        if (!(await isSupported())) return null;
        return { analytics: getAnalytics(app), logEvent };
      } catch (err) {
        console.warn("Analytics unavailable:", err);
        return null;
      }
    })();
  }
  return analyticsPromise;
}

async function track(name, params) {
  const a = await loadAnalytics();
  if (!a) return;
  try {
    a.logEvent(a.analytics, name, params);
  } catch (err) {
    console.warn("Analytics event failed:", name, err);
  }
}

export const trackGameStart = (size) => track("game_start", { size });
export const trackGameWin = (size, timeMs) => track("game_win", { size, time_ms: timeMs });
export const trackGameSolve = (size) => track("game_solve", { size });
export const trackSizeChange = (size) => track("size_change", { size });
```

- [ ] **Step 2: Confirm it imports cleanly in Node without network access**

Run: `cd ~/StudioProjects/queens-game && node -e "import('./public/analytics.js').then(m => console.log(typeof m.trackGameStart, typeof m.trackGameWin, typeof m.trackGameSolve, typeof m.trackSizeChange))"`
Expected: prints `function function function function` (no network call — `track` is not invoked).

- [ ] **Step 3: Confirm existing tests still pass**

Run: `cd ~/StudioProjects/queens-game && node --test`
Expected: 19 pass / 0 fail.

- [ ] **Step 4: Commit**

```bash
cd ~/StudioProjects/queens-game
git add public/analytics.js
git commit -m "feat: analytics wrappers for key game events"
```

---

### Task 3: Wire analytics events into `game.js`

Fire `game_start` on every new game, `game_win` on a genuine win, `game_solve` when the player
uses "Yechib ber", and `size_change` when the board size chip changes. A new `outcomeLogged`
flag prevents `solveAll()`'s synthetic completion (which flows through `render()` → `onWin()`)
from also logging a win.

**Files:**
- Modify: `public/game.js`

- [ ] **Step 1: Add the analytics import**

In `public/game.js`, the first three lines are:

```js
import { generate } from './generator.js';
import { solve } from './solver.js';
import { setupThemeToggle } from './theme.js';
```

Add a fourth import directly below them:

```js
import { trackGameStart, trackGameWin, trackGameSolve, trackSizeChange } from './analytics.js';
```

- [ ] **Step 2: Add the `outcomeLogged` flag to game state**

The `game` object currently ends:

```js
  running: false,
  won: false,
};
```

Change it to:

```js
  running: false,
  won: false,
  outcomeLogged: false,
};
```

- [ ] **Step 3: Reset the flag and log `game_start` in `newGame`**

The end of `newGame(n)` currently reads:

```js
  game.seconds = 0;
  game.won = false;
  timerEl.textContent = formatTime(0);
  winEl.textContent = WIN_TEXT;
  winEl.classList.add('hidden');
  buildBoard();
  render();
}
```

Change it to:

```js
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
```

(Placed after the early `return` in the `generate` catch block, so a failed generation logs
nothing.)

- [ ] **Step 4: Log `game_win` (guarded) in `onWin`**

`onWin()` currently reads:

```js
function onWin() {
  game.won = true;
  stopTimer();
  winEl.classList.remove('hidden');
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
  }
}
```

- [ ] **Step 5: Log `game_solve` in `solveAll` before `render()`**

`solveAll()` currently ends:

```js
  stopTimer();
  winEl.textContent = SOLVED_TEXT;
  render();
}
```

Change it to:

```js
  stopTimer();
  winEl.textContent = SOLVED_TEXT;
  game.outcomeLogged = true;
  trackGameSolve(game.n);
  render();
}
```

Setting `outcomeLogged` BEFORE `render()` ensures the `onWin()` reached during that render does
NOT also fire `game_win`.

- [ ] **Step 6: Log `size_change` in the size-chip handler**

The size handler currently reads:

```js
sizesEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  for (const chip of sizesEl.querySelectorAll('.chip')) chip.classList.remove('active');
  btn.classList.add('active');
  newGame(Number(btn.dataset.size));
});
```

Change it to:

```js
sizesEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  for (const chip of sizesEl.querySelectorAll('.chip')) chip.classList.remove('active');
  btn.classList.add('active');
  const size = Number(btn.dataset.size);
  trackSizeChange(size);
  newGame(size);
});
```

- [ ] **Step 7: Confirm existing tests still pass**

Run: `cd ~/StudioProjects/queens-game && node --test`
Expected: 19 pass / 0 fail (game.js is not imported by tests; this is a regression guard).

- [ ] **Step 8: Commit**

```bash
cd ~/StudioProjects/queens-game
git add public/game.js
git commit -m "feat: fire analytics events on start, win, solve, size change"
```

---

### Task 4: Browser QA + deploy (controller / user)

This task is performed by the controller (browser checks) and the user (deploy, which needs
their Firebase auth). No code changes unless QA finds a defect.

- [ ] **Step 1: Serve `public/` and load the page**

Start the preview (Claude Preview `preview_start` "queens", or `npx --yes serve public -l 5050`).

- [ ] **Step 2: Verify the game is fully playable and the console is clean**

Confirm the board renders, cells cycle, size switching works, win/solve banners behave. Confirm
there are NO uncaught errors in the console (warnings from `isSupported()` returning false in a
restricted browser are acceptable; uncaught exceptions are not).

- [ ] **Step 3: Verify the Firebase app initializes**

In the preview, eval:
`import('./firebase.js').then(m => m.getApp()).then(a => a.options.projectId)`
Expected: `"solve-queens"` (the SDK loaded from the CDN and the app initialized).

- [ ] **Step 4: Verify analytics events are emitted when supported**

In the preview, eval:
`(() => { window.dataLayer = window.dataLayer || []; return JSON.stringify((window.dataLayer||[]).slice(-5)); })()`
Trigger a size change and a solve, then re-read `window.dataLayer`. Expected: GA entries appear
once Analytics is supported. If `isSupported()` is false in this browser, `dataLayer` may stay
empty — that is acceptable; the authoritative check is the Firebase console DebugView in the
user's real browser. Either way, gameplay must be unaffected.

- [ ] **Step 5: Deploy to Firebase Hosting (USER — requires their Firebase auth)**

```bash
cd ~/StudioProjects/queens-game
npx --yes firebase-tools login          # one-time, opens browser
npx --yes firebase-tools use solve-queens
npx --yes firebase-tools deploy --only hosting
```

Expected: a live Hosting URL (e.g. `https://solve-queens.web.app`). Open it and confirm in the
Firebase console → Analytics → DebugView (or Realtime) that `game_start` / `size_change` /
`game_win` / `game_solve` events arrive.

- [ ] **Step 6 (optional): commit a deploy note**

No code is committed in this task unless QA found and fixed a defect.

---

## Notes for the implementer

- Do NOT add top-level `import ... from "https://..."` in `firebase.js` or `analytics.js`. Use
  the dynamic `import(sdkUrl(...))` form only. This is the whole point — the game must load even
  when the CDN is unreachable.
- Do NOT add auth or Firestore here. `getApp()` is the shared seam those sub-projects will build
  on; adding them now is out of scope (YAGNI).
- Do NOT add `login` / `signup` analytics events here — they belong to the auth sub-project,
  where the login/signup actions actually exist.
- The `firebaseConfig` API key is intentionally committed; do not treat it as a secret.
- `time_ms` granularity is whole seconds (`game.seconds * 1000`) because the timer ticks per
  second — that is acceptable for analytics.
