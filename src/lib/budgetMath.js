// ─────────────────────────────────────────────────────────────────────────────
// BUDGET MATH — frequency normalization, month keys, totals
// ─────────────────────────────────────────────────────────────────────────────

export const FREQUENCIES = [
  { key: "one-time", label: "One-time", monthlyMult: 0 },
  { key: "daily", label: "Daily", monthlyMult: 30.4375 },
  { key: "weekly", label: "Weekly", monthlyMult: 4.34524 },
  { key: "biweekly", label: "Every 2 weeks", monthlyMult: 2.17262 },
  { key: "monthly", label: "Monthly", monthlyMult: 1 },
  { key: "quarterly", label: "Quarterly", monthlyMult: 1 / 3 },
  { key: "yearly", label: "Yearly", monthlyMult: 1 / 12 },
];

export function getFrequency(key) {
  return FREQUENCIES.find((f) => f.key === key) || FREQUENCIES.find((f) => f.key === "monthly");
}

/**
 * Convert an item's amount to its equivalent monthly value.
 * One-time items return 0 (they count only toward the month they were logged).
 */
export function toMonthly(amount, frequency = "monthly") {
  const n = Number(amount) || 0;
  const f = getFrequency(frequency);
  return n * f.monthlyMult;
}

export function toPeriod(amount, frequency, period = "monthly") {
  const monthly = toMonthly(amount, frequency);
  if (period === "monthly") return monthly;
  if (period === "quarterly") return monthly * 3;
  if (period === "yearly") return monthly * 12;
  return monthly;
}

// ─────────────────────────────────────────────────────────────────────────────
// DATES / MONTH KEYS (YYYY-MM)
// ─────────────────────────────────────────────────────────────────────────────

export function monthKey(date) {
  if (!date) return currentMonthKey();
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return currentMonthKey();
  return d.toISOString().slice(0, 7);
}

export function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

export function previousMonthKey(base = currentMonthKey()) {
  const [y, m] = base.split("-").map((n) => parseInt(n, 10));
  const prev = new Date(Date.UTC(y, m - 2, 1)); // m-2 because JS months are 0-based
  return prev.toISOString().slice(0, 7);
}

export function formatMonthLabel(key) {
  if (!key) return "";
  const [y, m] = key.split("-").map((n) => parseInt(n, 10));
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────────────────────────
// MONTHLY EFFECTIVE TOTALS — accounts for recurring + one-time items
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given a list of items, return the total dollars they contribute to `monthKey`.
 * - one-time items: count only if their `date` month === monthKey
 * - recurring items: normalized monthly value, counted every month after createdAt
 *   (defaults to counting always for seed items without createdAt)
 */
export function sumItemsForMonth(items, targetMonth = currentMonthKey()) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, it) => {
    if (!it || it.active === false) return sum;
    const amt = Number(it.amount) || 0;
    if (it.frequency === "one-time") {
      return monthKey(it.date) === targetMonth ? sum + amt : sum;
    }
    // Recurring: only count in months at-or-after the item's createdAt month
    if (it.createdAt) {
      const startMonth = monthKey(it.createdAt);
      if (targetMonth < startMonth) return sum;
    }
    return sum + toMonthly(amt, it.frequency || "monthly");
  }, 0);
}

/**
 * Current-rate monthly total — what the budget runs at "right now".
 * Useful for DTI and leftover displays.
 */
export function sumRecurringMonthly(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, it) => {
    if (!it || it.active === false) return sum;
    if (it.frequency === "one-time") return sum;
    return sum + toMonthly(it.amount, it.frequency || "monthly");
  }, 0);
}

/**
 * Sum of one-time items whose date falls inside `targetMonth`.
 */
export function sumOneTimeInMonth(items, targetMonth = currentMonthKey()) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, it) => {
    if (!it || it.active === false) return sum;
    if (it.frequency !== "one-time") return sum;
    if (monthKey(it.date) !== targetMonth) return sum;
    return sum + (Number(it.amount) || 0);
  }, 0);
}

/**
 * Category totals for the given month, normalized to monthly dollars.
 */
export function categoryTotalsForMonth(items, targetMonth = currentMonthKey()) {
  const totals = {};
  if (!Array.isArray(items)) return totals;
  for (const it of items) {
    if (!it || it.active === false) continue;
    const cat = it.category || "Miscellaneous";
    let amt = 0;
    if (it.frequency === "one-time") {
      if (monthKey(it.date) !== targetMonth) continue;
      amt = Number(it.amount) || 0;
    } else {
      if (it.createdAt && monthKey(it.createdAt) > targetMonth) continue;
      amt = toMonthly(it.amount, it.frequency || "monthly");
    }
    totals[cat] = (totals[cat] || 0) + amt;
  }
  return totals;
}

/**
 * Produce a month-over-month comparison object.
 * Returns { current, previous, diff (current-previous for each), byCategory: [...] }
 */
export function compareMonths(items, currentM = currentMonthKey(), previousM = previousMonthKey()) {
  const current = categoryTotalsForMonth(items, currentM);
  const previous = categoryTotalsForMonth(items, previousM);

  const allCats = new Set([...Object.keys(current), ...Object.keys(previous)]);
  const byCategory = [];
  let totalCurrent = 0;
  let totalPrevious = 0;

  for (const cat of allCats) {
    const cur = current[cat] || 0;
    const prev = previous[cat] || 0;
    totalCurrent += cur;
    totalPrevious += prev;
    byCategory.push({
      category: cat,
      current: cur,
      previous: prev,
      delta: cur - prev,
      pct: prev > 0 ? ((cur - prev) / prev) * 100 : cur > 0 ? 100 : 0,
    });
  }

  byCategory.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const improved = byCategory.filter((c) => c.delta < 0).sort((a, b) => a.delta - b.delta);
  const worsened = byCategory.filter((c) => c.delta > 0).sort((a, b) => b.delta - a.delta);

  return {
    currentMonth: currentM,
    previousMonth: previousM,
    totalCurrent,
    totalPrevious,
    totalDelta: totalCurrent - totalPrevious,
    totalPct: totalPrevious > 0 ? ((totalCurrent - totalPrevious) / totalPrevious) * 100 : 0,
    byCategory,
    topImproved: improved.slice(0, 3),
    topWorsened: worsened.slice(0, 3),
  };
}
