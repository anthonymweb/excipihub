export default function LoadingSpinner({ size = "md" }) {
  const sizes = { sm: "w-5 h-5", md: "w-8 h-8", lg: "w-12 h-12" };
  return (
    <div className="flex justify-center items-center p-8">
      <div className={`${sizes[size]} border-4 border-slate-200 border-t-accent-600 rounded-full animate-spin`} />
    </div>
  );
}
