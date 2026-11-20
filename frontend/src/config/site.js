// Public contact details shown on the Help page.
// Set them per deployment in frontend/.env (see .env.example). A channel that
// is left empty is simply not shown.
const clean = (value) => String(value ?? "").trim();

export const SITE_NAME = "کوزک";

export const CONTACT = {
  email: clean(import.meta.env.VITE_CONTACT_EMAIL),
  telegram: clean(import.meta.env.VITE_CONTACT_TELEGRAM).replace(/^@/, ""),
  phone: clean(import.meta.env.VITE_CONTACT_PHONE),
  instagram: clean(import.meta.env.VITE_CONTACT_INSTAGRAM).replace(/^@/, ""),
};
