import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { api } from "../api/client.js";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const isSeller = user?.role === "manufacturer" || user?.role === "distributor";
  const isBuyer = user?.role === "scientist";
  const isAdmin = user?.is_staff;

  useEffect(() => {
    if (user && !isSeller) {
      const token = localStorage.getItem("excipihub_token");
      api.listNotifications(token).then((d) => {
        const list = d.results || d;
        setNotifCount(list.filter((n) => !n.is_read).length);
      }).catch(() => {});
    }
  }, [user]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const NavLink = ({ to, children }) => (
    <Link to={to} className="text-slate-600 hover:text-slate-900" onClick={() => setMobileOpen(false)}>
      {children}
    </Link>
  );

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-accent-700">ExcipiHub</Link>
            <div className="hidden md:flex items-center gap-6">
              <NavLink to="/catalog">Catalog</NavLink>
            {isBuyer && <NavLink to="/rfqs">RFQs</NavLink>}
              {isBuyer && <NavLink to="/saved">Saved</NavLink>}
              {isBuyer && <NavLink to="/formulation-kits">Formulations</NavLink>}
              {isSeller && <NavLink to="/seller">Dashboard</NavLink>}
              {isSeller && <NavLink to="/seller/catalog">Catalog</NavLink>}
              {isSeller && <NavLink to="/seller/orders">Orders</NavLink>}
              {isSeller && <NavLink to="/seller/rfqs">RFQs</NavLink>}
              {isSeller && <NavLink to="/seller/documents">Documents</NavLink>}
              {isSeller && <NavLink to="/seller/verification">Verification</NavLink>}
              {isSeller && <NavLink to="/seller/analytics">Analytics</NavLink>}
              {isAdmin && <NavLink to="/admin">Admin</NavLink>}
              {isAdmin && <NavLink to="/admin/suppliers">Suppliers</NavLink>}
              {isAdmin && <NavLink to="/admin/compliance">Compliance</NavLink>}
              {isAdmin && <NavLink to="/admin/audit">Audit</NavLink>}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {user && !isSeller && (
              <Link to="/cart" className="text-slate-600 hover:text-slate-900 relative" onClick={() => setMobileOpen(false)}>
                <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-accent-600 text-white text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            {user && !isSeller && (
              <Link to="/notifications" className="text-slate-600 hover:text-slate-900 relative" onClick={() => setMobileOpen(false)}>
                <svg className="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                    {notifCount}
                  </span>
                )}
              </Link>
            )}
            {user && (isBuyer || isSeller) && (
              <NavLink to="/messages">Messages</NavLink>
            )}
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
            <NavLink to="/catalog">Catalog</NavLink>
            {isBuyer && <NavLink to="/rfqs">RFQs</NavLink>}
            {isBuyer && <NavLink to="/saved">Saved</NavLink>}
            {isBuyer && <NavLink to="/formulation-kits">Formulations</NavLink>}
            {isSeller && <NavLink to="/seller">Dashboard</NavLink>}
            {isSeller && <NavLink to="/seller/catalog">Catalog</NavLink>}
            {isSeller && <NavLink to="/seller/orders">Orders</NavLink>}
            {isSeller && <NavLink to="/seller/rfqs">RFQs</NavLink>}
            {isSeller && <NavLink to="/seller/documents">Documents</NavLink>}
            {isSeller && <NavLink to="/seller/verification">Verification</NavLink>}
            {isSeller && <NavLink to="/seller/analytics">Analytics</NavLink>}
            {isAdmin && <NavLink to="/admin">Admin</NavLink>}
            {isAdmin && <NavLink to="/admin/suppliers">Suppliers</NavLink>}
            {isAdmin && <NavLink to="/admin/compliance">Compliance</NavLink>}
            {isAdmin && <NavLink to="/admin/audit">Audit</NavLink>}
            {user && !isSeller && <NavLink to="/cart">Cart</NavLink>}
            {user && !isSeller && <NavLink to="/notifications">Notifications</NavLink>}
            {user && (isBuyer || isSeller) && <NavLink to="/messages">Messages</NavLink>}
            <hr className="border-slate-200" />
            {user ? (
              <>
                <span className="block py-2 text-sm text-slate-500">{user.username}</span>
                <button onClick={handleLogout} className="btn-secondary text-sm w-full">Logout</button>
              </>
            ) : (
              <>
                <NavLink to="/login">Login</NavLink>
                <Link to="/register" className="btn-primary text-sm block text-center" onClick={() => setMobileOpen(false)}>Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
