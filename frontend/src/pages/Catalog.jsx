import { useState, useEffect } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import ProductCard from "../components/ProductCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const CATEGORIES = ["", "Binder", "Filler", "Lubricant", "Preservative", "Coating", "Solvent", "Disintegrant", "API"];
const GRADES = ["", "USP", "EP", "BP", "JP", "NF", "Technical"];
const SORT_OPTIONS = [
  { value: "", label: "Newest" },
  { value: "price", label: "Price: Low to High" },
  { value: "-price", label: "Price: High to Low" },
  { value: "name", label: "Name: A-Z" },
];

const ITEMS_PER_PAGE = 20;

export default function Catalog() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [excipients, setExcipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [grade, setGrade] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", grade: "", unit: "", unit_price: "", stock_quantity: "", description: "" });

  const isSeller = user?.role === "manufacturer" || user?.role === "distributor";
  const isVerifiedSeller = isSeller && user?.verification_status === "verified";

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = { page };
    if (search) params.search = search;
    if (category) params.category = category;
    if (grade) params.grade = grade;
    if (sortBy) params.ordering = sortBy;
    api
      .listExcipients(params)
      .then((data) => {
        setExcipients(data.results || data);
        setTotalCount(data.count || 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, category, grade, sortBy, page]);

  function handleAddToCart(excipient, qty) {
    for (let i = 0; i < qty; i++) addItem(excipient);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      const token = user?.token || localStorage.getItem("excipihub_token");
      await api.createExcipient(form, token);
      setShowForm(false);
      setForm({ name: "", category: "", grade: "", unit: "", unit_price: "", stock_quantity: "", description: "" });
      setPage(1);
    } catch (err) {
      setError(err.message);
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Excipient Catalog</h1>
        {isSeller && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? "Cancel" : "+ New listing"}
          </button>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {showForm && isVerifiedSeller && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">New Excipient Listing</h2>
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <label className="label">Category</label>
              <input className="input" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} required />
            </div>
            <div>
              <label className="label">Grade</label>
              <input className="input" value={form.grade} onChange={(e) => setForm({...form, grade: e.target.value})} placeholder="e.g. USP, EP" />
            </div>
            <div>
              <label className="label">Unit</label>
              <input className="input" value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})} required />
            </div>
            <div>
              <label className="label">Price</label>
              <input className="input" type="number" step="0.01" value={form.unit_price} onChange={(e) => setForm({...form, unit_price: e.target.value})} required />
            </div>
            <div>
              <label className="label">Stock quantity</label>
              <input className="input" type="number" value={form.stock_quantity} onChange={(e) => setForm({...form, stock_quantity: e.target.value})} required />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows="2" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="btn-primary">Create listing</button>
            </div>
          </form>
        </div>
      )}

      {isSeller && !isVerifiedSeller && showForm && (
        <div className="card mb-6">
          <p className="text-slate-600">
            Your seller account is <span className="font-medium">{user?.verification_status}</span>. You must be verified before listing new excipients.
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Update your documentation on the <a href="/seller" className="text-accent-600 hover:underline">seller dashboard</a> and wait for admin approval.
          </p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search excipients..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input flex-1"
        />
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c || "All categories"}</option>
          ))}
        </select>
        <select
          value={grade}
          onChange={(e) => { setGrade(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          {GRADES.map((g) => (
            <option key={g} value={g}>{g || "All grades"}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="input w-auto"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {excipients.map((exc) => (
              <ProductCard
                key={exc.id}
                excipient={exc}
                onAddToCart={!isSeller ? handleAddToCart : undefined}
                isSeller={isSeller}
              />
            ))}
          </div>
          {excipients.length === 0 && (
            <p className="text-center text-slate-500 py-12">No excipients found.</p>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="py-2 px-4 text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
