from django.contrib import admin

from .models import Excipient


@admin.register(Excipient)
class ExcipientAdmin(admin.ModelAdmin):
    list_display = ("name", "seller", "category", "unit_price", "stock_quantity", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("name", "batch_number")
