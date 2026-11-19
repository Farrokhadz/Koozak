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


class InsufficientFundsTests(APITestCase):
    """An account balance may never go below zero."""

    def setUp(self):
        self.user = User.objects.create_user(phone="09120000011")
        self.client.force_authenticate(self.user)

        self.cash = Account.objects.create(
            user=self.user, name="Cash", type=Account.Type.CASH, initial_balance=1000
        )
        self.card = Account.objects.create(
            user=self.user, name="Card", type=Account.Type.BANK_CARD
        )
        self.expense_cat = Category.objects.create(
            user=self.user, name_fa="Food", kind=Category.Kind.EXPENSE
        )
        self.income_cat = Category.objects.create(
            user=self.user, name_fa="Salary", kind=Category.Kind.INCOME
        )

    def _expense(self, amount, fee=0, account=None):
        return self.client.post(
            reverse("transaction-list"),
            {
                "type": Transaction.Type.EXPENSE,
                "account": (account or self.cash).id,
                "category": self.expense_cat.id,
                "amount": amount,
                "fee": fee,
                "date": "2026-11-19",
            },
            format="json",
        )

    def _income(self, amount, account=None):
        return self.client.post(
            reverse("transaction-list"),
            {
                "type": Transaction.Type.INCOME,
                "account": (account or self.cash).id,
                "category": self.income_cat.id,
                "amount": amount,
                "date": "2026-11-19",
            },
            format="json",
        )

    def _transfer(self, amount, fee=0):
        return self.client.post(
            reverse("transaction-list"),
            {
                "type": Transaction.Type.TRANSFER,
                "account": self.cash.id,
                "to_account": self.card.id,
                "amount": amount,
                "fee": fee,
                "date": "2026-11-19",
            },
            format="json",
        )

    def test_expense_above_balance_is_rejected_and_not_saved(self):
        response = self._expense(1001)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("amount", response.data)
        self.assertEqual(Transaction.objects.count(), 0)
        self.assertEqual(self.cash.balance, 1000)

    def test_expense_equal_to_balance_is_allowed(self):
        response = self._expense(1000)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.cash.balance, 0)

    def test_fee_counts_toward_the_balance(self):
        response = self._expense(990, fee=20)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.cash.balance, 1000)

    def test_transfer_above_source_balance_is_rejected(self):
        response = self._transfer(1500)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Transaction.objects.count(), 0)
        self.assertEqual(self.cash.balance, 1000)
        self.assertEqual(self.card.balance, 0)

    def test_transfer_fee_counts_toward_the_source_balance(self):
        response = self._transfer(900, fee=200)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.cash.balance, 1000)

    def test_valid_transfer_moves_money(self):
        response = self._transfer(400, fee=100)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.cash.balance, 500)
        self.assertEqual(self.card.balance, 400)

    def test_income_is_never_blocked_and_funds_later_spending(self):
        self.assertEqual(self._income(500, account=self.card).status_code, 201)

        response = self._expense(500, account=self.card)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.card.balance, 0)

    def test_raising_an_expense_above_balance_is_rejected(self):
        created = self._expense(600)
        url = reverse("transaction-detail", args=[created.data["id"]])

        response = self.client.patch(url, {"amount": 1200}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Transaction.objects.get(pk=created.data["id"]).amount, 600)
        self.assertEqual(self.cash.balance, 400)

    def test_editing_only_the_note_is_allowed(self):
        created = self._expense(1000)  # balance is now exactly zero
        url = reverse("transaction-detail", args=[created.data["id"]])

        response = self.client.patch(url, {"note": "lunch"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_moving_an_expense_to_a_poorer_account_is_rejected(self):
        created = self._expense(600)
        url = reverse("transaction-detail", args=[created.data["id"]])

        response = self.client.patch(url, {"account": self.card.id}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.cash.balance, 400)

    def test_deleting_income_that_funds_spending_is_rejected(self):
        income = self._income(500, account=self.card)
        self._expense(500, account=self.card)
        url = reverse("transaction-detail", args=[income.data["id"]])

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Transaction.objects.filter(pk=income.data["id"]).exists())

    def test_deleting_an_expense_is_allowed(self):
        created = self._expense(600)
        url = reverse("transaction-detail", args=[created.data["id"]])

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.cash.balance, 1000)
