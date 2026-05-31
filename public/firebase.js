const firebaseConfig = {
  apiKey: "AIzaSyCBbLr3tiQXt4Hr_gEMmStvRo318QOd72E",
  authDomain: "solve-queens.firebaseapp.com",
  projectId: "solve-queens",
  storageBucket: "solve-queens.firebasestorage.app",
  messagingSenderId: "628545384806",
  appId: "1:628545384806:web:40a9a2b10f82879553d8a7",
  measurementId: "G-VNG2BJW0TZ",
};

const SDK_VERSION = "12.14.0";

// URL for a Firebase modular SDK sub-module, e.g. sdkUrl("auth").
export const sdkUrl = (module) =>
  `https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-${module}.js`;

let appPromise = null;

// Lazily loads firebase-app and initializes the FirebaseApp exactly once.
// Returns a promise for the app. Rejects only if the SDK cannot be loaded.
export function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const { initializeApp } = await import(sdkUrl("app"));
      return initializeApp(firebaseConfig);
    })();
  }
  return appPromise;
}

let authPromise = null;

// Lazily loads firebase-auth and the Auth instance exactly once.
// Resolves to { auth, sdk } where sdk is the firebase-auth module namespace
// (signInWithPopup, GoogleAuthProvider, onAuthStateChanged, ...). Rejects only
// if the SDK cannot be loaded; callers handle that.
export function getAuth() {
  if (!authPromise) {
    authPromise = (async () => {
      const app = await getApp();
      const sdk = await import(sdkUrl("auth"));
      return { auth: sdk.getAuth(app), sdk };
    })();
  }
  return authPromise;
}

let dbPromise = null;

// Lazily loads firebase-firestore and the Firestore instance exactly once.
// Resolves to { db, sdk } where sdk is the firebase-firestore module namespace
// (doc, getDoc, setDoc, collection, addDoc, query, orderBy, limit, serverTimestamp, ...).
// Rejects only if the SDK cannot be loaded; callers handle that.
export function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const app = await getApp();
      const sdk = await import(sdkUrl("firestore"));
      return { db: sdk.getFirestore(app), sdk };
    })();
  }
  return dbPromise;
}
