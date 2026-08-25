import { Link } from "react-router-dom";

export default function ProductCard({ excipient, onAddToCart, isSeller }) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <Link to={`/product/${excipient.id}`} className="text-lg font-semibold text-slate-900 hover:text-accent-600">
          {excipient.name}
        </Link>
        {excipient.grade && (
          <span className="badge bg-slate-100 text-slate-700">{excipient.grade}</span>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-1">{excipient.category}</p>
      {excipient.description && (
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{excipient.description}</p>
      )}
      <div className="flex items-end justify-between mt-auto">
        <div>
          <p className="text-xl font-bold text-accent-700">{excipient.unit_price}</p>
          <p className="text-xs text-slate-500">per {excipient.unit}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">MOQ: {excipient.stock_quantity} {excipient.unit}</p>
          {excipient.seller_name && (
            <p className="text-xs text-slate-400">{excipient.seller_name}</p>
          )}
        </div>
      </div>
      {!isSeller && onAddToCart && (
        <button
          onClick={() => onAddToCart(excipient)}
          disabled={excipient.stock_quantity === 0}
          className="btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {excipient.stock_quantity === 0 ? "Out of stock" : "Add to cart"}
        </button>
      )}
    </div>
  );
}
