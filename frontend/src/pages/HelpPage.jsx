import { useEffect } from "react";
import ContactSection from "../components/help/ContactSection.jsx";
import { secondaryButton } from "../components/ui/styles.js";
import { SITE_NAME } from "../config/site.js";
import { toPersianDigits } from "../utils/identifier.js";

const NAV = [
  { id: "quick-start", label: "شروع سریع" },
  { id: "features", label: "راهنمای بخش‌ها" },
  { id: "faq", label: "سوالات متداول" },
  { id: "contact", label: "تماس با ما" },
  { id: "about", label: "درباره کوزک" },
];

const QUICK_START = [
  {
    title: "وارد شوید",
    body: "شماره موبایل (مثل ۰۹۱۲۳۴۵۶۷۸۹) یا ایمیل خود را وارد کنید و سپس کد تایید ۵ رقمی را بزنید. نیازی به رمز عبور نیست.",
  },
  {
    title: "یک حساب بسازید",
    body: "روی «+ حساب جدید» بزنید و نام، نوع حساب (نقد، کیف پول یا کارت بانکی) و موجودی اولیه را وارد کنید. مثلاً برای کارت بانکی‌تان یک حساب بسازید.",
  },
  {
    title: "تراکنش ثبت کنید",
    body: "روی «+ تراکنش جدید» بزنید و نوع (درآمد، هزینه یا انتقال)، مبلغ، حساب، دسته‌بندی و تاریخ را مشخص کنید.",
  },
  {
    title: "وضعیت مالی‌تان را ببینید",
    body: "مجموع موجودی همه حساب‌ها بالای داشبورد و موجودی هر حساب روی کارت خودش نمایش داده می‌شود و با هر تراکنش به‌روز می‌شود.",
  },
];

const FEATURES = [
  {
    title: "حساب‌ها",
    items: [
      "سه نوع حساب دارید: نقد، کیف پول و کارت بانکی.",
      "موجودی اولیه مبلغی است که هنگام ساختن حساب در آن بوده است و نمی‌تواند منفی باشد.",
      "با دکمه ویرایش روی کارت حساب می‌توانید نام، نوع و موجودی اولیه را تغییر دهید.",
      "آرشیو: حساب از فهرست و مجموع موجودی کنار می‌رود، ولی تراکنش‌هایش می‌ماند. هر وقت خواستید از بخش «حساب‌های آرشیوشده» برش می‌گردانید.",
      "حذف: حسابی که تراکنش ندارد پس از تایید حذف می‌شود. اگر تراکنش دارد، با تایید شما خود حساب و همه تراکنش‌هایش برای همیشه پاک می‌شود.",
    ],
  },
  {
    title: "تراکنش‌ها",
    items: [
      "درآمد (سبز، با علامت +) پولی است که وارد حساب می‌شود و هزینه (قرمز، با علامت −) پولی که از حساب خارج می‌شود.",
      "انتقال (زرد) پول را از یک حساب به حساب دیگر می‌برد، مثلاً از کارت بانکی به کیف پول. برای انتقال حداقل به دو حساب نیاز دارید و می‌توانید کارمزد هم وارد کنید.",
      "تاریخ را با انتخابگر تاریخ انتخاب کنید؛ معادل شمسی آن زیرش نشان داده می‌شود.",
      "یادداشت اختیاری است و کنار تراکنش در فهرست دیده می‌شود.",
      "با دکمه‌های ویرایش و حذف کنار هر تراکنش می‌توانید آن را اصلاح یا پاک کنید. موجودی حساب‌ها دوباره محاسبه می‌شود.",
    ],
  },
  {
    title: "دسته‌بندی‌ها",
    items: [
      "دسته‌بندی‌های آماده مثل خورد و خوراک، بیمه، مسکن و اجاره، حمل‌ونقل، درمان و حقوق و دستمزد از ابتدا در دسترس شما هستند.",
      "اگر دسته‌بندی دلخواه‌تان نبود، هنگام ثبت تراکنش روی «+ دسته‌بندی جدید» بزنید.",
      "دسته‌بندی‌های آماده قابل ویرایش یا حذف نیستند. انتقال‌ها دسته‌بندی ندارند.",
    ],
  },
  {
    title: "کنترل موجودی",
    items: [
      "کوزک اجازه نمی‌دهد موجودی هیچ حسابی منفی شود. اگر هزینه یا انتقال (به‌همراه کارمزد) از موجودی حساب بیشتر باشد، ثبت نمی‌شود و پیامی با موجودی فعلی و مقدار کمبود می‌بینید.",
      "همین قاعده هنگام بالا بردن مبلغ یک هزینه، جابه‌جا کردن آن به حساب دیگر یا حذف درآمدی که هزینه‌های بعدی به آن تکیه دارند هم اعمال می‌شود.",
    ],
  },
  {
    title: "نصب روی گوشی و کامپیوتر",
    items: [
      "کوزک را می‌شود مثل یک اپلیکیشن نصب کرد. اگر مرورگرتان پشتیبانی کند، دکمه «نصب اپلیکیشن» بالای داشبورد دیده می‌شود.",
      "روی آیفون: صفحه را در Safari باز کنید، دکمه اشتراک‌گذاری (Share) را بزنید و Add to Home Screen را انتخاب کنید.",
    ],
  },
];

