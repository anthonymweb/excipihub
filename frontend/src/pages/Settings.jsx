import { useAuth } from "../context/AuthContext.jsx";

export default function Settings() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-slate-500">Please log in to view your settings.</p>
      </div>
    );
  }

  const fields = [
    { label: "Username", value: user.username },
    { label: "Email", value: user.email },
    { label: "Role", value: user.role },
    { label: "Company / Institution", value: user.company_name || "—" },
    { label: "Phone", value: user.phone || "—" },
    {
      label: "Verification status",
      value: user.verification_status || (user.is_staff ? "staff" : "—"),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <dl className="divide-y divide-slate-100">
          {fields.map((f) => (
            <div key={f.label} className="py-3 flex items-center justify-between">
              <dt className="text-sm text-slate-500">{f.label}</dt>
              <dd className="text-sm font-medium text-slate-800">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="card mt-6">
        <h2 className="text-lg font-semibold mb-2">Change password</h2>
        <p className="text-sm text-slate-500">
          Password changes are handled through the authentication service. This
          option is not yet available in the app.
        </p>
        <button disabled className="btn-secondary mt-4 disabled:opacity-50">
          Change password (coming soon)
        </button>
      </div>
    </div>
  );
}
