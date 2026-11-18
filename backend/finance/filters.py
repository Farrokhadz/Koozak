import django_filters

from finance.models import Transaction


class TransactionFilter(django_filters.FilterSet):
    date = django_filters.DateFilter(field_name="date")
    date_after = django_filters.DateFilter(field_name="date", lookup_expr="gte")
    date_before = django_filters.DateFilter(field_name="date", lookup_expr="lte")
    type = django_filters.ChoiceFilter(choices=Transaction.Type.choices)

    class Meta:
        model = Transaction
        fields = ["date", "date_after", "date_before", "type"]
