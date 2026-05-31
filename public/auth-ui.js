import { getAuth } from "./firebase.js";
import { authErrorKey, validateCredentials } from "./auth-errors.js";
import { trackLogin, trackSignup } from "./analytics.js";
import { t } from "./i18n.js";

let mode = "login"; // "login" | "signup"

function el(id) {
  return document.getElementById(id);
}

function showMessage(text, ok = false) {
  const msg = el("authMsg");
  if (!msg) return;
  msg.textContent = text;
  msg.classList.toggle("ok", ok);
  msg.classList.toggle("hidden", !text);
}

function applyMode() {
  el("authSubmit").textContent = mode === "login" ? t("auth.login") : t("auth.signup");
  el("toggleMode").textContent = mode === "login" ? t("auth.toSignup") : t("auth.toLogin");
  el("authPassword").setAttribute(
    "autocomplete",
    mode === "login" ? "current-password" : "new-password",
  );
  showMessage("");
}

async function handleEmailSubmit(event) {
  event.preventDefault();
  const email = el("authEmail").value.trim();
  const password = el("authPassword").value;
  const invalid = validateCredentials(email, password);
  if (invalid) {
    showMessage(t(invalid));
    return;
  }
  const submit = el("authSubmit");
  submit.disabled = true;
  try {
    const { auth, sdk } = await getAuth();
    if (mode === "login") {
      await sdk.signInWithEmailAndPassword(auth, email, password);
      trackLogin("password");
    } else {
      const cred = await sdk.createUserWithEmailAndPassword(auth, email, password);
      trackSignup("password");
      try {
        await sdk.sendEmailVerification(cred.user);
        showMessage(t("auth.verifySent"), true);
      } catch {
        /* verification email is best-effort; sign-in already succeeded */
      }
    }
  } catch (err) {
    showMessage(t(authErrorKey(err && err.code)));
  } finally {
    submit.disabled = false;
  }
}

async function handleGoogle() {
  showMessage("");
  try {
    const { auth, sdk } = await getAuth();
    const provider = new sdk.GoogleAuthProvider();
    await sdk.signInWithPopup(auth, provider);
    trackLogin("google");
  } catch (err) {
    showMessage(t(authErrorKey(err && err.code)));
  }
}

async function handleReset() {
  const email = el("authEmail").value.trim();
  if (!email || !email.includes("@")) {
    showMessage(t("auth.resetNeedEmail"));
    return;
  }
  try {
    const { auth, sdk } = await getAuth();
    await sdk.sendPasswordResetEmail(auth, email);
    showMessage(t("auth.resetSent"), true);
  } catch (err) {
    showMessage(t(authErrorKey(err && err.code)));
  }
}

function toggleMode() {
  mode = mode === "login" ? "signup" : "login";
  applyMode();
}

// Attaches all auth-form handlers. Call once at startup.
export function mountAuthUi() {
  if (!el("authForm")) return;
  applyMode();
  window.addEventListener("queens:langchange", applyMode);
  el("authForm").addEventListener("submit", handleEmailSubmit);
  el("googleBtn").addEventListener("click", handleGoogle);
  el("resetBtn").addEventListener("click", handleReset);
  el("toggleMode").addEventListener("click", toggleMode);
}
