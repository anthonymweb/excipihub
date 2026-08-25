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
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.register(form);
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const isSeller =
    form.role === "manufacturer" || form.role === "distributor";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Create an account
          </h1>
          <p className="text-slate-500 mt-2">
            Join the pharmaceutical excipient marketplace
          </p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                type="email"
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                type="password"
                className="input"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="label">I am a</label>
              <select
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
                className="input"
              >
                <option value="scientist">Scientist (buyer)</option>
                <option value="manufacturer">Manufacturer (seller)</option>
                <option value="distributor">Distributor (seller)</option>
              </select>
            </div>

            {form.role === "scientist" && (
              <div>
                <label className="label">Institution</label>
                <input
                  value={form.institution_name}
                  onChange={(e) => update("institution_name", e.target.value)}
                  className="input"
                />
              </div>
            )}

            {isSeller && (
              <div className="border-t border-slate-200 pt-4 mt-4 space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
                  Seller accounts require company and compliance documents
                  before admin approval.
                </div>
                <div>
                  <label className="label">Company name</label>
                  <input
                    value={form.company_name}
                    onChange={(e) => update("company_name", e.target.value)}
                    className="input"
                    placeholder="Your company or brand name"
                    required={isSeller}
                  />
                </div>
                <div>
                  <label className="label">Business license number</label>
                  <input
                    value={form.business_license_no}
                    onChange={(e) =>
                      update("business_license_no", e.target.value)
                    }
                    className="input"
                    placeholder="Official business license number"
                    required={isSeller}
                  />
                </div>
                <div>
                  <label className="label">License URL</label>
                  <input
                    value={form.license_url}
                    onChange={(e) => update("license_url", e.target.value)}
                    type="url"
                    className="input"
                    placeholder="https://example.com/license.pdf"
                    required={isSeller}
                  />
                </div>
                <div>
                  <label className="label">GMP certificate URL</label>
                  <input
                    value={form.gmp_cert_url}
                    onChange={(e) => update("gmp_cert_url", e.target.value)}
                    type="url"
                    className="input"
                    placeholder="https://example.com/gmp.pdf"
                    required={isSeller}
                  />
                </div>
                <div>
                  <label className="label">ISO certificate URL</label>
                  <input
                    value={form.iso_cert_url}
                    onChange={(e) => update("iso_cert_url", e.target.value)}
                    type="url"
                    className="input"
                    placeholder="https://example.com/iso.pdf"
                    required={isSeller}
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
          <div className="mt-4 text-center text-sm text-slate-500 space-y-2">
            <p>
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-accent-600 hover:text-accent-700 font-medium"
              >
                Sign in
              </Link>
            </p>
            <p>
              <Link
                to="/"
                className="text-slate-400 hover:text-slate-600"
              >
                Back to home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
