import { getAuth } from "./firebase.js";

let currentUser = null;

// The signed-in Firebase user, or null. Synchronous snapshot of the last known state.
export function getCurrentUser() {
  return currentUser;
}

// Subscribes to auth-state changes and invokes onChange(user|null) on every change.
// If auth can't be loaded (offline/CDN down), reports logged-out once so the UI still routes.
export async function initSession(onChange) {
  try {
    const { auth, sdk } = await getAuth();
    sdk.onAuthStateChanged(auth, (user) => {
      currentUser = user;
      onChange(user);
    });
  } catch (err) {
    console.warn("Auth unavailable:", err);
    currentUser = null;
    onChange(null);
  }
}

// Signs the current user out. Rejects if auth can't be loaded; callers handle that.
export async function signOutUser() {
  const { auth, sdk } = await getAuth();
  await sdk.signOut(auth);
}
