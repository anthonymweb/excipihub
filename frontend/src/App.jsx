import { Routes, Route, Link, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { CartProvider, useCart } from "./context/CartContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Catalog from "./pages/Catalog.jsx";
import Cart from "./pages/Cart.jsx";
import Orders from "./pages/Orders.jsx";
import SellerDashboard from "./pages/SellerDashboard.jsx";
import SellerOrders from "./pages/SellerOrders.jsx";

function RequireAuth({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function Nav() {
  const { user, logout } = useAuth();
  const { items } = useCart();

  return (
    <nav>
      <Link to="/">ExcipiHub</Link>
      {user?.role === "scientist" && (
        <Link to="/cart">Cart ({items.reduce((n, i) => n + i.quantity, 0)})</Link>
      )}
      {user?.role === "manufacturer" || user?.role === "distributor" ? (
        <Link to="/seller">Seller dashboard</Link>
      ) : null}
      {user && <Link to="/orders">Orders</Link>}
      <span className="spacer" />
      {user ? (
        <>
          <span className="muted">{user.username} ({user.role})</span>
          <button onClick={logout}>Log out</button>
        </>
      ) : (
        <>
          <Link to="/login">Log in</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/cart"
            element={
              <RequireAuth>
                <Cart />
              </RequireAuth>
            }
          />
          <Route
            path="/seller"
            element={
              <RequireAuth>
                <SellerDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/seller/orders"
            element={
              <RequireAuth>
                <SellerOrders />
              </RequireAuth>
            }
          />
          <Route
            path="/orders"
            element={
              <RequireAuth>
                <Orders />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
    </CartProvider>
  );
}
