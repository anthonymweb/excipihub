import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Table } from "../components/UI.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { EmptyState } from "../components/UI.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const norm = (d) => (Array.isArray(d) ? d : (d?.results || []));

export default function AdminOrders() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.is_staff) return;
    setLoading(true);
    setError("");
    api
      .listSellerOrders(token)
      .then((res) => setOrders(norm(res)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, token]);

  if (!user?.is_staff) {
    return <div className="card">Admin access required.</div>;
  }

  const columns = [
    { key: "id", label: "Order ID", render: (r) => r.id?.toString().slice(0, 8) },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "buyer_name", label: "Buyer" },
    { key: "total", label: "Total" },
    { key: "created_at", label: "Created" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      <p className="text-sm text-slate-500 mb-4">
        This view proxies the seller order list and may not reflect every platform order.
        For order-related conflicts, see{" "}
        <Link to="/admin/disputes" className="text-accent-600 underline">
          Disputes
        </Link>
        .
      </p>
      {error && (
        <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</p>
      )}
      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <EmptyState title="No orders via this view" message="There are no orders to display through the seller order proxy." />
      ) : (
        <Table columns={columns} data={orders} />
      )}
    </div>
  );
}
