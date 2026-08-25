import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api.getExcipient(id).then(setProduct).finally(() => setLoading(false));
  }, [id]);

  function handleAddToCart() {
    for (let i = 0; i < quantity; i++) addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (loading) return <LoadingSpinner />;
  if (!product) return <div className="card text-center py-12">Product not found</div>;

  const isSeller = user?.role === "manufacturer" || user?.role === "distributor";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="text-accent-600 hover:text-accent-700 text-sm mb-4 inline-block">
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
            <h3 className="font-semibold mb-2">Supplier</h3>
            <p className="text-slate-600">{product.seller_name || "Unknown seller"}</p>
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
                {added ? "Added!" : product.stock_quantity === 0 ? "Out of stock" : "Add to cart"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
