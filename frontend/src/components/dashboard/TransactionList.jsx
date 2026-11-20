import Money from "../ui/Money.jsx";
import { EditIcon, TrashIcon } from "../ui/icons.jsx";
import { iconButton, iconButtonDanger } from "../ui/styles.js";
import { formatJalaliDate, formatNumber } from "../../utils/format.js";
import { TRANSACTION_TYPES, transactionTitle } from "../../utils/finance.js";

const MAX_VISIBLE = 50;

function TransactionRow({
  transaction,
  accountsById,
  categoriesById,
  onEdit,
  onDelete,
}) {
  const style = TRANSACTION_TYPES[transaction.type];
  const account = accountsById[transaction.account]?.name ?? "—";
  const title = transactionTitle(transaction, accountsById, categoriesById);

  const details = [
    transaction.type === "transfer" ? "انتقال" : account,
    formatJalaliDate(transaction.date),
    transaction.note,
  ].filter(Boolean);

  return (
    <li className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6">
      <span
        aria-hidden="true"
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${style.badge}`}
      >
        {style.icon}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{title}</p>
        <p className="mt-0.5 truncate text-xs text-text/60">
          {details.join(" · ")}
        </p>
      </div>

      <div className="shrink-0 text-end">
        <Money
          value={transaction.amount}
          sign={style.sign}
          className={`font-bold ${style.amount}`}
        />
        {transaction.fee > 0 ? (
          <p className="mt-0.5 text-xs text-text/50">
            کارمزد {formatNumber(transaction.fee)}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0">
        <button
          type="button"
          onClick={() => onEdit(transaction)}
          aria-label={`ویرایش تراکنش ${title}`}
          className={iconButton}
        >
          <EditIcon />
        </button>
        <button
          type="button"
          onClick={() => onDelete(transaction)}
          aria-label={`حذف تراکنش ${title}`}
          className={iconButtonDanger}
        >
          <TrashIcon />
        </button>
      </div>
    </li>
  );
}

export default function TransactionList({
  transactions,
  accountsById,
  categoriesById,
  onEdit,
  onDelete,
}) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-3xl bg-surface p-8 text-center text-sm text-text/60 shadow-sm">
        هنوز تراکنشی ثبت نشده است.
      </div>
    );
  }

  const visible = transactions.slice(0, MAX_VISIBLE);

  return (
    <div className="overflow-hidden rounded-3xl bg-surface shadow-sm">
      <ul className="divide-y divide-background">
        {visible.map((transaction) => (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            accountsById={accountsById}
            categoriesById={categoriesById}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>
      {transactions.length > MAX_VISIBLE ? (
        <p className="border-t border-background px-6 py-3 text-center text-xs text-text/60">
          {formatNumber(MAX_VISIBLE)} تراکنش آخر از {formatNumber(transactions.length)} تراکنش نمایش داده می‌شود.
        </p>
      ) : null}
    </div>
  );
}
