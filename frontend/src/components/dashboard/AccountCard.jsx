import Money from "../ui/Money.jsx";
import { ACCOUNT_TYPES } from "../../utils/finance.js";

export default function AccountCard({ account }) {
  const typeLabel = ACCOUNT_TYPES[account.type]?.label ?? account.type;

  return (
    <article className="rounded-3xl border-t-4 border-secondary bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 truncate font-bold text-text">{account.name}</h3>
        <span className="shrink-0 rounded-full bg-secondary/20 px-3 py-1 text-xs font-medium text-primary">
          {typeLabel}
        </span>
      </div>

      <p className="mt-6 text-xs text-text/60">موجودی</p>
      <Money
        value={account.balance}
        className={`mt-1 block text-2xl font-bold ${
          account.balance < 0 ? "text-red-600" : "text-text"
        }`}
      />
    </article>
  );
}
