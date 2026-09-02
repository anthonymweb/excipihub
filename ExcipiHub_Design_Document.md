#ExcipiHub -Concept & Design Document

A digital marketplace connecting pharmaceutical scientists directly with ingredient manufacturers and distributors

#1. Executive Summary

ExcipiHub is a web-based marketplace that applies the on-demand, multi-vendor logistics, pharmaceutical excipients and active ingredients. Instead of restaurants and grocery stores, the "vendors" on ExcipiHub are pharmaceutical ingredient manufacturers and distributors. The buyers are pharmaceutical scientists, formulators, R&D labs, and small-to-mid-size pharmaceutical manufacturers who need to source excipients (binders, fillers, coatings, preservatives, solvents, APIs, etc.) quickly, reliably, and with full traceability.

The core value proposition: one platform, many verified suppliers, transparent stock and pricing, and order fulfillment built around the realities of pharmaceutical procurement batch/lot tracking, certificates of analysis (CoA), regulatory documentation, and minimum order quantities rather than the instant, casual checkout flow of a food delivery app.

#2. Problem Statement

Pharmaceutical scientists currently source ingredients through a fragmented mix of direct manufacturer relationships, distributor catalogs, email/phone quote requests, and occasionally general chemical marketplaces not built for the sector. This creates:

- Slow, manual quote-and-negotiate cycles for routine ingredient purchases
- No unified way to compare price, lead time, and certification status across suppliers
- Difficulty verifying supplier legitimacy and ingredient quality documentation (CoA, MSDS/SDS, regulatory status)
- Poor visibility into stock availability before committing to an order
- No centralized order history or reorder mechanism for recurring formulation work

ExcipiHub addresses this by digitizing and standardizing the discovery-to-fulfillment pipeline, the way Glovo standardized food discovery-to-delivery.


#3. Target Users

#3.1 Buyers -Pharmaceutical Scientists / Institutional Buyers
- Formulation scientists and R&D chemists at pharma companies
- Academic and university research labs
- Small-to-mid pharmaceutical manufacturers without dedicated procurement teams
- Contract manufacturing organizations (CMOs) and contract research organizations (CROs)

#3.2 Sellers -Manufacturers & Distributors
- Excipient manufacturers (e.g., producers of lactose, cellulose derivatives, magnesium stearate, etc.)
- API (active pharmaceutical ingredient) manufacturers and distributors
- Authorized regional distributors of major ingredient brands
- Specialty/fine chemical suppliers serving the pharma sector

#3.3 Platform Administrators
- ExcipiHub internal team managing supplier verification, compliance oversight, dispute resolution, and platform operations

#4. Core Features

#4.1 Buyer Features
| Feature | Description |
|---|---|
| Ingredient search & catalog browse | Search by ingredient name, CAS number, pharmacopoeia grade (USP/EP/BP/JP), function (binder, disintegrant, etc.) |
| Supplier comparison | Side-by-side view of price, MOQ, lead time, certifications, and ratings across suppliers for the same ingredient |
| Verified documentation access | Download CoA, SDS/MSDS, TSE/BSE-free declarations, regulatory letters directly from listings |
| Cart & multi-supplier checkout | Order from multiple suppliers in a single checkout, similar to a multi-restaurant Glovo cart |
| Order tracking | Real-time status: confirmed → preparing/QC release → shipped → delivered |
| Reorder & saved formulations lists | Save frequently ordered ingredients as a "formulation kit" for one-click reordering |
| RFQ (Request for Quote) | For bulk/custom orders outside listed pricing, buyers can submit a quote request to one or more suppliers |
| Institutional accounts | Multi-user lab accounts with role-based purchasing permissions and budget approval workflows |
| Regulatory/compliance filters | Filter by GMP status, country of origin, allergen-free, halal/kosher, novel excipient status, etc. |

