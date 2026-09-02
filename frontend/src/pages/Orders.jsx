import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import OrderTimeline from "../components/OrderTimeline.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disputeReason, setDisputeReason] = useState("");
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [message, setMessage] = useState("");
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.listOrders(token)
      .then((data) => setOrders(data.results || data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function handleRaiseDispute(orderId) {
    if (!disputeReason.trim()) {
      setMessage("Please enter a reason before raising a dispute.");
      return;
    }
    setMessage("");
    try {
      await api.raiseOrderDispute(orderId, { reason: disputeReason }, token);
      setMessage("Dispute raised successfully. Admin will review it.");
      setDisputeReason("");
      setActiveOrderId(null);
    } catch (err) {
      setMessage(err.message || "Unable to raise dispute.");
    }
  }

  async function handlePay(orderId) {
    try {
      const updated = await api.payOrder(orderId, token);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      setMessage("Payment successful — order confirmed.");
    } catch (err) {
      setMessage(err.message || "Payment failed.");
    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      {message && <p className="text-green-600 text-sm mb-4">{message}</p>}
      {orders.length === 0 && (
        <p className="text-center text-slate-500 py-12">No orders yet.</p>
      )}
      <div className="space-y-4">
        {orders.map((o) => (
          <Link
            to={`/orders/${o.id}`}
            key={o.id}
            className="card block hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <p className="font-semibold text-lg">Order {o.id.slice(0, 8)}</p>
              <StatusBadge status={o.status}>
                {o.status?.replace(/_/g, " ")}
              </StatusBadge>
            </div>
            <OrderTimeline status={o.status} />
            <div className="mt-3 space-y-1">
              {o.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    {item.quantity} x {item.excipient_name}
                  </span>
                  <span className="text-slate-500">{item.unit_price_at_purchase}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t font-bold text-sm">
              <span>Total</span>
              <span className="text-accent-700">{o.total_amount}</span>
            </div>
            {o.status === "pending_payment" && (
              <div className="mt-3 pt-3 border-t">
                <button
                  className="btn-primary text-sm"
                  onClick={(e) => { e.preventDefault(); handlePay(o.id); }}
                >
                  Pay now
                </button>
              </div>
            )}
            {o.status !== "delivered" && o.status !== "cancelled" && (
              <div className="mt-3 pt-3 border-t">
                {activeOrderId === o.id ? (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <textarea
                      className="input"
                      rows={2}
                      placeholder="Reason for dispute..."
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        className="btn-danger text-sm"
                        onClick={() => handleRaiseDispute(o.id)}
                      >
                        Submit
                      </button>
                      <button
                        className="btn-secondary text-sm"
                        onClick={() => { setActiveOrderId(null); setDisputeReason(""); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="text-sm text-red-600 hover:underline"
                    onClick={(e) => { e.preventDefault(); setActiveOrderId(o.id); }}
                  >
                    Raise dispute
                  </button>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
