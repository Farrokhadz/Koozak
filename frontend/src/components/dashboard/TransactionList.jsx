import Money from "../ui/Money.jsx";
import { EditIcon, TrashIcon } from "../ui/icons.jsx";
import { iconButton, iconButtonDanger, panel } from "../ui/styles.js";
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
    <li className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-background/60 sm:px-5">
      <span
        aria-hidden="true"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${style.badge}`}
      >
        {style.icon}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="mt-0.5 truncate text-xs text-text/50">
          {details.join(" · ")}
        </p>
      </div>

      <div className="reveal-on-hover flex shrink-0">
        <button
          type="button"
          onClick={() => onEdit(transaction)}
          aria-label={`ویرایش تراکنش ${title}`}
          className={iconButton}
        >
          <EditIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(transaction)}
          aria-label={`حذف تراکنش ${title}`}
          className={iconButtonDanger}
        >
          <TrashIcon size={16} />
        </button>
      </div>
      <div className="shrink-0 text-end">
        <Money
          value={transaction.amount}
          sign={style.sign}
          className={`text-sm font-semibold ${style.amount}`}
        />
        {transaction.fee > 0 ? (
          <p className="mt-0.5 text-xs text-text/40">
            کارمزد {formatNumber(transaction.fee)}
          </p>
        ) : null}
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
      <div className="rounded-2xl border border-dashed border-text/15 p-8 text-center text-sm text-text/50">
        هنوز تراکنشی ثبت نشده است.
      </div>
    );
  }

  const visible = transactions.slice(0, MAX_VISIBLE);

  return (
    <div className={`${panel} overflow-hidden`}>
      <ul className="divide-y divide-text/5">
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
        <p className="border-t border-text/5 px-5 py-3 text-center text-xs text-text/50">
          {formatNumber(MAX_VISIBLE)} تراکنش آخر از{" "}
          {formatNumber(transactions.length)} تراکنش نمایش داده می‌شود.
        </p>
      ) : null}
    </div>
  );
}
