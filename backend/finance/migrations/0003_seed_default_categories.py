from django.db import migrations

# دسته‌بندی‌های پیش‌فرض سیستم (user = None) که برای همه‌ی کاربرها نمایش داده می‌شوند.
# هر ردیف: (نام فارسی، نام انگلیسی، آیکون). ترتیب لیست = ترتیب نمایش.
# انتقال بین حساب‌ها دسته‌بندی ندارد، پس فقط هزینه و درآمد.
EXPENSE_CATEGORIES = [
    ("خورد و خوراک", "Food & Dining", "🍽️"),
    ("مسکن و اجاره", "Housing & Rent", "🏠"),
    ("قبوض و شارژ", "Bills & Utilities", "💡"),
    ("حمل‌ونقل", "Transportation", "🚗"),
    ("درمان و سلامت", "Health & Medical", "🩺"),
    ("بیمه", "Insurance", "🛡️"),
    ("آموزش", "Education", "🎓"),
    ("پوشاک", "Clothing", "👕"),
    ("خرید و لوازم خانه", "Shopping & Home", "🛒"),
    ("تفریح و سرگرمی", "Entertainment", "🎬"),
    ("سفر", "Travel", "✈️"),
    ("هدیه و امور خیریه", "Gifts & Charity", "🎁"),
    ("اقساط و بدهی", "Loans & Debt", "💳"),
    ("سایر هزینه‌ها", "Other Expenses", "📦"),
]

INCOME_CATEGORIES = [
    ("حقوق و دستمزد", "Salary", "💼"),
    ("درآمد کسب‌وکار", "Business Income", "🏪"),
    ("سود و سرمایه‌گذاری", "Investments", "📈"),
    ("اجاره دریافتی", "Rental Income", "🏘️"),
    ("هدیه و عیدی", "Gifts & Bonuses", "🎉"),
    ("بازگشت وجه", "Refunds", "↩️"),
    ("سایر درآمدها", "Other Income", "💰"),
]

DEFAULTS = (("expense", EXPENSE_CATEGORIES), ("income", INCOME_CATEGORIES))


def seed_default_categories(apps, schema_editor):
    Category = apps.get_model("finance", "Category")
    for kind, items in DEFAULTS:
        for name_fa, name_en, icon in items:
            # UniqueConstraint روی (user, name_fa, kind) وقتی user = NULL است
            # جلوی تکرار را نمی‌گیرد؛ پس خودمان بررسی می‌کنیم (idempotent).
            already_there = Category.objects.filter(
                user__isnull=True, name_fa=name_fa, kind=kind
            ).exists()
            if not already_there:
                Category.objects.create(
                    user=None,
                    name_fa=name_fa,
                    name_en=name_en,
                    kind=kind,
                    icon=icon,
                )


def remove_default_categories(apps, schema_editor):
    """برگرداندن migration؛ دسته‌بندی‌هایی که تراکنش به آن‌ها وصل است حذف نمی‌شوند."""
    Category = apps.get_model("finance", "Category")
    Transaction = apps.get_model("finance", "Transaction")
    in_use = Transaction.objects.exclude(category__isnull=True).values_list(
        "category_id", flat=True
    )
    for kind, items in DEFAULTS:
        Category.objects.filter(
            user__isnull=True,
            kind=kind,
            name_fa__in=[name_fa for name_fa, _, _ in items],
        ).exclude(pk__in=in_use).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("finance", "0002_initial"),
    ]

    operations = [
        migrations.RunPython(seed_default_categories, remove_default_categories),
    ]
