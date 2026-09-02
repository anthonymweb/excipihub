import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Table } from "../components/UI.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const norm = (d) => (Array.isArray(d) ? d : (d?.results || []));

export default function AdminAuditLogs() {
  const { user, token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.is_staff) return;
    setLoading(true);
    setError("");
    api
      .adminAuditLogs(token)
      .then((res) => setLogs(norm(res)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, token]);

  if (!user?.is_staff) {
    return <div className="card">Admin access required.</div>;
  }

  const columns = [
    { key: "created_at", label: "Created" },
    { key: "actor_name", label: "Actor" },
    { key: "action", label: "Action" },
    { key: "object_type", label: "Object Type" },
    { key: "object_id", label: "Object ID" },
    {
      key: "details",
      label: "Details",
      render: (r) => (
        <span className="text-xs break-all">
          {r.details ? JSON.stringify(r.details) : "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Audit Logs</h1>
      {error && (
        <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</p>
      )}
      {loading ? <LoadingSpinner /> : <Table columns={columns} data={logs} />}
    </div>
  );
}
