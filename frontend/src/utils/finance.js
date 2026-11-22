export const ACCOUNT_TYPES = {
  cash: { label: "نقد" },
  wallet: { label: "کیف پول" },
  bank_card: { label: "کارت بانکی" },
};

// Color coding: income = green, expense = red, transfer = amber (brand accent).
export const TRANSACTION_TYPES = {
  income: {
    label: "درآمد",
    sign: "+",
    icon: "↓",
    badge: "bg-emerald-50 text-emerald-700",
    amount: "text-emerald-700",
    active: "bg-surface text-emerald-700 shadow-sm",
  },
  expense: {
    label: "هزینه",
    sign: "−",
    icon: "↑",
    badge: "bg-red-50 text-red-600",
    amount: "text-red-600",
    active: "bg-surface text-red-600 shadow-sm",
  },
  transfer: {
    label: "انتقال",
    sign: "",
    icon: "⇄",
    badge: "bg-accent/25 text-amber-800",
    amount: "text-amber-700",
    active: "bg-surface text-amber-700 shadow-sm",
  },
};

/** Row heading: "from ← to" for transfers, the category name otherwise. */
export function transactionTitle(transaction, accountsById, categoriesById) {
  if (transaction.type === "transfer") {
    const from = accountsById[transaction.account]?.name ?? "—";
    const to = accountsById[transaction.to_account]?.name ?? "—";
    return `${from} ← ${to}`;
  }
  return (
    categoriesById[transaction.category]?.name_fa ??
    TRANSACTION_TYPES[transaction.type].label
  );
}
