# users/views.py
from datetime import timedelta
from django.contrib.auth import login
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import OTPCode, User


class RequestOTPView(APIView):
    permission_classes = []  # عمومی (بدون نیاز به توکن)

    def post(self, request):
        identifier = request.data.get("identifier")  # موبایل یا ایمیل
        if not identifier:
            return Response(
                {"error": "وارد کردن شماره موبایل یا ایمیل الزامی است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        code = OTPCode.generate_code()
        print(f">>>>> [Koozak OTP] Code for {identifier}: {code} <<<<<")

        expires_at = timezone.now() + timedelta(minutes=3)

        OTPCode.objects.update_or_create(
            identifier=identifier,
            defaults={
                "code_hash": make_password(code),
                "attempts": 0,
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
        identifier = request.data.get("identifier")
        code = request.data.get("code")

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

        if otp_record.attempts >= 3:
            otp_record.delete()
            return Response(
                {
                    "error": "تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً دوباره کد بگیرید."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not check_password(code, otp_record.code_hash):
            otp_record.attempts += 1
            otp_record.save()
            return Response(
                {"error": "کد تایید اشتباه است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp_record.delete()

        is_email = "@" in identifier
        filter_kwargs = (
            {"email": identifier} if is_email else {"phone": identifier}
        )

        user, created = User.objects.get_or_create(**filter_kwargs)
        login(request, user)

        return Response(
            {
                "message": "ورود با موفقیت انجام شد.",
                "is_new_user": created,
                "user_id": user.id,
            },
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