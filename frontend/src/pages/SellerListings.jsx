import { useState, useEffect } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function SellerListings() {
  const { token } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .listMyExcipients(token)
      .then((data) => setListings(data.results || data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  function startEdit(listing) {
    setEditingId(listing.id);
    setEditForm({
      unit_price: listing.unit_price,
      stock_quantity: listing.stock_quantity,
      grade: listing.grade || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function handleSave(id) {
    setSaving(true);
    setError("");
    try {
      await api.updateExcipient(id, editForm, token);
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...editForm } : l))
      );
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Listings</h1>

      {error && (
        <p className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </p>
      )}

      {listings.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500 mb-4">No listings yet.</p>
          <a href="/" className="text-accent-600 hover:text-accent-700">
            Create one from the catalog page
          </a>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Grade</th>
                <th className="pb-3 font-medium">Price/kg</th>
                <th className="pb-3 font-medium">Stock</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{l.name}</td>
                  <td className="py-3 text-slate-500">{l.category}</td>
                  <td className="py-3">
                    {editingId === l.id ? (
                      <input
                        type="text"
                        value={editForm.grade}
                        onChange={(e) =>
                          setEditForm({ ...editForm, grade: e.target.value })
                        }
                        className="input w-24 py-1 text-sm"
                      />
                    ) : (
                      l.grade || <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3">
                    {editingId === l.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.unit_price}
                        onChange={(e) =>
                          setEditForm({ ...editForm, unit_price: e.target.value })
                        }
                        className="input w-24 py-1 text-sm"
                      />
                    ) : (
                      l.unit_price
                    )}
                  </td>
                  <td className="py-3">
                    {editingId === l.id ? (
                      <input
                        type="number"
                        value={editForm.stock_quantity}
                        onChange={(e) =>
                          setEditForm({ ...editForm, stock_quantity: e.target.value })
                        }
                        className="input w-20 py-1 text-sm"
                      />
                    ) : (
                      l.stock_quantity
                    )}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={l.is_active ? "confirmed" : "cancelled"}>
                      {l.is_active ? "Active" : "Inactive"}
                    </StatusBadge>
                  </td>
                  <td className="py-3">
                    {editingId === l.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(l.id)}
                          disabled={saving}
                          className="text-green-600 hover:text-green-700 text-sm font-medium disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-slate-500 hover:text-slate-700 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(l)}
                        className="text-accent-600 hover:text-accent-700 text-sm"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
