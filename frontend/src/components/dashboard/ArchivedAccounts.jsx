import Money from "../ui/Money.jsx";
import { RestoreIcon, TrashIcon } from "../ui/icons.jsx";
import { iconButton, iconButtonDanger } from "../ui/styles.js";
import { ACCOUNT_TYPES } from "../../utils/finance.js";
import { formatNumber } from "../../utils/format.js";

/** Collapsed list of archived accounts, so they can be restored or deleted. */
export default function ArchivedAccounts({ accounts, onRestore, onDelete }) {
  if (accounts.length === 0) return null;

  return (
    <details className="mt-4 rounded-3xl bg-surface shadow-sm">
      <summary className="cursor-pointer select-none px-5 py-4 text-sm font-medium text-text/70">
        حساب‌های آرشیوشده ({formatNumber(accounts.length)})
      </summary>
      <ul className="divide-y divide-background border-t border-background">
        {accounts.map((account) => (
          <li key={account.id} className="flex items-center gap-3 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{account.name}</p>
              <p className="text-xs text-text/60">
                {ACCOUNT_TYPES[account.type]?.label ?? account.type}
              </p>
            </div>
            <Money value={account.balance} className="shrink-0 text-sm font-bold" />
            <button
              type="button"
              onClick={() => onRestore(account)}
              aria-label={`بازگردانی حساب ${account.name}`}
              className={iconButton}
            >
              <RestoreIcon />
            </button>
            <button
              type="button"
              onClick={() => onDelete(account)}
              aria-label={`حذف حساب ${account.name}`}
              className={iconButtonDanger}
            >
              <TrashIcon />
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
