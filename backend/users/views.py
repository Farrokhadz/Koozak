# users/views.py
import re
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.hashers import check_password, make_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError
from django.db.models import F
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import OTPCode, User

# ارقام فارسی و عربی → انگلیسی
_DIGITS_MAP = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "0123456789" * 2)
_MOBILE_PATTERN = re.compile(r"^09\d{9}$")


def normalize_identifier(raw):
    """
    شناسه را یکدست می‌کند تا «درخواست کد» و «تایید کد» همیشه
    روی یک مقدار کار کنند: فاصله‌ها حذف، ارقام فارسی → انگلیسی، ایمیل lowercase.
    """
    if not isinstance(raw, str):
        return ""
    value = raw.translate(_DIGITS_MAP).strip()
    return value.lower() if "@" in value else value


def is_valid_identifier(value):
    if "@" in value:
        try:
            validate_email(value)
        except ValidationError:
            return False
        return True
    return bool(_MOBILE_PATTERN.match(value))


def _payload(request):
    return request.data if isinstance(request.data, dict) else {}


class RequestOTPView(APIView):
    permission_classes = []  # عمومی (بدون نیاز به توکن)

    def post(self, request):
        identifier = normalize_identifier(_payload(request).get("identifier"))
        if not identifier:
            return Response(
                {"error": "وارد کردن شماره موبایل یا ایمیل الزامی است."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not is_valid_identifier(identifier):
            return Response(
                {"error": "شماره موبایل یا ایمیل واردشده معتبر نیست."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        code = OTPCode.generate_code()
        if settings.DEBUG:
            # فقط برای توسعه؛ تا زمانی که سرویس پیامک وصل نشده
            print(f">>>>> [Koozak OTP] Code for {identifier}: {code} <<<<<")

        expires_at = timezone.now() + timedelta(minutes=OTPCode.TTL_MINUTES)

        OTPCode.objects.update_or_create(
            identifier=identifier,
            defaults={
                "code_hash": make_password(code),
                "attempts": 0,
                "used_at": None,
                "expires_at": expires_at,
            },
        )

        return Response(
            {"message": "کد تایید با موفقیت ارسال شد."},
            status=status.HTTP_200_OK,
        )


class VerifyOTPView(APIView):
    permission_classes = []

    def post(self, request):
        data = _payload(request)
        identifier = normalize_identifier(data.get("identifier"))
        code = str(data.get("code") or "").translate(_DIGITS_MAP).strip()

        if not identifier or not code:
            return Response(
                {"error": "شناسه و کد تایید الزامی هستند."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            otp_record = OTPCode.objects.get(identifier=identifier)
        except OTPCode.DoesNotExist:
            return Response(
                {"error": "کدی برای این شناسه درخواست نشده است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp_record.is_expired():
            otp_record.delete()
            return Response(
                {"error": "کد تایید منقضی شده است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        too_many_attempts = Response(
            {
                "error": "تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً دوباره کد بگیرید."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

        if otp_record.attempts >= OTPCode.MAX_ATTEMPTS:
            otp_record.delete()
            return too_many_attempts

        if not check_password(code, otp_record.code_hash):
            # افزایش atomic تا با درخواست‌های موازی نشود محدودیت تلاش را دور زد
            OTPCode.objects.filter(pk=otp_record.pk).update(attempts=F("attempts") + 1)
            attempts = (
                OTPCode.objects.filter(pk=otp_record.pk)
                .values_list("attempts", flat=True)
                .first()
            )
            if attempts is None or attempts >= OTPCode.MAX_ATTEMPTS:
                otp_record.delete()
                return too_many_attempts
            return Response(
                {"error": "کد تایید اشتباه است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp_record.delete()

        is_email = "@" in identifier
        lookup = {"email__iexact": identifier} if is_email else {"phone": identifier}

        user = User.objects.filter(**lookup).first()
        created = False
        if user is None:
            create_kwargs = {"email": identifier} if is_email else {"phone": identifier}
            try:
                user = User.objects.create_user(**create_kwargs)
                created = True
            except IntegrityError:
                # درخواست موازی همزمان کاربر را ساخته است
                user = User.objects.get(**lookup)

        if not user.is_active:
            return Response(
                {"error": "حساب کاربری شما غیرفعال است."},
                status=status.HTTP_403_FORBIDDEN,
            )

        login(request, user)

        return Response(
            {
                "message": "ورود با موفقیت انجام شد.",
                "is_new_user": created,
                "user_id": user.id,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    پایان session. برای کاربر لاگین‌شده، SessionAuthentication توکن CSRF را
    الزامی می‌کند (فرانت آن را از کوکی csrftoken می‌فرستد). اگر کاربر از قبل
    لاگین نباشد هم 200 برمی‌گردد (idempotent).
    """

    permission_classes = []

    def post(self, request):
        logout(request)
        return Response(
            {"message": "خروج با موفقیت انجام شد."},
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {
                "id": user.id,
                "phone": user.phone,
                "email": user.email,
            },
            status=status.HTTP_200_OK,
        )
