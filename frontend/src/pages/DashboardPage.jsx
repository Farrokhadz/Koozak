import { useCallback, useEffect, useMemo, useState } from "react";
import AccountCard from "../components/dashboard/AccountCard.jsx";
import AccountFormModal from "../components/dashboard/AccountFormModal.jsx";
import ArchivedAccounts from "../components/dashboard/ArchivedAccounts.jsx";
import BalanceOverview from "../components/dashboard/BalanceOverview.jsx";
import TransactionFormModal from "../components/dashboard/TransactionFormModal.jsx";
import TransactionList from "../components/dashboard/TransactionList.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import InstallAppButton from "../components/ui/InstallAppButton.jsx";
import { ghostButtonSm, primaryButtonSm } from "../components/ui/styles.js";
import {
  deleteAccount,
  deleteTransaction,
  listAccounts,
  listCategories,
  listTransactions,
  updateAccount,
} from "../services/financeService.js";
import { transactionTitle } from "../utils/finance.js";
import { formatNumber } from "../utils/format.js";

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
  const [actionError, setActionError] = useState("");
  // { kind: "account" | "transaction", account?, transaction? } or null
  const [modal, setModal] = useState(null);
  // { kind: "delete-transaction" | "delete-account" | "archive-account", ... }
  const [confirm, setConfirm] = useState(null);

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
  const archivedAccounts = useMemo(
    () => accounts.filter((account) => account.is_archived),
    [accounts],
  );
  const accountsById = useMemo(() => byId(accounts), [accounts]);
  const categoriesById = useMemo(() => byId(categories), [categories]);
  const totalBalance = useMemo(
    () => activeAccounts.reduce((sum, account) => sum + account.balance, 0),
    [activeAccounts],
  );
  // Accounts that appear in any transaction can't be deleted, only archived.
  const usedAccountIds = useMemo(() => {
    const ids = new Set();
    for (const item of transactions) {
      ids.add(item.account);
      if (item.to_account) ids.add(item.to_account);
    }
    return ids;
  }, [transactions]);
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

  const handleSaved = () => {
    setModal(null);
    setActionError("");
    load();
  };

  const closeConfirm = () => setConfirm(null);

  // Each confirm handler throws on failure: ConfirmDialog shows the message.
  const runConfirmed = async (action) => {
    await action();
    setConfirm(null);
    setActionError("");
    await load();
  };

  const restoreAccount = async (account) => {
    try {
      await updateAccount(account.id, { is_archived: false });
      setActionError("");
      await load();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // "۵ تراکنش (۳ هزینه، ۱ درآمد، ۱ انتقال)" for the delete-account dialog.
  const usageSummary = (accountId) => {
    const counts = { expense: 0, income: 0, transfer: 0 };
    for (const item of transactions) {
      if (item.account === accountId || item.to_account === accountId) {
        counts[item.type] += 1;
      }
    }
    const total = counts.expense + counts.income + counts.transfer;
    const parts = [
      counts.expense && `${formatNumber(counts.expense)} هزینه`,
      counts.income && `${formatNumber(counts.income)} درآمد`,
      counts.transfer && `${formatNumber(counts.transfer)} انتقال`,
    ].filter(Boolean);
    return `${formatNumber(total)} تراکنش (${parts.join("، ")})`;
  };

  // Editing a transaction must still offer the accounts it already uses,
  // even if one of them has been archived since.
  const editedTransaction = modal?.kind === "transaction" ? modal.transaction : null;
  const transactionFormAccounts = editedTransaction
    ? accounts.filter(
        (account) =>
          !account.is_archived ||
          account.id === editedTransaction.account ||
          account.id === editedTransaction.to_account,
      )
    : activeAccounts;

  return (
    <div>
      <header className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <h1 className="text-lg font-semibold text-primary">کوزک</h1>
        <div className="flex items-center gap-1">
          <span dir="ltr" className="me-2 hidden text-xs text-text/40 sm:inline">
            {user.phone ?? user.email}
          </span>
          <InstallAppButton />
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className={ghostButtonSm}
          >
            {loggingOut ? "در حال خروج..." : "خروج"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-4 pb-12 pt-2 sm:px-6">
        {logoutError ? (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {logoutError}
          </p>
        ) : null}

        {actionError ? (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </p>
        ) : null}

        {error ? (
          <div role="alert" className="flex items-center justify-between gap-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={load} className="shrink-0 font-medium underline">
              تلاش دوباره
            </button>
          </div>
        ) : null}

        <BalanceOverview
          total={totalBalance}
          accounts={activeAccounts}
          transactions={transactions}
          loading={loading}
          unavailable={Boolean(error) && accounts.length === 0}
        />

        <section aria-labelledby="accounts-title">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="accounts-title" className="text-sm font-medium text-text/60">
              حساب‌ها
            </h2>
            <button
              type="button"
              onClick={() => setModal({ kind: "account" })}
              disabled={loading}
              className={ghostButtonSm}
            >
              + حساب جدید
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-text/50">در حال بارگذاری...</p>
          ) : activeAccounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-text/15 p-8 text-center text-sm text-text/50">
              هنوز حسابی نساخته‌اید. برای شروع یک حساب بسازید.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={(item) => setModal({ kind: "account", account: item })}
                  onArchive={(item) =>
                    setConfirm({ kind: "archive-account", account: item })
                  }
                  onDelete={(item) =>
                    setConfirm({ kind: "delete-account", account: item })
                  }
                />
              ))}
            </div>
          )}

          <ArchivedAccounts
            accounts={archivedAccounts}
            onRestore={restoreAccount}
            onDelete={(item) =>
              setConfirm({ kind: "delete-account", account: item })
            }
          />
        </section>

        <section aria-labelledby="transactions-title">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="transactions-title" className="text-sm font-medium text-text/60">
              تراکنش‌ها
            </h2>
            <button
              type="button"
              onClick={() => setModal({ kind: "transaction" })}
              disabled={loading || activeAccounts.length === 0}
              className={primaryButtonSm}
            >
              + تراکنش جدید
            </button>
          </div>

          {!loading && (
            <TransactionList
              transactions={sortedTransactions}
              accountsById={accountsById}
              categoriesById={categoriesById}
              onEdit={(item) => setModal({ kind: "transaction", transaction: item })}
              onDelete={(item) =>
                setConfirm({ kind: "delete-transaction", transaction: item })
              }
            />
          )}
        </section>
      </main>

      {modal?.kind === "account" ? (
        <AccountFormModal
          account={modal.account}
          accounts={accounts}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      ) : null}

      {modal?.kind === "transaction" ? (
        <TransactionFormModal
          transaction={modal.transaction}
          accounts={transactionFormAccounts}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
          onCategoryCreated={(created) =>
            setCategories((previous) => [...previous, created])
          }
        />
      ) : null}

      {confirm?.kind === "delete-transaction" ? (
        <ConfirmDialog
          title="حذف تراکنش"
          confirmLabel="حذف تراکنش"
          onClose={closeConfirm}
          onConfirm={() =>
            runConfirmed(() => deleteTransaction(confirm.transaction.id))
          }
        >
          تراکنش «
          {transactionTitle(confirm.transaction, accountsById, categoriesById)}
          » به مبلغ {formatNumber(confirm.transaction.amount)} تومان حذف شود؟
          موجودی حساب‌ها دوباره محاسبه می‌شود.
        </ConfirmDialog>
      ) : null}

      {confirm?.kind === "delete-account" &&
      usedAccountIds.has(confirm.account.id) ? (
        <ConfirmDialog
          title="حذف حساب و تراکنش‌ها"
          confirmLabel="حذف حساب و تراکنش‌ها"
          onClose={closeConfirm}
          onConfirm={() =>
            runConfirmed(() =>
              deleteAccount(confirm.account.id, { withTransactions: true }),
            )
          }
        >
          <p>
            با حساب «{confirm.account.name}» تاکنون{" "}
            <strong>{usageSummary(confirm.account.id)}</strong> ثبت کرده‌اید.
          </p>
          <p className="mt-2">
            با حذف این حساب، همه این تراکنش‌ها هم برای همیشه پاک می‌شوند و
            قابل بازگشت نیستند. مطمئنید که می‌خواهید حذفشان کنید؟
          </p>
          <p className="mt-2 text-text/60">
            اگر فقط نمی‌خواهید حساب نمایش داده شود، به‌جای حذف آرشیوش کنید.
          </p>
        </ConfirmDialog>
      ) : null}

      {confirm?.kind === "delete-account" &&
      !usedAccountIds.has(confirm.account.id) ? (
        <ConfirmDialog
          title="حذف حساب"
          confirmLabel="حذف حساب"
          onClose={closeConfirm}
          onConfirm={() => runConfirmed(() => deleteAccount(confirm.account.id))}
        >
          حساب «{confirm.account.name}» برای همیشه حذف شود؟
        </ConfirmDialog>
      ) : null}

      {confirm?.kind === "archive-account" ? (
        <ConfirmDialog
          title="آرشیو حساب"
          confirmLabel="آرشیو حساب"
          danger={false}
          onClose={closeConfirm}
          onConfirm={() =>
            runConfirmed(() =>
              updateAccount(confirm.account.id, { is_archived: true }),
            )
          }
        >
          حساب «{confirm.account.name}» آرشیو شود؟ از فهرست حساب‌ها و مجموع
          موجودی کنار می‌رود، ولی تراکنش‌هایش می‌ماند. هر وقت خواستید از بخش
          «حساب‌های آرشیوشده» برش می‌گردانید.
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
