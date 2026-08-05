import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function SellerOrders() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const { user, token } = useAuth();

  useEffect(() => {
    if (!token) return;
    api.listSellerOrderItems(token)
      .then(setItems)
      .catch((err) => setError(err.message));
  }, [token]);

  async function handleUpdate(id, payload) {
    setError("");
    try {
      const updated = await api.updateSellerOrderItem(id, payload, token);
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user) {
    return <p className="muted">Loading seller orders...</p>;
  }

  return (
    <div>
      <h2>Seller order items</h2>
      {error && <p className="error">{error}</p>}
      {items.length === 0 && <p className="muted">No order items for your listings yet.</p>}
      {items.map((item) => (
        <div className="card" key={item.id}>
          <p>
            <strong>Order {item.order_id.slice(0, 8)}</strong> — {item.order_status}
          </p>
          <p>Buyer: {item.buyer_name}</p>
          <p>
            {item.quantity} x {item.excipient_name} @ {item.unit_price_at_purchase}
          </p>
          <label>Batch number</label>
          <input
            value={item.batch_number ?? ""}
            onChange={(e) =>
              setItems((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, batch_number: e.target.value } : i))
              )
            }
          />
          <label>COA URL</label>
          <input
            value={item.coa_url ?? ""}
            onChange={(e) =>
              setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, coa_url: e.target.value } : i)))
            }
            type="url"
          />
          <label>SDS URL</label>
          <input
            value={item.sds_url ?? ""}
            onChange={(e) =>
              setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, sds_url: e.target.value } : i)))
            }
            type="url"
          />
          <label>Tracking number</label>
          <input
            value={item.tracking_number ?? ""}
            onChange={(e) =>
              setItems((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, tracking_number: e.target.value } : i))
              )
            }
          />
          <button
            onClick={() =>
              handleUpdate(item.id, {
                batch_number: item.batch_number,
                coa_url: item.coa_url,
                sds_url: item.sds_url,
                tracking_number: item.tracking_number,
              })
            }
          >
            Save item details
          </button>
        </div>
      ))}
    </div>
  );
}
