import { useState } from "react";

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-slate-200 mb-6">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            active === t.key
              ? "border-accent-600 text-accent-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          {t.label}
          {t.count != null && (
            <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-2xl font-bold ${accent ? "text-accent-700" : "text-slate-900"}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export function StatusIndicator({ status, positive, negative, neutral }) {
  const tone = positive
    ? "bg-green-100 text-green-800"
    : negative
    ? "bg-red-100 text-red-800"
    : neutral
    ? "bg-slate-100 text-slate-600"
    : "bg-yellow-100 text-yellow-800";
  return <span className={`badge ${tone}`}>{status}</span>;
}

export function Table({ columns, data, empty }) {
  if (!data || data.length === 0) {
    return <p className="text-center text-slate-400 py-8">{empty || "No records found."}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-200">
            {columns.map((c) => (
              <th key={c.key} className="py-3 px-3 font-medium">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, i) => (
            <tr key={row.id || i} className="hover:bg-slate-50">
              {columns.map((c) => (
                <td key={c.key} className="py-3 px-3 text-slate-700">
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Drawer({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full shadow-xl overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FileUploader({ onChange, label = "Upload document" }) {
  return (
    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
      <input
        type="file"
        onChange={(e) => onChange(e.target.files[0])}
        className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent-600 file:text-white file:cursor-pointer hover:file:bg-accent-700"
      />
      <p className="text-xs text-slate-400 mt-2">{label}</p>
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="card text-center py-12">
      <p className="text-lg font-medium text-slate-700 mb-1">{title}</p>
      {message && <p className="text-sm text-slate-400 mb-4">{message}</p>}
      {action}
    </div>
  );
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button
            onClick={onConfirm}
            className={danger ? "btn-danger" : "btn-primary"}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProgressBar({ value }) {
  return (
    <div className="w-full bg-slate-200 rounded-full h-2.5">
      <div
        className="bg-accent-600 h-2.5 rounded-full"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
