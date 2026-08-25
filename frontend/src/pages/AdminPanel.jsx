import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Modal from "../components/Modal.jsx";

export default function AdminPanel() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("sellers");
  const [pendingSellers, setPendingSellers] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [outcome, setOutcome] = useState("buyer");
  const [resolution, setResolution] = useState("");

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    setLoading(true);
    setError("");
    Promise.all([api.adminPendingSellers(token), api.adminDisputes(token)])
      .then(([sellers, disputesData]) => {
        setPendingSellers(sellers);
        setDisputes(disputesData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, token]);

  async function handleVerifySeller(sellerId, action) {
    setMessage("");
    setError("");
    try {
      await api.adminVerifySeller(sellerId, action, token);
      setPendingSellers((prev) => prev.filter((s) => s.id !== sellerId));
      setMessage(`Seller ${action === "approve" ? "approved" : "rejected"} successfully.`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleResolveDispute() {
    if (!resolution.trim()) {
      setError("Resolution text is required.");
      return;
    }
    setMessage("");
    setError("");
    try {
      await api.adminResolveDispute(selectedDispute.id, outcome, resolution, token);
      setDisputes((prev) =>
        prev.map((d) =>
          d.id === selectedDispute.id ? { ...d, status: "resolved", outcome, resolution } : d
        )
      );
      setDisputeModalOpen(false);
      setSelectedDispute(null);
      setOutcome("buyer");
      setResolution("");
      setMessage("Dispute resolved successfully.");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="muted">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>

      {message && <p className="text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">{message}</p>}
      {error && <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</p>}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("sellers")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "sellers"
              ? "bg-accent-600 text-white"
              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          }`}
        >
          Pending Sellers {pendingSellers.length > 0 && `(${pendingSellers.length})`}
        </button>
        <button
          onClick={() => setActiveTab("disputes")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "disputes"
              ? "bg-accent-600 text-white"
              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          }`}
        >
          Disputes
        </button>
      </div>

      {loading ? (
        <p className="muted">Loading...</p>
      ) : activeTab === "sellers" ? (
        <div>
          {pendingSellers.length === 0 ? (
            <p className="muted">No pending sellers.</p>
          ) : (
            pendingSellers.map((seller) => (
              <div key={seller.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{seller.company_name || seller.email}</h3>
                    <p className="text-slate-600 text-sm">{seller.email}</p>
                    <StatusBadge status={seller.verification_status} />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {seller.business_license_no && (
                    <div><span className="font-medium">License #:</span> {seller.business_license_no}</div>
                  )}
                  {seller.license_url && (
                    <div>
                      <span className="font-medium">License:</span>{" "}
                      <a href={seller.license_url} target="_blank" rel="noreferrer" className="text-accent-600 underline">
                        View
                      </a>
                    </div>
                  )}
                  {seller.gmp_cert_url && (
                    <div>
                      <span className="font-medium">GMP Cert:</span>{" "}
                      <a href={seller.gmp_cert_url} target="_blank" rel="noreferrer" className="text-accent-600 underline">
                        View
                      </a>
                    </div>
                  )}
                  {seller.iso_cert_url && (
                    <div>
                      <span className="font-medium">ISO Cert:</span>{" "}
                      <a href={seller.iso_cert_url} target="_blank" rel="noreferrer" className="text-accent-600 underline">
                        View
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleVerifySeller(seller.id, "approve")}
                    className="px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleVerifySeller(seller.id, "reject")}
                    className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div>
          {disputes.length === 0 ? (
            <p className="muted">No disputes found.</p>
          ) : (
            disputes.map((d) => (
              <div key={d.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">Dispute for Order {d.order?.toString().slice(0, 8)}</h3>
                    <p className="text-slate-600 text-sm mt-1">{d.reason || d.complaint}</p>
                    {d.raised_by_name && (
                      <p className="text-slate-500 text-xs mt-1">Raised by: {d.raised_by_name}</p>
                    )}
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                {d.status !== "resolved" && (
                  <button
                    onClick={() => {
                      setSelectedDispute(d);
                      setOutcome("buyer");
                      setResolution("");
                      setDisputeModalOpen(true);
                    }}
                    className="mt-4 px-4 py-2 rounded-lg font-medium bg-accent-600 text-white hover:bg-accent-700 transition-colors"
                  >
                    Resolve
                  </button>
                )}
                {d.status === "resolved" && d.resolution && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm">
                    <p><strong>Resolution:</strong> {d.resolution}</p>
                    <p><strong>Outcome:</strong> {d.outcome === "buyer" ? "Buyer wins" : "Seller wins"}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <Modal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        title="Resolve Dispute"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Outcome</label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="input"
            >
              <option value="buyer">Buyer wins</option>
              <option value="seller">Seller wins</option>
            </select>
          </div>
          <div>
            <label className="label">Resolution details</label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="input"
              rows={4}
              placeholder="Explain the resolution..."
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDisputeModalOpen(false)}
              className="px-4 py-2 rounded-lg font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleResolveDispute}
              className="px-4 py-2 rounded-lg font-medium bg-accent-600 text-white hover:bg-accent-700 transition-colors"
            >
              Resolve
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
