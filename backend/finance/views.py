from django.db import transaction
from django.db.models import Q
from django.db.models.deletion import ProtectedError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, viewsets
from rest_framework.exceptions import ValidationError

from finance.filters import TransactionFilter
from finance.models import Account, Category, Transaction
from finance.serializers import (
    AccountSerializer,
    CategorySerializer,
    TransactionSerializer,
)
from finance.services import (
    delete_account_with_transactions,
    ensure_initial_balance_allowed,
    ensure_sufficient_funds,
)


class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user_id == request.user.id


class IsOwnerOrReadOnlyShared(permissions.BasePermission):
    """Own rows are writable. System rows (user is null) are read-only."""

    def has_object_permission(self, request, view, obj):
        if obj.user_id == request.user.id:
            return True
        return obj.user_id is None and request.method in permissions.SAFE_METHODS


class OwnedModelViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError as exc:
            raise ValidationError(
                "این رکورد در تراکنش‌ها استفاده شده و قابل حذف نیست."
            ) from exc


class AccountViewSet(OwnedModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer

    def perform_update(self, serializer):
        with transaction.atomic():
            stored = Account.objects.select_for_update().get(
                pk=serializer.instance.pk
            )
            ensure_initial_balance_allowed(
                stored,
                serializer.validated_data.get(
                    "initial_balance", stored.initial_balance
                ),
            )
            serializer.save()

    def perform_destroy(self, instance):
        # By default an account that has transactions can't be deleted. The
        # client asks for the full delete explicitly, after confirming with
        # the user: DELETE /api/accounts/<id>/?delete_transactions=true
        if self.request.query_params.get("delete_transactions") in ("1", "true"):
            with transaction.atomic():
                delete_account_with_transactions(instance)
            return
        super().perform_destroy(instance)


class CategoryViewSet(OwnedModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnlyShared]

    def get_queryset(self):
        return self.queryset.filter(Q(user=self.request.user) | Q(user__isnull=True))


class TransactionViewSet(OwnedModelViewSet):
    queryset = Transaction.objects.select_related("account", "to_account", "category")
    serializer_class = TransactionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = TransactionFilter

    # An account balance may never go below zero. Each write runs the check and
    # the save in one DB transaction so the locked balance can't change between
    # them.
    def perform_create(self, serializer):
        with transaction.atomic():
            ensure_sufficient_funds(None, serializer.build_candidate())
            serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        with transaction.atomic():
            stored = Transaction.objects.select_for_update().get(
                pk=serializer.instance.pk
            )
            ensure_sufficient_funds(stored, serializer.build_candidate())
            serializer.save()

    def perform_destroy(self, instance):
        with transaction.atomic():
            ensure_sufficient_funds(instance, None)
            super().perform_destroy(instance)