#4.2 Seller Features
| Feature | Description |
|---|---|
| Storefront management | Sellers manage their own catalog, pricing, stock levels, and lead times |
| Document vault | Upload and attach CoA/SDS per batch/lot to specific listings or shipments |
| Order & fulfillment dashboard | Accept/reject orders, update fulfillment status, manage packing and shipment |
| Verification & compliance profile | Upload business licenses, GMP/ISO certifications, and manufacturing site details for platform verification |
| Analytics | Sales trends, top-ordered ingredients, repeat buyer metrics |
| RFQ inbox | Respond to buyer quote requests with custom pricing and terms |

#4.3 Platform-Wide Features
| Feature | Description |
|---|---|
| Supplier verification pipeline | Manual + document-based vetting before a seller can list products |
| Batch/lot traceability | Every order line is tied to a specific batch/lot number with linked documentation |
| Ratings & reviews | Buyers rate suppliers on quality, accuracy, and delivery timeliness |
| In-app messaging | Direct buyer-seller communication for order-specific questions |
| Notifications | Order status changes, stock restocks for saved items, RFQ responses |
| Admin moderation panel | Manage disputes, verify new sellers, monitor flagged listings |

#5. Key User Flows

#5.1 Buyer: Browse-to-Order Flow
1. Buyer logs in / creates an institutional account
2. Searches for an ingredient (e.g., "microcrystalline cellulose, USP grade")
3. Views a list of verified suppliers offering that ingredient, with price/MOQ/lead time/documentation shown per listing
4. Adds desired quantity from one or more suppliers to cart
5. Reviews cart (grouped by supplier, similar to multi-vendor carts in Glovo)
6. Enters/reviews shipping and billing details, selects payment method
7. Places order → receives order confirmation with expected fulfillment timeline per supplier
8. Tracks order status until delivery; downloads batch-specific CoA once shipped

#5.2 Buyer: RFQ Flow (for bulk/non-listed items)
1. Buyer submits an RFQ specifying ingredient, quantity, grade, and delivery timeline
2. RFQ is routed to matching verified suppliers
3. Suppliers respond with quotes (price, lead time, terms)
4. Buyer compares quotes and accepts one, converting it into a standard order

#5.3 Seller: Onboarding Flow
1. Seller registers and submits company/business documentation
2. Uploads manufacturing licenses, GMP/ISO certifications, and site details
3. Platform admin reviews and verifies the submission
4. Upon approval, seller builds their catalog (ingredient listings, pricing, stock, documentation)
5. Seller goes live and begins receiving orders/RFQs

#5.4 Seller: Order Fulfillment Flow
1. Seller receives new order notification
2. Confirms stock/batch availability and accepts the order
3. Attaches batch-specific CoA/SDS to the order
4. Marks order as shipped with tracking details
5. Buyer confirms receipt; order closes and becomes eligible for review


#6. System Architecture (High-Level)

┌─────────────────────────────┐
│        Client Layer          │
│  Web App (Buyer Portal)      │
│  Web App (Seller Dashboard)  │
│  Admin Console               │
└──────────────┬───────────────┘
               │ HTTPS / REST or GraphQL
┌──────────────▼───────────────┐
│        API Gateway            │
└──────────────┬───────────────┘
               │
┌──────────────▼───────────────────────────────────────────┐
│                     Backend Services                       │
│  ┌───────────┐ ┌───────────┐ ┌────────────┐ ┌───────────┐ │
│  │  Catalog  │ │  Orders & │ │  Supplier  │ │   User &  │ │
│  │  Service  │ │ Checkout  │ │Verification│ │Auth Service│ │
│  └───────────┘ └───────────┘ └────────────┘ └───────────┘ │
│  ┌───────────┐ ┌───────────┐ ┌────────────┐               │
│  │ Documents │ │  Payments │ │Notifications│               │
│  │ (CoA/SDS) │ │  Service  │ │  Service    │               │
│  └───────────┘ └───────────┘ └────────────┘               │
└──────────────┬───────────────────────────────────────────┘
               │
┌──────────────▼───────────────┐
│         Data Layer             │
│  Relational DB (orders, users, │
│  catalog, transactions)        │
│  Object Storage (CoA/SDS/docs) │
│  Search Index (ingredient/     │
│  supplier search)              │
└────────────────────────────────┘


