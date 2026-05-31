# Queens O'yini — Dizayn (Spec)

**Sana:** 2026-05-31
**Loyiha:** `~/StudioProjects/queens-game/` (alohida repo)

## Maqsad

LinkedIn Queens uslubidagi logik jumboq o'yini. Foydalanuvchi brauzerda
o'ynaydi: rangli n×n taxtaga queen'larni qoidaga muvofiq joylashtiradi.
To'liq client-side, server yo'q. Public Firebase Hosting'ga deploy qilinadi.

## O'yin qoidalari

- Taxta — **n×n** kvadrat, ichida **n ta rangli zona**.
- Har **qator**, har **ustun** va har **rangli zona**da aniq bitta queen 👑.
- Hech qaysi ikki queen bir-biriga **tegmasligi** kerak (gorizontal, vertikal
  va diagonal qo'shni kataklar ham mumkin emas).
- Katakni bosish holatni aylantiradi: bo'sh → ✕ (belgi) → 👑 → bo'sh.
- ✕ — foydalanuvchining shaxsiy belgisi (bu yerga queen qo'ymayman), validatsiyaga
  ta'sir qilmaydi.
- **G'alaba:** har qator/ustun/zonada aniq bitta queen va hech qaysi ikkitasi
  qo'shni emas.

## Qiyinlik / o'lchamlar

Foydalanuvchi tanlaydi:
- Oson — **7×7**
- O'rta — **8×8**
- Qiyin — **9×9**

Har o'lchamda zonalar soni o'lchamga teng (n ta zona).

## Arxitektura

To'liq client-side, vanilla HTML/CSS/JS. Build step yo'q.

| Fayl | Vazifa |
|------|--------|
| `index.html` | Sahifa tuzilishi (taxta konteyneri, panel, timer) |
| `styles.css` | Vizual stil A — rangli, o'ynoqi (yorqin ranglar, emoji ikonkalar, yumaloq tugmalar) |
| `generator.js` | Jumboq yaratish — n×n, yagona yechimli |
| `solver.js` | Backtracking solver — yagonalik tekshiruvi, hint, "yechib ber" |
| `game.js` | O'yin holati, taxtani render qilish, bosish/validatsiya/timer |
| `firebase.json` | Firebase Hosting konfiguratsiyasi |

Har fayl bitta aniq vazifaga ega va alohida tushuniladi. `generator.js` va
`solver.js` UI'dan mustaqil (sof funksiyalar), shuning uchun alohida test qilinadi.

## Jumboq generatsiyasi (`generator.js`)

Uch qadam:

1. **Yechimni joylashtirish.** n ta queen'ni qo'yamiz: har qatorda bitta, har
   ustunda bitta, hech qaysi ikkitasi qo'shni emas. Tasodifiy tartibda
   backtracking bilan. Bu yagona to'g'ri yechim — `solution[row] = col`.

2. **Rangli zonalarni o'stirish.** Har queen katagi bitta zonaning "urug'i"
   bo'ladi (demak har zonada aniq bitta queen). Qolgan kataklarni tasodifiy
   flood-fill (randomized BFS) bilan eng yaqin zonalarga biriktiramiz, to butun
   taxta to'lguncha. Natija — n ta bog'langan (connected) rangli zona.

3. **Yagonalikni tekshirish.** `solver.js` yechimlar sonini 2 gacha sanaydi.
   Agar 2+ yechim chiqsa, jumboq noaniq — 2-qadamni boshqa tasodif bilan qayta
   bajaramiz (bir necha urinish; kerak bo'lsa 1-qadamdan boshlab). Faqat yagona
   yechimli jumboq foydalanuvchiga beriladi.

## Solver (`solver.js`)

Backtracking: qator-qatorlab queen joylaydi, ustun/zona/qo'shnilik
cheklovlarini tekshiradi. Ikki vazifa:
- **Yagonalik:** yechimlar sonini sanaydi (2 ta topilsa to'xtaydi).
- **Hint / Yechib ber:** to'liq yechimni qaytaradi.

## O'yin mexanikasi (`game.js`)

- **Holat:** har katak `empty` | `mark` (✕) | `queen` (👑). Bosish aylantiradi.
- **Real-time validatsiya:** har o'zgarishdan keyin qoidani buzgan queen'lar
  (bir qator/ustun/zonada ikkita, yoki qo'shni) **qizil** bilan belgilanadi.
- **G'alaba aniqlash:** barcha qator/ustun/zonada bitta queen va konflikt yo'q
  bo'lsa — g'alaba xabari + timer to'xtaydi.
- **Timer:** o'yin boshlanganda ishga tushadi, g'alabada to'xtaydi.
- **Undo:** qadamlar tarixi (stack), oxirgi harakatni qaytaradi.
- **Tozalash:** taxtani boshlang'ich holatga qaytaradi (jumboq o'zgarmaydi).
- **Hint:** solver yechimidan bitta hali qo'yilmagan to'g'ri queen'ni ochadi.
- **Yechib ber:** butun yechimni ko'rsatadi (o'yin tugaydi).
- **Yangi o'yin / o'lcham tanlash:** yangi jumboq generatsiya qilinadi.

## Vizual stil (A — rangli)

- Yorqin pastel-to'yingan ranglar zonalar uchun (kamida 9 rangli palitra).
- Emoji ikonkalar: ⏱ timer, 👑 queen, ✕ belgi, 💡 hint.
- Yumaloq tugmalar, yumaloq kataklar, ozgina oraliq (gap) bilan grid.
- O'lcham tanlash — "chip" tugmalar (7×7 / 8×8 / 9×9).
- Taxta har doim kvadrat (n×n), ekranga moslashadi (responsive).

## Hosting

Firebase Hosting — static fayllar. `firebase.json` da `public` papka
ko'rsatiladi, `firebase deploy` bilan public URL'ga chiqadi.

## Test

- `generator.js` va `solver.js` — sof funksiyalar, alohida test qilinadi
  (yaratilgan har jumboq yagona yechimli ekanini solver bilan tasdiqlash).
- UI — brauzerda qo'lda tekshiriladi (o'ynash, g'alaba, hint, undo, o'lcham
  almashtirish).

## Qamrovdan tashqari (YAGNI)

- Backend / akkaunt / ball saqlash yo'q.
- Kunlik jumboq (hammaga bir xil) — hozircha yo'q.
- Mobil ilova — yo'q (lekin responsive web).
- Leaderboard, multiplayer — yo'q.
