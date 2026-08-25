export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <span className="text-lg font-bold text-accent-700">ExcipiHub</span>
            <p className="text-sm text-slate-500">Pharmaceutical excipient marketplace</p>
          </div>
          <p className="text-sm text-slate-400">&copy; 2026 ExcipiHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
