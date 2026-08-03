from django.contrib import admin

from .models import Address, Delivery, Rider


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("label", "user", "district", "is_default")
    list_filter = ("district",)


@admin.register(Rider)
class RiderAdmin(admin.ModelAdmin):
    list_display = ("user", "vehicle_type", "availability_status")
    list_filter = ("availability_status",)


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ("order", "rider", "status", "picked_up_at", "delivered_at")
    list_filter = ("status",)
