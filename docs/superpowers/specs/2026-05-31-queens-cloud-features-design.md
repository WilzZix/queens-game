# Queens — Accounts, Cloud Progress, Analytics & Theme Design

**Date:** 2026-05-31
**Status:** Approved (design phase)
**Builds on:** the shipped Queens game (vanilla HTML/CSS/JS, ES modules, Firebase Hosting).

## Goal

Add four capabilities to the existing Queens game: a light/dark theme toggle, a Firebase
backend (project + Analytics), authentication (Google + Email/password), and per-account
cloud progress tracking — without introducing a build step.

## Decomposition & Build Order

Four sub-projects, each independently shippable and testable, built in dependency order.
Each gets its own implementation plan and can be deployed before the next begins.

| # | Sub-project | Depends on | Definition of done |
|---|-------------|-----------|--------------------|
| 1 | Theme | nothing | Light default, toggle persists, all views readable in both modes |
| 2 | Firebase foundation + Analytics | a real FB project | App initializes Firebase; key events logged; deployed |
| 3 | Auth (Google + Email/password) | #2 | Users sign up / log in / reset password; auth state gates views |
| 4 | Cloud progress | #3 | Stats persist to Firestore per user; stats view renders them |

Theme is first because it is tiny and proves the deploy loop with zero backend risk.

## Shared Architecture

1. **No build step.** Firebase is loaded via the modular CDN SDK using browser-native ES
   module imports (e.g. `import { initializeApp } from
   "https://www.gstatic.com/firebasejs/<ver>/firebase-app.js"`). No npm bundler. This keeps
   the existing zero-build, ES-modules setup intact.
2. **Three views in one `index.html`** — `auth`, `game`, `stats` — toggled by a small
   `public/view.js` manager that shows exactly one view at a time and updates nav state.
3. **Custom minimal auth forms** styled to match the existing Style A palette. No FirebaseUI.
4. **`firebaseConfig` is committed to the repo.** For web apps the API key is public by
   design; security is enforced by Firestore security rules (each user reads/writes only
   their own `users/{uid}` document and subcollection) plus Firebase Auth. `firestore.rules`
   is part of the repo and deployed alongside hosting.
5. **Testability.** Pure logic (theme resolution, streak math, best-time merge, stats
   aggregation) lives in framework-free modules covered by `node:test`. Firebase/DOM glue is
   verified through browser QA, optionally against the Firestore emulator.

## Firestore Data Model (sub-project 4)

```
users/{uid} {
  played: number,
  won: number,
  perSize: {
    "7": { played, won, best },   // best = fastest win time in ms, null until first win
    "8": { played, won, best },
    "9": { played, won, best }
  },
  currentStreak: number,
  longestStreak: number,
  updatedAt: serverTimestamp
}

users/{uid}/games/{gameId} {
  size: 7 | 8 | 9,
  timeMs: number,
  result: "win" | "solve",
  playedAt: serverTimestamp
}
```

Rules:
- A **win** increments `played`, `won`, per-size `played`/`won`, may set per-size `best`
  (only if faster or previously null), increments `currentStreak`, updates `longestStreak`,
  and appends a `games` history doc with `result: "win"`.
- A **solve / give-up** increments `played` and per-size `played`, resets `currentStreak`
  to 0, does NOT touch `best` or `won`, and appends a history doc with `result: "solve"`.

## Sub-project 1 — Theme (detailed)

**Behavior:** Light by default. A toggle button (sun/moon) flips to dark. The choice is
saved to `localStorage` under `queens.theme` and restored on load. No system-preference
following in this version (light is the deliberate default).

**Implementation:**
- Move all hard-coded colors in `styles.css` into CSS custom properties on `:root`, and add
  a `:root[data-theme="dark"]` block overriding them with a dark palette.
- `public/theme.js` (pure-ish): `resolveTheme(stored)` returns `"light"` or `"dark"`
  (defaults to `"light"` when stored value is missing/invalid); `applyTheme(theme)` sets
  `document.documentElement.dataset.theme`; `toggleTheme()` flips and persists.
- Add a toggle button to the header in `index.html`; wire it in `game.js` (or a small init).
- `tests/theme.test.js`: unit-test `resolveTheme` for the light default, valid stored
  values, and invalid input.

**Dark palette (initial):** background `#0f172a`, ink `#e2e8f0`, gridline `#334155`,
indigo accent kept `#6366f1`; chips, buttons, win-banner adjusted for contrast.

## Sub-project 2 — Firebase Foundation + Analytics (outline)

- `public/firebase.js`: imports the modular CDN SDK, holds the committed `firebaseConfig`,
  exports the initialized `app`, `auth`, `db`, and an `analytics` instance.
- `public/analytics.js`: thin `logEvent` wrappers for `game_start`, `game_win`,
  `game_solve`, `size_change`, `login`, `signup`. Plus automatic page views from the SDK.
- Wire the event calls into existing game flow (`newGame`, `onWin`, `solveAll`, size chips).
- Deploy hosting; confirm events in the Firebase console DebugView.
- Manual prerequisite: user creates the Firebase project, enables Analytics, pastes
  `firebaseConfig`.

## Sub-project 3 — Auth (outline)

- `public/auth-ui.js` + an `auth` view: Google button, email/password sign-up & login forms,
  password reset, email-verification prompt.
- `public/session.js`: subscribes to `onAuthStateChanged`, exposes current user, drives view
  routing (logged out → `auth` view; logged in → `game`), and a sign-out control.
- Log `login` / `signup` analytics events.
- Manual prerequisite: enable Google and Email/Password providers in the console.

## Sub-project 4 — Cloud Progress (outline)

- `public/stats.js` (pure): aggregation/merge helpers — apply a game result to a stats
  object, compute streaks, decide best-time updates. Fully unit-tested.
- `public/progress.js`: reads/writes `users/{uid}` and the `games` subcollection via the
  pure helpers; called from game win/solve handlers.
- `stats` view: renders totals, per-size best times, streaks, and recent history.
- `firestore.rules`: restrict each user to their own document tree; deploy them.

## Error Handling

- Firebase init failure or offline: the game itself (generation/solving/UI) must keep working
  fully; only cloud features degrade. Show a non-blocking notice, never block play.
- Auth errors (wrong password, email in use, popup closed): inline form messages, no console-
  only failures.
- Firestore write failure: retry-free, surface a small toast; local play is unaffected.

## Out of Scope (YAGNI)

Leaderboards, social/Apple/anonymous auth, friend systems, multi-device real-time sync UI,
seedable/shareable puzzles, server-side functions. Revisit only if requested.
