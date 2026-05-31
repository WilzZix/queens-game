const VIEW_IDS = { auth: "view-auth", game: "view-game" };

// Shows exactly one view ("auth" or "game") and hides the rest.
export function setView(name) {
  for (const [key, id] of Object.entries(VIEW_IDS)) {
    const elView = document.getElementById(id);
    if (elView) elView.classList.toggle("hidden", key !== name);
  }
}
