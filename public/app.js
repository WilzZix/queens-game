import "./game.js";
import { initSession, signOutUser, getCurrentUser } from "./session.js";
import { mountAuthUi } from "./auth-ui.js";
import { setView } from "./view.js";
import { loadStats, loadRecentGames, recordResult } from "./progress.js";
import { renderStats } from "./stats-ui.js";
import { getLang, setLang, applyTranslations } from "./i18n.js";

const userEmail = document.getElementById("userEmail");
const signOutBtn = document.getElementById("signOutBtn");
const statsBtn = document.getElementById("statsBtn");
const loginBtn = document.getElementById("loginBtn");
const backToGameBtn = document.getElementById("backToGameBtn");
const backToGameFromAuth = document.getElementById("backToGameFromAuth");
const langSwitch = document.getElementById("langSwitch");
const savePrompt = document.getElementById("savePrompt");
const savePromptBtn = document.getElementById("savePromptBtn");

let currentUid = null;
let pendingResult = null;

function applyLang(lang) {
  const active = setLang(lang);
  document.documentElement.lang = active;
  applyTranslations();
  if (langSwitch) {
    for (const btn of langSwitch.querySelectorAll(".lang-btn")) {
      btn.classList.toggle("active", btn.dataset.lang === active);
    }
  }
  window.dispatchEvent(new CustomEvent("queens:langchange"));
}

applyLang(getLang());

if (langSwitch) {
  langSwitch.addEventListener("click", (e) => {
    const btn = e.target.closest(".lang-btn");
    if (btn) applyLang(btn.dataset.lang);
  });
}

mountAuthUi();
setView("game");

if (loginBtn) loginBtn.addEventListener("click", () => setView("auth"));
if (backToGameFromAuth) backToGameFromAuth.addEventListener("click", () => setView("game"));
if (backToGameBtn) backToGameBtn.addEventListener("click", () => setView("game"));
if (savePromptBtn) savePromptBtn.addEventListener("click", () => setView("auth"));

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

function hideSavePrompt() {
  pendingResult = null;
  if (savePrompt) savePrompt.classList.add("hidden");
}

// A finished game. Logged-in players auto-save via recordOutcome; guests get a save prompt.
window.addEventListener("queens:outcome", (e) => {
  if (getCurrentUser()) return;
  pendingResult = e.detail;
  if (savePrompt) savePrompt.classList.remove("hidden");
});

window.addEventListener("queens:newgame", hideSavePrompt);

initSession((user) => {
  currentUid = user ? user.uid : null;
  const loggedIn = !!user;
  if (statsBtn) statsBtn.classList.toggle("hidden", !loggedIn);
  if (signOutBtn) signOutBtn.classList.toggle("hidden", !loggedIn);
  if (loginBtn) loginBtn.classList.toggle("hidden", loggedIn);
  if (userEmail) userEmail.textContent = loggedIn ? user.email || "" : "";

  if (loggedIn && pendingResult) {
    const toSave = pendingResult;
    hideSavePrompt();
    recordResult(user.uid, toSave).catch((err) => console.warn("Pending save failed:", err));
    setView("game");
  } else if (loggedIn) {
    const authView = document.getElementById("view-auth");
    if (authView && !authView.classList.contains("hidden")) setView("game");
  }
});
