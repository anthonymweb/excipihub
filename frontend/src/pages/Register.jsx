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
    <div className="card">
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
        {isSeller && (
          <>
            <label>Company name</label>
            <input
              value={form.company_name}
              onChange={(e) => update("company_name", e.target.value)}
            />
          </>
        )}

        {error && <p className="error">{error}</p>}
        <button type="submit">Register</button>
      </form>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