#Suggested Tech Stack (Web App)
- **Frontend:** React (or Vue), TypeScript, Tailwind CSS
- **Backend:** Django/Python. Python is worth considering given the compliance/document-heavy domain and future data-analysis needs
- **Database:** PostgreSQL for structured/relational data (orders, users, catalog, batches)
- **Search:** Elasticsearch or PostgreSQL full-text search for ingredient/supplier discovery
- **File storage:** Object storage (e.g., S3-compatible) for CoA/SDS/regulatory documents
- **Auth:** OAuth2/JWT-based auth with role-based access control (buyer, seller, admin, sub-roles for institutional accounts)
- **Payments:** Escrow-capable payment processor supporting B2B invoicing/net terms, not just instant card checkout
- **Hosting:** Cloud provider (AWS/Azure/GCP) with staging + production environments

---

#7. Data Model (Core Entities)

- **User** -id, role (buyer/seller/admin), institution, verification status
- **Organization** -company/lab profile, linked users, billing info
- **Product Listing** -ingredient name, CAS number, pharmacopoeia grade, seller, price, MOQ, lead time
- **Batch/Lot** -batch number, linked CoA/SDS documents, expiry, manufacture date, linked to product listing
- **Order** -buyer, line items (each tied to a supplier + batch), status, timestamps
- **RFQ** -buyer, requested ingredient/spec, responses from sellers, status
- **Document** -type (CoA, SDS, license, certification), linked entity, file reference
- **Review** -buyer, seller, order reference, rating, comments


#8. Compliance & Trust Considerations

This is the area where ExcipiHub differs most sharply from a general delivery app, and it deserves early attention:

- **Regulated goods:** Some ingredients (particularly APIs) may be subject to export/import controls or require proof of legitimate end use, the platform should support buyer credential verification (e.g., institutional/business registration) before certain categories are purchasable.
- **Documentation integrity:** CoA and SDS documents should be tied to specific batches, not generic product pages, since actual composition can vary batch to batch.
- **Supplier vetting:** Manual verification of manufacturing licenses and certifications (GMP, ISO) before a seller can list products.
- **Traceability:** Every order should be traceable back to a specific batch for recall or quality-investigation purposes.
- **Data privacy:** Institutional buyer data and order history should be protected under standard data-protection practices given the sensitive nature of R&D activity.


#9. MVP Scope (Suggested Phase 1)

To keep a first build achievable, an MVP could focus on:
1. Buyer and seller account registration with basic verification (manual admin approval, not automated)
2. Product catalog with search/filter by ingredient name and grade
3. Single-supplier cart and checkout (multi-supplier cart deferred to Phase 2)
4. Basic order status tracking (confirmed → delivered)
5. Document upload/download for CoA/SDS per listing
6. Simple admin panel for supplier approval

**Deferred to later phases:** RFQ system, multi-supplier cart, analytics dashboards, in-app messaging, ratings/reviews, automated compliance checks.

#10. Suggested Roadmap

| Phase | Focus | Rough Timeframe |
|---|---|---|
| Phase 0 | Requirements finalization, wireframes, DB schema design | Period|
| Phase 1 (MVP) | Core catalog, single-supplier checkout, basic accounts | Period |
| Phase 2 | Multi-supplier cart, RFQ system, document vault expansion | Period |
| Phase 3 | Ratings/reviews, analytics, messaging, compliance automation | Period |
| Phase 4 | Scale, mobile app, payment/escrow enhancements | Period |


#11. Questions Worth Deciding Early

- Will ExcipiHub take a commission per transaction, charge suppliers a listing/subscription fee, or both?
- Will payments flow through the platform (escrow-style) or is ExcipiHub purely a discovery/connection layer with payment handled off-platform?
- Which regions/regulatory jurisdictions will the platform launch in first, since ingredient regulations vary significantly by country?
- Will buyer accounts require proof of institutional affiliation before they can order controlled or higher-risk ingredients?





























