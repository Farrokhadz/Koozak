import AccountBadge from "./AccountBadge.jsx";
import Money from "../ui/Money.jsx";
import { ArchiveIcon, EditIcon, TrashIcon } from "../ui/icons.jsx";
import { cardIconButton } from "../ui/styles.js";
import { ACCOUNT_TYPES } from "../../utils/finance.js";
import { accountColor } from "../../utils/palette.js";

export default function AccountCard({ account, onEdit, onArchive, onDelete }) {
  const palette = accountColor(account.color);
  const typeLabel = ACCOUNT_TYPES[account.type]?.label ?? account.type;

  return (
    <article
      style={{ backgroundColor: palette.soft, color: palette.ink }}
      className="group relative rounded-2xl p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AccountBadge type={account.type} color={account.color} />
          <div className="min-w-0">
            <h3 className="truncate font-medium">{account.name}</h3>
            <p className="text-xs opacity-60">{typeLabel}</p>
          </div>
        </div>

        <div
          style={{ backgroundColor: palette.soft }}
          className="reveal-on-hover reveal-overlay -me-1.5 -mt-1 flex shrink-0"
        >
          <button
            type="button"
            onClick={() => onEdit(account)}
            aria-label={`ویرایش حساب ${account.name}`}
            className={cardIconButton}
          >
            <EditIcon size={16} />
          </button>
          <button
            type="button"
            onClick={() => onArchive(account)}
            aria-label={`آرشیو حساب ${account.name}`}
            className={cardIconButton}
          >
            <ArchiveIcon size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(account)}
            aria-label={`حذف حساب ${account.name}`}
            className={cardIconButton}
          >
            <TrashIcon size={16} />
          </button>
        </div>
      </div>

      <Money
        value={account.balance}
        className={`mt-7 block text-2xl font-semibold tracking-tight ${
          account.balance < 0 ? "text-red-600" : ""
        }`}
      />
    </article>
  );
}
