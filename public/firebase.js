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
