import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Table } from "../components/UI.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const norm = (d) => (Array.isArray(d) ? d : (d?.results || []));

export default function AdminDocuments() {
  const { user, token } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  async function load() {
    if (!user?.is_staff) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.listDocuments({ pending: "true" });
      setDocs(norm(res));
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

  async function handleVerify(id) {
    setBusy(id);
    setError("");
    try {
      await api.verifyDocument(id, token);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleReject(id) {
    setBusy(id);
    setError("");
    try {
      await api.rejectDocument(id, token);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  if (!user?.is_staff) {
    return <div className="card">Admin access required.</div>;
  }

  const columns = [
    { key: "document_type", label: "Type" },
    { key: "supplier_name", label: "Supplier" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "uploaded_at", label: "Uploaded", render: (r) => r.uploaded_at || r.created_at },
    {
      key: "file",
      label: "File",
      render: (r) =>
        r.file_url ? (
          <a href={r.file_url} target="_blank" rel="noreferrer" className="text-accent-600 underline">
            View
          </a>
        ) : (
          "-"
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div className="flex gap-2">
          <button
            disabled={busy === r.id}
            onClick={() => handleVerify(r.id)}
            className="btn-primary disabled:opacity-50"
          >
            Verify
          </button>
          <button
            disabled={busy === r.id}
            onClick={() => handleReject(r.id)}
            className="btn-danger disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Documents</h1>
      {error && (
        <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</p>
      )}
      {loading ? <LoadingSpinner /> : <Table columns={columns} data={docs} />}
    </div>
  );
}
