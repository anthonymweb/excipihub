import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { StatCard } from "../components/UI.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const norm = (d) => (Array.isArray(d) ? d : (d?.results || []));

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.is_staff) return;
    setError("");
    Promise.all([
      api.adminUsers(undefined, token),
      api.adminPendingSellers(token),
      api.listExcipients({}),
      api.adminDisputes(token),
    ])
      .then(([usersRes, pendingRes, excipientsRes, disputesRes]) => {
        const users = norm(usersRes);
        const pending = norm(pendingRes);
        const excipients = norm(excipientsRes);
        const disputes = norm(disputesRes);
        const activeSuppliers = users.filter(
          (u) =>
            (u.role === "manufacturer" || u.role === "distributor") &&
            u.verification_status === "verified"
        );
        const openDisputes = disputes.filter((d) => d.status !== "resolved");
        setStats({
          totalUsers: users.length,
          activeSuppliers: activeSuppliers.length,
          pendingVerification: pending.length,
          totalProducts: excipients.length,
          openDisputes: openDisputes.length,
        });
      })
      .catch((err) => setError(err.message));
  }, [user, token]);

  if (!user?.is_staff) {
    return <div className="card">Admin access required.</div>;
  }

  const links = [
    { to: "/admin/users", label: "Users", sub: "Manage platform users" },
    { to: "/admin/suppliers", label: "Suppliers", sub: "Verify seller accounts" },
    { to: "/admin/compliance", label: "Compliance", sub: "Supplier & product scores" },
    { to: "/admin/audit", label: "Audit Logs", sub: "Platform activity" },
    { to: "/admin/documents", label: "Documents", sub: "Review submissions" },
    { to: "/admin/disputes", label: "Disputes", sub: "Resolve conflicts" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {error && (
        <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</p>
      )}

      {!stats ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Users" value={stats.totalUsers} />
          <StatCard label="Active Suppliers" value={stats.activeSuppliers} sub="Verified manufacturers & distributors" />
          <StatCard label="Pending Verification" value={stats.pendingVerification} accent />
          <StatCard label="Total Products" value={stats.totalProducts} />
          <StatCard label="Open Disputes" value={stats.openDisputes} accent />
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="card hover:border-accent-400 transition-colors">
            <p className="font-medium text-accent-700">{l.label}</p>
            <p className="text-sm text-slate-500 mt-1">{l.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
