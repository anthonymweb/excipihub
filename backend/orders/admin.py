from django.contrib import admin

from .models import Dispute, Order, OrderItem, Payment, Review


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1


class DisputeInline(admin.StackedInline):
    model = Dispute
    extra = 0
    fields = ("raised_by", "reason", "status", "outcome", "resolution")
    readonly_fields = ("raised_by",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "buyer", "status", "total_amount", "created_at")
    list_filter = ("status",)
    inlines = [OrderItemInline, DisputeInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("order", "amount", "method", "status", "paid_at")
    list_filter = ("status", "method")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("order", "reviewer", "rating", "created_at")
    list_filter = ("rating",)


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "raised_by", "status", "outcome", "created_at")
    list_filter = ("status", "outcome")
    search_fields = ("order__id", "raised_by__username", "reason", "resolution")
    readonly_fields = ("created_at", "updated_at")
