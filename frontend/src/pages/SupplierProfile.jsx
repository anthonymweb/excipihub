import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";
import { Table } from "../components/UI.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function SupplierProfile() {
  const { id } = useParams();
  const [products, setProducts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .listExcipients({})
      .then((data) => {
        const all = data.results || data || [];
        setProducts(all.filter((e) => String(e.seller) === String(id)));
      })
      .catch((err) => setError(err.message));
    api
      .listDocuments({ supplier: id })
      .then((data) => setDocuments(data.results || data || []))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;

  const columns = [
    {
      key: "name",
      label: "Product",
      render: (p) => (
        <Link to={`/product/${p.id}`} className="text-accent-600 hover:underline font-medium">
          {p.name}
        </Link>
      ),
    },
    { key: "category", label: "Category" },
    { key: "grade", label: "Grade" },
    { key: "unit_price", label: "Price", render: (p) => `${p.unit_price} / ${p.unit}` },
    { key: "stock_quantity", label: "Stock" },
  ];

  const docColumns = [
    { key: "document_type", label: "Type" },
    { key: "status", label: "Status" },
    {
      key: "file_url",
      label: "File",
      render: (d) =>
        d.file_url ? (
          <a href={d.file_url} target="_blank" rel="noreferrer" className="text-accent-600 hover:underline">
            Download
          </a>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/catalog" className="text-accent-600 hover:text-accent-700 text-sm mb-4 inline-block">
        &larr; Back to catalog
      </Link>
      <div className="card mb-6">
        <h1 className="text-2xl font-bold">Supplier {id}</h1>
        <p className="text-slate-500 text-sm mt-1">
          Public listing of excipients offered by this supplier.
        </p>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Listed Products ({products.length})</h2>
        {products.length === 0 ? (
          <p className="text-slate-400 text-sm py-4 text-center">No products listed by this supplier.</p>
        ) : (
          <Table columns={columns} data={products} />
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Verified Documents</h2>
        {documents.length === 0 ? (
          <p className="text-slate-400 text-sm py-4 text-center">No supplier documents on file.</p>
        ) : (
          <Table columns={docColumns} data={documents} />
        )}
      </div>
    </div>
  );
}
