import { CONTACT } from "../../config/site.js";
import { normalizeDigits } from "../../utils/identifier.js";

function buildChannels() {
  const { email, telegram, phone, instagram } = CONTACT;
  const phoneDigits = normalizeDigits(phone).replace(/[^\d+]/g, "");

  return [
    email && {
      key: "email",
      label: "ایمیل",
      value: email,
      href: `mailto:${email}`,
    },
    telegram && {
      key: "telegram",
      label: "تلگرام",
      value: `@${telegram}`,
      href: `https://t.me/${encodeURIComponent(telegram)}`,
      external: true,
    },
    phone && {
      key: "phone",
      label: "تلفن",
      value: phone,
      href: `tel:${phoneDigits}`,
    },
    instagram && {
      key: "instagram",
      label: "اینستاگرام",
      value: `@${instagram}`,
      href: `https://instagram.com/${encodeURIComponent(instagram)}`,
      external: true,
    },
  ].filter(Boolean);
}

export default function ContactSection() {
  const channels = buildChannels();

  return (
    <div>
      <p className="text-sm leading-7 text-text/80">
        سوال، پیشنهاد یا مشکلی دارید؟ از یکی از راه‌های زیر به ما پیام بدهید.
      </p>

      {channels.length > 0 ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {channels.map((channel) => (
            <li key={channel.key}>
              <a
                href={channel.href}
                {...(channel.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="flex items-center justify-between gap-3 rounded-xl border border-text/10 bg-background px-4 py-3 transition hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <span className="text-sm font-medium text-text">
                  {channel.label}
                </span>
                <span dir="ltr" className="truncate text-sm text-primary">
                  {channel.value}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl bg-background px-4 py-3 text-sm leading-7 text-text/70">
          راه‌های ارتباطی به‌زودی در همین بخش اضافه می‌شود.
        </p>
      )}

      <div className="mt-6">
        <h3 className="text-sm font-bold text-text">
          هنگام گزارش مشکل این موارد را بنویسید
        </h3>
        <ul className="mt-2 list-disc space-y-1 ps-5 text-sm leading-7 text-text/80">
          <li>کاری که می‌خواستید انجام دهید و در کدام مرحله مشکل پیش آمد</li>
          <li>متن دقیق پیامی که برنامه نشان داد</li>
          <li>نوع دستگاه و مرورگر (مثلاً آیفون و Safari یا اندروید و Chrome)</li>
        </ul>
        <p className="mt-3 text-xs leading-6 text-text/60">
          لطفاً هیچ‌وقت کد تایید یا اطلاعات حساس کارت بانکی را برای کسی
          نفرستید؛ کوزک هم هرگز آن‌ها را از شما نمی‌خواهد.
        </p>
      </div>
    </div>
  );
}
