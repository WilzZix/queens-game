const STORAGE_KEY = "queens.theme";

// Mirrors the inline anti-FOUC boot script in index.html — keep the two in sync.
export function resolveTheme(stored) {
  return stored === "dark" ? "dark" : "light";
}

export function nextTheme(current) {
  return current === "dark" ? "light" : "dark";
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

export function toggleTheme() {
  const current = document.documentElement.dataset.theme || "light";
  const next = nextTheme(current);
  applyTheme(next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* storage unavailable (private mode) — toggle still works for this session */
  }
  return next;
}

export function setupThemeToggle(btn) {
  if (!btn) return;
  const sync = () => {
    btn.textContent = document.documentElement.dataset.theme === "dark" ? "☀️" : "🌙";
  };
  sync();
  btn.addEventListener("click", () => {
    toggleTheme();
    sync();
  });
}
