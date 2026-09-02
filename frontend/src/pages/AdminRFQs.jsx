import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Table } from "../components/UI.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const norm = (d) => (Array.isArray(d) ? d : (d?.results || []));

export default function AdminRFQs() {
  const { user, token } = useAuth();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.is_staff) return;
    setLoading(true);
    setError("");
    api
      .listRFQs({})
      .then((res) => setRfqs(norm(res)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, token]);

  if (!user?.is_staff) {
    return <div className="card">Admin access required.</div>;
  }

  const columns = [
    { key: "reference", label: "Reference" },
    { key: "ingredient_name", label: "Ingredient" },
    { key: "buyer_name", label: "Buyer" },
    { key: "quantity", label: "Quantity" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "quote_count", label: "Quotes" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">RFQs</h1>
      {error && (
        <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</p>
      )}
      {loading ? <LoadingSpinner /> : <Table columns={columns} data={rfqs} />}
    </div>
  );
}
