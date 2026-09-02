import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Table } from "../components/UI.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Modal from "../components/Modal.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const norm = (d) => (Array.isArray(d) ? d : (d?.results || []));

export default function AdminDisputes() {
  const { user, token } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [outcome, setOutcome] = useState("buyer");
  const [resolution, setResolution] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!user?.is_staff) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.adminDisputes(token);
      setDisputes(norm(res));
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

  async function handleResolve() {
    if (!resolution.trim()) {
      setError("Resolution text is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.adminResolveDispute(selected.id, outcome, resolution, token);
      await load();
      setSelected(null);
      setResolution("");
      setOutcome("buyer");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!user?.is_staff) {
    return <div className="card">Admin access required.</div>;
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "order_id", label: "Order", render: (r) => r.order?.toString().slice(0, 8) || r.order_id },
    { key: "raised_by_name", label: "Raised By" },
    { key: "reason", label: "Reason" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "outcome", label: "Outcome" },
    {
      key: "actions",
      label: "Actions",
      render: (r) =>
        r.status !== "resolved" ? (
          <button
            onClick={() => {
              setSelected(r);
              setOutcome("buyer");
              setResolution("");
            }}
            className="btn-primary"
          >
            Resolve
          </button>
        ) : (
          <span className="text-slate-400">Resolved</span>
        ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Disputes</h1>
      {error && (
        <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</p>
      )}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <Table columns={columns} data={disputes} />
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Resolve Dispute"
      >
        {selected && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Order: {selected.order?.toString().slice(0, 8) || selected.order_id}
            </p>
            <div>
              <label className="label">Outcome</label>
              <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className="input">
                <option value="buyer">Buyer wins</option>
                <option value="seller">Seller wins</option>
              </select>
            </div>
            <div>
              <label className="label">Resolution</label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="input"
                rows={4}
                placeholder="Explain the resolution..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setSelected(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleResolve} disabled={busy} className="btn-primary disabled:opacity-50">
                Resolve
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
