from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from finance.models import Account, Category, Transaction
from users.models import User


class FinanceApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(phone="09120000001")
        self.other = User.objects.create_user(phone="09120000002")
        self.client.force_authenticate(self.user)

        self.cash = Account.objects.create(
            user=self.user, name="Cash", type=Account.Type.CASH, initial_balance=1000
        )
        self.card = Account.objects.create(
            user=self.user, name="Card", type=Account.Type.BANK_CARD
        )
        self.other_cash = Account.objects.create(
            user=self.other, name="Other cash", type=Account.Type.CASH
        )
        self.food = Category.objects.create(
            user=self.user, name_fa="خوراک", kind=Category.Kind.EXPENSE
        )
        self.salary = Category.objects.create(
            user=self.user, name_fa="حقوق", kind=Category.Kind.INCOME
        )
        self.shared_food = Category.objects.create(
            user=None, name_fa="خوراک سیستم", kind=Category.Kind.EXPENSE
        )

    def test_user_only_sees_own_accounts(self):
        response = self.client.get(reverse("account-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {row["id"] for row in response.data}
        self.assertEqual(ids, {self.cash.id, self.card.id})

    def test_other_users_account_is_not_readable(self):
        url = reverse("account-detail", args=[self.other_cash.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_transaction_clean_rejects_category_kind_mismatch(self):
        response = self.client.post(
            reverse("transaction-list"),
            {
                "type": Transaction.Type.EXPENSE,
                "account": self.cash.id,
                "category": self.salary.id,
                "amount": 50,
                "date": "2026-11-18",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("category", response.data)

    def test_transaction_rejects_another_users_account(self):
        response = self.client.post(
            reverse("transaction-list"),
            {
                "type": Transaction.Type.EXPENSE,
                "account": self.other_cash.id,
                "category": self.food.id,
                "amount": 50,
                "date": "2026-11-18",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("account", response.data)
        self.assertEqual(Transaction.objects.count(), 0)

    def test_create_transaction_belongs_to_request_user(self):
        response = self.client.post(
            reverse("transaction-list"),
            {
                "type": Transaction.Type.EXPENSE,
                "account": self.cash.id,
                "category": self.food.id,
                "amount": 250,
                "date": "2026-11-10",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        transaction = Transaction.objects.get(pk=response.data["id"])
        self.assertEqual(transaction.user, self.user)

    def test_filter_transactions_by_date_and_type(self):
        Transaction.objects.create(
            user=self.user,
            type=Transaction.Type.EXPENSE,
            account=self.cash,
            category=self.food,
            amount=10,
            date=date(2026, 11, 10),
        )
        Transaction.objects.create(
            user=self.user,
            type=Transaction.Type.INCOME,
            account=self.cash,
            category=self.salary,
            amount=20,
            date=date(2026, 11, 10),
        )
        Transaction.objects.create(
            user=self.user,
            type=Transaction.Type.EXPENSE,
            account=self.cash,
            category=self.food,
            amount=30,
            date=date(2026, 12, 1),
        )
        Transaction.objects.create(
            user=self.other,
            type=Transaction.Type.EXPENSE,
            account=self.other_cash,
            category=self.shared_food,
            amount=99,
            date=date(2026, 11, 10),
        )

        response = self.client.get(
            reverse("transaction-list"),
            {
                "type": Transaction.Type.EXPENSE,
                "date_after": "2026-11-01",
                "date_before": "2026-11-30",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["amount"], 10)

    def test_system_category_is_readable_but_not_writable(self):
        listed = self.client.get(reverse("category-list"))
        ids = {row["id"] for row in listed.data}
        self.assertIn(self.shared_food.id, ids)

        response = self.client.patch(
            reverse("category-detail", args=[self.shared_food.id]),
            {"name_fa": "تغییر"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_requests_are_rejected(self):
        self.client.force_authenticate(None)
        response = self.client.get(reverse("account-list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
