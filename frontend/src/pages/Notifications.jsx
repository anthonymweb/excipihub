import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { EmptyState } from "../components/UI.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { useToast } from "../components/Toast.jsx";

export default function Notifications() {
  const { token } = useAuth();
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    if (!token) return;
    setLoading(true);
    api
      .listNotifications(token)
      .then((data) => setNotifications(data.results || data || []))
      .catch(() => toast.error("Failed to load notifications"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [token]);

  async function handleMarkRead(id) {
    try {
      await api.markNotificationRead(id, token);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {}
  }

  async function handleMarkAll() {
    try {
      await api.markAllNotificationsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked read");
    } catch {
      toast.error("Failed to mark all read");
    }
  }

  if (loading) return <LoadingSpinner />;

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <button
          onClick={handleMarkAll}
          disabled={!hasUnread}
          className="btn-secondary disabled:opacity-50"
        >
          Mark all read
        </button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="No notifications" message="You're all caught up." />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
              className={`card cursor-pointer ${
                n.is_read ? "opacity-70" : "border-accent-300"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800">{n.title}</h3>
                    {!n.is_read && (
                      <span className="badge bg-accent-100 text-accent-700">New</span>
                    )}
                  </div>
                  {n.message && (
                    <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                  )}
                  {n.event && (
                    <p className="text-xs text-slate-400 mt-1">Event: {n.event}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                  </p>
                </div>
                {n.link && (
                  <Link
                    to={n.link}
                    onClick={(e) => e.stopPropagation()}
                    className="btn-primary whitespace-nowrap"
                  >
                    View
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
