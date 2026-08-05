import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    role: "scientist",
    institution_name: "",
    company_name: "",
    business_license_no: "",
    license_url: "",
    gmp_cert_url: "",
    iso_cert_url: "",
  });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await api.register(form);
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  const isSeller = form.role === "manufacturer" || form.role === "distributor";

  return (
    <div className="auth-page-layout register-landing-layout">
      <section className="register-hero">
        <div className="hero-copy">
          <span className="eyebrow">Verified seller onboarding</span>
          <h1>Start selling premium excipients to science teams.</h1>
          <p>
            Use ExcipiHub to connect compliant manufacturers and distributors with labs,
            research teams, and production facilities. Submit your compliance documents,
            get approved, and let buyers discover your inventory with confidence.
          </p>
          <ul className="hero-benefits">
            <li>Seller verification built for regulators and buyers</li>
            <li>Fast access to life sciences procurement teams</li>
            <li>Order tracking, certificates, and dispute protection</li>
          </ul>
        </div>
        <div className="hero-image">
          <img src="/register-hero.jpg" alt="Premium excipient supply" />
        </div>
      </section>

      <div className="card auth-card">
        <h2>Create an account</h2>
        <form onSubmit={handleSubmit}>
          <label>Username</label>
          <input value={form.username} onChange={(e) => update("username", e.target.value)} required />
          <label>Email</label>
          <input
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            type="email"
            required
          />
          <label>Phone</label>
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
          <label>Password</label>
          <input
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            type="password"
            required
            minLength={8}
          />
          <label>I am a</label>
          <select value={form.role} onChange={(e) => update("role", e.target.value)}>
            <option value="scientist">Scientist (buyer)</option>
            <option value="manufacturer">Manufacturer (seller)</option>
            <option value="distributor">Distributor (seller)</option>
          </select>

          {form.role === "scientist" && (
            <>
              <label>Institution</label>
              <input
                value={form.institution_name}
                onChange={(e) => update("institution_name", e.target.value)}
              />
            </>
          )}

          <div className="seller-section">
            <p className="muted">
              Seller accounts require company and compliance documents before admin approval.
              Choose "Manufacturer" or "Distributor" to enable these fields.
            </p>
            <label>Company name</label>
            <input
              value={form.company_name}
              onChange={(e) => update("company_name", e.target.value)}
              placeholder="Your company or brand name"
              required={isSeller}
              disabled={!isSeller}
            />
            <label>Business license number</label>
            <input
              value={form.business_license_no}
              onChange={(e) => update("business_license_no", e.target.value)}
              placeholder="Official business license number"
              required={isSeller}
              disabled={!isSeller}
            />
            <label>License URL</label>
            <input
              value={form.license_url}
              onChange={(e) => update("license_url", e.target.value)}
              type="url"
              placeholder="https://example.com/license.pdf"
              required={isSeller}
              disabled={!isSeller}
            />
            <label>GMP certificate URL</label>
            <input
              value={form.gmp_cert_url}
              onChange={(e) => update("gmp_cert_url", e.target.value)}
              type="url"
              placeholder="https://example.com/gmp.pdf"
              required={isSeller}
              disabled={!isSeller}
            />
            <label>ISO certificate URL</label>
            <input
              value={form.iso_cert_url}
              onChange={(e) => update("iso_cert_url", e.target.value)}
              type="url"
              placeholder="https://example.com/iso.pdf"
              required={isSeller}
              disabled={!isSeller}
            />
          </div>

          {error && <p className="error">{error}</p>}
          <button type="submit">Register</button>
        </form>
        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
