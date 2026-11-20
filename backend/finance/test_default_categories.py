import importlib

from django.apps import apps
from rest_framework.test import APITestCase

from finance.models import Category
from users.models import User

CATEGORIES_URL = "/api/categories/"
ACCOUNTS_URL = "/api/accounts/"
TRANSACTIONS_URL = "/api/transactions/"

seed_module = importlib.import_module("finance.migrations.0003_seed_default_categories")


class DefaultCategoriesTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(phone="09123456789")
        self.client.force_authenticate(self.user)

    def _names(self, kind):
        return {
            category["name_fa"]
            for category in self.client.get(CATEGORIES_URL).json()
            if category["kind"] == kind
        }

    def test_migration_creates_system_categories(self):
        system = Category.objects.filter(user__isnull=True)
        self.assertEqual(
            set(system.values_list("kind", flat=True)), {"income", "expense"}
        )
        self.assertGreaterEqual(system.filter(kind="expense").count(), 10)
        self.assertGreaterEqual(system.filter(kind="income").count(), 5)

    def test_expected_general_categories_exist(self):
        expenses = self._names("expense")
        for name in ["خورد و خوراک", "بیمه", "حمل‌ونقل", "سایر هزینه‌ها"]:
            self.assertIn(name, expenses)
        incomes = self._names("income")
        for name in ["حقوق و دستمزد", "سایر درآمدها"]:
            self.assertIn(name, incomes)

    def test_no_duplicate_names_within_a_kind(self):
        rows = list(
            Category.objects.filter(user__isnull=True).values_list("kind", "name_fa")
        )
        self.assertEqual(len(rows), len(set(rows)))

    def test_every_user_sees_the_same_defaults(self):
        other = User.objects.create_user(phone="09350000000")
        self.client.force_authenticate(other)
        self.assertIn("خورد و خوراک", self._names("expense"))

    def test_defaults_are_read_only(self):
        category = Category.objects.get(
            user__isnull=True, name_fa="بیمه", kind="expense"
        )
        url = f"{CATEGORIES_URL}{category.id}/"

        self.assertEqual(
            self.client.patch(url, {"name_fa": "هک"}, format="json").status_code, 403
        )
        self.assertEqual(self.client.delete(url).status_code, 403)
        category.refresh_from_db()
        self.assertEqual(category.name_fa, "بیمه")

    def test_seeding_twice_does_not_duplicate(self):
        before = Category.objects.filter(user__isnull=True).count()
        seed_module.seed_default_categories(apps, None)
        self.assertEqual(Category.objects.filter(user__isnull=True).count(), before)

    def test_seeding_keeps_users_own_categories(self):
        mine = Category.objects.create(
            user=self.user, name_fa="خوراکی", kind="expense"
        )
        seed_module.seed_default_categories(apps, None)
        self.assertTrue(Category.objects.filter(pk=mine.pk).exists())

    def test_default_category_can_be_used_in_a_transaction(self):
        account = self.client.post(
            ACCOUNTS_URL,
            {"name": "Wallet", "type": "cash", "initial_balance": 1_000_000},
            format="json",
        ).json()
        category = Category.objects.get(
            user__isnull=True, name_fa="خورد و خوراک", kind="expense"
        )

        response = self.client.post(
            TRANSACTIONS_URL,
            {
                "type": "expense",
                "account": account["id"],
                "category": category.id,
                "amount": 50_000,
                "date": "2026-11-20",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.content)

    def test_default_category_must_match_the_transaction_type(self):
        account = self.client.post(
            ACCOUNTS_URL,
            {"name": "Wallet", "type": "cash", "initial_balance": 1_000_000},
            format="json",
        ).json()
        income_category = Category.objects.get(
            user__isnull=True, name_fa="حقوق و دستمزد", kind="income"
        )

        response = self.client.post(
            TRANSACTIONS_URL,
            {
                "type": "expense",
                "account": account["id"],
                "category": income_category.id,
                "amount": 1_000,
                "date": "2026-11-20",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_reverse_keeps_defaults_that_transactions_use(self):
        account = self.client.post(
            ACCOUNTS_URL,
            {"name": "Wallet", "type": "cash", "initial_balance": 1_000_000},
            format="json",
        ).json()
        used = Category.objects.get(
            user__isnull=True, name_fa="خورد و خوراک", kind="expense"
        )
        self.client.post(
            TRANSACTIONS_URL,
            {
                "type": "expense",
                "account": account["id"],
                "category": used.id,
                "amount": 1_000,
                "date": "2026-11-20",
            },
            format="json",
        )

        seed_module.remove_default_categories(apps, None)

        self.assertTrue(Category.objects.filter(pk=used.pk).exists())
        self.assertFalse(
            Category.objects.filter(user__isnull=True, name_fa="بیمه").exists()
        )
