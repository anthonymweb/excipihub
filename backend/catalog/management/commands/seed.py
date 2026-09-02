"""Seed demonstration data for the newly added platform modules.

Run with:  python manage.py seed
It is safe to run repeatedly (uses get_or_create-style logic where possible).
"""
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import User
from catalog.models import Batch, Excipient
from documents.models import Document, SupplierVerification
from formulations.models import FormulationItem, FormulationKit
from messaging.models import Message
from notifications.models import Notification
from rfq.models import RFQ, RFQQuote


class Command(BaseCommand):
    help = "Seed demo data for batches, documents, RFQ, formulations, notifications, messages."

    def handle(self, *args, **options):
        suppliers = User.objects.filter(role__in=["manufacturer", "distributor"])
        buyers = User.objects.filter(role="scientist")
        if not suppliers.exists() or not buyers.exists():
            self.stdout.write(self.style.WARNING("Need supplier + buyer users to seed."))
            return

        mac = suppliers.filter(email="mac@gmail.com").first() or suppliers.first()
        maria = buyers.filter(email="maria@gmail.com").first() or buyers.first()

        # 1. Supplier verifications
        for s in suppliers:
            SupplierVerification.objects.get_or_create(
                supplier=s,
                defaults={
                    "stage": SupplierVerification.Stage.ACTIVE
                    if s.verification_status == "verified"
                    else SupplierVerification.Stage.UNDER_REVIEW,
                    "risk_flags": [],
                },
            )

        # 2. Batches for each excipient
        batch_count = 0
        for exc in Excipient.objects.all():
            if not Batch.objects.filter(excipient=exc).exists():
                Batch.objects.create(
                    excipient=exc,
                    batch_number=f"EXC-{exc.name[:3].upper()}-{batch_count + 1:03d}",
                    manufacture_date=timezone.now().date() - timezone.timedelta(days=60),
                    expiry_date=timezone.now().date() + timezone.timedelta(days=300),
                    quantity=max(50, exc.stock_quantity),
                    status=Batch.Status.AVAILABLE,
                    coa_url="https://example.com/coa.pdf",
                    sds_url="https://example.com/sds.pdf",
                )
                batch_count += 1
        self.stdout.write(f"Seeded {batch_count} batches.")

        # 3. Documents for suppliers + products
        doc_count = 0
        for s in suppliers:
            if not Document.objects.filter(supplier=s, document_type="gmp").exists():
                Document.objects.create(
                    document_type="gmp",
                    file_url="https://example.com/gmp.pdf",
                    status=Document.Status.VERIFIED,
                    uploaded_by=s,
                    supplier=s,
                    verified_by=s,
                    verified_at=timezone.now(),
                )
                doc_count += 1
        for exc in Excipient.objects.all()[:5]:
            if not Document.objects.filter(product=exc, document_type="sds").exists():
                Document.objects.create(
                    document_type="sds",
                    file_url="https://example.com/sds.pdf",
                    status=Document.Status.VERIFIED,
                    uploaded_by=exc.seller,
                    product=exc,
                    verified_by=exc.seller,
                    verified_at=timezone.now(),
                )
                doc_count += 1
        self.stdout.write(f"Seeded {doc_count} documents.")

        # 4. RFQ from a buyer + a quote from a supplier
        if not RFQ.objects.exists():
            rfq = RFQ.objects.create(
                buyer=maria,
                ingredient_name="Microcrystalline Cellulose",
                cas_number="9004-34-6",
                required_grade="USP",
                quantity=500,
                unit="kg",
                required_delivery_date=timezone.now().date() + timezone.timedelta(days=30),
                required_documents=["coa", "sds", "gmp"],
                verified_suppliers_only=True,
                status=RFQ.Status.OPEN,
            )
            rfq.reference = f"RFQ-{timezone.now().strftime('%Y%m')}-{rfq.id.hex[:6].upper()}"
            rfq.save()
            RFQQuote.objects.create(
                rfq=rfq,
                supplier=mac,
                price_per_unit=4.80,
                lead_time_days=5,
                moq=25,
                validity_days=30,
                payment_terms="Net 30",
                status=RFQQuote.Status.PENDING,
            )
            self.stdout.write("Seeded 1 RFQ + 1 quote.")

        # 5. Formulation kit for a buyer
        if not FormulationKit.objects.filter(owner=maria).exists():
            kit = FormulationKit.objects.create(
                owner=maria,
                name="Immediate Release Tablet Prototype",
                description="Demo formulation for a generic tablet.",
            )
            FormulationItem.objects.create(kit=kit, ingredient_name="Microcrystalline Cellulose", quantity=500, unit="g")
            FormulationItem.objects.create(kit=kit, ingredient_name="Magnesium Stearate", quantity=50, unit="g")
            FormulationItem.objects.create(kit=kit, ingredient_name="Povidone K30", quantity=100, unit="g")
            self.stdout.write("Seeded 1 formulation kit.")

        # 6. Notification + message
        if not Notification.objects.filter(recipient=maria).exists():
            Notification.objects.create(
                recipient=maria,
                event=Notification.Event.ORDER_CREATED,
                title="Welcome to ExcipiHub",
                message="Your account is ready. Browse the catalog or request a quote.",
                link="/",
            )
        if not Message.objects.filter(sender=mac, recipient=maria).exists():
            Message.objects.create(
                sender=mac,
                recipient=maria,
                subject="Bulk pricing for MCC",
                body="Hi, we can offer tiered pricing for orders above 1 tonne. Let us know.",
            )
        self.stdout.write(self.style.SUCCESS("Seed complete."))
