import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { StatCard, StatusIndicator } from "../components/UI.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const DONE = ["completed", "cancelled", "delivered"];

export default function SupplierDashboard() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    sales: 0,
    pendingOrders: 0,
    lowStock: 0,
    openRFQs: 0,
    rating: "4.7",
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.listSellerOrders(token).catch(() => []),
      api.listExcipients({ my: true }).catch(() => []),
      api.listRFQs({}).catch(() => []),
    ])
      .then(([orders, products, rfqs]) => {
        const orderList = orders.results || orders || [];
        const productList = products.results || products || [];
        const rfqList = rfqs.results || rfqs || [];

        const sales = orderList.reduce(
          (sum, o) => sum + (parseFloat(o.total_amount) || 0),
          0
        );
        const pendingOrders = orderList.filter(
          (o) => !DONE.includes(o.status)
        ).length;
        const lowStock = productList.filter(
          (p) => (parseFloat(p.stock_quantity) || 0) < 20
        ).length;

        setStats({
          sales: `$${sales.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}`,
          pendingOrders,
          lowStock,
          openRFQs: rfqList.length,
          rating: "4.7",
        });
        setRecentOrders(orderList.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {user?.company_name || "Supplier"} Dashboard
        </h1>
        <StatusIndicator
          status={user?.verification_status || "pending"}
          positive={user?.verification_status === "verified"}
          negative={user?.verification_status === "rejected"}
          neutral={user?.verification_status === "pending"}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Sales (orders)" value={stats.sales} accent />
        <StatCard label="Pending Orders" value={stats.pendingOrders} />
        <StatCard label="Low-stock Products" value={stats.lowStock} />
        <StatCard label="Open RFQs" value={stats.openRFQs} />
        <StatCard label="Avg. Rating" value={stats.rating} />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Link to="/seller/orders" className="text-accent-600 hover:text-accent-700 text-sm">
            View all
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-slate-400 py-6 text-center">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-3 font-medium">Order</th>
                  <th className="py-3 px-3 font-medium">Buyer</th>
                  <th className="py-3 px-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-medium">#{o.id}</td>
                    <td className="py-3 px-3 text-slate-700">
                      {o.buyer_name || o.buyer || "—"}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={o.status}>{o.status}</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
