export const LANGS = ["en", "uz", "ru"];
export const DEFAULT_LANG = "en";
const STORE_KEY = "queens.lang";

const translations = {
  en: {
    "auth.subtitle": "Sign in to your account",
    "auth.google": "Sign in with Google",
    "auth.or": "or",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.login": "Sign in",
    "auth.signup": "Sign up",
    "auth.toSignup": "No account? Sign up",
    "auth.toLogin": "Have an account? Sign in",
    "auth.forgot": "Forgot password?",
    "auth.verifySent": "Verification email sent.",
    "auth.resetNeedEmail": "Enter your email to reset the password.",
    "auth.resetSent": "Password reset email sent.",
    "auth.back": "← Back to game",
    "auth.account": "Account",
    "nav.stats": "Stats",
    "nav.signOut": "Sign out",
    "nav.login": "Sign in",
    "game.win": "🎉 You win!",
    "game.solved": "👑 Solved",
    "game.genError": "⚠️ Could not generate puzzle, try again",
    "game.undo": "↶ Undo",
    "game.clear": "✕ Clear",
    "game.hint": "💡 Hint",
    "game.solve": "👑 Solve",
    "game.new": "🔄 New",
    "game.rules":
      "One 👑 in each row, column and color. Queens must not touch. Tap a cell: empty → ✕ → 👑 → empty.",
    "save.prompt": "Sign in to save your result",
    "save.login": "Sign in to save",
    "stats.title": "📊 Stats",
    "stats.loadError": "Could not load stats.",
    "stats.played": "Played",
    "stats.won": "Won",
    "stats.rate": "Rate",
    "stats.currentStreak": "Current streak",
    "stats.longestStreak": "Longest",
    "stats.best": "Best:",
    "stats.recent": "Recent games",
    "stats.empty": "No games yet.",
    "stats.solvedLabel": "🏳 Solved",
    "err.generic": "Something went wrong. Please try again.",
    "err.invalidEmail": "Invalid email address.",
    "err.weakPasswordInput": "Password must be at least 6 characters.",
    "auth/invalid-email": "Invalid email address.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/user-not-found": "No such user found.",
    "auth/wrong-password": "Wrong password.",
    "auth/invalid-credential": "Wrong email or password.",
    "auth/email-already-in-use": "This email is already registered.",
    "auth/weak-password": "Password too weak (at least 6 characters).",
    "auth/popup-closed-by-user": "Window closed, please try again.",
    "auth/cancelled-popup-request": "Window closed, please try again.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
  },
  uz: {
    "auth.subtitle": "Hisobingizga kiring",
    "auth.google": "Google bilan kirish",
    "auth.or": "yoki",
    "auth.email": "Email",
    "auth.password": "Parol",
    "auth.login": "Kirish",
    "auth.signup": "Ro'yxatdan o'tish",
    "auth.toSignup": "Hisob yo'qmi? Ro'yxatdan o'ting",
    "auth.toLogin": "Hisobingiz bormi? Kiring",
    "auth.forgot": "Parolni unutdingizmi?",
    "auth.verifySent": "Tasdiqlash xati emailingizga yuborildi.",
    "auth.resetNeedEmail": "Parolni tiklash uchun email kiriting.",
    "auth.resetSent": "Parolni tiklash xati yuborildi.",
    "auth.back": "← O'yinga qaytish",
    "auth.account": "Hisob",
    "nav.stats": "Statistika",
    "nav.signOut": "Chiqish",
    "nav.login": "Kirish",
    "game.win": "🎉 G'alaba!",
    "game.solved": "👑 Yechildi",
    "game.genError": "⚠️ Jumboq yaratilmadi, qayta urining",
    "game.undo": "↶ Undo",
    "game.clear": "✕ Tozalash",
    "game.hint": "💡 Hint",
    "game.solve": "👑 Yechib ber",
    "game.new": "🔄 Yangi",
    "game.rules":
      "Har qator, ustun va rangda bitta 👑. Queen'lar bir-biriga tegmasin. Katakni bos: bo'sh → ✕ → 👑 → bo'sh.",
    "save.prompt": "Natijani saqlash uchun kiring",
    "save.login": "Kirib saqlash",
    "stats.title": "📊 Statistika",
    "stats.loadError": "Statistikani yuklab bo'lmadi.",
    "stats.played": "O'ynalgan",
    "stats.won": "Yutilgan",
    "stats.rate": "Foiz",
    "stats.currentStreak": "Joriy seriya",
    "stats.longestStreak": "Eng uzun",
    "stats.best": "Eng yaxshi:",
    "stats.recent": "So'nggi o'yinlar",
    "stats.empty": "Hali o'yinlar yo'q.",
    "stats.solvedLabel": "🏳 Yechib berildi",
    "err.generic": "Xatolik yuz berdi. Qayta urinib ko'ring.",
    "err.invalidEmail": "Email manzil noto'g'ri.",
    "err.weakPasswordInput": "Parol kamida 6 ta belgidan iborat bo'lishi kerak.",
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
  },
  ru: {
    "auth.subtitle": "Войдите в свой аккаунт",
    "auth.google": "Войти через Google",
    "auth.or": "или",
    "auth.email": "Эл. почта",
    "auth.password": "Пароль",
    "auth.login": "Войти",
    "auth.signup": "Регистрация",
    "auth.toSignup": "Нет аккаунта? Зарегистрируйтесь",
    "auth.toLogin": "Есть аккаунт? Войдите",
    "auth.forgot": "Забыли пароль?",
    "auth.verifySent": "Письмо для подтверждения отправлено.",
    "auth.resetNeedEmail": "Введите эл. почту для сброса пароля.",
    "auth.resetSent": "Письмо для сброса пароля отправлено.",
    "auth.back": "← Назад к игре",
    "auth.account": "Аккаунт",
    "nav.stats": "Статистика",
    "nav.signOut": "Выйти",
    "nav.login": "Войти",
    "game.win": "🎉 Победа!",
    "game.solved": "👑 Решено",
    "game.genError": "⚠️ Не удалось создать головоломку, попробуйте снова",
    "game.undo": "↶ Отмена",
    "game.clear": "✕ Очистить",
    "game.hint": "💡 Подсказка",
    "game.solve": "👑 Решить",
    "game.new": "🔄 Новая",
    "game.rules":
      "По одной 👑 в каждом ряду, столбце и цвете. Ферзи не должны соприкасаться. Нажмите на клетку: пусто → ✕ → 👑 → пусто.",
    "save.prompt": "Войдите, чтобы сохранить результат",
    "save.login": "Войти и сохранить",
    "stats.title": "📊 Статистика",
    "stats.loadError": "Не удалось загрузить статистику.",
    "stats.played": "Сыграно",
    "stats.won": "Выиграно",
    "stats.rate": "Процент",
    "stats.currentStreak": "Текущая серия",
    "stats.longestStreak": "Лучшая",
    "stats.best": "Лучшее:",
    "stats.recent": "Последние игры",
    "stats.empty": "Пока нет игр.",
    "stats.solvedLabel": "🏳 Решено",
    "err.generic": "Произошла ошибка. Попробуйте снова.",
    "err.invalidEmail": "Неверный адрес эл. почты.",
    "err.weakPasswordInput": "Пароль должен содержать не менее 6 символов.",
    "auth/invalid-email": "Неверный адрес эл. почты.",
    "auth/user-disabled": "Этот аккаунт отключён.",
    "auth/user-not-found": "Пользователь не найден.",
    "auth/wrong-password": "Неверный пароль.",
    "auth/invalid-credential": "Неверная эл. почта или пароль.",
    "auth/email-already-in-use": "Эта эл. почта уже зарегистрирована.",
    "auth/weak-password": "Слишком слабый пароль (минимум 6 символов).",
    "auth/popup-closed-by-user": "Окно закрыто, попробуйте снова.",
    "auth/cancelled-popup-request": "Окно закрыто, попробуйте снова.",
    "auth/network-request-failed": "Ошибка сети. Проверьте подключение.",
    "auth/too-many-requests": "Слишком много попыток. Попробуйте позже.",
  },
};

