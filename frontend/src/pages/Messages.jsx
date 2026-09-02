import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { EmptyState } from "../components/UI.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { useToast } from "../components/Toast.jsx";

export default function Messages() {
  const { token } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  function load() {
    if (!token) return;
    setLoading(true);
    api
      .listMessages(token)
      .then((data) => setMessages(data.results || data || []))
      .catch(() => toast.error("Failed to load messages"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [token]);

  async function handleOpen(id, isRead) {
    setOpenId(openId === id ? null : id);
    if (!isRead) {
      try {
        await api.markMessageRead(id, token);
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, is_read: true } : m))
        );
      } catch {}
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!recipient.trim() || !subject.trim() || !body.trim()) return;
    try {
      await api.sendMessage(
        { recipient, subject, body },
        token
      );
      toast.success("Message sent");
      setRecipient("");
      setSubject("");
      setBody("");
      load();
    } catch {
      toast.error("Failed to send message");
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Messages</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {messages.length === 0 ? (
            <EmptyState title="No messages" message="Your conversations will appear here." />
          ) : (
            messages.map((m) => (
              <div key={m.id} className="card">
                <button
                  onClick={() => handleOpen(m.id, m.is_read)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-800">
                      {m.subject || "(No subject)"}
                    </p>
                    {!m.is_read && (
                      <span className="badge bg-accent-100 text-accent-700">Unread</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    {m.sender_name || m.recipient_name || "—"}
                  </p>
                </button>
                {openId === m.id && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {m.body}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {m.created_at ? new Date(m.created_at).toLocaleString() : ""}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSend} className="card h-fit">
          <h2 className="text-lg font-semibold mb-4">Send message</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Recipient (email or id)</label>
              <input
                className="input"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="supplier@company.com"
              />
            </div>
            <div>
              <label className="label">Subject</label>
              <input
                className="input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
              />
            </div>
            <div>
              <label className="label">Body</label>
              <textarea
                className="input"
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message..."
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
