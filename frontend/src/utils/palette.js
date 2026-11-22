// Card colors an account can use. The keys match Account.Color on the backend.
// solid: swatch and icon badge, soft: card background, ink: text on the card.
export const ACCOUNT_COLORS = {
  green: { label: "سبز", solid: "#2F7D63", soft: "#E3F1EA", ink: "#174C3C" },
  blue: { label: "آبی", solid: "#3B6FD4", soft: "#E4ECFB", ink: "#1E3A78" },
  teal: { label: "فیروزه‌ای", solid: "#1F9A9A", soft: "#DDF2F1", ink: "#0F5757" },
  purple: { label: "بنفش", solid: "#7C5CD6", soft: "#ECE7FA", ink: "#43307F" },
  rose: { label: "صورتی", solid: "#D6527A", soft: "#FBE5EC", ink: "#7A2342" },
  orange: { label: "نارنجی", solid: "#D9692B", soft: "#FCEADB", ink: "#7A3B12" },
  amber: { label: "زرد", solid: "#B8810A", soft: "#FAF0CF", ink: "#6B4D07" },
  slate: { label: "خاکستری", solid: "#5B6B7A", soft: "#E8ECEF", ink: "#2C3A46" },
};

export const DEFAULT_ACCOUNT_COLOR = "green";

/** Colors for an account's `color` key; unknown keys fall back to the default. */
export const accountColor = (key) =>
  ACCOUNT_COLORS[key] ?? ACCOUNT_COLORS[DEFAULT_ACCOUNT_COLOR];
