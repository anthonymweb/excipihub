import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import OrderTimeline from "../components/OrderTimeline.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { Drawer } from "../components/UI.jsx";

export default function OrderDetail() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const isBuyer = user?.role === "scientist";
  const canReview = ["delivered", "buyer_confirmed", "completed"].includes(order?.status);

  useEffect(() => {
    if (!token) return;
    api
      .listOrders(token)
      .then((data) => {
        const orders = data.results || data;
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

  async function handleRaiseDispute() {
    if (!disputeReason.trim()) {
      setError("Please provide a reason for the dispute.");
      return;
    }
    setSubmitting(true);
    try {
      await api.raiseOrderDispute(order.id, { reason: disputeReason.trim() }, token);
      setOrder((prev) => ({ ...prev, has_active_dispute: true }));
      setDisputeOpen(false);
      setDisputeReason("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePay() {
    setPaying(true);
    try {
      const updated = await api.payOrder(id, token);
      setOrder(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setPaying(false);
    }
  }

  async function handleSubmitReview() {
    setReviewSubmitting(true);
    try {
      const review = await api.createReview(
        { order: order.id, rating: reviewRating, comment: reviewComment },
        token
      );
      setOrder((prev) => ({ ...prev, review }));
      setReviewOpen(false);
      setReviewComment("");
      setReviewRating(5);
    } catch (err) {
      setError(err.message);
    } finally {
      setReviewSubmitting(false);
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

      <div className="flex gap-4 flex-wrap">
        {order.status === "pending_payment" && (
          <button onClick={handlePay} disabled={paying} className="btn-primary px-6 py-3 disabled:opacity-50">
            {paying ? "Processing..." : `Pay ${order.total_amount}`}
          </button>
        )}
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
        {isBuyer && !order.has_active_dispute && (
          <button
            onClick={() => setDisputeOpen(true)}
            className="btn-danger px-6 py-3"
          >
            Raise Dispute
          </button>
        )}
        {order.has_active_dispute && (
          <span className="badge badge-pending self-center">Dispute in progress</span>
        )}
      </div>

      {canReview && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-3">Your Review</h2>
          {order.review ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-accent-600 font-bold">{order.review.rating}/5</span>
                <span className="text-sm text-slate-400">
                  by {order.review.reviewer_name} ·{" "}
                  {new Date(order.review.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-slate-600">{order.review.comment || "No comment provided."}</p>
            </div>
          ) : reviewOpen ? (
            <div className="space-y-3">
              <div>
                <label className="label">Rating</label>
                <select
                  className="input"
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} / 5
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Comment</label>
                <textarea
                  rows="3"
                  className="input"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience with this supplier..."
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-3 justify-end">
                <button onClick={() => setReviewOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewSubmitting}
                  className="btn-primary disabled:opacity-50"
                >
                  {reviewSubmitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setReviewOpen(true)} className="btn-secondary">
              Leave a review
            </button>
          )}
        </div>
      )}

      <Drawer open={disputeOpen} onClose={() => setDisputeOpen(false)} title="Raise a Dispute">
        <p className="text-sm text-slate-600 mb-4">
          Describe the issue with order {order.id?.slice(0, 8)}. Our team will review it.
        </p>
        <label className="label">Reason</label>
        <textarea
          rows="5"
          value={disputeReason}
          onChange={(e) => setDisputeReason(e.target.value)}
          className="input mb-4"
          placeholder="Explain the problem (e.g. wrong item, damaged shipment)..."
        />
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDisputeOpen(false)} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleRaiseDispute} disabled={submitting} className="btn-danger disabled:opacity-50">
            {submitting ? "Submitting..." : "Submit Dispute"}
          </button>
        </div>
      </Drawer>
    </div>
  );
}
