import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { Table, EmptyState } from "../components/UI.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function AdminReviews() {
  const { user, token } = useAuth();
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.is_staff) return;
    setLoading(true);
    api
      .adminReviews(token)
      .then((data) => setReviews(data.results || data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, token]);

  if (!user?.is_staff) {
    return <div className="card">Admin access required.</div>;
  }

  async function handleDelete(id) {
    try {
      await api.deleteReview(id, token);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success("Review removed.");
    } catch (err) {
      toast.error(err.message);
    }
  }

  const columns = [
    { key: "rating", label: "Rating", render: (r) => `${r.rating}/5` },
    { key: "comment", label: "Comment", render: (r) => r.comment || "—" },
    { key: "reviewer", label: "Reviewer", render: (r) => r.reviewer_name || r.reviewer },
    {
      key: "order",
      label: "Order",
      render: (r) => <span className="font-mono text-xs">{r.order_id?.slice(0, 8) || r.order?.slice(0, 8)}</span>,
    },
    { key: "created", label: "Date", render: (r) => new Date(r.created_at).toLocaleDateString() },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <button onClick={() => handleDelete(r.id)} className="btn-danger text-sm">
          Remove
        </button>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Reviews</h1>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading ? (
        <LoadingSpinner />
      ) : reviews.length === 0 ? (
        <EmptyState title="No reviews yet" message="Buyer reviews will appear here once orders are completed." />
      ) : (
        <Table columns={columns} data={reviews} />
      )}
    </div>
  );
}
