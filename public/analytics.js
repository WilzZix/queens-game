import { getApp, sdkUrl } from "./firebase.js";

let analyticsPromise = null;

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
