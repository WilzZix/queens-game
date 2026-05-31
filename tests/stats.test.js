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
