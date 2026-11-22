import AccountBadge from "./AccountBadge.jsx";
import Money from "../ui/Money.jsx";
import { RestoreIcon, TrashIcon } from "../ui/icons.jsx";
import { iconButton, iconButtonDanger, panel } from "../ui/styles.js";
import { ACCOUNT_TYPES } from "../../utils/finance.js";
import { formatNumber } from "../../utils/format.js";

/** Collapsed list of archived accounts, so they can be restored or deleted. */
export default function ArchivedAccounts({ accounts, onRestore, onDelete }) {
  if (accounts.length === 0) return null;

  return (
    <details className={`${panel} mt-3`}>
      <summary className="cursor-pointer select-none px-4 py-3 text-sm text-text/60">
        حساب‌های آرشیوشده ({formatNumber(accounts.length)})
      </summary>
      <ul className="divide-y divide-text/5 border-t border-text/5">
        {accounts.map((account) => (
          <li key={account.id} className="flex items-center gap-3 px-4 py-2.5">
            <AccountBadge type={account.type} color={account.color} small />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{account.name}</p>
              <p className="text-xs text-text/50">
                {ACCOUNT_TYPES[account.type]?.label ?? account.type}
              </p>
            </div>
            <Money value={account.balance} className="shrink-0 text-sm" />
            <button
              type="button"
              onClick={() => onRestore(account)}
              aria-label={`بازگردانی حساب ${account.name}`}
              className={iconButton}
            >
              <RestoreIcon size={16} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(account)}
              aria-label={`حذف حساب ${account.name}`}
              className={iconButtonDanger}
            >
              <TrashIcon size={16} />
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
