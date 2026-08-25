import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function SellerDashboard() {
  const { user, token, login } = useAuth();
  const [form, setForm] = useState({
    company_name: "",
    business_license_no: "",
    license_url: "",
    gmp_cert_url: "",
    iso_cert_url: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        company_name: user.company_name || "",
        business_license_no: user.business_license_no || "",
        license_url: user.license_url || "",
        gmp_cert_url: user.gmp_cert_url || "",
        iso_cert_url: user.iso_cert_url || "",
      });
    }
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const updated = await api.updateProfile(form, token);
      login(token, updated);
      setMessage("Seller profile saved. Your verification request is now with admin.");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user) {
    return <p className="muted">Loading seller dashboard...</p>;
  }

  if (user.role !== "manufacturer" && user.role !== "distributor") {
    return <p className="muted">Only manufacturers and distributors can access the seller dashboard.</p>;
  }

  return (
    <div>
      <h2>Seller dashboard</h2>

      <div className="card">
        <h3>Verification & documents</h3>
        <p className="muted">
          Your current status is <strong>{user.verification_status}</strong>. Admins verify seller
          accounts manually from the Django admin.
        </p>
        <form onSubmit={handleSubmit}>
          <p className="muted">
            Please provide all required seller documents so your account can be verified.
          </p>
          <label>Company name</label>
          <input
            value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            placeholder="Your company or brand name"
            required
          />
          <label>Business license number</label>
          <input
            value={form.business_license_no}
            onChange={(e) => setForm({ ...form, business_license_no: e.target.value })}
            placeholder="Official business license number"
            required
          />
          <label>License URL</label>
          <input
            value={form.license_url}
            onChange={(e) => setForm({ ...form, license_url: e.target.value })}
            type="url"
            placeholder="https://example.com/license.pdf"
            required
          />
          <label>GMP certificate URL</label>
          <input
            value={form.gmp_cert_url}
            onChange={(e) => setForm({ ...form, gmp_cert_url: e.target.value })}
            type="url"
            placeholder="https://example.com/gmp.pdf"
            required
          />
          <label>ISO certificate URL</label>
          <input
            value={form.iso_cert_url}
            onChange={(e) => setForm({ ...form, iso_cert_url: e.target.value })}
            type="url"
            placeholder="https://example.com/iso.pdf"
            required
          />
          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}
          <button type="submit">Save seller info</button>
        </form>
      </div>

      <div className="card">
        <h3>Seller actions</h3>
        <p>
          Once verified, you can list excipients from the catalog page and manage orders from the seller orders page.
        </p>
        <div className="flex gap-4 mt-4">
          <a href="/seller/orders" className="btn-secondary inline-block">
            View seller orders
          </a>
          <Link to="/seller/listings" className="btn-primary inline-block">
            Manage listings
          </Link>
        </div>
      </div>
    </div>
  );
}
