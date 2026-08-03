from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "role", "verification_status", "is_active_seller")
    list_filter = ("role", "verification_status")
    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "ExcipiHub profile",
            {
                "fields": (
                    "role",
                    "phone",
                    "institution_name",
                    "company_name",
                    "business_license_no",
                    "verification_status",
                    "is_active_seller",
                )
            },
        ),
    )
