import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    api.listOrders(token).then(setOrders);
  }, [token]);

  return (
    <div>
      <h2>My orders</h2>
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
              </li>
            ))}
          </ul>
          <p>Total: {o.total_amount}</p>
        </div>
      ))}
    </div>
  );
}
