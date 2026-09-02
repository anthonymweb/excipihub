import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { StatCard, EmptyState } from "../components/UI.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function BuyerDashboard() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [saved, setSaved] = useState([]);
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      api.listOrders(token),
      api.listRFQs({}),
      api.listSavedProducts(token),
      api.listFormulationKits(token),
    ])
      .then(([o, r, s, k]) => {
        setOrders(o.results || o || []);
        setRfqs(r.results || r || []);
        setSaved(s.results || s || []);
        setKits(k.results || k || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const completedStatuses = ["completed", "cancelled"];
  const activeOrders = orders.filter((o) => !completedStatuses.includes(o.status));
  const completedOrders = orders.filter((o) => o.status === "completed");
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">
        Welcome back, {user?.username || "Buyer"}
      </h1>
      <p className="text-slate-500 mb-6">Here's what's happening with your account.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Orders" value={activeOrders.length} accent />
        <StatCard label="Pending RFQs" value={rfqs.length} />
        <StatCard label="Saved Items" value={saved.length} />
        <StatCard label="Completed Orders" value={completedOrders.length} />
      </div>

      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <EmptyState title="No orders yet" message="When you place orders they'll show up here." />
        ) : (
          <div className="space-y-3">
            {recentOrders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between border border-slate-100 rounded-lg p-4 hover:bg-slate-50"
              >
                <div>
                  <Link
                    to={`/orders/${o.id}`}
                    className="font-medium text-accent-700 hover:underline"
                  >
                    #{String(o.id).slice(0, 8)}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {o.total_amount != null
                      ? `$${Number(o.total_amount).toFixed(2)}`
                      : "—"}
                  </p>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Saved Formulations</h2>
          <Link to="/formulation-kits" className="text-sm text-accent-700 hover:underline">
            View all
          </Link>
        </div>
        {kits.length === 0 ? (
          <EmptyState
            title="No formulation kits"
            message="Create kits to group ingredients for your formulations."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {kits.map((k) => (
              <Link
                key={k.id}
                to="/formulation-kits"
                className="block border border-slate-100 rounded-lg p-4 hover:bg-slate-50"
              >
                <p className="font-medium text-slate-800">{k.name}</p>
                <p className="text-sm text-slate-500">
                  {(k.items ? k.items.length : k.item_count || 0)} ingredients
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
