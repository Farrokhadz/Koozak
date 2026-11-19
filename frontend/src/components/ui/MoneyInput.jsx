import { formatNumber } from "../../utils/format.js";
import { normalizeDigits } from "../../utils/identifier.js";
import { inputClass } from "./styles.js";

/**
 * Controlled amount field. `value` is a plain digit string (e.g. "1250000").
 * The box shows it grouped ("1,250,000") and a Persian readout sits below.
 */
export default function MoneyInput({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = "0",
}) {
  const display = value ? Number(value).toLocaleString("en-US") : "";

  return (
    <div>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        dir="ltr"
        autoComplete="off"
        value={display}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            normalizeDigits(event.target.value).replace(/\D/g, "").slice(0, 13),
          )
        }
        className={`${inputClass} text-left`}
      />
      {value ? (
        <p className="mt-1.5 text-xs text-text/60">
          {formatNumber(Number(value))} تومان
        </p>
      ) : null}
    </div>
  );
}
