const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_PATTERN = /^09\d{9}$/;

/** Converts Persian/Arabic-Indic digits to ASCII digits. */
export function normalizeDigits(value) {
  return String(value ?? "")
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

/** Converts ASCII digits in a string to Persian digits (for display only). */
export function toPersianDigits(value) {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

/**
 * Trims the input and makes it consistent so that "request" and "verify"
 * always send the exact same identifier to the backend.
 */
export function normalizeIdentifier(raw) {
  const value = normalizeDigits(raw).trim();
  return value.includes("@") ? value.toLowerCase() : value;
}

/** Returns an error message (Persian) or "" when the identifier is valid. */
export function validateIdentifier(identifier) {
  if (!identifier) return "شماره موبایل یا ایمیل را وارد کنید.";
  if (identifier.includes("@")) {
    return EMAIL_PATTERN.test(identifier) ? "" : "ایمیل واردشده معتبر نیست.";
  }
  return MOBILE_PATTERN.test(identifier)
    ? ""
    : "شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد.";
}
