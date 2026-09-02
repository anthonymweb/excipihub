import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Catalog from "./pages/Catalog.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import Cart from "./pages/Cart.jsx";
import Orders from "./pages/Orders.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import OrderDetail from "./pages/OrderDetail.jsx";

// Buyer portal
import BuyerDashboard from "./pages/BuyerDashboard.jsx";
import SavedItems from "./pages/SavedItems.jsx";
import FormulationKits from "./pages/FormulationKits.jsx";
import BuyerRFQs from "./pages/BuyerRFQs.jsx";
import Messages from "./pages/Messages.jsx";
import Notifications from "./pages/Notifications.jsx";
import Settings from "./pages/Settings.jsx";
import CompareSuppliers from "./pages/CompareSuppliers.jsx";
import SupplierProfile from "./pages/SupplierProfile.jsx";

// Supplier portal
import SupplierDashboard from "./pages/SupplierDashboard.jsx";
import SupplierCatalog from "./pages/SupplierCatalog.jsx";
import SupplierOrders from "./pages/SupplierOrders.jsx";
import SupplierRFQs from "./pages/SupplierRFQs.jsx";
import SupplierDocuments from "./pages/SupplierDocuments.jsx";
import SupplierVerification from "./pages/SupplierVerification.jsx";
import SupplierAnalytics from "./pages/SupplierAnalytics.jsx";

// Admin console
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminSuppliers from "./pages/AdminSuppliers.jsx";
import AdminMarketplace from "./pages/AdminMarketplace.jsx";
import AdminOrders from "./pages/AdminOrders.jsx";
import AdminRFQs from "./pages/AdminRFQs.jsx";
import AdminDocuments from "./pages/AdminDocuments.jsx";
import AdminDisputes from "./pages/AdminDisputes.jsx";
import AdminReviews from "./pages/AdminReviews.jsx";
import AdminMessages from "./pages/AdminMessages.jsx";
import AdminCompliance from "./pages/AdminCompliance.jsx";
import AdminAuditLogs from "./pages/AdminAuditLogs.jsx";
import AdminSettings from "./pages/AdminSettings.jsx";

function RequireAuth({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <p className="text-center py-20 text-slate-400">Loading...</p>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RequireRole({ roles, children }) {
  const { user, token, loading } = useAuth();
  if (loading) return <p className="text-center py-20 text-slate-400">Loading...</p>;
  if (!token) return <Navigate to="/login" replace />;
  if (!roles.includes(user?.role) && !user?.is_staff) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/supplier/:id" element={<SupplierProfile />} />
            <Route path="/compare" element={<CompareSuppliers />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />

            {/* Buyer portal */}
            <Route path="/buyer" element={<RequireRole roles={["scientist"]}><BuyerDashboard /></RequireRole>} />
            <Route path="/saved" element={<RequireRole roles={["scientist"]}><SavedItems /></RequireRole>} />
            <Route path="/formulation-kits" element={<RequireRole roles={["scientist"]}><FormulationKits /></RequireRole>} />
            <Route path="/rfqs" element={<RequireRole roles={["scientist"]}><BuyerRFQs /></RequireRole>} />
            <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
            <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />

            {/* Orders (buyer) */}
            <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
            <Route path="/orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />

            {/* Supplier portal */}
            <Route path="/seller" element={<RequireRole roles={["manufacturer", "distributor"]}><SupplierDashboard /></RequireRole>} />
            <Route path="/seller/catalog" element={<RequireRole roles={["manufacturer", "distributor"]}><SupplierCatalog /></RequireRole>} />
            <Route path="/seller/orders" element={<RequireRole roles={["manufacturer", "distributor"]}><SupplierOrders /></RequireRole>} />
            <Route path="/seller/rfqs" element={<RequireRole roles={["manufacturer", "distributor"]}><SupplierRFQs /></RequireRole>} />
            <Route path="/seller/documents" element={<RequireRole roles={["manufacturer", "distributor"]}><SupplierDocuments /></RequireRole>} />
            <Route path="/seller/verification" element={<RequireRole roles={["manufacturer", "distributor"]}><SupplierVerification /></RequireRole>} />
            <Route path="/seller/analytics" element={<RequireRole roles={["manufacturer", "distributor"]}><SupplierAnalytics /></RequireRole>} />

            {/* Admin console */}
            <Route path="/admin" element={<RequireRole roles={["admin"]}><AdminDashboard /></RequireRole>} />
            <Route path="/admin/users" element={<RequireRole roles={["admin"]}><AdminUsers /></RequireRole>} />
            <Route path="/admin/suppliers" element={<RequireRole roles={["admin"]}><AdminSuppliers /></RequireRole>} />
            <Route path="/admin/marketplace" element={<RequireRole roles={["admin"]}><AdminMarketplace /></RequireRole>} />
            <Route path="/admin/orders" element={<RequireRole roles={["admin"]}><AdminOrders /></RequireRole>} />
            <Route path="/admin/rfqs" element={<RequireRole roles={["admin"]}><AdminRFQs /></RequireRole>} />
            <Route path="/admin/documents" element={<RequireRole roles={["admin"]}><AdminDocuments /></RequireRole>} />
            <Route path="/admin/disputes" element={<RequireRole roles={["admin"]}><AdminDisputes /></RequireRole>} />
            <Route path="/admin/reviews" element={<RequireRole roles={["admin"]}><AdminReviews /></RequireRole>} />
            <Route path="/admin/messages" element={<RequireRole roles={["admin"]}><AdminMessages /></RequireRole>} />
            <Route path="/admin/compliance" element={<RequireRole roles={["admin"]}><AdminCompliance /></RequireRole>} />
            <Route path="/admin/audit" element={<RequireRole roles={["admin"]}><AdminAuditLogs /></RequireRole>} />
            <Route path="/admin/settings" element={<RequireRole roles={["admin"]}><AdminSettings /></RequireRole>} />

            <Route
              path="*"
              element={
                <div className="text-center py-20">
                  <h1 className="text-2xl font-bold mb-2">Page not found</h1>
                  <a href="/" className="text-accent-600 hover:underline">Go home</a>
                </div>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}
