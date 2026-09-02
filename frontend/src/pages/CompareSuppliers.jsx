import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { Table } from "../components/UI.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function CompareSuppliers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const toast = useToast();

  const ingredient = searchParams.get("ingredient") || "";
  const [input, setInput] = useState(ingredient);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSeller = user?.role === "manufacturer" || user?.role === "distributor";

  useEffect(() => {
    setInput(ingredient);
    if (!ingredient) return;
    setLoading(true);
    setError("");
    api
      .listExcipients({ search: ingredient })
      .then((data) => setResults(data.results || data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [ingredient]);

  function handleSearch(e) {
    const name = input.trim();
    if (!name) return;
    setSearchParams({ ingredient: name });
  }

  function handleAddToCart(exc) {
    if (isSeller) return;
    addItem(exc);
    toast.success(`Added ${exc.name} to cart`);
  }

  const columns = [
    {
      key: "seller_name",
      label: "Supplier",
      render: (exc) => (
        <div>
          <p className="font-medium text-slate-800">{exc.seller_name || "Unknown"}</p>
          <Link to={`/supplier/${exc.seller}`} className="text-xs text-accent-600 hover:underline">
            View supplier
          </Link>
        </div>
      ),
    },
    { key: "unit_price", label: "Price / unit", render: (exc) => `${exc.unit_price} / ${exc.unit}` },
    { key: "moq", label: "MOQ", render: (exc) => `${exc.stock_quantity} ${exc.unit}` },
    { key: "stock", label: "Stock" },
    { key: "grade", label: "Grade", render: (exc) => exc.grade || "—" },
    { key: "lead_time_days", label: "Lead time", render: (exc) => (exc.lead_time_days ? `${exc.lead_time_days} days` : "—") },
    {
      key: "verified",
      label: "Verified",
      render: (exc) =>
        exc.seller_verification_status ? (
          <StatusBadge status={exc.seller_verification_status}>{exc.seller_verification_status}</StatusBadge>
        ) : (
          <span className="badge bg-slate-100 text-slate-600">N/A</span>
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (exc) =>
        !isSeller ? (
          <button
            onClick={() => handleAddToCart(exc)}
            disabled={exc.stock_quantity === 0}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {exc.stock_quantity === 0 ? "Out of stock" : "Add to cart"}
          </button>
        ) : (
          <span className="text-slate-400 text-sm">—</span>
        ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link to="/catalog" className="text-accent-600 hover:text-accent-700 text-sm mb-4 inline-block">
        &larr; Back to catalog
      </Link>
      <h1 className="text-2xl font-bold mb-6">Compare Suppliers</h1>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Enter an ingredient name (e.g. Lactose)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="input flex-1"
          />
          <button onClick={handleSearch} className="btn-primary whitespace-nowrap">
            Compare
          </button>
        </div>
        {ingredient && (
          <p className="text-sm text-slate-500 mt-3">
            Comparing suppliers for <span className="font-medium text-slate-700">{ingredient}</span>
          </p>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : ingredient ? (
        results.length === 0 ? (
          <p className="card text-center text-slate-500 py-12">
            No suppliers found for "{ingredient}".
          </p>
        ) : (
          <div className="card">
            <Table columns={columns} data={results} />
          </div>
        )
      ) : (
        <p className="card text-center text-slate-500 py-12">
          Type an ingredient name above to compare suppliers side by side.
        </p>
      )}
    </div>
  );
}
