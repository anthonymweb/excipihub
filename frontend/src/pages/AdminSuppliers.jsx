import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Tabs, Table, StatusIndicator } from "../components/UI.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const norm = (d) => (Array.isArray(d) ? d : (d?.results || []));

export default function AdminSuppliers() {
  const { user, token } = useAuth();
  const [active, setActive] = useState("pending");
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!user?.is_staff) return;
    setLoading(true);
    setError("");
    try {
      const [pendingRes, manufacturers, distributors] = await Promise.all([
        api.adminPendingSellers(token),
        api.adminUsers("manufacturer", token),
        api.adminUsers("distributor", token),
      ]);
      const pend = norm(pendingRes);
      const all = [...norm(manufacturers), ...norm(distributors)];
      setPending(pend);
      setApproved(all.filter((u) => u.verification_status === "verified"));
      setRejected(all.filter((u) => u.verification_status === "rejected"));
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

  async function handleVerify(id, action) {
    setError("");
    try {
      await api.adminVerifySeller(id, action, token);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user?.is_staff) {
    return <div className="card">Admin access required.</div>;
  }

  const pendingCols = [
    { key: "company_name", label: "Company", render: (r) => r.company_name || r.username || r.email },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", render: (r) => <StatusBadge status={r.role} /> },
    {
      key: "verification_status",
      label: "Status",
      render: (r) => (
        <StatusIndicator status={r.verification_status} neutral />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div className="flex gap-2">
          <button onClick={() => handleVerify(r.id, "approve")} className="btn-primary">Approve</button>
          <button onClick={() => handleVerify(r.id, "reject")} className="btn-danger">Reject</button>
        </div>
      ),
    },
  ];

  const verifiedCols = [
    { key: "company_name", label: "Company", render: (r) => r.company_name || r.username || r.email },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", render: (r) => <StatusBadge status={r.role} /> },
    {
      key: "verification_status",
      label: "Status",
      render: (r) => <StatusIndicator status="verified" positive />,
    },
  ];

  const rejectedCols = [
    { key: "company_name", label: "Company", render: (r) => r.company_name || r.username || r.email },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", render: (r) => <StatusBadge status={r.role} /> },
    {
      key: "verification_status",
      label: "Status",
      render: (r) => <StatusIndicator status="rejected" negative />,
    },
  ];

  const data =
    active === "pending" ? pending : active === "approved" ? approved : rejected;
  const cols =
    active === "pending" ? pendingCols : active === "approved" ? verifiedCols : rejectedCols;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Suppliers</h1>
      {error && (
        <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</p>
      )}
      <Tabs
        active={active}
        onChange={setActive}
        tabs={[
          { key: "pending", label: "Pending", count: pending.length },
          { key: "approved", label: "Approved", count: approved.length },
          { key: "rejected", label: "Rejected", count: rejected.length },
        ]}
      />
      {loading ? <LoadingSpinner /> : <Table columns={cols} data={data} />}
    </div>
  );
}
