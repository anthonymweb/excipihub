import { useAuth } from "../context/AuthContext.jsx";

export default function AdminSettings() {
  const { user } = useAuth();
  if (!user?.is_staff) {
    return <div className="card">Admin access required.</div>;
  }
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Platform Configuration</h2>
        <p className="text-sm text-slate-500 mb-4">
          The following values are read-only. Platform configuration controls are not yet
          exposed through the admin interface.
        </p>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-medium text-slate-700">Platform</dt>
            <dd className="text-slate-600">ExcipiHub</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-700">Environment</dt>
            <dd className="text-slate-600">Production</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
