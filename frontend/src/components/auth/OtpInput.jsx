import { useEffect, useRef } from "react";
import { normalizeDigits } from "../../utils/identifier.js";

/**
 * Row of single-digit boxes. `value` is always a gap-free digit string.
 * The row is forced to LTR so digits read left-to-right like the code itself.
 */
export default function OtpInput({
  length = 5,
  value,
  onChange,
  disabled = false,
  hasError = false,
}) {
  const inputsRef = useRef([]);

  const focusBox = (index) => {
    const safeIndex = Math.max(0, Math.min(length - 1, index));
    inputsRef.current[safeIndex]?.focus();
  };

  useEffect(() => {
    focusBox(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (index, event) => {
    const digit = normalizeDigits(event.target.value).replace(/\D/g, "").slice(-1);

    if (!digit) {
      onChange(value.slice(0, index) + value.slice(index + 1));
      return;
    }

    const next = (value.slice(0, index) + digit + value.slice(index + 1)).slice(
      0,
      length,
    );
    onChange(next);
    focusBox(Math.min(next.length, length - 1));
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !value[index] && index > 0) {
      event.preventDefault();
      onChange(value.slice(0, index - 1));
      focusBox(index - 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = normalizeDigits(event.clipboardData.getData("text"))
      .replace(/\D/g, "")
      .slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    focusBox(Math.min(pasted.length, length - 1));
  };

  return (
    <div dir="ltr" className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`رقم ${index + 1} از ${length}`}
          value={value[index] ?? ""}
          disabled={disabled}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          className={`h-14 w-12 rounded-2xl border bg-surface text-center text-2xl font-bold text-text outline-none transition focus:ring-2 disabled:opacity-60 sm:h-16 sm:w-14 ${
            hasError
              ? "border-red-400 focus:border-red-500 focus:ring-red-200"
              : "border-secondary/50 focus:border-primary focus:ring-secondary/50"
          }`}
        />
      ))}
    </div>
  );
}
