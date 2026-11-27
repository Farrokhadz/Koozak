import { useMemo } from "react";
import Money from "../ui/Money.jsx";
import { panel } from "../ui/styles.js";
import { formatPercent } from "../../utils/format.js";
import { accountColor } from "../../utils/palette.js";
import { balanceShares, monthSummary } from "../../utils/summary.js";

/**
 * Grey placeholder shown instead of a figure. It pulses while loading and
 * stays still when the data could not be loaded.
 */
function Skeleton({ className, pulse = true }) {
  return (
    <span
      aria-hidden="true"
      className={`block rounded-md bg-text/10 ${
        pulse ? "animate-pulse motion-reduce:animate-none" : ""
      } ${className}`}
    />
  );
}

/**
 * Top of the dashboard: the total, how it splits across accounts (in each
 * account's own color) and this month's income and spending.
 *
 * Three states, so a wrong "0 toman" is never shown as if it were real:
 * - `loading`: pulsing placeholders until the first response arrives;
 * - `unavailable`: still placeholders (not pulsing) when loading failed;
 * - otherwise the real figures.
 */
export default function BalanceOverview({
  total,
  accounts,
  transactions,
  loading = false,
  unavailable = false,
}) {
  const { income, expense, monthName } = useMemo(
    () => monthSummary(transactions),
    [transactions],
  );
  const shares = useMemo(() => balanceShares(accounts), [accounts]);
  const placeholder = loading || unavailable;

  return (
    <section
      aria-label="مجموع موجودی"
      aria-busy={loading}
      className={`${panel} p-5 sm:p-6`}
    >
      <p className="text-sm text-text/50">مجموع موجودی</p>
      {placeholder ? (
        <>
          <Skeleton pulse={loading} className="mt-2 h-10 w-56 sm:h-12" />
          <span className="sr-only">
            {loading ? "در حال بارگذاری…" : "اطلاعات در دسترس نیست"}
          </span>
        </>
      ) : (
        <Money
          value={total}
          className={`mt-1 block text-4xl font-semibold tracking-tight sm:text-5xl ${
            total < 0 ? "text-red-600" : ""
          }`}
          unitClassName="text-base font-normal text-text/40"
        />
      )}

      {!placeholder && shares.length > 0 ? (
        <div className="mt-6">
          <div
            role="img"
            aria-label="سهم هر حساب از مجموع موجودی"
            className="flex h-2 gap-0.5 overflow-hidden rounded-full"
          >
            {shares.map(({ account, share }) => (
              <span
                key={account.id}
                title={`${account.name}: ${formatPercent(share)}`}
                style={{
                  width: `${share * 100}%`,
                  minWidth: "6px",
                  backgroundColor: accountColor(account.color).solid,
                }}
              />
            ))}
          </div>

          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-text/60">
            {shares.map(({ account, share }) => (
              <li key={account.id} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: accountColor(account.color).solid }}
                  className="h-2 w-2 rounded-full"
                />
                {account.name}
                <span className="text-text/40">{formatPercent(share)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-text/5 pt-4">
        <div>
          <dt className="text-xs text-text/50">درآمد {monthName}</dt>
          <dd className="mt-1">
            {placeholder ? (
              <Skeleton pulse={loading} className="h-5 w-24" />
            ) : (
              <Money
                value={income}
                sign={income > 0 ? "+" : ""}
                className={`text-base font-semibold ${
                  income > 0 ? "text-emerald-700" : "text-text/40"
                }`}
              />
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-text/50">هزینه {monthName}</dt>
          <dd className="mt-1">
            {placeholder ? (
              <Skeleton pulse={loading} className="h-5 w-24" />
            ) : (
              <Money
                value={expense}
                sign={expense > 0 ? "−" : ""}
                className={`text-base font-semibold ${
                  expense > 0 ? "text-red-600" : "text-text/40"
                }`}
              />
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
