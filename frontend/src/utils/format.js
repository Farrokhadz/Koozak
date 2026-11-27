const numberFormatter = new Intl.NumberFormat("fa-IR");
const jalaliFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

/** 1250000 -> "۱٬۲۵۰٬۰۰۰" */
export function formatNumber(value) {
  return numberFormatter.format(value);
}

/** "2026-11-19" (Gregorian, as stored in the DB) -> "۲۸ آبان ۱۴۰۵" */
export function formatJalaliDate(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-").map(Number);
  // Built from parts (not parsed as a string) to avoid timezone day-shifts.
  return jalaliFormatter.format(new Date(year, month - 1, day));
}

/** Today's date in local time as "YYYY-MM-DD". */
export function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

const percentFormatter = new Intl.NumberFormat("fa-IR", {
  style: "percent",
  maximumFractionDigits: 0,
});

/** 0.375 -> "٣٨٪"; anything under one percent reads "کمتر از ۱٪". */
export function formatPercent(share) {
  return share > 0 && share < 0.01
    ? `کمتر از ${percentFormatter.format(0.01)}`
    : percentFormatter.format(share);
}
