const KNOWN_CODES = new Set([
  "auth/invalid-email",
  "auth/user-disabled",
  "auth/user-not-found",
  "auth/wrong-password",
  "auth/invalid-credential",
  "auth/email-already-in-use",
  "auth/weak-password",
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/network-request-failed",
  "auth/too-many-requests",
]);

// Maps a Firebase auth error code to an i18n key. Unknown/missing → generic key.
export function authErrorKey(code) {
  return KNOWN_CODES.has(code) ? code : "err.generic";
}

// Returns an i18n key if the credentials are obviously invalid, else null.
export function validateCredentials(email, password) {
  if (typeof email !== "string" || !email.includes("@") || email.length < 3) {
    return "err.invalidEmail";
  }
  if (typeof password !== "string" || password.length < 6) {
    return "err.weakPasswordInput";
  }
  return null;
}
