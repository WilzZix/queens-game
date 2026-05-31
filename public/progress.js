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
