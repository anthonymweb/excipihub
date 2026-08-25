import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
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

export default function App() {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
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
        <Footer />
      </div>
    </CartProvider>
  );
}
