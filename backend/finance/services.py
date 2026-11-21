from django.db.models import Q
from rest_framework.exceptions import ValidationError

from finance.models import Account, Transaction

_PERSIAN_DIGITS = str.maketrans("0123456789,", "۰۱۲۳۴۵۶۷۸۹٬")


def _format_toman(value):
    return f"{value:,}".translate(_PERSIAN_DIGITS)


def balance_effects(txn):
    """How one transaction changes each account's balance: {account_id: delta}.

    Mirrors Account.balance: the fee is always charged to `account`, and a
    transfer also credits `to_account`.
    """
    if txn is None:
        return {}
    if txn.type == Transaction.Type.INCOME:
        return {txn.account_id: txn.amount - txn.fee}

    effects = {txn.account_id: -txn.amount - txn.fee}
    if txn.type == Transaction.Type.TRANSFER and txn.to_account_id:
        effects[txn.to_account_id] = effects.get(txn.to_account_id, 0) + txn.amount
    return effects


def _ensure_no_overdraft(deltas, make_error):
    """Raise make_error(account, balance, shortfall) if applying `deltas`
    ({account_id: change}) would push an account below zero.

    Only accounts whose balance goes *down* are checked, so a change that
    doesn't lower a balance is never blocked. The rows are locked so two
    simultaneous requests can't spend the same money twice, so this must run
    inside transaction.atomic().
    """
    shrinking = {pk: delta for pk, delta in deltas.items() if delta < 0}
    if not shrinking:
        return

    accounts = Account.objects.select_for_update().filter(pk__in=shrinking)
    for account in accounts.order_by("pk"):
        balance = account.balance
        shortfall = -(balance + shrinking[account.pk])
        if shortfall > 0:
            raise make_error(account, balance, shortfall)


def ensure_sufficient_funds(old, new):
    """Reject a transaction change that would push an account below zero.

    `old` is the transaction as stored (None when creating) and `new` is what
    replaces it (None when deleting). Must run inside transaction.atomic().
    """
    deltas = {}
    for sign, txn in ((-1, old), (1, new)):
        for account_id, delta in balance_effects(txn).items():
            deltas[account_id] = deltas.get(account_id, 0) + sign * delta

    def make_error(account, balance, shortfall):
        if new is None:
            return ValidationError(
                f"با حذف این تراکنش، موجودی حساب «{account.name}» منفی می‌شود "
                f"(کمبود: {_format_toman(shortfall)} تومان)."
            )
        return ValidationError(
            {
                "amount": [
                    f"موجودی حساب «{account.name}» کافی نیست. "
                    f"موجودی فعلی: {_format_toman(balance)} تومان، "
                    f"کمبود: {_format_toman(shortfall)} تومان."
                ]
            }
        )

    _ensure_no_overdraft(deltas, make_error)


def ensure_initial_balance_allowed(account, new_initial_balance):
    """Lowering the opening balance lowers the balance by the same amount.

    Must run inside transaction.atomic() with the account row locked.
    """
    delta = new_initial_balance - account.initial_balance
    if delta >= 0:
        return

    shortfall = -(account.balance + delta)
    if shortfall > 0:
        raise ValidationError(
            {
                "initial_balance": [
                    f"با این موجودی اولیه، موجودی حساب «{account.name}» منفی می‌شود "
                    f"(کمبود: {_format_toman(shortfall)} تومان)."
                ]
            }
        )


def delete_account_with_transactions(account):
    """Delete an account together with every transaction that touches it.

    Removing a transfer that paid *into* another account takes that money away
    from it, so the other accounts must stay non-negative too. Must run inside
    transaction.atomic().
    """
    locked = Account.objects.select_for_update().get(pk=account.pk)
    related = list(
        Transaction.objects.select_for_update().filter(
            Q(account=locked) | Q(to_account=locked)
        )
    )

    deltas = {}
    for txn in related:
        for account_id, delta in balance_effects(txn).items():
            if account_id != locked.pk:
                deltas[account_id] = deltas.get(account_id, 0) - delta

    def make_error(other, balance, shortfall):
        return ValidationError(
            f"با حذف حساب «{locked.name}» و تراکنش‌هایش، موجودی حساب "
            f"«{other.name}» منفی می‌شود (کمبود: {_format_toman(shortfall)} تومان). "
            "ابتدا تراکنش‌های وابسته به آن انتقال‌ها را حذف کنید."
        )

    _ensure_no_overdraft(deltas, make_error)

    Transaction.objects.filter(pk__in=[txn.pk for txn in related]).delete()
    locked.delete()
