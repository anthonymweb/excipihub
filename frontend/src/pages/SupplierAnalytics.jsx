import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { StatCard, Table } from "../components/UI.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function SupplierAnalytics() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    products: [],
    batches: [],
    orders: [],
  });

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.listExcipients({ my: true }).catch(() => []),
      api.listBatches({ my: true }).catch(() => []),
      api.listSellerOrders(token).catch(() => []),
    ])
      .then(([p, b, o]) => {
        setData({
          products: p.results || p || [],
          batches: b.results || b || [],
          orders: o.results || o || [],
        });
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingSpinner />;

  const revenue = data.orders.reduce(
    (sum, o) => sum + (parseFloat(o.total_amount) || 0),
    0
  );

  const byStock = [...data.products]
    .sort(
      (a, b) =>
        (parseFloat(b.stock_quantity) || 0) -
        (parseFloat(a.stock_quantity) || 0)
    )
    .slice(0, 5);

  const productName = Object.fromEntries(
    data.products.map((p) => [p.id, p.name])
  );

  const columns = [
    { key: "name", label: "Product" },
    {
      key: "stock_quantity",
      label: "Stock",
      render: (r) => parseFloat(r.stock_quantity) || 0,
    },
    {
      key: "unit_price",
      label: "Unit Price",
      render: (r) => r.unit_price || "—",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Supplier Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Products" value={data.products.length} accent />
        <StatCard label="Total Batches" value={data.batches.length} />
        <StatCard label="Total Orders" value={data.orders.length} />
        <StatCard
          label="Revenue"
          value={`$${revenue.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}`}
        />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Top Products by Stock</h2>
        <Table columns={columns} data={byStock} empty="No products yet." />
      </div>
    </div>
  );
}
