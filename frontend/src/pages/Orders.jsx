import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import OrderTimeline from "../components/OrderTimeline.jsx";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [disputeReason, setDisputeReason] = useState("");
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [message, setMessage] = useState("");
  const { token } = useAuth();

  useEffect(() => {
    api.listOrders(token).then(setOrders);
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

  return (
    <div>
      <h2>My orders</h2>
      {message && <p className="muted">{message}</p>}
      {orders.length === 0 && <p className="muted">No orders yet.</p>}
      {orders.map((o) => (
        <Link
          to={`/orders/${o.id}`}
          key={o.id}
          className="card block hover:shadow-md transition-shadow mb-4"
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
        </Link>
      ))}
    </div>
  );
}
