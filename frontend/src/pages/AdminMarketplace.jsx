import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Tabs, Table, StatusIndicator } from "../components/UI.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const norm = (d) => (Array.isArray(d) ? d : (d?.results || []));

export default function AdminMarketplace() {
  const { user, token } = useAuth();
  const [active, setActive] = useState("products");
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!user?.is_staff) return;
    setLoading(true);
    setError("");
    try {
      const [prodRes, batchRes] = await Promise.all([
        api.listExcipients({}),
        api.listBatches({}),
      ]);
      setProducts(norm(prodRes));
      setBatches(norm(batchRes));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  if (!user?.is_staff) {
    return <div className="card">Admin access required.</div>;
  }

  const productCols = [
    { key: "name", label: "Name" },
    { key: "category", label: "Category" },
    { key: "grade", label: "Grade" },
    { key: "seller_name", label: "Seller" },
    { key: "unit_price", label: "Unit Price" },
    { key: "stock_quantity", label: "Stock" },
    {
      key: "is_active",
      label: "Active",
      render: (r) =>
        r.is_active ? (
          <StatusIndicator status="active" positive />
        ) : (
          <StatusIndicator status="inactive" neutral />
        ),
    },
  ];

  const batchCols = [
    { key: "batch_number", label: "Batch #" },
    { key: "excipient", label: "Excipient ID", render: (r) => r.excipient },
    { key: "quantity", label: "Quantity" },
    { key: "status", label: "Status", render: (r) => <StatusIndicator status={r.status} neutral /> },
    { key: "expiry_date", label: "Expiry" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Marketplace</h1>
      {error && (
        <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</p>
      )}
      <Tabs
        active={active}
        onChange={setActive}
        tabs={[
          { key: "products", label: "Products", count: products.length },
          { key: "batches", label: "Batches", count: batches.length },
        ]}
      />
      {loading ? (
        <LoadingSpinner />
      ) : active === "products" ? (
        <Table columns={productCols} data={products} />
      ) : (
        <Table columns={batchCols} data={batches} />
      )}
    </div>
  );
}
