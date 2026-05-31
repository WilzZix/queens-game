import { formatBest } from "./stats.js";
import { t } from "./i18n.js";

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
    body.appendChild(el("p", "stats-empty", t("stats.loadError")));
    return;
  }

  const winRate = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;
  const totals = el("div", "stats-totals");
  totals.appendChild(statCard(t("stats.played"), stats.played));
  totals.appendChild(statCard(t("stats.won"), stats.won));
  totals.appendChild(statCard(t("stats.rate"), winRate + "%"));
  totals.appendChild(statCard(t("stats.currentStreak"), stats.currentStreak));
  totals.appendChild(statCard(t("stats.longestStreak"), stats.longestStreak));
  body.appendChild(totals);

  const perSize = el("div", "stats-persize");
  for (const size of SIZES) {
    const ps = (stats.perSize && stats.perSize[size]) || { played: 0, won: 0, best: null };
    const row = el("div", "stat-row");
    row.appendChild(el("span", "stat-size", size + "×" + size));
    row.appendChild(el("span", "stat-detail", t("stats.best") + " " + formatBest(ps.best)));
    row.appendChild(el("span", "stat-detail", ps.won + "/" + ps.played));
    perSize.appendChild(row);
  }
  body.appendChild(perSize);

  body.appendChild(el("h3", "stats-subtitle", t("stats.recent")));
  if (!games || games.length === 0) {
    body.appendChild(el("p", "stats-empty", t("stats.empty")));
    return;
  }
  const list = el("div", "stats-history");
  for (const g of games) {
    const row = el("div", "hist-row");
    const label = g.result === "win" ? "👑 " + formatBest(g.timeMs) : t("stats.solvedLabel");
    row.appendChild(el("span", "hist-size", g.size + "×" + g.size));
    row.appendChild(el("span", "hist-result", label));
    list.appendChild(row);
  }
  body.appendChild(list);
}
