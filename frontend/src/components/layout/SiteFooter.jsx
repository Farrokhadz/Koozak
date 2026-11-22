import { SITE_NAME } from "../../config/site.js";

const LINKS = [
  { href: "#help", label: "راهنما" },
  { href: "#contact", label: "تماس با ما" },
  { href: "#about", label: "درباره کوزک" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-text/10">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm sm:px-6">
        <p className="text-text/50">
          <span className="font-semibold text-primary">{SITE_NAME}</span> · مدیریت
          مالی شخصی
        </p>
        <nav aria-label="پیوندهای سایت">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-text/60 transition hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
