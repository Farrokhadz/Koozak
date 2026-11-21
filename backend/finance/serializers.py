from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from rest_framework import serializers

from finance.models import Account, Category, Transaction


def _as_serializer_error(exc):
    if getattr(exc, "error_dict", None):
        return serializers.ValidationError(exc.message_dict)
    return serializers.ValidationError(exc.messages)


class AccountSerializer(serializers.ModelSerializer):
    balance = serializers.IntegerField(read_only=True)

    class Meta:
        model = Account
        fields = [
            "id",
            "name",
            "type",
            "color",
            "initial_balance",
            "is_archived",
            "balance",
        ]
        extra_kwargs = {"initial_balance": {"min_value": 0}}

    def validate_name(self, value):
        # The (user, name) unique constraint would otherwise surface as a 500.
        clash = Account.objects.filter(
            user=self.context["request"].user, name=value
        )
        if self.instance is not None:
            clash = clash.exclude(pk=self.instance.pk)
        if clash.exists():
            raise serializers.ValidationError("حسابی با این نام از قبل وجود دارد.")
        return value


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id",
            "name_fa",
            "name_en",
            "kind",
            "icon",
            "is_archived",
        ]


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            "id",
            "type",
            "account",
            "to_account",
            "category",
            "amount",
            "fee",
            "date",
            "note",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]
        extra_kwargs = {
            "id": {"required": False},
            "fee": {"required": False},
            "note": {"required": False},
            "to_account": {"required": False, "allow_null": True},
            "category": {"required": False, "allow_null": True},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # A client-supplied id is only for creating an offline/idempotent row.
        if self.instance is not None:
            self.fields["id"].read_only = True

        user = getattr(self.context.get("request"), "user", None)
        if user is None or not user.is_authenticated:
            self.fields["account"].queryset = Account.objects.none()
            self.fields["to_account"].queryset = Account.objects.none()
            self.fields["category"].queryset = Category.objects.none()
            return

        accounts = Account.objects.filter(user=user)
        self.fields["account"].queryset = accounts
        self.fields["to_account"].queryset = accounts
        self.fields["category"].queryset = Category.objects.filter(
            Q(user=user) | Q(user__isnull=True)
        )

    def validate(self, attrs):
        candidate = self._candidate(attrs)
        try:
            # DRF does not call Model.clean(). Ownership and category-kind
            # rules live there, so they must run before save.
            candidate.clean()
            candidate.validate_constraints()
        except DjangoValidationError as exc:
            raise _as_serializer_error(exc) from exc
        return attrs

    def build_candidate(self):
        """The unsaved Transaction this validated request would produce."""
        return self._candidate(self.validated_data)

    def _candidate(self, attrs):
        user = self.context["request"].user
        if self.instance is None:
            return Transaction(user=user, **attrs)

        values = {
            "id": self.instance.id,
            "user": self.instance.user,
            "type": self.instance.type,
            "account": self.instance.account,
            "to_account": self.instance.to_account,
            "category": self.instance.category,
            "amount": self.instance.amount,
            "fee": self.instance.fee,
            "date": self.instance.date,
            "note": self.instance.note,
        }
        values.update(attrs)
        values["id"] = self.instance.id
        values["user"] = self.instance.user
        return Transaction(**values)
