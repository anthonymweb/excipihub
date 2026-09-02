import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Table, ProgressBar } from "../components/UI.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const norm = (d) => (Array.isArray(d) ? d : (d?.results || []));

function renderChecks(checks) {
  if (!checks) return <span className="text-slate-400">No checks</span>;
  const entries = Object.entries(checks);
  if (entries.length === 0) return <span className="text-slate-400">No checks</span>;
  return (
    <ul className="space-y-1">
      {entries.map(([label, ok]) => (
        <li key={label} className="flex items-center gap-2 text-sm">
          <span className={ok ? "text-green-600" : "text-red-600"}>{ok ? "✓" : "✗"}</span>
          <span className="capitalize">{label.replace(/_/g, " ")}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AdminCompliance() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.is_staff) return;
    setLoading(true);
    setError("");
    api
      .adminCompliance(token)
      .then((res) => setData(res || {}))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, token]);

  if (!user?.is_staff) {
    return <div className="card">Admin access required.</div>;
  }

  const suppliers = norm(data?.suppliers);
  const products = norm(data?.products);

  const supplierCols = [
    { key: "name", label: "Supplier" },
    {
      key: "score",
      label: "Score",
      render: (r) => (
        <div className="w-40">
          <ProgressBar value={r.score || 0} />
          <span className="text-xs text-slate-500">{r.score || 0}</span>
        </div>
      ),
    },
    { key: "status", label: "Status", render: (r) => r.status || "-" },
    { key: "checks", label: "Checks", render: (r) => renderChecks(r.checks) },
  ];

  const productCols = [
    { key: "name", label: "Product" },
    { key: "supplier", label: "Supplier", render: (r) => r.supplier || r.supplier_name || "-" },
    {
      key: "score",
      label: "Score",
      render: (r) => (
        <div className="w-40">
          <ProgressBar value={r.score || 0} />
          <span className="text-xs text-slate-500">{r.score || 0}</span>
        </div>
      ),
    },
    { key: "checks", label: "Checks", render: (r) => renderChecks(r.checks) },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Compliance</h1>
      {error && (
        <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</p>
      )}
      {loading || !data ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-semibold mb-4">Supplier Compliance</h2>
            <Table columns={supplierCols} data={suppliers} />
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-4">Product Compliance</h2>
            <Table columns={productCols} data={products} />
          </section>
        </div>
      )}
    </div>
  );
}
