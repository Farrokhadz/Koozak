import { CardIcon, CashIcon, WalletIcon } from "../ui/icons.jsx";
import { accountColor } from "../../utils/palette.js";

const TYPE_ICONS = {
  cash: CashIcon,
  wallet: WalletIcon,
  bank_card: CardIcon,
};

/** Round badge in the account's own color, holding its type icon. */
export default function AccountBadge({ type, color, small = false }) {
  const Icon = TYPE_ICONS[type] ?? CardIcon;

  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: accountColor(color).solid }}
      className={`flex shrink-0 items-center justify-center rounded-full text-white ${
        small ? "h-8 w-8" : "h-10 w-10"
      }`}
    >
      <Icon size={small ? 16 : 20} />
    </span>
  );
}
