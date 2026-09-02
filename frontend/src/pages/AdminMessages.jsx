import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Table } from "../components/UI.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const norm = (d) => (Array.isArray(d) ? d : (d?.results || []));

export default function AdminMessages() {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.is_staff) return;
    setLoading(true);
    setError("");
    api
      .listMessages(token)
      .then((res) => setMessages(norm(res)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, token]);

  if (!user?.is_staff) {
    return <div className="card">Admin access required.</div>;
  }

  const columns = [
    { key: "sender_name", label: "Sender" },
    { key: "recipient_name", label: "Recipient" },
    { key: "subject", label: "Subject" },
    {
      key: "body",
      label: "Body",
      render: (r) => (r.body ? r.body.slice(0, 80) + (r.body.length > 80 ? "..." : "") : "-"),
    },
    { key: "created_at", label: "Created" },
    { key: "is_read", label: "Read", render: (r) => (r.is_read ? "Yes" : "No") },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <p className="text-sm text-slate-500 mb-4">Read-only view of platform messages.</p>
      {error && (
        <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</p>
      )}
      {loading ? <LoadingSpinner /> : <Table columns={columns} data={messages} />}
    </div>
  );
}
