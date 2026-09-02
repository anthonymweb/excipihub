import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { Tabs, Table, Drawer, ConfirmDialog } from "../components/UI.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const EMPTY_PRODUCT = {
  name: "",
  category: "",
  grade: "",
  unit: "kg",
  unit_price: "",
  stock_quantity: "",
  cas_number: "",
  function: "",
  country_of_origin: "",
  description: "",
};

const EMPTY_BATCH = {
  excipient: "",
  batch_number: "",
  quantity: "",
  manufacture_date: "",
  expiry_date: "",
  status: "available",
};

export default function SupplierCatalog() {
  const { token } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [savingProduct, setSavingProduct] = useState(false);

  const [batchForm, setBatchForm] = useState(EMPTY_BATCH);
  const [savingBatch, setSavingBatch] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);

  function load() {
    if (!token) return;
    setLoading(true);
    Promise.all([
      api.listExcipients({ my: true }).catch(() => []),
      api.listBatches({ my: true }).catch(() => []),
    ])
      .then(([p, b]) => {
        setProducts(p.results || p || []);
        setBatches(b.results || b || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [token]);

  async function handleProductSubmit(e) {
    e.preventDefault();
    setError("");
    setSavingProduct(true);
    try {
      await api.createExcipient(
        { ...productForm, is_active: true },
        token
      );
      toast.success("Listing created");
      setProductForm(EMPTY_PRODUCT);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.updateExcipient(id, { is_active: false }, token);
      toast.success("Listing deactivated");
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setConfirmDelete(null);
    }
  }

  async function handleBatchSubmit(e) {
    e.preventDefault();
    setError("");
    setSavingBatch(true);
    try {
      await api.createBatch(batchForm, token);
      toast.success("Batch added");
      setBatchForm(EMPTY_BATCH);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingBatch(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  const productMap = Object.fromEntries(products.map((p) => [p.id, p.name]));
  const lowStock = products.filter(
    (p) => (parseFloat(p.stock_quantity) || 0) < 20
  );

  const productColumns = [
    { key: "name", label: "Name" },
    { key: "category", label: "Category" },
    { key: "grade", label: "Grade" },
    { key: "unit_price", label: "Unit Price" },
    { key: "stock_quantity", label: "Stock" },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <StatusBadge status={r.is_active ? "confirmed" : "cancelled"}>
          {r.is_active ? "Active" : "Inactive"}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <button
          onClick={() => setConfirmDelete(r)}
          className="text-red-600 hover:text-red-700 text-sm"
        >
          Delete
        </button>
      ),
    },
  ];

  const batchColumns = [
    { key: "batch_number", label: "Batch #" },
    {
      key: "excipient",
      label: "Product",
      render: (r) => productMap[r.excipient] || `ID ${r.excipient}`,
    },
    { key: "quantity", label: "Quantity" },
    {
      key: "status",
      label: "Status",
      render: (r) => <StatusBadge status={r.status}>{r.status}</StatusBadge>,
    },
    { key: "expiry", label: "Expiry", render: (r) => r.expiry_date || "—" },
  ];

  const inventoryColumns = [
    { key: "name", label: "Name" },
    { key: "stock_quantity", label: "Stock" },
    { key: "lead_time_days", label: "Lead Time (days)" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Supplier Catalog</h1>

      {error && (
        <p className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </p>
      )}

      <Tabs
        tabs={[
          { key: "products", label: "Products", count: products.length },
          { key: "batches", label: "Batches", count: batches.length },
          { key: "inventory", label: "Inventory", count: lowStock.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "products" && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">New Listing</h2>
            <form
              onSubmit={handleProductSubmit}
              className="grid md:grid-cols-2 gap-4"
            >
              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="label">Category</label>
                <input
                  className="input"
                  value={productForm.category}
                  onChange={(e) =>
                    setProductForm({ ...productForm, category: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="label">Grade</label>
                <input
                  className="input"
                  value={productForm.grade}
                  onChange={(e) =>
                    setProductForm({ ...productForm, grade: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Unit</label>
                <input
                  className="input"
                  value={productForm.unit}
                  onChange={(e) =>
                    setProductForm({ ...productForm, unit: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Unit Price</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={productForm.unit_price}
                  onChange={(e) =>
                    setProductForm({ ...productForm, unit_price: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="label">Stock Quantity</label>
                <input
                  type="number"
                  className="input"
                  value={productForm.stock_quantity}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      stock_quantity: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="label">CAS Number</label>
                <input
                  className="input"
                  value={productForm.cas_number}
                  onChange={(e) =>
                    setProductForm({ ...productForm, cas_number: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Country of Origin</label>
                <input
                  className="input"
                  value={productForm.country_of_origin}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      country_of_origin: e.target.value,
                    })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Function</label>
                <input
                  className="input"
                  value={productForm.function}
                  onChange={(e) =>
                    setProductForm({ ...productForm, function: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingProduct}
                >
                  {savingProduct ? "Saving..." : "Create listing"}
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">My Products</h2>
            <Table columns={productColumns} data={products} />
          </div>
        </div>
      )}

      {tab === "batches" && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Add Batch</h2>
            <form
              onSubmit={handleBatchSubmit}
              className="grid md:grid-cols-2 gap-4"
            >
              <div>
                <label className="label">Product</label>
                <select
                  className="input"
                  value={batchForm.excipient}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, excipient: e.target.value })
                  }
                  required
                >
                  <option value="">Select a product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Batch Number</label>
                <input
                  className="input"
                  value={batchForm.batch_number}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, batch_number: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="label">Quantity</label>
                <input
                  type="number"
                  className="input"
                  value={batchForm.quantity}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, quantity: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="input"
                  value={batchForm.status}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, status: e.target.value })
                  }
                >
                  <option value="available">available</option>
                  <option value="reserved">reserved</option>
                  <option value="qc_hold">QC Hold</option>
                  <option value="released">released</option>
                  <option value="quarantined">quarantined</option>
                  <option value="expired">expired</option>
                  <option value="depleted">depleted</option>
                  <option value="recalled">recalled</option>
                </select>
              </div>
              <div>
                <label className="label">Manufacture Date</label>
                <input
                  type="date"
                  className="input"
                  value={batchForm.manufacture_date}
                  onChange={(e) =>
                    setBatchForm({
                      ...batchForm,
                      manufacture_date: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="label">Expiry Date</label>
                <input
                  type="date"
                  className="input"
                  value={batchForm.expiry_date}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, expiry_date: e.target.value })
                  }
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingBatch}
                >
                  {savingBatch ? "Saving..." : "Add batch"}
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">My Batches</h2>
            <Table columns={batchColumns} data={batches} />
          </div>
        </div>
      )}

      {tab === "inventory" && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Low-stock Products</h2>
            <Table
              columns={inventoryColumns}
              data={lowStock}
              empty="No low-stock products."
            />
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Stock Summary</h2>
            <Table columns={inventoryColumns} data={products} />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Deactivate listing"
        message="This will mark the listing as inactive. Continue?"
        onConfirm={() => handleDelete(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
        danger
      />
    </div>
  );
}
