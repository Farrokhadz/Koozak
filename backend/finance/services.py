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


def ensure_sufficient_funds(old, new):
    """Reject a change that would push an account's balance below zero.

    `old` is the transaction as stored (None when creating) and `new` is what
    replaces it (None when deleting). Only accounts whose balance goes *down*
    are checked, so editing a note or adding income is never blocked.

    Must run inside transaction.atomic(): the account rows are locked so two
    simultaneous requests can't spend the same money twice.
    """
    deltas = {}
    for sign, txn in ((-1, old), (1, new)):
        for account_id, delta in balance_effects(txn).items():
            deltas[account_id] = deltas.get(account_id, 0) + sign * delta

    shrinking = {pk: delta for pk, delta in deltas.items() if delta < 0}
    if not shrinking:
        return

    accounts = Account.objects.select_for_update().filter(pk__in=shrinking)
    for account in accounts.order_by("pk"):
        balance = account.balance
        shortfall = -(balance + shrinking[account.pk])
        if shortfall <= 0:
            continue

        if new is None:
            message = (
                f"با حذف این تراکنش، موجودی حساب «{account.name}» منفی می‌شود "
                f"(کمبود: {_format_toman(shortfall)} تومان)."
            )
            raise ValidationError(message)

        message = (
            f"موجودی حساب «{account.name}» کافی نیست. "
            f"موجودی فعلی: {_format_toman(balance)} تومان، "
            f"کمبود: {_format_toman(shortfall)} تومان."
        )
        raise ValidationError({"amount": [message]})
