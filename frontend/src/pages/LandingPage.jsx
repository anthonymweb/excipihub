import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Feature({ icon, title, children }) {
  return (
    <div className="card p-6">
      <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center text-2xl mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2 text-slate-800">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-9 h-9 shrink-0 rounded-full bg-accent-600 text-white flex items-center justify-center font-bold">
        {n}
      </div>
      <div>
        <h4 className="font-semibold text-slate-800">{title}</h4>
        <p className="text-slate-600 text-sm">{children}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const shopHref = user ? "/catalog" : "/catalog";

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-accent-50 to-white">
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <span className="inline-block bg-accent-100 text-accent-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
            Pharmaceutical Excipient Marketplace
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-5">
            Source trusted pharmaceutical
            <br className="hidden md:block" /> ingredients with full traceability
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            ExcipiHub connects pharmaceutical scientists and manufacturers directly
            with verified suppliers — transparent stock, batch-level documentation,
            and a compliant procurement pipeline built for the lab.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to={shopHref} className="btn-primary px-8 py-3 text-base">
              Start Shopping
            </Link>
            <Link to="/register" className="btn-secondary px-8 py-3 text-base">
              Become a Supplier
            </Link>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <Feature icon="🔬" title="Verified Suppliers">
            Every manufacturer and distributor is vetted with business licenses,
            GMP/ISO certifications, and documentation before they can list products.
          </Feature>
          <Feature icon="📦" title="Batch & Lot Traceability">
            Each order line is tied to a specific batch with linked Certificates of
            Analysis (CoA) and Safety Data Sheets (SDS).
          </Feature>
          <Feature icon="💬" title="RFQ & Quotes">
            Request quotes for bulk or custom orders and compare pricing, lead time,
            and certification status across suppliers.
          </Feature>
          <Feature icon="🧪" title="Formulation Kits">
            Save frequently ordered ingredients as a kit for one-click reordering and
            check live availability across suppliers.
          </Feature>
          <Feature icon="🛡️" title="Compliance Oversight">
            Admin-driven compliance scoring, document verification, and dispute
            resolution keep the marketplace trustworthy.
          </Feature>
          <Feature icon="🔔" title="Live Notifications">
            Stay informed on order status changes, stock restocks for saved items,
            and responses to your RFQs.
          </Feature>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10 text-slate-900">
            How it works
          </h2>
          <div className="space-y-6">
            <Step n={1} title="Discover & compare">
              Browse a searchable catalog filtered by CAS number, function, grade,
              and country of origin. Compare suppliers side by side.
            </Step>
            <Step n={2} title="Order or request a quote">
              Buy listed stock instantly, or submit an RFQ for bulk and custom
              requirements and review supplier quotes.
            </Step>
            <Step n={3} title="Track & review">
              Follow your order from confirmation through shipment with batch-level
              documentation, then rate your experience.
            </Step>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="card p-10 bg-accent-600 text-white">
          <h2 className="text-2xl font-bold mb-3">Ready to source smarter?</h2>
          <p className="mb-6 text-accent-50">
            Join the marketplace built for pharmaceutical procurement.
          </p>
          <Link to={shopHref} className="bg-white text-accent-700 px-8 py-3 rounded-lg font-medium hover:bg-accent-50 transition-colors inline-block">
            Start Shopping
          </Link>
        </div>
      </section>
    </div>
  );
}
