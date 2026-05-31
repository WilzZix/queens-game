import { formatBest } from "./stats.js";

const SIZES = ["7", "8", "9"];

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function statCard(label, value) {
  const card = el("div", "stat-card");
  card.appendChild(el("div", "stat-value", String(value)));
  card.appendChild(el("div", "stat-label", label));
  return card;
}

// Renders stats + recent games into #statsBody. Pass stats=null to show a load-error notice.
export function renderStats(stats, games) {
  const body = document.getElementById("statsBody");
  if (!body) return;
  body.innerHTML = "";

  if (!stats) {
    body.appendChild(el("p", "stats-empty", "Statistikani yuklab bo'lmadi."));
    return;
  }

  const winRate = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;
  const totals = el("div", "stats-totals");
  totals.appendChild(statCard("O'ynalgan", stats.played));
  totals.appendChild(statCard("Yutilgan", stats.won));
  totals.appendChild(statCard("Foiz", winRate + "%"));
  totals.appendChild(statCard("Joriy seriya", stats.currentStreak));
  totals.appendChild(statCard("Eng uzun", stats.longestStreak));
  body.appendChild(totals);

  const perSize = el("div", "stats-persize");
  for (const size of SIZES) {
    const ps = (stats.perSize && stats.perSize[size]) || { played: 0, won: 0, best: null };
    const row = el("div", "stat-row");
    row.appendChild(el("span", "stat-size", size + "×" + size));
    row.appendChild(el("span", "stat-detail", "Eng yaxshi: " + formatBest(ps.best)));
    row.appendChild(el("span", "stat-detail", ps.won + "/" + ps.played));
    perSize.appendChild(row);
  }
  body.appendChild(perSize);

  body.appendChild(el("h3", "stats-subtitle", "So'nggi o'yinlar"));
  if (!games || games.length === 0) {
    body.appendChild(el("p", "stats-empty", "Hali o'yinlar yo'q."));
    return;
  }
  const list = el("div", "stats-history");
  for (const g of games) {
    const row = el("div", "hist-row");
    const label = g.result === "win" ? "👑 " + formatBest(g.timeMs) : "🏳 Yechib berildi";
    row.appendChild(el("span", "hist-size", g.size + "×" + g.size));
    row.appendChild(el("span", "hist-result", label));
    list.appendChild(row);
  }
  body.appendChild(list);
}
