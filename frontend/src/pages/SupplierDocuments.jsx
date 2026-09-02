import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { FileUploader } from "../components/UI.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const DOC_TYPES = [
  "coa",
  "sds",
  "gmp",
  "iso",
  "business_license",
  "manufacturing_license",
  "tse_bse",
  "regulatory_letter",
  "allergen",
  "halal",
  "kosher",
  "other",
];

export default function SupplierDocuments() {
  const { user, token } = useAuth();
  const toast = useToast();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [docType, setDocType] = useState("coa");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  function load() {
    if (!token) return;
    api
      .listDocuments({ supplier: user.id })
      .then((data) => setDocs(data.results || data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [token, user]);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("document_type", docType);
      fd.append("file", file);
      fd.append("supplier", user.id);
      await api.uploadDocument(fd, token);
      toast.success("Document uploaded");
      setFile(null);
      setDocType("coa");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Supplier Documents</h1>

      {error && (
        <p className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </p>
      )}

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Upload Document</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="label">Document Type</label>
            <select
              className="input"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <FileUploader onChange={setFile} />
          {file && (
            <p className="text-sm text-slate-500">Selected: {file.name}</p>
          )}
          <button type="submit" className="btn-primary" disabled={uploading}>
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">My Documents</h2>
        {docs.length === 0 ? (
          <p className="text-slate-400 py-6 text-center">No documents yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-3 font-medium">Type</th>
                  <th className="py-3 px-3 font-medium">Status</th>
                  <th className="py-3 px-3 font-medium">Uploaded</th>
                  <th className="py-3 px-3 font-medium">File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td className="py-3 px-3 font-medium">
                      {(d.document_type || "—").replace(/_/g, " ")}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={d.status || "pending"}>
                        {d.status || "pending"}
                      </StatusBadge>
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {d.uploaded_at
                        ? new Date(d.uploaded_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="py-3 px-3">
                      {d.file_url ? (
                        <a
                          href={d.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent-600 hover:text-accent-700"
                        >
                          View
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
