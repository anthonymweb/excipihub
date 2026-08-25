import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import OrderTimeline from "../components/OrderTimeline.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function OrderDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api
      .listOrders(token)
      .then((orders) => {
        const found = orders.find((o) => o.id === id);
        setOrder(found || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, token]);

  async function handleCancelOrder() {
    try {
      await api.raiseOrderDispute(order.id, { reason: "Cancelled by buyer" }, token);
      setOrder((prev) => ({ ...prev, status: "cancelled" }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleConfirmDelivery() {
    try {
      await api.confirmDelivery(id, token);
      setOrder((prev) => ({ ...prev, status: "delivered" }));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!order)
    return (
      <div className="card text-center py-12">
        <p className="text-slate-500 mb-4">Order not found.</p>
        <Link to="/orders" className="text-accent-600 hover:text-accent-700">
          Back to orders
        </Link>
      </div>
    );

  const canCancel = order.status === "confirmed" || order.status === "preparing";
  const canConfirm = order.status === "out_for_delivery";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/orders"
        className="text-accent-600 hover:text-accent-700 text-sm mb-4 inline-block"
      >
        &larr; Back to orders
      </Link>

      {error && (
        <p className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </p>
      )}

      <div className="card mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">Order {order.id?.slice(0, 8)}</h1>
            <p className="text-slate-500 text-sm">
              Placed on {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          <StatusBadge status={order.status}>
            {order.status?.replace(/_/g, " ")}
          </StatusBadge>
        </div>
        <OrderTimeline status={order.status} />
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold mb-3">Items</h2>
        {order.items?.map((item) => (
          <div key={item.id} className="flex justify-between py-2 border-b last:border-0">
            <div>
              <p className="font-medium">
                {item.excipient_name || `Excipient ${item.excipient?.slice(0, 8)}`}
              </p>
              <p className="text-sm text-slate-500">
                {item.quantity} x {item.unit_price_at_purchase}
              </p>
              {item.batch_number && (
                <p className="text-xs text-slate-400">Batch: {item.batch_number}</p>
              )}
            </div>
            <div className="text-right">
              {item.coa_url && (
                <a
                  href={item.coa_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-accent-600 block"
                >
                  CoA
                </a>
              )}
              {item.sds_url && (
                <a
                  href={item.sds_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-accent-600 block"
                >
                  SDS
                </a>
              )}
              {item.tracking_number && (
                <p className="text-xs text-slate-400">Track: {item.tracking_number}</p>
              )}
            </div>
          </div>
        ))}
        <div className="flex justify-between mt-4 pt-3 border-t font-bold">
          <span>Total</span>
          <span className="text-accent-700">{order.total_amount}</span>
        </div>
      </div>

      {order.delivery_address && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-2">Delivery Address</h2>
          <p className="text-slate-600">{order.delivery_address}</p>
        </div>
      )}

      <div className="flex gap-4">
        {canCancel && (
          <button
            onClick={handleCancelOrder}
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Cancel Order
          </button>
        )}
        {canConfirm && (
          <button onClick={handleConfirmDelivery} className="btn-primary px-6 py-3">
            Mark as Received
          </button>
        )}
      </div>
    </div>
  );
}
