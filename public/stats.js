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
