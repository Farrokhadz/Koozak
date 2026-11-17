from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models
from django.db.models import Q


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create(self, phone=None, email=None, password=None, **extra_fields):
        # رشته‌ی خالی باید None بشه تا unique constraint خراب نشه
        phone = phone or None
        email = self.normalize_email(email) if email else None
        if not phone and not email:
            raise ValueError("At least one of phone or email is required.")

        user = self.model(phone=phone, email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            # لاگین با OTP است؛ رمز عبور لازم نیست
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_user(self, phone=None, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create(phone, email, password, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self._create(None, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Language(models.TextChoices):
        FA = "fa", "فارسی"
        EN = "en", "English"

    phone = models.CharField(max_length=15, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    language = models.CharField(
        max_length=2, choices=Language.choices, default=Language.FA
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  # برای دسترسی به admin
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"  # فقط برای createsuperuser و admin
    REQUIRED_FIELDS = []

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(phone__isnull=False) | Q(email__isnull=False),
                name="user_has_phone_or_email",
            ),
        ]

    def save(self, *args, **kwargs):
        self.phone = self.phone or None
        self.email = self.email or None
        super().save(*args, **kwargs)

    def get_username(self):
        return self.phone or self.email

    def __str__(self):
        return self.phone or self.email or str(self.pk)


class OTPCode(models.Model):
    identifier = models.CharField(max_length=254)  # شماره موبایل یا ایمیل
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["identifier", "-created_at"]),
        ]

    def __str__(self):
        return f"OTP for {self.identifier}"
