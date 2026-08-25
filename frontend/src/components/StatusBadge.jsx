const variants = {
  verified: "badge-verified",
  pending: "badge-pending",
  rejected: "badge-rejected",
  manufacturer: "bg-blue-100 text-blue-800",
  distributor: "bg-purple-100 text-purple-800",
  scientist: "bg-green-100 text-green-800",
  admin: "bg-red-100 text-red-800",
  pending_order: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-indigo-100 text-indigo-800",
  out_for_delivery: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  open: "bg-yellow-100 text-yellow-800",
  investigating: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
};

export default function StatusBadge({ status, children }) {
  const variant = variants[status] || "bg-slate-100 text-slate-800";
  return (
    <span className={`badge ${variant}`}>
      {children || status.replace(/_/g, " ")}
    </span>
  );
}
