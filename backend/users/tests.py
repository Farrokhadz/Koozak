from datetime import timedelta
from unittest.mock import patch

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase

from users.models import OTPCode, User

REQUEST_URL = "/api/users/auth/otp/request/"
VERIFY_URL = "/api/users/auth/otp/verify/"
ME_URL = "/api/users/auth/me/"
LOGOUT_URL = "/api/users/auth/logout/"
ACCOUNTS_URL = "/api/accounts/"
FRONTEND_ORIGIN = "http://localhost:5173"

PHONE = "09123456789"
CODE = "12345"


class OTPCodeModelTests(TestCase):
    def test_generate_code_is_five_digits(self):
        for _ in range(200):
            code = OTPCode.generate_code()
            self.assertEqual(len(code), OTPCode.CODE_LENGTH)
            self.assertTrue(code.isdigit())

    def test_is_expired(self):
        now = timezone.now()
        expired = OTPCode(identifier="a", expires_at=now - timedelta(seconds=1))
        valid = OTPCode(identifier="b", expires_at=now + timedelta(minutes=1))
        self.assertTrue(expired.is_expired())
        self.assertFalse(valid.is_expired())

    def test_identifier_is_unique(self):
        OTPCode.objects.create(
            identifier=PHONE, code_hash="x", expires_at=timezone.now()
        )
        with self.assertRaises(IntegrityError), transaction.atomic():
            OTPCode.objects.create(
                identifier=PHONE, code_hash="y", expires_at=timezone.now()
            )


