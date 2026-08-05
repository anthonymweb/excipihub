import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

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
      await api.raiseOrderDispute(orderId, { reason: disputeReason });
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
        <div className="card" key={o.id}>
          <p>
            <strong>Order {o.id.slice(0, 8)}</strong> — {o.status}
          </p>
          <ul>
            {o.items.map((item) => (
              <li key={item.id}>
                {item.quantity} x {item.excipient_name} @ {item.unit_price_at_purchase}
                {item.batch_number && <div>Batch: {item.batch_number}</div>}
                {item.coa_url && (
                  <div>
                    COA: <a href={item.coa_url} target="_blank" rel="noreferrer">Download</a>
                  </div>
                )}
                {item.sds_url && (
                  <div>
                    SDS: <a href={item.sds_url} target="_blank" rel="noreferrer">Download</a>
                  </div>
                )}
                {item.tracking_number && <div>Tracking: {item.tracking_number}</div>}
                {item.shipped_at && <div>Shipped at: {new Date(item.shipped_at).toLocaleString()}</div>}
              </li>
            ))}
          </ul>
          <p>Total: {o.total_amount}</p>
          <p className="muted">Delivery address ID: {o.delivery_address}</p>
          {o.has_active_dispute ? (
            <p className="muted">A dispute is already open for this order.</p>
          ) : o.status !== "delivered" ? (
            <div>
              <label>Dispute reason</label>
              <textarea
                value={activeOrderId === o.id ? disputeReason : ""}
                onChange={(e) => {
                  setActiveOrderId(o.id);
                  setDisputeReason(e.target.value);
                }}
              />
              <button onClick={() => handleRaiseDispute(o.id)}>Raise dispute</button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
