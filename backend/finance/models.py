import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q, Sum, Value
from django.db.models.functions import Coalesce


class Account(models.Model):
    class Type(models.TextChoices):
        CASH = "cash", "نقد"
        WALLET = "wallet", "کیف پول"
        BANK_CARD = "bank_card", "کارت بانکی"

    class Color(models.TextChoices):
        GREEN = "green", "سبز"
        BLUE = "blue", "آبی"
        TEAL = "teal", "فیروزه‌ای"
        PURPLE = "purple", "بنفش"
        ROSE = "rose", "صورتی"
        ORANGE = "orange", "نارنجی"
        AMBER = "amber", "زرد"
        SLATE = "slate", "خاکستری"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="accounts"
    )
    name = models.CharField(max_length=60)
    type = models.CharField(max_length=12, choices=Type.choices)
    color = models.CharField(
        max_length=10, choices=Color.choices, default=Color.GREEN
    )  # the card color the user picked
    initial_balance = models.BigIntegerField(default=0)  # تومان
    is_archived = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"], name="unique_account_name_per_user"
            ),
        ]

    def __str__(self):
        return self.name

    @property
    def balance(self):
        """
        موجودی = موجودی اولیه + درآمدها - هزینه‌ها - انتقال‌های خروجی
                 + انتقال‌های ورودی - کارمزد همه‌ی تراکنش‌هایی که از این حساب خارج شدن
        """
        zero = Value(0)
        big = models.BigIntegerField()

        out = self.transactions.aggregate(
            income=Coalesce(
                Sum("amount", filter=Q(type=Transaction.Type.INCOME)), zero, output_field=big
            ),
            expense=Coalesce(
                Sum("amount", filter=Q(type=Transaction.Type.EXPENSE)), zero, output_field=big
            ),
            transfer_out=Coalesce(
                Sum("amount", filter=Q(type=Transaction.Type.TRANSFER)), zero, output_field=big
            ),
            fees=Coalesce(Sum("fee"), zero, output_field=big),
        )
        transfer_in = self.incoming_transfers.filter(
            type=Transaction.Type.TRANSFER
        ).aggregate(total=Coalesce(Sum("amount"), zero, output_field=big))["total"]

        return (
            self.initial_balance
            + out["income"]
            - out["expense"]
            - out["transfer_out"]
            + transfer_in
            - out["fees"]
        )


class Category(models.Model):
    class Kind(models.TextChoices):
        INCOME = "income", "درآمد"
        EXPENSE = "expense", "هزینه"

    # user = None یعنی دسته‌بندی پیش‌فرض سیستم (برای همه‌ی کاربرها)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="categories",
    )
    name_fa = models.CharField(max_length=60)
    name_en = models.CharField(max_length=60, blank=True)
    kind = models.CharField(max_length=7, choices=Kind.choices)
    icon = models.CharField(max_length=40, blank=True)
    is_archived = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name_fa", "kind"],
                name="unique_category_name_per_user_and_kind",
            ),
        ]

    def __str__(self):
        return self.name_fa


class Transaction(models.Model):
    class Type(models.TextChoices):
        INCOME = "income", "درآمد"
        EXPENSE = "expense", "هزینه"
        TRANSFER = "transfer", "انتقال"

    # از کلاینت هم می‌تونه بیاد (برای sync آفلاین و idempotent بودن)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="transactions"
    )
    type = models.CharField(max_length=8, choices=Type.choices)
    account = models.ForeignKey(
        Account, on_delete=models.PROTECT, related_name="transactions"
    )
    to_account = models.ForeignKey(
        Account,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="incoming_transfers",
    )
    category = models.ForeignKey(
        Category, null=True, blank=True, on_delete=models.PROTECT
    )
    amount = models.PositiveBigIntegerField()  # تومان، عدد صحیح
    fee = models.PositiveBigIntegerField(default=0)  # کارمزد (مثلاً کارت به کارت)
    date = models.DateField()  # میلادی در DB، شمسی در UI
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        indexes = [
            models.Index(fields=["user", "-date"]),
            models.Index(fields=["user", "type", "-date"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(amount__gt=0),
                name="transaction_amount_positive",
            ),
            models.CheckConstraint(
                condition=(
                    # انتقال: مقصد دارد، دسته‌بندی ندارد، مقصد ≠ مبدأ
                    (
                        Q(type="transfer")
                        & Q(to_account__isnull=False)
                        & Q(category__isnull=True)
                        & ~Q(to_account=F("account"))
                    )
                    # درآمد/هزینه: دسته‌بندی دارد، مقصد ندارد
                    | (
                        Q(type__in=["income", "expense"])
                        & Q(category__isnull=False)
                        & Q(to_account__isnull=True)
                    )
                ),
                name="transaction_shape_by_type",
            ),
        ]

    def __str__(self):
        return f"{self.type} {self.amount} ({self.date})"

    def clean(self):
        """
        اعتبارسنجی‌هایی که با CheckConstraint قابل بیان نیستن (بین جدول‌ها).
        توجه: DRF خودش clean() مدل را صدا نمی‌زند؛ در serializer.validate صدایش بزن.
        """
        errors = {}

        if self.account_id and self.account.user_id != self.user_id:
            errors["account"] = "این حساب متعلق به کاربر نیست."

        if self.to_account_id and self.to_account.user_id != self.user_id:
            errors["to_account"] = "این حساب متعلق به کاربر نیست."

        if self.category_id:
            if self.category.user_id not in (None, self.user_id):
                errors["category"] = "این دسته‌بندی متعلق به کاربر نیست."
            elif self.category.kind != self.type:
                errors["category"] = "نوع دسته‌بندی با نوع تراکنش هم‌خوان نیست."

        if errors:
            raise ValidationError(errors)
