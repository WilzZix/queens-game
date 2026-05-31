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
