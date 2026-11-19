import { useCallback, useEffect, useMemo, useState } from "react";
import AccountCard from "../components/dashboard/AccountCard.jsx";
import AccountFormModal from "../components/dashboard/AccountFormModal.jsx";
import TransactionFormModal from "../components/dashboard/TransactionFormModal.jsx";
import TransactionList from "../components/dashboard/TransactionList.jsx";
import Money from "../components/ui/Money.jsx";
import { primaryButton, secondaryButton } from "../components/ui/styles.js";
import {
  listAccounts,
  listCategories,
  listTransactions,
} from "../services/financeService.js";

const byId = (items) =>
  Object.fromEntries(items.map((item) => [item.id, item]));

export default function DashboardPage({
  user,
  onLogout,
  loggingOut,
  logoutError,
}) {
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // "account" | "transaction" | null

  const load = useCallback(async () => {
    try {
      const [nextAccounts, nextCategories, nextTransactions] =
        await Promise.all([
          listAccounts(),
          listCategories(),
          listTransactions(),
        ]);
      setAccounts(nextAccounts);
      setCategories(nextCategories);
      setTransactions(nextTransactions);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeAccounts = useMemo(
    () => accounts.filter((account) => !account.is_archived),
    [accounts],
  );
  const accountsById = useMemo(() => byId(accounts), [accounts]);
  const categoriesById = useMemo(() => byId(categories), [categories]);
  const totalBalance = useMemo(
    () => activeAccounts.reduce((sum, account) => sum + account.balance, 0),
    [activeAccounts],
  );
  // Newest first; created_at breaks ties between rows on the same day.
  const sortedTransactions = useMemo(
    () =>
      [...transactions].sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          (b.created_at ?? "").localeCompare(a.created_at ?? ""),
      ),
    [transactions],
  );

  const handleCreated = () => {
    setModal(null);
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/30 bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">کوزک</h1>
            <p dir="ltr" className="text-start text-xs text-text/60">
              {user.phone ?? user.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLogout}
              disabled={loggingOut}
              className={`${secondaryButton} px-4 py-2 text-sm`}
            >
              {loggingOut ? "در حال خروج..." : "خروج"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        {logoutError ? (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {logoutError}
          </p>
        ) : null}

        {error ? (
          <div role="alert" className="flex items-center justify-between gap-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={load} className="shrink-0 font-bold underline">
              تلاش دوباره
            </button>
          </div>
        ) : null}

        <section className="rounded-3xl bg-primary p-6 text-white shadow-sm">
          <p className="text-sm text-white/70">مجموع موجودی حساب‌ها</p>
          <Money
            value={totalBalance}
            className="mt-2 block text-3xl font-bold sm:text-4xl"
          />
        </section>

        <section aria-labelledby="accounts-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="accounts-title" className="text-lg font-bold text-text">
              حساب‌ها
            </h2>
            <button
              type="button"
              onClick={() => setModal("account")}
              disabled={loading}
              className={`${secondaryButton} px-4 py-2 text-sm`}
            >
              + حساب جدید
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-text/60">در حال بارگذاری...</p>
          ) : activeAccounts.length === 0 ? (
            <div className="rounded-3xl bg-surface p-8 text-center text-sm text-text/60 shadow-sm">
              هنوز حسابی نساخته‌اید. برای شروع یک حساب بسازید.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeAccounts.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="transactions-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="transactions-title" className="text-lg font-bold text-text">
              تراکنش‌ها
            </h2>
            <button
              type="button"
              onClick={() => setModal("transaction")}
              disabled={loading || activeAccounts.length === 0}
              className={`${primaryButton} px-4 py-2 text-sm`}
            >
              + تراکنش جدید
            </button>
          </div>

          {!loading && (
            <TransactionList
              transactions={sortedTransactions}
              accountsById={accountsById}
              categoriesById={categoriesById}
            />
          )}
        </section>
      </main>

      {modal === "account" ? (
        <AccountFormModal
          accounts={accounts}
          onClose={() => setModal(null)}
          onCreated={handleCreated}
        />
      ) : null}

      {modal === "transaction" ? (
        <TransactionFormModal
          accounts={activeAccounts}
          categories={categories}
          onClose={() => setModal(null)}
          onCreated={handleCreated}
          onCategoryCreated={(created) =>
            setCategories((previous) => [...previous, created])
          }
        />
      ) : null}
    </div>
  );
}
