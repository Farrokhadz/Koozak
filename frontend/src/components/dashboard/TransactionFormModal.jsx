import { useState } from "react";
import Modal from "../ui/Modal.jsx";
import MoneyInput from "../ui/MoneyInput.jsx";
import {
  inputClass,
  labelClass,
  primaryButton,
  secondaryButton,
} from "../ui/styles.js";
import {
  createCategory,
  createTransaction,
  updateTransaction,
} from "../../services/financeService.js";
import { formatJalaliDate, todayIso } from "../../utils/format.js";
import { TRANSACTION_TYPES } from "../../utils/finance.js";

const cleanName = (value) => value.replace(/\s+/g, " ").trim();

export default function TransactionFormModal({
  transaction, // the transaction being edited; omit to create a new one
  accounts, // active accounts (plus the ones this transaction already uses)
  categories,
  onClose,
  onSaved,
  onCategoryCreated,
}) {
  const isEditing = Boolean(transaction);
  const [type, setType] = useState(transaction?.type ?? "expense");
  const [amount, setAmount] = useState(
    transaction ? String(transaction.amount) : "",
  );
  const [accountId, setAccountId] = useState(
    String(transaction?.account ?? accounts[0]?.id ?? ""),
  );
  const [toAccountId, setToAccountId] = useState(
    String(transaction?.to_account ?? ""),
  );
  const [categoryId, setCategoryId] = useState(
    String(transaction?.category ?? ""),
  );
  const [fee, setFee] = useState(
    transaction?.fee > 0 ? String(transaction.fee) : "",
  );
  const [date, setDate] = useState(transaction?.date ?? todayIso());
  const [note, setNote] = useState(transaction?.note ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [categoryLoading, setCategoryLoading] = useState(false);

  const isTransfer = type === "transfer";
  const busy = loading || categoryLoading;
  const typeCategories = categories.filter(
    (category) =>
      category.kind === type &&
      (!category.is_archived || String(category.id) === categoryId),
  );
  const targetAccounts = accounts.filter(
    (account) => String(account.id) !== accountId,
  );
  // With no category yet there is nothing to pick, so the adder opens itself.
  const showCategoryAdder = addingCategory || typeCategories.length === 0;

  const clearError = () => {
    if (error) setError("");
  };

  const changeType = (next) => {
    setType(next);
    setCategoryId("");
    setToAccountId("");
    setAddingCategory(false);
    setNewCategoryName("");
    setCategoryError("");
    setError("");
  };

  const changeAccount = (next) => {
    setAccountId(next);
    if (next === toAccountId) setToAccountId("");
    clearError();
  };

  const handleAddCategory = async () => {
    if (categoryLoading) return;
    const trimmed = cleanName(newCategoryName);
    if (!trimmed) {
      setCategoryError("نام دسته‌بندی را وارد کنید.");
      return;
    }
    if (trimmed.length > 60) {
      setCategoryError("نام دسته‌بندی نباید بیشتر از ۶۰ حرف باشد.");
      return;
    }
    if (
      categories.some(
        (category) => category.kind === type && category.name_fa === trimmed,
      )
    ) {
      setCategoryError("این دسته‌بندی از قبل وجود دارد.");
      return;
    }

    setCategoryLoading(true);
    setCategoryError("");
    try {
      const created = await createCategory({ name_fa: trimmed, kind: type });
      onCategoryCreated(created);
      setCategoryId(String(created.id));
      setAddingCategory(false);
      setNewCategoryName("");
      clearError();
    } catch (err) {
      setCategoryError(err.message);
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;

    if (!(Number(amount) > 0)) {
      setError("مبلغ را وارد کنید.");
      return;
    }
    if (!accountId) {
      setError("حساب را انتخاب کنید.");
      return;
    }
    if (isTransfer) {
      if (!toAccountId) {
        setError("حساب مقصد را انتخاب کنید.");
        return;
      }
      if (toAccountId === accountId) {
        setError("حساب مبدأ و مقصد نمی‌توانند یکسان باشند.");
        return;
      }
    } else if (!categoryId) {
      setError("دسته‌بندی را انتخاب کنید.");
      return;
    }
    if (!date) {
      setError("تاریخ را وارد کنید.");
      return;
    }

    const payload = {
      type,
      account: Number(accountId),
      amount: Number(amount),
      date,
      note: note.trim(),
      ...(isTransfer
        ? { to_account: Number(toAccountId), fee: Number(fee || 0), category: null }
        : { category: Number(categoryId), to_account: null, fee: 0 }),
    };

    setLoading(true);
    setError("");
    try {
      if (isEditing) await updateTransaction(transaction.id, payload);
      else await createTransaction(payload);
      onSaved();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Modal title={isEditing ? "ویرایش تراکنش" : "تراکنش جدید"} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <div
            role="group"
            aria-label="نوع تراکنش"
            className="grid grid-cols-3 gap-1 rounded-2xl bg-background p-1"
          >
            {Object.entries(TRANSACTION_TYPES).map(([value, config]) => (
              <button
                key={value}
                type="button"
                aria-pressed={type === value}
                disabled={busy || (value === "transfer" && accounts.length < 2)}
                onClick={() => changeType(value)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  type === value ? config.active : "text-text/70 hover:bg-surface"
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
          {accounts.length < 2 ? (
            <p className="mt-2 text-xs text-text/60">
              برای ثبت انتقال، حداقل به دو حساب نیاز دارید.
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="tx-amount" className={labelClass}>
            مبلغ (تومان)
          </label>
          <MoneyInput
            id="tx-amount"
            value={amount}
            onChange={(next) => {
              setAmount(next);
              clearError();
            }}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="tx-account" className={labelClass}>
            {isTransfer ? "از حساب" : "حساب"}
          </label>
          <select
            id="tx-account"
            value={accountId}
            disabled={loading}
            onChange={(event) => changeAccount(event.target.value)}
            className={inputClass}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {isTransfer ? (
          <>
            <div>
              <label htmlFor="tx-to-account" className={labelClass}>
                به حساب
              </label>
              <select
                id="tx-to-account"
                value={toAccountId}
                disabled={loading}
                onChange={(event) => {
                  setToAccountId(event.target.value);
                  clearError();
                }}
                className={inputClass}
              >
                <option value="">انتخاب کنید</option>
                {targetAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tx-fee" className={labelClass}>
                کارمزد (تومان، اختیاری)
              </label>
              <MoneyInput id="tx-fee" value={fee} onChange={setFee} disabled={loading} />
            </div>
          </>
        ) : (
          <div>
            <label htmlFor="tx-category" className={labelClass}>
              دسته‌بندی
            </label>

            {typeCategories.length > 0 ? (
              <select
                id="tx-category"
                value={categoryId}
                disabled={loading}
                onChange={(event) => {
                  setCategoryId(event.target.value);
                  clearError();
                }}
                className={inputClass}
              >
                <option value="">انتخاب کنید</option>
                {typeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name_fa}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs leading-6 text-text/60">
                هنوز دسته‌بندی {TRANSACTION_TYPES[type].label} نساخته‌اید. یکی بسازید:
              </p>
            )}

            {showCategoryAdder ? (
              <div className="mt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    aria-label="نام دسته‌بندی جدید"
                    maxLength={60}
                    value={newCategoryName}
                    disabled={busy}
                    placeholder="نام دسته‌بندی جدید"
                    onChange={(event) => {
                      setNewCategoryName(event.target.value);
                      if (categoryError) setCategoryError("");
                    }}
                    onKeyDown={(event) => {
                      // Enter here must add the category, not submit the form.
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleAddCategory();
                      }
                    }}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={busy}
                    className={`${secondaryButton} shrink-0 px-4`}
                  >
                    {categoryLoading ? "..." : "افزودن"}
                  </button>
                </div>
                {categoryError ? (
                  <p role="alert" className="mt-1.5 text-xs text-red-600">
                    {categoryError}
                  </p>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingCategory(true)}
                disabled={busy}
                className="mt-2 text-sm font-medium text-primary hover:underline disabled:opacity-60"
              >
                + دسته‌بندی جدید
              </button>
            )}
          </div>
        )}

        <div>
          <label htmlFor="tx-date" className={labelClass}>
            تاریخ
          </label>
          <input
            id="tx-date"
            type="date"
            dir="ltr"
            value={date}
            disabled={loading}
            onChange={(event) => {
              setDate(event.target.value);
              clearError();
            }}
            className={`${inputClass} text-left`}
          />
          {date ? (
            <p className="mt-1.5 text-xs text-text/60">
              تاریخ شمسی: {formatJalaliDate(date)}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="tx-note" className={labelClass}>
            یادداشت (اختیاری)
          </label>
          <input
            id="tx-note"
            type="text"
            maxLength={255}
            value={note}
            disabled={loading}
            onChange={(event) => setNote(event.target.value)}
            className={inputClass}
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

        <button type="submit" disabled={busy} className={`${primaryButton} w-full`}>
          {loading
            ? "در حال ذخیره..."
            : isEditing
              ? "ذخیره تغییرات"
              : "ثبت تراکنش"}
        </button>
      </form>
    </Modal>
  );
}