const FAQ = [
  {
    q: "چرا نمی‌توانم هزینه یا انتقال ثبت کنم؟",
    a: "احتمالاً مبلغ (به‌همراه کارمزد) از موجودی همان حساب بیشتر است. کوزک اجازه نمی‌دهد موجودی حساب منفی شود. می‌توانید ابتدا درآمد ثبت کنید، مبلغ را کمتر کنید یا حساب دیگری را انتخاب کنید.",
  },
  {
    q: "تفاوت آرشیو و حذف حساب چیست؟",
    a: "آرشیو فقط حساب را از فهرست و مجموع موجودی کنار می‌گذارد و هر زمان می‌توانید برگردانیدش. حذف دائمی است و اگر حساب تراکنش داشته باشد، تراکنش‌هایش هم پاک می‌شود. اگر مطمئن نیستید، آرشیو را انتخاب کنید.",
  },
  {
    q: "چرا گزینه «انتقال» غیرفعال است؟",
    a: "برای انتقال پول باید حداقل دو حساب فعال داشته باشید. یک حساب دیگر بسازید یا حساب آرشیوشده را برگردانید.",
  },
  {
    q: "مبلغ‌ها به چه واحدی هستند؟",
    a: "همه مبلغ‌ها به تومان ثبت و نمایش داده می‌شوند.",
  },
  {
    q: "کد تایید منقضی شد یا کار نمی‌کند، چه کنم؟",
    a: "کد تایید ۳ دقیقه معتبر است و بعد از ۳ بار وارد کردن اشتباه باطل می‌شود. در هر دو حالت کمی صبر کنید تا دکمه «ارسال مجدد کد» فعال شود و کد جدید بگیرید.",
  },
  {
    q: "چطور از حساب کاربری‌ام خارج شوم؟",
    a: "دکمه «خروج» را در بالای داشبورد بزنید.",
  },
  {
    q: "آیا می‌توانم دسته‌بندی‌های آماده را تغییر دهم؟",
    a: "خیر، دسته‌بندی‌های آماده ثابت‌اند. اگر چیز دیگری لازم دارید، هنگام ثبت تراکنش یک دسته‌بندی جدید برای خودتان بسازید.",
  },
];

const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  });
}

function Card({ id, title, children }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-20 rounded-3xl bg-surface p-6 shadow-sm sm:p-8"
    >
      <h2 id={`${id}-title`} className="mb-5 text-xl font-bold text-primary">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function HelpPage({ section, onBack }) {
  useEffect(() => {
    if (section) scrollToSection(section);
    else window.scrollTo(0, 0);
  }, [section]);

  return (
    <div className="bg-background">
      <header className="border-b border-secondary/30 bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-2xl font-bold text-primary">{SITE_NAME}</p>
            <h1 className="text-sm text-text/70">راهنما و پشتیبانی</h1>
          </div>
          <button
            type="button"
            onClick={onBack}
            className={`${secondaryButton} px-4 py-2 text-sm`}
          >
            بازگشت به برنامه
          </button>
        </div>
      </header>

      <nav
        aria-label="بخش‌های راهنما"
        className="sticky top-0 z-10 border-b border-secondary/30 bg-surface/95 backdrop-blur"
      >
        <ul className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 py-3 sm:px-6">
          {NAV.map((item) => (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="rounded-full border border-secondary/40 px-4 py-1.5 text-sm text-primary transition hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <Card id="quick-start" title="شروع سریع">
          <ol className="space-y-5">
            {QUICK_START.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
                >
                  {toPersianDigits(index + 1)}
                </span>
                <div>
                  <h3 className="font-bold text-text">{step.title}</h3>
                  <p className="mt-1 text-sm leading-7 text-text/80">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card id="features" title="راهنمای بخش‌ها">
          <div className="space-y-6">
            {FEATURES.map((feature) => (
              <div key={feature.title}>
                <h3 className="font-bold text-text">{feature.title}</h3>
                <ul className="mt-2 list-disc space-y-1.5 ps-5 text-sm leading-7 text-text/80">
                  {feature.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        <Card id="faq" title="سوالات متداول">
          <div className="divide-y divide-background">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-primary transition group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-7 text-text/80">{item.a}</p>
              </details>
            ))}
          </div>
        </Card>

        <Card id="contact" title="تماس با ما">
          <ContactSection />
        </Card>

        <Card id="about" title="درباره کوزک">
          <div className="space-y-3 text-sm leading-7 text-text/80">
            <p>
              کوزک ابزاری ساده برای مدیریت امور مالی شخصی است: درآمد و هزینه‌هایتان
              را سریع ثبت کنید، موجودی حساب‌ها را ببینید و با شفافیت بیشتری خرج کنید.
            </p>
            <p>
              اطلاعات را خودتان وارد می‌کنید. کوزک به حساب بانکی شما وصل نمی‌شود و
              هرگز رمز یا اطلاعات حساس کارت را از شما نمی‌خواهد.
            </p>
            <p>
              ورود با کد تایید یک‌بارمصرف انجام می‌شود و رمز عبوری برای حساب شما
              ذخیره نمی‌شود. اطلاعات هر کاربر فقط برای خود او قابل مشاهده است.
            </p>
            <p className="text-text/60">
              این نسخه روی مدیریت پایه درآمد و هزینه تمرکز دارد.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
