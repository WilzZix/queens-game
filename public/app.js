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
