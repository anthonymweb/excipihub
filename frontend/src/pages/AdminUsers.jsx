import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Table } from "../components/UI.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const norm = (d) => (Array.isArray(d) ? d : (d?.results || []));

export default function AdminUsers() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.is_staff) return;
    setLoading(true);
    setError("");
    const roleParam = role === "all" ? undefined : role;
    api
      .adminUsers(roleParam, token)
      .then((res) => setUsers(norm(res)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, token, role]);

  if (!user?.is_staff) {
    return <div className="card">Admin access required.</div>;
  }

  const columns = [
    { key: "username", label: "Username" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", render: (r) => <StatusBadge status={r.role} /> },
    {
      key: "verification_status",
      label: "Verification",
      render: (r) => <StatusBadge status={r.verification_status} />,
    },
    { key: "is_staff", label: "Staff", render: (r) => (r.is_staff ? "Yes" : "No") },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="input max-w-xs"
        >
          <option value="all">All roles</option>
          <option value="scientist">Scientist</option>
          <option value="manufacturer">Manufacturer</option>
          <option value="distributor">Distributor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {error && (
        <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</p>
      )}
      {loading ? <LoadingSpinner /> : <Table columns={columns} data={users} />}
    </div>
  );
}
