import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Drawer, EmptyState, ConfirmDialog } from "../components/UI.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { useToast } from "../components/Toast.jsx";

export default function FormulationKits() {
  const { token } = useAuth();
  const toast = useToast();
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [availLoading, setAvailLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  function load() {
    if (!token) return;
    setLoading(true);
    api
      .listFormulationKits(token)
      .then((data) => setKits(data.results || data || []))
      .catch(() => toast.error("Failed to load formulation kits"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [token]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.createFormulationKit({ name, description, items: [] }, token);
      toast.success("Kit created");
      setName("");
      setDescription("");
      load();
    } catch {
      toast.error("Failed to create kit");
    }
  }

  async function handleAvailability(id) {
    setDrawerOpen(true);
    setAvailLoading(true);
    setAvailability(null);
    try {
      const data = await api.kitAvailability(id, token);
      setAvailability(data);
    } catch {
      toast.error("Failed to check availability");
    } finally {
      setAvailLoading(false);
    }
  }

  async function handleDelete() {
    try {
      await api.deleteFormulationKit(deleteId, token);
      toast.success("Kit deleted");
      setDeleteId(null);
      load();
    } catch {
      toast.error("Failed to delete kit");
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Formulation Kits</h1>

      <form onSubmit={handleCreate} className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">New kit</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tablet base v1"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <input
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
        </div>
        <button type="submit" className="btn-primary mt-4">
          Create kit
        </button>
      </form>

      {kits.length === 0 ? (
        <EmptyState title="No formulation kits" message="Create a kit above to get started." />
      ) : (
        <div className="space-y-3">
          {kits.map((k) => (
            <div key={k.id} className="card flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">{k.name}</h3>
                {k.description && (
                  <p className="text-sm text-slate-500">{k.description}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  {(k.items ? k.items.length : k.item_count || 0)} ingredients
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAvailability(k.id)}
                  className="btn-secondary"
                >
                  Check availability
                </button>
                <button onClick={() => setDeleteId(k.id)} className="btn-danger">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Kit Availability"
      >
        {availLoading ? (
          <LoadingSpinner />
        ) : availability ? (
          <div>
            <p className="text-lg font-semibold text-slate-800">
              {availability.available_count ?? 0} /{" "}
              {availability.total_count ?? 0} available
            </p>
            {availability.matches && availability.matches.length > 0 ? (
              <div className="mt-4 space-y-2">
                {availability.matches.map((m, i) => (
                  <div
                    key={i}
                    className="border border-slate-100 rounded-lg p-3 text-sm"
                  >
                    <p className="font-medium text-slate-800">{m.name || m.ingredient}</p>
                    <p className="text-slate-500">
                      {m.supplier_count != null
                        ? `${m.supplier_count} supplier(s)`
                        : m.supplier || "No supplier matches"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 mt-2">
                No supplier matches found.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No availability data.</p>
        )}
      </Drawer>

      <ConfirmDialog
        open={deleteId != null}
        title="Delete kit"
        message="Are you sure you want to delete this formulation kit? This cannot be undone."
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
