import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { Drawer, Table } from "../components/UI.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const EMPTY_QUOTE = {
  price_per_unit: "",
  lead_time_days: "",
  moq: "",
  validity_days: "",
  payment_terms: "",
  notes: "",
};

export default function SupplierRFQs() {
  const { token } = useAuth();
  const toast = useToast();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openRfq, setOpenRfq] = useState(null);
  const [form, setForm] = useState(EMPTY_QUOTE);
  const [saving, setSaving] = useState(false);
  const [quotesByRfq, setQuotesByRfq] = useState({});

  useEffect(() => {
    if (!token) return;
    api
      .listRFQs({})
      .then((data) => setRfqs(data.results || data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function loadQuotes(rfqId) {
    try {
      const q = await api.listRFQQuotes(rfqId, token);
      setQuotesByRfq((prev) => ({ ...prev, [rfqId]: q.results || q || [] }));
    } catch {
      /* ignore */
    }
  }

  function openQuote(rfq) {
    setOpenRfq(rfq);
    setForm(EMPTY_QUOTE);
    loadQuotes(rfq.id);
  }

  async function submitQuote(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createRFQQuote(openRfq.id, form, token);
      toast.success("Quote submitted");
      await loadQuotes(openRfq.id);
      setForm(EMPTY_QUOTE);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  const columns = [
    { key: "ingredient_name", label: "Ingredient" },
    { key: "required_grade", label: "Grade" },
    {
      key: "qty",
      label: "Quantity",
      render: (r) => `${r.quantity} ${r.unit || ""}`,
    },
    { key: "required_delivery_date", label: "Delivery" },
    {
      key: "status",
      label: "Status",
      render: (r) => <StatusBadge status={r.status}>{r.status}</StatusBadge>,
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <button onClick={() => openQuote(r)} className="btn-primary text-sm">
          Quote
        </button>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">RFQs for Suppliers</h1>

      {error && (
        <p className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </p>
      )}

      <div className="card">
        <Table columns={columns} data={rfqs} empty="No open RFQs right now." />
      </div>

      <Drawer
        open={!!openRfq}
        onClose={() => setOpenRfq(null)}
        title={openRfq ? `Quote for ${openRfq.ingredient_name}` : "Quote"}
      >
        <form onSubmit={submitQuote} className="space-y-4">
          <div>
            <label className="label">Price per Unit</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.price_per_unit}
              onChange={(e) =>
                setForm({ ...form, price_per_unit: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="label">Lead Time (days)</label>
            <input
              type="number"
              className="input"
              value={form.lead_time_days}
              onChange={(e) =>
                setForm({ ...form, lead_time_days: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">MOQ</label>
            <input
              type="number"
              className="input"
              value={form.moq}
              onChange={(e) => setForm({ ...form, moq: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Validity (days)</label>
            <input
              type="number"
              className="input"
              value={form.validity_days}
              onChange={(e) =>
                setForm({ ...form, validity_days: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Payment Terms</label>
            <input
              className="input"
              value={form.payment_terms}
              onChange={(e) =>
                setForm({ ...form, payment_terms: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Submitting…" : "Submit quote"}
          </button>
        </form>

        <div className="mt-6">
          <h3 className="font-semibold mb-2">Your quotes</h3>
          {!quotesByRfq[openRfq?.id] ||
          quotesByRfq[openRfq.id].length === 0 ? (
            <p className="text-slate-400 text-sm">No quotes submitted yet.</p>
          ) : (
            <div className="space-y-2">
              {quotesByRfq[openRfq.id].map((q) => (
                <div
                  key={q.id}
                  className="border border-slate-200 rounded-lg p-3 text-sm"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">${q.price_per_unit}</span>
                    <StatusBadge status={q.status || "open"}>
                      {q.status || "open"}
                    </StatusBadge>
                  </div>
                  <p className="text-slate-500">
                    Lead: {q.lead_time_days || "—"} · MOQ: {q.moq || "—"}
                  </p>
                  {q.notes && (
                    <p className="text-slate-400 mt-1">{q.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
