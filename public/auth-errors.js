const MESSAGES = {
  "auth/invalid-email": "Email manzil noto'g'ri.",
  "auth/user-disabled": "Bu hisob o'chirilgan.",
  "auth/user-not-found": "Bunday foydalanuvchi topilmadi.",
  "auth/wrong-password": "Parol noto'g'ri.",
  "auth/invalid-credential": "Email yoki parol noto'g'ri.",
  "auth/email-already-in-use": "Bu email allaqachon ro'yxatdan o'tgan.",
  "auth/weak-password": "Parol juda zaif (kamida 6 ta belgi).",
  "auth/popup-closed-by-user": "Oyna yopildi, qayta urinib ko'ring.",
  "auth/cancelled-popup-request": "Oyna yopildi, qayta urinib ko'ring.",
  "auth/network-request-failed": "Tarmoq xatosi. Internetni tekshiring.",
  "auth/too-many-requests": "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring.",
};

// Maps a Firebase auth error code to a friendly Uzbek message. Unknown/missing → generic.
export function authErrorMessage(code) {
  return MESSAGES[code] || "Xatolik yuz berdi. Qayta urinib ko'ring.";
}

// Returns an error string if the credentials are obviously invalid, else null.
export function validateCredentials(email, password) {
  if (typeof email !== "string" || !email.includes("@") || email.length < 3) {
    return "Email manzil noto'g'ri.";
  }
  if (typeof password !== "string" || password.length < 6) {
    return "Parol kamida 6 ta belgidan iborat bo'lishi kerak.";
  }
  return null;
}
