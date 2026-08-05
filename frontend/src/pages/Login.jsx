import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await api.login({ email, password });
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-page-layout">
      <div className="card auth-card">
        <h2>Log in</h2>
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          <label>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit">Log in</button>
        </form>
        <p>
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
      <div className="auth-side-image">
        <img src="/login-image.jpg" alt="ExcipiHub login illustration" loading="lazy" />
      </div>
    </div>
  );
}
