import random
import uuid
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone
from rest_framework.authtoken.models import Token

from accounts.models import User
from catalog.models import Batch, Excipient
from documents.models import Document, SupplierVerification
from formulations.models import FormulationItem, FormulationKit, SavedProduct
from logistics.models import Address
from messaging.models import Message
from notifications.models import Notification
from orders.models import Dispute, Order, OrderItem, Payment, Review
from rfq.models import RFQ, RFQQuote


class Command(BaseCommand):
    help = "Seed the database with realistic demo data for the pharmaceutical excipient marketplace"

    def handle(self, *args, **options):
        self.stdout.write("Seeding demo data...\n")

        # ── Users ────────────────────────────────────────────────
        admin = self._user("admin", "admin@excipihub.com", "+256700000000", "Admin@1234", User.Role.SCIENTIST, is_staff=True, institution_name="ExcipiHub Admin")
        self._user("dr.amina", "amina@nabiresearch.ug", "+256700000001", "Demo@1234", User.Role.SCIENTIST, institution_name="Nairobi Research Institute")
        self._user("dr.kato", "kato@mak.ac.ug", "+256700000002", "Demo@1234", User.Role.SCIENTIST, institution_name="Makerere University Pharmacy Dept")
        self._user("sarah.labs", "sarah@capsalab.ug", "+256700000003", "Demo@1234", User.Role.SCIENTIST, institution_name="CAPSA Laboratories")

        manufacturer = self._user("mac_pharma", "sales@macpharma.com", "+256700000010", "Demo@1234", User.Role.MANUFACTURER,
                                   company_name="Mac Pharmaceuticals Ltd", business_license_no="BL-UG-2024-001",
                                   license_url="https://example.com/license1", gmp_cert_url="https://example.com/gmp1", iso_cert_url="https://example.com/iso1",
                                   verification_status=User.VerificationStatus.VERIFIED)
        distributor = self._user("ron_dist", "orders@rondist.ug", "+256700000011", "Demo@1234", User.Role.DISTRIBUTOR,
                                  company_name="Ron Distributors East Africa", business_license_no="BL-UG-2024-002",
                                  license_url="https://example.com/license2", gmp_cert_url="https://example.com/gmp2", iso_cert_url="https://example.com/iso2",
                                  verification_status=User.VerificationStatus.VERIFIED)
        self._user("chem_africa", "info@chemafrica.com", "+256700000012", "Demo@1234", User.Role.MANUFACTURER,
                   company_name="ChemAfrica Industries", business_license_no="BL-UG-2024-003",
                   license_url="https://example.com/license3", gmp_cert_url="https://example.com/gmp3", iso_cert_url="https://example.com/iso3",
                   verification_status=User.VerificationStatus.PENDING)

        buyers = [u for u in [admin, User.objects.get(username="dr.amina"), User.objects.get(username="dr.kato"), User.objects.get(username="sarah.labs")]]
        sellers = [manufacturer, distributor]

        # ── Addresses ────────────────────────────────────────────
        addr1 = Address.objects.create(user=buyers[1], label="Lab", district="Kampala", street="Plot 45, Makerere Hill Road", latitude=0.3319, longitude=32.5700, is_default=True)
        addr2 = Address.objects.create(user=buyers[2], label="Office", district="Kampala", street="University Road, Makerere", latitude=0.3330, longitude=32.5680, is_default=True)
        addr3 = Address.objects.create(user=buyers[3], label="Warehouse", district="Industrial Area", street="3rd Street, Industrial Area", latitude=0.3030, longitude=32.5880, is_default=True)
        addr4 = Address.objects.create(user=buyers[0], label="Admin Office", district="Nakawa", street="Plot 12, Port Bell Road", latitude=0.3130, longitude=32.5900, is_default=True)

        # ── Excipients ───────────────────────────────────────────
        excipient_data = [
            {"name": "Microcrystalline Cellulose (MCC)", "cas_number": "9004-34-6", "category": "Binder", "function": "Tablet binder and filler", "grade": "USP", "seller": manufacturer, "unit": "kg", "unit_price": "45.00", "stock_quantity": 5000, "lead_time_days": 7, "description": "Pharmaceutical grade microcrystalline cellulose for direct compression tablet manufacturing. Excellent compressibility and flow properties.", "certifications": ["GMP", "ISO 9001", "USP"]},
            {"name": "Lactose Monohydrate", "cas_number": "64044-51-5", "category": "Filler", "function": "Tablet and capsule diluent", "grade": "USP", "seller": manufacturer, "unit": "kg", "unit_price": "12.50", "stock_quantity": 10000, "lead_time_days": 5, "description": "Spray-dried lactose monohydrate for pharmaceutical tablet and capsule manufacturing. High purity, low moisture content.", "certifications": ["GMP", "Halal"]},
            {"name": "Magnesium Stearate", "cas_number": "557-04-0", "category": "Lubricant", "function": "Tablet lubricant and release agent", "grade": "USP", "seller": manufacturer, "unit": "kg", "unit_price": "28.00", "stock_quantity": 3000, "lead_time_days": 3, "description": "Pharmaceutical grade magnesium stearate. Ultra-fine particle size for optimal lubrication in tablet compression.", "certifications": ["GMP", "ISO 22000"]},
            {"name": "Sodium Benzoate", "cas_number": "532-32-1", "category": "Preservative", "function": "Antimicrobial preservative", "grade": "BP", "seller": distributor, "unit": "kg", "unit_price": "8.75", "stock_quantity": 8000, "lead_time_days": 4, "description": "Food and pharmaceutical grade sodium benzoate. Effective antimicrobial preservative for liquid formulations.", "certifications": ["FSSC 22000", "ISO 9001"]},
            {"name": "Hypromellose (HPMC)", "cas_number": "9004-65-3", "category": "Coating", "function": "Film coating and controlled release", "grade": "USP", "seller": manufacturer, "unit": "kg", "unit_price": "62.00", "stock_quantity": 2500, "lead_time_days": 10, "description": "Hydroxypropyl methylcellulose for film coating and controlled-release tablet matrices. Multiple viscosity grades available.", "certifications": ["GMP", "ISO 9001", "USP", "EP"]},
            {"name": "Povidone (PVP K30)", "cas_number": "9003-39-8", "category": "Binder", "function": "Tablet binder and solubility enhancer", "grade": "USP", "seller": distributor, "unit": "kg", "unit_price": "35.00", "stock_quantity": 4000, "lead_time_days": 6, "description": "Pharmaceutical grade PVP K30 for wet granulation binding and solid dispersion technology.", "certifications": ["GMP", "USP"]},
            {"name": "Croscarmellose Sodium", "cas_number": "74298-57-2", "category": "Disintegrant", "function": "Superdisintegrant for tablets", "grade": "USP", "seller": manufacturer, "unit": "kg", "unit_price": "22.00", "stock_quantity": 6000, "lead_time_days": 5, "description": "Cross-linked sodium carboxymethylcellulose. Superior disintegration properties at low use levels.", "certifications": ["GMP", "Halal"]},
            {"name": "Colloidal Silicon Dioxide", "cas_number": "7631-86-9", "category": "Filler", "function": "Glidant and anti-caking agent", "grade": "USP", "seller": manufacturer, "unit": "kg", "unit_price": "55.00", "stock_quantity": 1500, "lead_time_days": 8, "description": "Aerosil-grade fumed silica for improving powder flow in tablet and capsule manufacturing.", "certifications": ["GMP", "ISO 9001"]},
            {"name": "Polyethylene Glycol 4000", "cas_number": "25322-68-3", "category": "Other", "function": "Binder, lubricant, and plasticizer", "grade": "USP", "seller": distributor, "unit": "kg", "unit_price": "15.00", "stock_quantity": 7000, "lead_time_days": 4, "description": "PEG 4000 for pharmaceutical tablet binding, capsule plasticization, and suppository base formulation.", "certifications": ["USP", "EP"]},
            {"name": "Ibuprofen (API)", "cas_number": "15687-27-1", "category": "API", "function": "Active Pharmaceutical Ingredient", "grade": "USP", "seller": manufacturer, "unit": "kg", "unit_price": "120.00", "stock_quantity": 2000, "lead_time_days": 14, "description": "Pharmaceutical grade ibuprofen API. Complies with USP monograph specifications. Available in micronized and standard grades.", "certifications": ["GMP", "USP", "EP", "ISO 9001"]},
            {"name": "Paracetamol (API)", "cas_number": "103-90-2", "category": "API", "function": "Active Pharmaceutical Ingredient", "grade": "BP", "seller": distributor, "unit": "kg", "unit_price": "85.00", "stock_quantity": 3500, "lead_time_days": 10, "description": "Acetaminophen BP grade for tablet and suspension manufacturing. Consistent particle size distribution.", "certifications": ["GMP", "BP", "USP"]},
            {"name": "Ethanol (Pharmaceutical Grade)", "cas_number": "64-17-5", "category": "Solvent", "function": "Pharmaceutical solvent and extraction", "grade": "USP", "seller": manufacturer, "unit": "L", "unit_price": "5.50", "stock_quantity": 20000, "lead_time_days": 3, "description": "Anhydrous ethanol 99.5%+ for pharmaceutical manufacturing, extraction, and cleaning validation.", "certifications": ["GMP", "USP", "Ph. Eur."]},
        ]

        excipients = []
        for data in excipient_data:
            exc = Excipient.objects.create(**data, is_active=True)
            excipients.append(exc)
            self.stdout.write(f"  + Excipient: {exc.name}")

        # ── Batches ──────────────────────────────────────────────
        statuses = ["available", "available", "available", "qc_hold", "released"]
        for exc in excipients:
            for i in range(random.randint(1, 3)):
                year = random.choice([2024, 2025])
                month = random.randint(1, 12)
                Batch.objects.create(
                    excipient=exc,
                    batch_number=f"BN-{exc.name[:3].upper()}-{year}{month:02d}-{i+1:03d}",
                    manufacture_date=timezone.now() - timedelta(days=random.randint(30, 300)),
                    expiry_date=timezone.now() + timedelta(days=random.randint(180, 730)),
                    quantity=random.randint(500, 2000),
                    status=random.choice(statuses),
                    coa_url=f"https://storage.excipihub.com/coa/{exc.id}/batch-{i+1}.pdf",
                )
        self.stdout.write(f"  + Created {Batch.objects.count()} batches")

        # ── Saved Products ───────────────────────────────────────
        for buyer in buyers[1:]:
            for exc in random.sample(excipients, min(4, len(excipients))):
                SavedProduct.objects.get_or_create(user=buyer, excipient=exc)
        self.stdout.write(f"  + Created {SavedProduct.objects.count()} saved products")

        # ── Orders ───────────────────────────────────────────────
        order_statuses = [
            ("completed", 3), ("delivered", 2), ("shipped", 2),
            ("confirmed", 1), ("pending_payment", 1), ("cancelled", 1),
        ]
        orders = []
        for buyer in buyers[1:]:
            for _ in range(random.randint(2, 4)):
                status, weight = random.choice(order_statuses)
                items_data = random.sample(excipients, random.randint(1, 3))
                total = sum(float(e.unit_price) * random.randint(10, 100) for e in items_data)
                order = Order.objects.create(
                    buyer=buyer,
                    delivery_address=random.choice([addr1, addr2, addr3]),
                    status=status,
                    total_amount=total,
                    notes=random.choice(["", "Urgent delivery needed", "Please include SDS", "Ship to loading dock"]),
                )
                for exc in items_data:
                    qty = random.randint(10, 100)
                    OrderItem.objects.create(
                        order=order, excipient=exc, quantity=qty,
                        unit_price_at_purchase=exc.unit_price,
                        batch_number=f"BN-{random.randint(1000,9999)}",
                        shipped_at=timezone.now() - timedelta(days=random.randint(1, 5)) if status in ["shipped", "delivered", "completed"] else None,
                    )
                if status != "pending_payment":
                    Payment.objects.create(
                        order=order, amount=total,
                        method=random.choice(["card", "bank_transfer", "mobile_money"]),
                        status=Payment.Status.PAID,
                        transaction_ref=f"PAY-{uuid.uuid4().hex[:12].upper()}",
                        paid_at=timezone.now() - timedelta(days=random.randint(1, 10)),
                    )
                if status in ["completed", "delivered"]:
                    Review.objects.create(
                        order=order, reviewer=buyer,
                        rating=random.randint(3, 5),
                        comment=random.choice([
                            "Good quality, fast delivery.",
                            "Product matched specifications perfectly.",
                            "Slightly delayed but product was fine.",
                            "Excellent supplier, highly recommended.",
                            "Will order again.",
                        ]),
                    )
                orders.append(order)
        self.stdout.write(f"  + Created {Order.objects.count()} orders")

        # ── RFQs ─────────────────────────────────────────────────
        from decimal import Decimal
        rfq_data = [
            {"buyer": buyers[1], "ingredient_name": "Microcrystalline Cellulose", "cas_number": "9004-34-6", "required_grade": "USP", "quantity": Decimal("500.00"), "unit": "kg", "additional_requirements": "Ph. Eur. compliant, 100-mesh grade"},
            {"buyer": buyers[2], "ingredient_name": "Ibuprofen", "cas_number": "15687-27-1", "required_grade": "USP", "quantity": Decimal("200.00"), "unit": "kg", "additional_requirements": "Micronized grade, particle size < 50um"},
            {"buyer": buyers[3], "ingredient_name": "Hypromellose", "cas_number": "9004-65-3", "required_grade": "USP", "quantity": Decimal("100.00"), "unit": "kg", "additional_requirements": "HPMC K100M for controlled release matrix"},
            {"buyer": buyers[1], "ingredient_name": "Lactose Monohydrate", "cas_number": "64044-51-5", "required_grade": "USP", "quantity": Decimal("1000.00"), "unit": "kg", "additional_requirements": "Spray-dried, 100-mesh"},
        ]
        rfqs = []
        for data in rfq_data:
            status = random.choice([RFQ.Status.OPEN, RFQ.Status.OPEN, RFQ.Status.QUOTED])
            rfq = RFQ.objects.create(
                **data,
                status=status,
                required_delivery_date=timezone.now() + timedelta(days=random.randint(14, 60)),
                required_documents=["CoA", "SDS"],
                verified_suppliers_only=True,
            )
            rfq.reference = f"RFQ-{timezone.now().strftime('%Y%m')}-{rfq.id.hex[:6].upper()}"
            rfq.save(update_fields=["reference"])
            rfqs.append(rfq)
            if status == RFQ.Status.QUOTED:
                for seller in random.sample(sellers, random.randint(1, 2)):
                    RFQQuote.objects.create(
                        rfq=rfq, supplier=seller,
                        price_per_unit=float(data["quantity"]) * random.uniform(0.8, 1.2),
                        lead_time_days=random.randint(5, 21),
                        moq=random.randint(50, 200),
                        validity_days=30,
                        payment_terms=random.choice(["Net 30", "Net 60", "50% Advance"]),
                        notes="Includes documentation and testing.",
                        status=random.choice([RFQQuote.Status.PENDING, RFQQuote.Status.PENDING, RFQQuote.Status.ACCEPTED]),
                    )
        self.stdout.write(f"  + Created {RFQ.objects.count()} RFQs with {RFQQuote.objects.count()} quotes")

        # ── Documents ────────────────────────────────────────────
        doc_types = ["coa", "sds", "gmp", "iso", "business_license"]
        for seller in sellers:
            for dt in random.sample(doc_types, 3):
                Document.objects.create(
                    document_type=dt,
                    file_url=f"https://storage.excipihub.com/docs/{seller.id}/{dt}.pdf",
                    status=random.choice(["verified", "uploaded", "under_review"]),
                    uploaded_by=seller,
                    supplier=seller,
                )
        self.stdout.write(f"  + Created {Document.objects.count()} documents")

        # ── Supplier Verifications ───────────────────────────────
        for seller in sellers:
            SupplierVerification.objects.get_or_create(
                supplier=seller,
                defaults={
                    "stage": "active" if seller.verification_status == "verified" else "under_review",
                    "reviewer_notes": "All documents verified. Supplier approved for marketplace.",
                },
            )
        self.stdout.write(f"  + Created {SupplierVerification.objects.count()} supplier verifications")

        # ── Formulation Kits ─────────────────────────────────────
        for buyer in buyers[1:]:
            kit = FormulationKit.objects.create(
                owner=buyer,
                name=random.choice(["Tablet Core Formula", "Capsule Blend", "Suspension Base"]),
                description="Standard formulation kit for common dosage forms.",
            )
            for exc in random.sample(excipients[:6], 3):
                FormulationItem.objects.create(
                    kit=kit, ingredient_name=exc.name,
                    quantity=random.randint(10, 100), unit="g",
                )
        self.stdout.write(f"  + Created {FormulationKit.objects.count()} formulation kits")

        # ── Messages ─────────────────────────────────────────────
        msg_subjects = [
            ("Delivery inquiry", "Hi, could you provide an update on the shipment status for order #BN-1234?"),
            ("Quality question", "Do you have the latest CoA available for the MCC 200 grade?"),
            ("Quote follow-up", "Following up on the RFQ submitted last week. Any updates?"),
            ("Bulk pricing", "We're looking to place a larger order. Can you offer volume discounts?"),
        ]
        for seller in sellers:
            for buyer in random.sample(buyers[1:], 2):
                subj, body = random.choice(msg_subjects)
                Message.objects.create(sender=buyer, recipient=seller, subject=subj, body=body)
                Message.objects.create(sender=seller, recipient=buyer, subject=f"Re: {subj}", body="Thank you for reaching out. We'll get back to you shortly.")
        self.stdout.write(f"  + Created {Message.objects.count()} messages")

        # ── Notifications ────────────────────────────────────────
        notif_events = [
            ("order_created", "New order placed", "Your order has been placed successfully."),
            ("order_shipped", "Order shipped", "Your order has been shipped and is on its way."),
            ("order_delivered", "Order delivered", "Your order has been delivered."),
            ("quote_received", "New quote received", "A supplier has submitted a quote for your RFQ."),
            ("document_verified", "Document verified", "Your uploaded document has been verified by admin."),
        ]
        for buyer in buyers[1:]:
            for event, title, msg in random.sample(notif_events, 3):
                Notification.objects.create(
                    recipient=buyer, event=event, title=title, message=msg,
                    is_read=random.choice([True, False]),
                )
        self.stdout.write(f"  + Created {Notification.objects.count()} notifications")

        # ── Disputes ─────────────────────────────────────────────
        completed_orders = [o for o in orders if o.status == "completed"]
        if completed_orders:
            order = random.choice(completed_orders)
            Dispute.objects.create(
                order=order, raised_by=order.buyer,
                reason="Received wrong batch quantity",
                status=random.choice(["open", "investigating"]),
            )
            self.stdout.write("  + Created 1 dispute")

        self.stdout.write(self.style.SUCCESS(f"\nDemo data seeded successfully!"))
        self.stdout.write(self.style.SUCCESS(f"  Users:       {User.objects.count()}"))
        self.stdout.write(self.style.SUCCESS(f"  Excipients:  {Excipient.objects.count()}"))
        self.stdout.write(self.style.SUCCESS(f"  Batches:     {Batch.objects.count()}"))
        self.stdout.write(self.style.SUCCESS(f"  Orders:      {Order.objects.count()}"))
        self.stdout.write(self.style.SUCCESS(f"  RFQs:        {RFQ.objects.count()}"))
        self.stdout.write(self.style.SUCCESS(f"  Messages:    {Message.objects.count()}"))
        self.stdout.write(self.style.SUCCESS(f"\nLogin credentials:"))
        self.stdout.write(self.style.SUCCESS(f"  Admin:   admin@excipihub.com / Admin@1234"))
        self.stdout.write(self.style.SUCCESS(f"  Buyer:   amina@nabiresearch.ug / Demo@1234"))
        self.stdout.write(self.style.SUCCESS(f"  Seller:  sales@macpharma.com / Demo@1234"))

    def _user(self, username, email, phone, password, role, **kwargs):
        existing = User.objects.filter(email=email).first() or User.objects.filter(username=username).first()
        if existing:
            return existing
        user = User(username=username, email=email, phone=phone, role=role, **kwargs)
        user.set_password(password)
        user.save()
        Token.objects.get_or_create(user=user)
        self.stdout.write(f"  + User: {username} ({role})")
        return user
