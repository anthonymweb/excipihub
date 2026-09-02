import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { api } from "../api/client.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { Drawer, EmptyState } from "../components/UI.jsx";

const DOC_TYPES = [
  ["coa", "CoA"],
  ["sds", "SDS"],
  ["gmp", "GMP"],
  ["iso", "ISO"],
  ["tse_bse", "TSE/BSE"],
  ["regulatory_letter", "Regulatory Letter"],
];

export default function BuyerRFQs() {
  const { token } = useAuth();
  const toast = useToast();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [quotes, setQuotes] = useState({});
  const [form, setForm] = useState({
    ingredient_name: "",
    cas_number: "",
    required_grade: "",
    quantity: "",
    unit: "kg",
    required_delivery_date: "",
    additional_requirements: "",
    verified_suppliers_only: true,
    required_documents: [],
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.listRFQs({});
      setRfqs(data.results || data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleQuotes(rfqId) {
    if (expanded === rfqId) {
      setExpanded(null);
      return;
    }
    setExpanded(rfqId);
    try {
      const data = await api.listRFQQuotes(rfqId, token);
      setQuotes((prev) => ({ ...prev, [rfqId]: data.results || data }));
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function accept(quoteId) {
    try {
      await api.acceptQuote(quoteId, token);
      toast.success("Quote accepted");
      load();
      setExpanded(null);
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function submit(e) {
    e.preventDefault();
    try {
      await api.createRFQ(
        {
          ...form,
          quantity: parseFloat(form.quantity),
          required_documents: form.required_documents,
        },
        token
      );
      toast.success("RFQ submitted");
      setShowForm(false);
      setForm({
        ingredient_name: "",
        cas_number: "",
        required_grade: "",
        quantity: "",
        unit: "kg",
        required_delivery_date: "",
        additional_requirements: "",
        verified_suppliers_only: true,
        required_documents: [],
      });
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Request For Quotation</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancel" : "+ New RFQ"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card mb-6 grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Ingredient</label>
            <input className="input" required value={form.ingredient_name}
              onChange={(e) => setForm({ ...form, ingredient_name: e.target.value })} />
          </div>
          <div>
            <label className="label">CAS Number</label>
            <input className="input" value={form.cas_number}
              onChange={(e) => setForm({ ...form, cas_number: e.target.value })} />
          </div>
          <div>
            <label className="label">Required Grade</label>
            <input className="input" value={form.required_grade}
              onChange={(e) => setForm({ ...form, required_grade: e.target.value })} placeholder="e.g. USP" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label">Quantity</label>
              <input className="input" type="number" step="0.01" required value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div className="w-24">
              <label className="label">Unit</label>
              <input className="input" value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Required Delivery Date</label>
            <input className="input" type="date" value={form.required_delivery_date}
              onChange={(e) => setForm({ ...form, required_delivery_date: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Required Documents</label>
            <div className="flex flex-wrap gap-3">
              {DOC_TYPES.map(([val, label]) => (
                <label key={val} className="flex items-center gap-1 text-sm text-slate-600">
                  <input type="checkbox" checked={form.required_documents.includes(val)}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        required_documents: e.target.checked
                          ? [...f.required_documents, val]
                          : f.required_documents.filter((d) => d !== val),
                      }))
                    } />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="label">Additional Requirements</label>
            <textarea className="input" rows="2" value={form.additional_requirements}
              onChange={(e) => setForm({ ...form, additional_requirements: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
            <input type="checkbox" checked={form.verified_suppliers_only}
              onChange={(e) => setForm({ ...form, verified_suppliers_only: e.target.checked })} />
            Verified suppliers only
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="btn-primary">Submit RFQ</button>
          </div>
        </form>
      )}

      {rfqs.length === 0 ? (
        <EmptyState title="No RFQs yet" message="Create a request to get quotes from suppliers." />
      ) : (
        <div className="space-y-3">
          {rfqs.map((rfq) => (
            <div key={rfq.id} className="card">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{rfq.ingredient_name}</p>
                  <p className="text-sm text-slate-500">
                    {rfq.reference} · {rfq.quantity} {rfq.unit} · {rfq.status}
                  </p>
                </div>
                <button onClick={() => toggleQuotes(rfq.id)} className="btn-secondary text-sm">
                  {expanded === rfq.id ? "Hide quotes" : `View quotes (${rfq.quote_count})`}
                </button>
              </div>
              {expanded === rfq.id && (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  {(quotes[rfq.id] || []).length === 0 ? (
                    <p className="text-sm text-slate-400">No quotes yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="py-2">Supplier</th>
                          <th>Price/unit</th>
                          <th>Lead</th>
                          <th>Total</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(quotes[rfq.id] || []).map((q) => (
                          <tr key={q.id} className="border-t border-slate-100">
                            <td className="py-2">{q.supplier_name}</td>
                            <td>{q.price_per_unit}</td>
                            <td>{q.lead_time_days} d</td>
                            <td>{q.total}</td>
                            <td>
                              {q.status === "pending" && (
                                <button onClick={() => accept(q.id)} className="btn-primary text-xs">
                                  Accept
                                </button>
                              )}
                              {q.status !== "pending" && (
                                <span className="text-xs text-slate-400">{q.status}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
