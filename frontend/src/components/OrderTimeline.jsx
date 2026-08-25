import StatusBadge from "./StatusBadge";

const steps = ["confirmed", "preparing", "out_for_delivery", "delivered"];

export default function OrderTimeline({ status }) {
  const currentIdx = steps.indexOf(status);
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <span className="text-2xl">&#10060;</span>
        <span className="font-medium">Order cancelled</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className={`flex flex-col items-center ${i <= currentIdx ? "text-accent-600" : "text-slate-300"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              i < currentIdx ? "bg-accent-600 text-white" :
              i === currentIdx ? "bg-accent-100 text-accent-700 ring-2 ring-accent-600" :
              "bg-slate-100 text-slate-400"
            }`}>
              {i < currentIdx ? "\u2713" : i + 1}
            </div>
            <span className="text-xs mt-1 capitalize">{step.replace(/_/g, " ")}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-12 h-0.5 mx-1 ${i < currentIdx ? "bg-accent-600" : "bg-slate-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
