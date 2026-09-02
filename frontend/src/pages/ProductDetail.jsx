import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../components/Toast.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { Table, StatusIndicator } from "../components/UI.jsx";

export default function ProductDetail() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const { addItem } = useCart();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [batches, setBatches] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getExcipient(id).then(setProduct).finally(() => setLoading(false));
    api
      .listBatches({ excipient: id })
      .then((data) => setBatches(data.results || data || []))
      .catch(() => setBatches([]));
    api
      .listDocuments({ product: id })
      .then((data) => setDocuments(data.results || data || []))
      .catch(() => setDocuments([]));
    if (token) {
      api
        .listSavedProducts(token)
        .then((data) => {
          const savedList = data.results || data || [];
          setSaved(savedList.some((s) => s.excipient === Number(id) || String(s.excipient) === String(id)));
        })
        .catch(() => setSaved(false));
    }
  }, [id, token]);

  function handleAddToCart() {
    for (let i = 0; i < quantity; i++) addItem(product);
    toast.success(`Added ${product.name} × ${quantity} to cart`);
  }

  async function handleSaveToggle() {
    if (!token || user?.role === "manufacturer" || user?.role === "distributor") {
      toast.error("Sign in as a buyer to save products");
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await api.toggleSavedProduct(product.id, token);
      setSaved((prev) => !prev);
      toast.success(saved ? "Removed from saved" : "Saved to your list");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!product) return <div className="card text-center py-12">Product not found</div>;

  const isSeller = user?.role === "manufacturer" || user?.role === "distributor";

  const batchColumns = [
    { key: "batch_number", label: "Batch No." },
    { key: "quantity", label: "Quantity" },
    {
      key: "status",
      label: "Status",
      render: (b) => (
        <StatusIndicator
          status={b.status}
          positive={b.status === "available"}
          negative={b.status === "recalled" || b.status === "quarantined"}
        />
      ),
    },
    { key: "manufacture_date", label: "Manufactured" },
    { key: "expiry_date", label: "Expiry" },
    {
      key: "coa_url",
      label: "CoA",
      render: (b) =>
        b.coa_url ? (
          <a href={b.coa_url} target="_blank" rel="noreferrer" className="text-accent-600 hover:underline">
            View
          </a>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
  ];

  const docColumns = [
    { key: "document_type", label: "Type" },
    {
      key: "status",
      label: "Status",
      render: (d) => <StatusBadge status={d.status}>{d.status}</StatusBadge>,
    },
    {
      key: "file_url",
      label: "File",
      render: (d) =>
        d.file_url ? (
          <a href={d.file_url} target="_blank" rel="noreferrer" className="text-accent-600 hover:underline">
            Download
          </a>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/catalog" className="text-accent-600 hover:text-accent-700 text-sm mb-4 inline-block">
        &larr; Back to catalog
      </Link>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="card">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            {product.grade && <StatusBadge status="verified">{product.grade}</StatusBadge>}
          </div>
          <p className="text-slate-500 mb-2">{product.category}</p>
          {product.description && <p className="text-slate-600 mb-4">{product.description}</p>}
          <div className="space-y-3 mt-6">
            <div className="flex justify-between"><span className="text-slate-500">Unit</span><span className="font-medium">{product.unit}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Price</span><span className="text-xl font-bold text-accent-700">{product.unit_price}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Stock</span><span className="font-medium">{product.stock_quantity} {product.unit}</span></div>
            {product.batch_number && <div className="flex justify-between"><span className="text-slate-500">Batch</span><span className="font-medium">{product.batch_number}</span></div>}
            {product.expiry_date && <div className="flex justify-between"><span className="text-slate-500">Expiry</span><span className="font-medium">{product.expiry_date}</span></div>}
          </div>
          {product.coa_url && (
            <a href={product.coa_url} target="_blank" rel="noreferrer" className="btn-secondary w-full mt-6 text-center block">
              Download CoA
            </a>
          )}
        </div>
        <div>
          <div className="card mb-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold mb-2">Supplier</h3>
                <p className="text-slate-600">{product.seller_name || "Unknown seller"}</p>
              </div>
              {!isSeller && (
                <button
                  onClick={handleSaveToggle}
                  disabled={saving}
                  className={`text-2xl leading-none ${saved ? "text-accent-600" : "text-slate-300 hover:text-accent-500"} disabled:opacity-50`}
                  title={saved ? "Saved" : "Save"}
                >
                  {saved ? "♥" : "♡"}
                </button>
              )}
            </div>
          </div>
          {!isSeller && (
            <div className="card">
              <h3 className="font-semibold mb-4">Add to cart</h3>
              <label className="label">Quantity ({product.unit})</label>
              <input
                type="number"
                min="1"
                max={product.stock_quantity}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="input mb-4"
              />
              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0}
                className="btn-primary w-full disabled:opacity-50"
              >
                {product.stock_quantity === 0 ? "Out of stock" : "Add to cart"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-8">
        <h2 className="text-lg font-semibold mb-4">Pharmaceutical Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex justify-between border-b border-slate-100 py-2">
            <span className="text-slate-500">CAS Number</span>
            <span className="font-medium">{product.cas_number || "—"}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 py-2">
            <span className="text-slate-500">Function</span>
            <span className="font-medium text-right">{product.function || "—"}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 py-2">
            <span className="text-slate-500">Country of Origin</span>
            <span className="font-medium">{product.country_of_origin || "—"}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 py-2">
            <span className="text-slate-500">Lead Time</span>
            <span className="font-medium">{product.lead_time_days ? `${product.lead_time_days} days` : "—"}</span>
          </div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-2 py-2">
            <span className="text-slate-500 mr-1">Certifications</span>
            {(product.certifications && product.certifications.length > 0) ? (
              product.certifications.map((c) => (
                <span key={c} className="badge badge-verified">{c}</span>
              ))
            ) : (
              <span className="text-slate-400">—</span>
            )}
          </div>
        </div>
      </div>

      <div className="card mt-8">
        <h2 className="text-lg font-semibold mb-4">Available Batches</h2>
        {batches.length === 0 ? (
          <p className="text-slate-400 text-sm py-4 text-center">No batches allocated yet.</p>
        ) : (
          <Table columns={batchColumns} data={batches} />
        )}
      </div>

      <div className="card mt-8">
        <h2 className="text-lg font-semibold mb-4">Documentation</h2>
        {documents.length === 0 ? (
          <p className="text-slate-400 text-sm py-4 text-center">No product-level documents uploaded.</p>
        ) : (
          <Table columns={docColumns} data={documents} />
        )}
        <p className="text-xs text-slate-400 mt-4">
          Batch-specific CoA available after batch allocation.
        </p>
      </div>
    </div>
  );
}
