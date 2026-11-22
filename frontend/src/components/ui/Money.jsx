import { formatNumber } from "../../utils/format.js";

/**
 * Displays a toman amount with Persian digits. Negative values always get a
 * minus sign; `sign` adds a prefix (e.g. "+") for positive values.
 * `unitClassName` styles the "تومان" label (smaller and softer by default).
 */
export default function Money({
  value,
  sign = "",
  className = "",
  unitClassName = "text-[0.7em] font-normal opacity-70",
}) {
  const prefix = value < 0 ? "−" : sign;
  return (
    <span className={className}>
      <bdi dir="ltr" className="inline-block">
        {prefix}
        {formatNumber(Math.abs(value))}
      </bdi>{" "}
      <span className={unitClassName}>تومان</span>
    </span>
  );
}
