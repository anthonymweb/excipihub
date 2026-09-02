import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const STATUSES = [
  "supplier_review",
  "confirmed",
  "batch_allocated",
  "qc_release",
  "preparing",
  "packed",
  "shipped",
  "in_transit",
  "delivered",
  "buyer_confirmed",
  "completed",
  "cancelled",
  "rejected",
  "disputed",
  "return_requested",
  "recalled",
];

export default function SupplierOrders() {
  const { token } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState({});
  const [advancing, setAdvancing] = useState(null);

  useEffect(() => {
    if (!token) return;
    api
      .listSellerOrders(token)
      .then((data) => setOrders(data.results || data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function advance(order) {
    const status = selected[order.id];
    if (!status) return;
    setAdvancing(order.id);
    try {
      await api.setOrderStatus(order.id, status, token);
      toast.success(`Order #${order.id} set to ${status}`);
      const refreshed = await api.listSellerOrders(token);
      setOrders(refreshed.results || refreshed || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdvancing(null);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Supplier Orders</h1>

      {error && (
        <p className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </p>
      )}

      {orders.length === 0 ? (
        <p className="text-slate-400 py-8 text-center">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold">Order #{o.id}</h2>
                  <StatusBadge status={o.status}>{o.status}</StatusBadge>
                </div>
                <span className="text-sm text-slate-500">
                  Buyer: {o.buyer_name || o.buyer || "—"}
                </span>
              </div>

              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="py-2 px-3 font-medium">Item</th>
                      <th className="py-2 px-3 font-medium">Qty</th>
                      <th className="py-2 px-3 font-medium">Price</th>
                      <th className="py-2 px-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(o.items || []).map((it, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3">
                          {it.name || it.excipient_name || `Item #${it.id || i}`}
                        </td>
                        <td className="py-2 px-3">{it.quantity}</td>
                        <td className="py-2 px-3">{it.unit_price || "—"}</td>
                        <td className="py-2 px-3">{it.total || "—"}</td>
                      </tr>
                    ))}
                    {(!o.items || o.items.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-2 px-3 text-slate-400">
                          No item details.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  className="input w-auto"
                  value={selected[o.id] || ""}
                  onChange={(e) =>
                    setSelected({ ...selected, [o.id]: e.target.value })
                  }
                >
                  <option value="">Advance status…</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => advance(o)}
                  disabled={!selected[o.id] || advancing === o.id}
                  className="btn-primary"
                >
                  {advancing === o.id ? "Updating…" : "Update"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
