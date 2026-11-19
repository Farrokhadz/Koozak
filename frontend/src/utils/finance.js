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
    active: "bg-emerald-600 text-white",
  },
  expense: {
    label: "هزینه",
    sign: "−",
    icon: "↑",
    badge: "bg-red-50 text-red-600",
    amount: "text-red-600",
    active: "bg-red-600 text-white",
  },
  transfer: {
    label: "انتقال",
    sign: "",
    icon: "⇄",
    badge: "bg-accent/25 text-amber-800",
    amount: "text-amber-700",
    active: "bg-accent text-text",
  },
};
