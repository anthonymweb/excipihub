import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { EmptyState } from "../components/UI.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { useToast } from "../components/Toast.jsx";

export default function SavedItems() {
  const { token } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    if (!token) return;
    setLoading(true);
    api
      .listSavedProducts(token)
      .then((data) => setItems(data.results || data || []))
      .catch(() => toast.error("Failed to load saved items"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [token]);

  async function handleRemove(id) {
    try {
      await api.toggleSavedProduct(id, token);
      toast.success("Removed from saved items");
      load();
    } catch {
      toast.error("Failed to remove item");
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Saved Items</h1>
      {items.length === 0 ? (
        <EmptyState
          title="No saved items"
          message="Browse the catalog and save ingredients to find them here later."
          action={
            <Link to="/catalog" className="btn-primary">
              Browse catalog
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => {
            const id = it.excipient || it.excipient_id;
            return (
              <div key={id} className="card flex flex-col">
                <h3 className="text-lg font-semibold text-slate-800">
                  {it.excipient_name || it.name || "Ingredient"}
                </h3>
                {it.created_at && (
                  <p className="text-sm text-slate-400 mb-4">
                    Saved {new Date(it.created_at).toLocaleDateString()}
                  </p>
                )}
                <div className="mt-auto flex gap-2">
                  <Link to={`/product/${id}`} className="btn-secondary flex-1 text-center">
                    View
                  </Link>
                  <button onClick={() => handleRemove(id)} className="btn-danger flex-1">
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
