import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const isSeller = user?.role === "manufacturer" || user?.role === "distributor";
  const isAdmin = user?.is_staff;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-accent-700">
              ExcipiHub
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-slate-600 hover:text-slate-900">Catalog</Link>
              {user && !isSeller && (
                <Link to="/cart" className="text-slate-600 hover:text-slate-900">Cart</Link>
              )}
              {user && !isSeller && (
                <Link to="/orders" className="text-slate-600 hover:text-slate-900">Orders</Link>
              )}
              {isSeller && (
                <Link to="/seller" className="text-slate-600 hover:text-slate-900">Dashboard</Link>
              )}
              {isSeller && (
                <Link to="/seller/orders" className="text-slate-600 hover:text-slate-900">Orders</Link>
              )}
              {isAdmin && (
                <Link to="/admin/dashboard" className="text-slate-600 hover:text-slate-900">Admin</Link>
              )}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-slate-600">{user.username}</span>
                <button onClick={handleLogout} className="btn-secondary text-sm">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-slate-900">Login</Link>
                <Link to="/register" className="btn-primary text-sm">Register</Link>
              </>
            )}
          </div>
          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link to="/" className="block py-2 text-slate-600" onClick={() => setMobileOpen(false)}>Catalog</Link>
            {user && !isSeller && (
              <Link to="/cart" className="block py-2 text-slate-600" onClick={() => setMobileOpen(false)}>Cart</Link>
            )}
            {user && !isSeller && (
              <Link to="/orders" className="block py-2 text-slate-600" onClick={() => setMobileOpen(false)}>Orders</Link>
            )}
            {isSeller && (
              <Link to="/seller" className="block py-2 text-slate-600" onClick={() => setMobileOpen(false)}>Dashboard</Link>
            )}
            {isSeller && (
              <Link to="/seller/orders" className="block py-2 text-slate-600" onClick={() => setMobileOpen(false)}>Orders</Link>
            )}
            {isAdmin && (
              <Link to="/admin/dashboard" className="block py-2 text-slate-600" onClick={() => setMobileOpen(false)}>Admin</Link>
            )}
            <hr className="border-slate-200" />
            {user ? (
              <>
                <span className="block py-2 text-sm text-slate-500">{user.username}</span>
                <button onClick={handleLogout} className="btn-secondary text-sm w-full">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 text-slate-600" onClick={() => setMobileOpen(false)}>Login</Link>
                <Link to="/register" className="btn-primary text-sm block text-center" onClick={() => setMobileOpen(false)}>Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
