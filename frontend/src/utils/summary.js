// Figures behind the balance overview on the dashboard.

// Persian-calendar month name, e.g. "آبان".
const monthNameFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  month: "long",
});
// Two dates are in the same Persian month exactly when these keys match.
const monthKeyFormatter = new Intl.DateTimeFormat("en-u-ca-persian", {
  year: "numeric",
  month: "numeric",
});

// Built from parts (not parsed as a string) to avoid timezone day-shifts.
const fromIso = (iso) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Income and spending in the current Persian month. Transfers between your
 * own accounts are neither; their fees are, because they lower the balance.
 */
export function monthSummary(transactions, now = new Date()) {
  const currentKey = monthKeyFormatter.format(now);
  let income = 0;
  let expense = 0;

  for (const item of transactions) {
    if (monthKeyFormatter.format(fromIso(item.date)) !== currentKey) continue;
    if (item.type === "income") income += item.amount;
    if (item.type === "expense") expense += item.amount;
    expense += item.fee ?? 0;
  }

  return { income, expense, monthName: monthNameFormatter.format(now) };
}

/**
 * Each account's share (0–1) of the money held in accounts with a positive
 * balance, largest first. Empty when there is nothing to split.
 */
export function balanceShares(accounts) {
  const positive = accounts.filter((account) => account.balance > 0);
  const total = positive.reduce((sum, account) => sum + account.balance, 0);
  if (total <= 0) return [];

  return positive
    .map((account) => ({ account, share: account.balance / total }))
    .sort((a, b) => b.share - a.share);
}
