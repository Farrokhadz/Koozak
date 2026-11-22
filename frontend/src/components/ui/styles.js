// Shared look: flat white surfaces, hairline borders, soft radius, no shadows.
// Sizes live in separate exports (…Sm) so a caller never has to override
// padding classes, which Tailwind doesn't resolve by class order.

export const labelClass = "mb-1.5 block text-sm font-medium text-text/80";

export const inputClass =
  "w-full rounded-xl border border-text/10 bg-surface px-4 py-2.5 text-text outline-none transition placeholder:text-text/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 disabled:opacity-60";

const buttonBase =
  "rounded-xl font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60";

const primary = "bg-primary text-white hover:bg-primary/90";
const secondary = "border border-text/10 bg-surface text-text hover:bg-text/5";
const danger = "bg-red-600 text-white hover:bg-red-700";

export const primaryButton = `${buttonBase} ${primary} px-5 py-2.5 text-sm`;
export const primaryButtonSm = `${buttonBase} ${primary} px-3.5 py-1.5 text-sm`;

export const secondaryButton = `${buttonBase} ${secondary} px-5 py-2.5 text-sm`;
export const secondaryButtonSm = `${buttonBase} ${secondary} px-3.5 py-1.5 text-sm`;

export const dangerButton = `${buttonBase} ${danger} px-5 py-2.5 text-sm`;

// Text-only action, e.g. "+ حساب جدید".
export const ghostButtonSm =
  "rounded-lg px-2.5 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60";

// Small round button holding just an icon (needs an aria-label).
export const iconButton =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text/40 transition hover:bg-text/5 hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60";

export const iconButtonDanger =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text/40 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-60";

// Same, but for use on a tinted account card: it inherits the card's ink color.
export const cardIconButton =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full opacity-60 transition hover:bg-black/5 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-current";

// Container for the rounded white panels used across the app.
export const panel = "rounded-2xl bg-surface ring-1 ring-text/5";
