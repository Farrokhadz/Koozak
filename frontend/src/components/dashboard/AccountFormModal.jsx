import { useState } from "react";
import AccountBadge from "./AccountBadge.jsx";
import Modal from "../ui/Modal.jsx";
import MoneyInput from "../ui/MoneyInput.jsx";
import { CheckIcon } from "../ui/icons.jsx";
import { inputClass, labelClass, primaryButton } from "../ui/styles.js";
import { createAccount, updateAccount } from "../../services/financeService.js";
import { ACCOUNT_TYPES } from "../../utils/finance.js";
import {
  ACCOUNT_COLORS,
  DEFAULT_ACCOUNT_COLOR,
  accountColor,
} from "../../utils/palette.js";

const cleanName = (value) => value.replace(/\s+/g, " ").trim();

export default function AccountFormModal({
  account, // the account being edited; omit to create a new one
  accounts,
  onClose,
  onSaved,
}) {
  const isEditing = Boolean(account);
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState(account?.type ?? "bank_card");
  const [color, setColor] = useState(account?.color ?? DEFAULT_ACCOUNT_COLOR);
  const [initialBalance, setInitialBalance] = useState(
    account ? String(account.initial_balance) : "",
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const palette = accountColor(color);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    const trimmed = cleanName(name);
    if (!trimmed) {
      setError("نام حساب را وارد کنید.");
      return;
    }
    if (trimmed.length > 60) {
      setError("نام حساب نباید بیشتر از ۶۰ حرف باشد.");
      return;
    }
    // Check here for a quicker message. Archived accounts count too: the
    // database constraint covers them.
    if (
      accounts.some(
        (other) => other.id !== account?.id && other.name === trimmed,
      )
    ) {
      setError("حسابی با این نام از قبل وجود دارد.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const payload = {
        name: trimmed,
        type,
        color,
        initial_balance: Number(initialBalance || 0),
      };
      if (isEditing) await updateAccount(account.id, payload);
      else await createAccount(payload);
      onSaved();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Modal title={isEditing ? "ویرایش حساب" : "حساب جدید"} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Live preview, so the chosen color is visible before saving. */}
        <div
          aria-hidden="true"
          style={{ backgroundColor: palette.soft, color: palette.ink }}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors"
        >
          <AccountBadge type={type} color={color} small />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {cleanName(name) || "نام حساب"}
            </p>
            <p className="text-xs opacity-60">{ACCOUNT_TYPES[type]?.label}</p>
          </div>
        </div>

        <div>
          <label htmlFor="account-name" className={labelClass}>
            نام حساب
          </label>
          <input
            id="account-name"
            type="text"
            autoFocus
            maxLength={60}
            value={name}
            disabled={loading}
            placeholder="مثلاً کارت بانک ملی"
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError("");
            }}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="account-type" className={labelClass}>
            نوع حساب
          </label>
          <select
            id="account-type"
            value={type}
            disabled={loading}
            onChange={(event) => setType(event.target.value)}
            className={inputClass}
          >
            {Object.entries(ACCOUNT_TYPES).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <fieldset disabled={loading}>
          <legend className={labelClass}>رنگ حساب</legend>
          <div className="flex flex-wrap gap-3">
            {Object.entries(ACCOUNT_COLORS).map(([key, option]) => (
              <label key={key} className="cursor-pointer">
                <input
                  type="radio"
                  name="account-color"
                  value={key}
                  checked={color === key}
                  onChange={() => setColor(key)}
                  aria-label={option.label}
                  className="peer sr-only"
                />
                <span
                  title={option.label}
                  style={{ backgroundColor: option.solid }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-surface transition hover:scale-105 peer-checked:ring-2 peer-checked:ring-text/60 peer-focus-visible:ring-2 peer-focus-visible:ring-primary"
                >
                  {color === key ? <CheckIcon size={16} /> : null}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="account-balance" className={labelClass}>
            موجودی اولیه (تومان)
          </label>
          <MoneyInput
            id="account-balance"
            value={initialBalance}
            onChange={(next) => {
              setInitialBalance(next);
              if (error) setError("");
            }}
            disabled={loading}
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
          >
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={loading} className={`${primaryButton} w-full`}>
          {loading
            ? "در حال ذخیره..."
            : isEditing
              ? "ذخیره تغییرات"
              : "ذخیره حساب"}
        </button>
      </form>
    </Modal>
  );
}
