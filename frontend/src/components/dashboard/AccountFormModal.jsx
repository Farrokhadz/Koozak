import { useState } from "react";
import Modal from "../ui/Modal.jsx";
import MoneyInput from "../ui/MoneyInput.jsx";
import { inputClass, labelClass, primaryButton } from "../ui/styles.js";
import { createAccount } from "../../services/financeService.js";
import { ACCOUNT_TYPES } from "../../utils/finance.js";

const cleanName = (value) => value.replace(/\s+/g, " ").trim();

export default function AccountFormModal({ accounts, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("bank_card");
  const [initialBalance, setInitialBalance] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    // The backend answers a duplicate name with a 500, so check it here.
    // Archived accounts count too: the database constraint covers them.
    if (accounts.some((account) => account.name === trimmed)) {
      setError("حسابی با این نام از قبل وجود دارد.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await createAccount({
        name: trimmed,
        type,
        initial_balance: Number(initialBalance || 0),
      });
      onCreated();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Modal title="حساب جدید" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
          {loading ? "در حال ذخیره..." : "ذخیره حساب"}
        </button>
      </form>
    </Modal>
  );
}