export function normalizeLang(lang) {
  return LANGS.includes(lang) ? lang : DEFAULT_LANG;
}

let currentLang = DEFAULT_LANG;

// Reads the saved language from localStorage (default "en"). Safe in non-DOM contexts.
export function getLang() {
  try {
    currentLang = normalizeLang(localStorage.getItem(STORE_KEY));
  } catch {
    currentLang = DEFAULT_LANG;
  }
  return currentLang;
}

// Persists and activates a language. Returns the normalized value actually set.
export function setLang(lang) {
  currentLang = normalizeLang(lang);
  try {
    localStorage.setItem(STORE_KEY, currentLang);
  } catch {
    /* storage may be unavailable; in-memory language still updates */
  }
  return currentLang;
}

// Translates a key for the given language (defaults to the active one).
// Falls back to English, then to the key itself, so a missing string is never blank.
export function t(key, lang = currentLang) {
  const table = translations[normalizeLang(lang)] || translations[DEFAULT_LANG];
  if (key in table) return table[key];
  if (key in translations[DEFAULT_LANG]) return translations[DEFAULT_LANG][key];
  return key;
}

// Applies translations to every element under root carrying a data-i18n* attribute.
//   data-i18n          → textContent
//   data-i18n-ph       → placeholder attribute
//   data-i18n-aria     → aria-label attribute
export function applyTranslations(root = document) {
  if (!root || !root.querySelectorAll) return;
  for (const node of root.querySelectorAll("[data-i18n]")) {
    node.textContent = t(node.getAttribute("data-i18n"));
  }
  for (const node of root.querySelectorAll("[data-i18n-ph]")) {
    node.setAttribute("placeholder", t(node.getAttribute("data-i18n-ph")));
  }
  for (const node of root.querySelectorAll("[data-i18n-aria]")) {
    node.setAttribute("aria-label", t(node.getAttribute("data-i18n-aria")));
  }
}
