from django.core.management.base import BaseCommand
from accounts.models import User
from rest_framework.authtoken.models import Token


class Command(BaseCommand):
    help = "Create demo user accounts"

    def handle(self, *args, **options):
        users = [
            {
                "username": "Mac",
                "email": "mac@gmail.com",
                "phone": "+254700000001",
                "password": "Mac@1234",
                "role": User.Role.MANUFACTURER,
                "company_name": "Mac Pharmaceuticals",
                "business_license_no": "BL-001",
                "license_url": "https://example.com/license1",
                "gmp_cert_url": "https://example.com/gmp1",
                "iso_cert_url": "https://example.com/iso1",
            },
            {
                "username": "Maria",
                "email": "maria@gmail.com",
                "phone": "+254700000002",
                "password": "Mac@1234",
                "role": User.Role.SCIENTIST,
                "institution_name": "Nairobi Research Lab",
            },
            {
                "username": "Ron",
                "email": "ron@gmail.com",
                "phone": "+254700000003",
                "password": "Mac@1234",
                "role": User.Role.DISTRIBUTOR,
                "company_name": "Ron Distributors",
                "business_license_no": "BL-002",
                "license_url": "https://example.com/license2",
                "gmp_cert_url": "https://example.com/gmp2",
                "iso_cert_url": "https://example.com/iso2",
            },
        ]

        for data in users:
            email = data["email"]
            if User.objects.filter(email=email).exists():
                self.stdout.write(self.style.WARNING(f"User {email} already exists, skipping"))
                continue
            password = data.pop("password")
            user = User(**data)
            user.set_password(password)
            user.save()
            Token.objects.get_or_create(user=user)
            self.stdout.write(self.style.SUCCESS(f"Created {user.username} ({user.role})"))
