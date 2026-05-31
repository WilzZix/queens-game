import { getAuth } from "./firebase.js";
import { authErrorMessage, validateCredentials } from "./auth-errors.js";
import { trackLogin, trackSignup } from "./analytics.js";

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
  el("authSubmit").textContent = mode === "login" ? "Kirish" : "Ro'yxatdan o'tish";
  el("toggleMode").textContent =
    mode === "login" ? "Hisob yo'qmi? Ro'yxatdan o'ting" : "Hisobingiz bormi? Kiring";
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
    showMessage(invalid);
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
        showMessage("Tasdiqlash xati emailingizga yuborildi.", true);
      } catch {
        /* verification email is best-effort; sign-in already succeeded */
      }
    }
  } catch (err) {
    showMessage(authErrorMessage(err && err.code));
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
    showMessage(authErrorMessage(err && err.code));
  }
}

async function handleReset() {
  const email = el("authEmail").value.trim();
  if (!email || !email.includes("@")) {
    showMessage("Parolni tiklash uchun email kiriting.");
    return;
  }
  try {
    const { auth, sdk } = await getAuth();
    await sdk.sendPasswordResetEmail(auth, email);
    showMessage("Parolni tiklash xati yuborildi.", true);
  } catch (err) {
    showMessage(authErrorMessage(err && err.code));
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
  el("authForm").addEventListener("submit", handleEmailSubmit);
  el("googleBtn").addEventListener("click", handleGoogle);
  el("resetBtn").addEventListener("click", handleReset);
  el("toggleMode").addEventListener("click", toggleMode);
}
