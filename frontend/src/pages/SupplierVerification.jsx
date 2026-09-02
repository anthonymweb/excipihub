import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { StatusIndicator, ProgressBar } from "../components/UI.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const CHECKLIST = [
  { key: "business_registration", label: "Business registration" },
  { key: "manufacturing_license", label: "Manufacturing licence" },
  { key: "gmp_certificate", label: "GMP certificate" },
  { key: "iso_certificate", label: "ISO certificate" },
  { key: "manufacturing_site", label: "Manufacturing site" },
  { key: "contact_verification", label: "Contact verification" },
];

export default function SupplierVerification() {
  const { token } = useAuth();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api
      .listSupplierVerifications(token)
      .then((data) => {
        const list = data.results || data || [];
        setVerification(Array.isArray(list) ? list[0] || null : list);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingSpinner />;

  function checklistState(item) {
    if (!verification) return false;
    if (item.key === "business_registration")
      return !!verification.business_registration;
    if (item.key === "manufacturing_license")
      return !!verification.manufacturing_license;
    if (item.key === "gmp_certificate") return !!verification.gmp_certificate;
    if (item.key === "iso_certificate") return !!verification.iso_certificate;
    if (item.key === "manufacturing_site")
      return !!verification.manufacturing_site;
    if (item.key === "contact_verification")
      return !!verification.contact_verified;
    return false;
  }

  const completed = CHECKLIST.filter(checklistState).length;
  const progress = (completed / CHECKLIST.length) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Supplier Verification</h1>

      {!verification ? (
        <div className="card text-center py-12">
          <p className="text-lg font-medium text-slate-700 mb-2">
            No verification record found
          </p>
          <p className="text-sm text-slate-400">
            Submit your documents and profile to request verification from an
            admin. Once reviewed, your status will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Verification Status</h2>
              <StatusIndicator
                status={verification.stage || verification.status || "pending"}
                positive={verification.stage === "approved"}
                negative={verification.stage === "rejected"}
                neutral={
                  verification.stage !== "approved" &&
                  verification.stage !== "rejected"
                }
              />
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm text-slate-500 mb-1">
                <span>Progress</span>
                <span>
                  {completed}/{CHECKLIST.length}
                </span>
              </div>
              <ProgressBar value={progress} />
            </div>

            {verification.risk_flags && (
              <div className="mb-3">
                <p className="label">Risk flags</p>
                <p className="text-sm text-slate-600">
                  {verification.risk_flags}
                </p>
              </div>
            )}
            {verification.reviewer_notes && (
              <div>
                <p className="label">Reviewer notes</p>
                <p className="text-sm text-slate-600">
                  {verification.reviewer_notes}
                </p>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Required Documents</h2>
            <ul className="space-y-2">
              {CHECKLIST.map((item) => {
                const done = checklistState(item);
                return (
                  <li
                    key={item.key}
                    className="flex items-center justify-between border border-slate-200 rounded-lg px-4 py-3"
                  >
                    <span className="text-sm text-slate-700">{item.label}</span>
                    <span
                      className={`badge ${
                        done
                          ? "badge-verified"
                          : "badge-pending"
                      }`}
                    >
                      {done ? "Provided" : "Missing"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