class OTPFlowTests(APITestCase):
    def _request_code(self, identifier=PHONE, code=CODE):
        with patch.object(OTPCode, "generate_code", return_value=code):
            return self.client.post(REQUEST_URL, {"identifier": identifier}, format="json")

    def _verify(self, code=CODE, identifier=PHONE):
        return self.client.post(
            VERIFY_URL, {"identifier": identifier, "code": code}, format="json"
        )

    # ---- request ----

    def test_request_creates_hashed_code(self):
        response = self._request_code()
        self.assertEqual(response.status_code, 200)
        record = OTPCode.objects.get(identifier=PHONE)
        self.assertNotEqual(record.code_hash, CODE)  # never stored in plain text
        self.assertFalse(record.is_expired())

    def test_request_requires_identifier(self):
        response = self.client.post(REQUEST_URL, {}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_request_rejects_invalid_identifier(self):
        for bad in ["abc", "0912", "12345678901", "a@b", "   "]:
            response = self.client.post(REQUEST_URL, {"identifier": bad}, format="json")
            self.assertEqual(response.status_code, 400, bad)
        self.assertEqual(OTPCode.objects.count(), 0)

    def test_request_rejects_non_string_identifier(self):
        response = self.client.post(REQUEST_URL, {"identifier": 9123456789}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_request_twice_keeps_one_record_and_replaces_code(self):
        self._request_code(code="11111")
        self._request_code(code="22222")
        self.assertEqual(OTPCode.objects.filter(identifier=PHONE).count(), 1)
        self.assertEqual(self._verify(code="11111").status_code, 400)
        self.assertEqual(self._verify(code="22222").status_code, 200)

    # ---- verify ----

    def test_verify_success_logs_in_and_creates_user(self):
        self._request_code()
        response = self._verify()
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["is_new_user"])

        user = User.objects.get(phone=PHONE)
        self.assertFalse(user.has_usable_password())
        self.assertFalse(OTPCode.objects.filter(identifier=PHONE).exists())

        me = self.client.get(ME_URL)
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data["phone"], PHONE)

    def test_verify_existing_user_is_not_new(self):
        User.objects.create_user(phone=PHONE)
        self._request_code()
        response = self._verify()
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["is_new_user"])
        self.assertEqual(User.objects.filter(phone=PHONE).count(), 1)

    def test_persian_digits_are_normalized(self):
        self._request_code(identifier="۰۹۱۲۳۴۵۶۷۸۹")
        self.assertTrue(OTPCode.objects.filter(identifier=PHONE).exists())
        response = self._verify(code="۱۲۳۴۵", identifier="۰۹۱۲۳۴۵۶۷۸۹")
        self.assertEqual(response.status_code, 200)

    def test_email_login_is_case_insensitive(self):
        self._request_code(identifier="  Farokh@Example.com ")
        response = self._verify(identifier="farokh@example.com")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(User.objects.get().email, "farokh@example.com")

        self.client.logout()
        self._request_code(identifier="FAROKH@example.com")
        self.assertEqual(self._verify(identifier="FAROKH@example.com").status_code, 200)
        self.assertEqual(User.objects.count(), 1)

    def test_verify_without_request(self):
        self.assertEqual(self._verify().status_code, 400)

    def test_verify_missing_fields(self):
        response = self.client.post(VERIFY_URL, {"identifier": PHONE}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_wrong_code_counts_attempts(self):
        self._request_code()
        response = self._verify(code="00000")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(OTPCode.objects.get(identifier=PHONE).attempts, 1)
        self.assertEqual(self.client.get(ME_URL).status_code, 403)

    def test_code_is_burned_after_max_attempts(self):
        self._request_code()
        for _ in range(OTPCode.MAX_ATTEMPTS):
            self.assertEqual(self._verify(code="00000").status_code, 400)
        # Even the correct code no longer works: the user must request a new one.
        self.assertFalse(OTPCode.objects.filter(identifier=PHONE).exists())
        self.assertEqual(self._verify().status_code, 400)
        self.assertFalse(User.objects.exists())

    def test_expired_code_is_rejected_and_deleted(self):
        OTPCode.objects.create(
            identifier=PHONE,
            code_hash=make_password(CODE),
            expires_at=timezone.now() - timedelta(seconds=1),
        )
        response = self._verify()
        self.assertEqual(response.status_code, 400)
        self.assertFalse(OTPCode.objects.filter(identifier=PHONE).exists())

    def test_code_cannot_be_reused(self):
        self._request_code()
        self.assertEqual(self._verify().status_code, 200)
        self.client.logout()
        self.assertEqual(self._verify().status_code, 400)

    def test_inactive_user_cannot_log_in(self):
        User.objects.create_user(phone=PHONE, is_active=False)
        self._request_code()
        response = self._verify()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.client.get(ME_URL).status_code, 403)

    # ---- misc ----

    def test_me_requires_login(self):
        self.assertEqual(self.client.get(ME_URL).status_code, 403)

    # ---- logout ----

    def test_logout_ends_the_session(self):
        self._request_code()
        self._verify()
        self.assertEqual(self.client.get(ME_URL).status_code, 200)

        response = self.client.post(LOGOUT_URL)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get(ME_URL).status_code, 403)

    def test_logout_when_not_logged_in_is_ok(self):
        self.assertEqual(self.client.post(LOGOUT_URL).status_code, 200)

    def test_logout_with_csrf_enforced(self):
        """Real browsers enforce CSRF: logout must work with the token, not without."""
        client = APIClient(enforce_csrf_checks=True)
        origin = {"HTTP_ORIGIN": FRONTEND_ORIGIN}

        with patch.object(OTPCode, "generate_code", return_value=CODE):
            client.post(REQUEST_URL, {"identifier": PHONE}, format="json", **origin)
        verify = client.post(
            VERIFY_URL, {"identifier": PHONE, "code": CODE}, format="json", **origin
        )
        token = verify.cookies["csrftoken"].value

        self.assertEqual(client.post(LOGOUT_URL, **origin).status_code, 403)
        self.assertEqual(client.get(ME_URL).status_code, 200)  # still logged in

        response = client.post(LOGOUT_URL, HTTP_X_CSRFTOKEN=token, **origin)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(client.get(ME_URL).status_code, 403)

    def test_frontend_origin_is_trusted_for_csrf(self):
        self.assertIn("http://localhost:5173", settings.CSRF_TRUSTED_ORIGINS)

    def test_post_after_login_passes_csrf_from_frontend_origin(self):
        """
        End-to-end CSRF check with enforcement ON (the default test client turns
        it off): after OTP login, a POST from the Vite origin must succeed when it
        carries the csrftoken cookie value in X-CSRFToken, and fail without it.
        """
        client = APIClient(enforce_csrf_checks=True)
        origin = {"HTTP_ORIGIN": FRONTEND_ORIGIN}

        with patch.object(OTPCode, "generate_code", return_value=CODE):
            client.post(REQUEST_URL, {"identifier": PHONE}, format="json", **origin)
        verify = client.post(
            VERIFY_URL, {"identifier": PHONE, "code": CODE}, format="json", **origin
        )
        self.assertEqual(verify.status_code, 200)
        token = verify.cookies["csrftoken"].value

        body = {"name": "Wallet", "type": "cash", "initial_balance": 0}
        blocked = client.post(ACCOUNTS_URL, body, format="json", **origin)
        self.assertEqual(blocked.status_code, 403)

        allowed = client.post(
            ACCOUNTS_URL, body, format="json", HTTP_X_CSRFTOKEN=token, **origin
        )
        self.assertEqual(allowed.status_code, 201)
