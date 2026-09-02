import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function Cart() {
  const { items, setQuantity, total, clear } = useCart();
  const { token } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "",
    district: "",
    street: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  });
  const [editingAddress, setEditingAddress] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [placed, setPlaced] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      api.listAddresses(token).then((data) => {
        const addrs = data.results || data;
        setAddresses(addrs);
        if (addrs.length) setSelectedAddressId(addrs[0].id);
      }).catch(() => {});
    }
  }, [token]);

  async function handleAddAddress(e) {
    e.preventDefault();
    setError("");
    try {
      const addr = await api.createAddress(newAddress, token);
      setAddresses((prev) => [...prev, addr]);
      setSelectedAddressId(addr.id);
      setNewAddress({ label: "", district: "", street: "", city: "", state: "", postal_code: "", country: "" });
      setShowNewAddressForm(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateAddress(e) {
    e.preventDefault();
    setError("");
    try {
      const updated = await api.updateAddress(editingAddress.id, editingAddress, token);
      setAddresses((prev) => prev.map((a) => a.id === updated.id ? updated : a));
      setEditingAddress(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteAddress(id) {
    if (!window.confirm("Delete this address?")) return;
    setError("");
    try {
      await api.deleteAddress(id, token);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      if (selectedAddressId === id) {
        setSelectedAddressId(addresses.find((a) => a.id !== id)?.id || "");
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePlaceOrder() {
    setError("");
    const addr = addresses.find((a) => a.id === selectedAddressId);
    if (!addr) {
      setError("Please select a delivery address.");
      return;
    }
    setLoading(true);
    try {
      const order = await api.createOrder(
        {
          delivery_address: selectedAddressId,
          items: items.map((i) => ({ excipient: i.excipient, quantity: i.quantity })),
        },
        token
      );
      setPlaced(order);
      clear();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const grouped = items.reduce((acc, item) => {
    const key = item.seller_name || "Unknown Supplier";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  if (placed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="card">
          <div className="text-4xl mb-4">&#9989;</div>
          <h2 className="text-2xl font-bold mb-2">Order placed successfully</h2>
          <p className="text-slate-600 mb-4">
            Order <code className="bg-slate-100 px-2 py-1 rounded">{placed.id?.slice(0, 8)}</code>
          </p>
          <p className="text-xl font-bold text-accent-700 mb-6">Total: {placed.total_amount}</p>
          {placed.status === "pending_payment" ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Complete payment to confirm your order.
              </p>
              <button
                onClick={() => navigate(`/orders/${placed.id}`)}
                className="btn-primary"
              >
                Pay now
              </button>
            </div>
          ) : (
            <button onClick={() => navigate("/orders")} className="btn-primary">
              View my orders
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>
      {error && <p className="text-red-600 text-sm mb-4 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

      {items.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500 mb-4">Your cart is empty</p>
          <button onClick={() => navigate("/catalog")} className="btn-primary">Browse catalog</button>
        </div>
      ) : (
        <>
          {Object.entries(grouped).map(([seller, sellerItems]) => {
            const supplierTotal = sellerItems.reduce(
              (sum, item) => sum + parseFloat(item.unit_price) * item.quantity, 0
            );
            return (
              <div key={seller} className="card mb-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-3">
                  <h3 className="font-semibold text-slate-800">{seller}</h3>
                  <span className="text-sm font-medium text-slate-500">
                    {sellerItems.length} {sellerItems.length === 1 ? "item" : "items"}
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {sellerItems.map((item) => {
                    const subtotal = parseFloat(item.unit_price) * item.quantity;
                    return (
                      <div key={item.excipient} className="flex items-center justify-between py-3 gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 truncate">{item.name}</p>
                            {item.grade && (
                              <span className="badge bg-slate-100 text-slate-700">{item.grade}</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">
                            {item.unit_price} / {item.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => setQuantity(item.excipient, Math.max(1, Number(e.target.value)))}
                            className="input w-20 text-center text-sm"
                          />
                          <span className="text-sm font-medium text-slate-700 w-24 text-right">
                            {subtotal.toFixed(2)}
                          </span>
                          <button
                            onClick={() => setQuantity(item.excipient, 0)}
                            className="text-red-500 hover:text-red-700 text-sm whitespace-nowrap"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end border-t border-slate-200 pt-3 mt-1">
                  <span className="text-sm font-semibold text-slate-700">
                    Subtotal: <span className="text-accent-700">{supplierTotal.toFixed(2)}</span>
                  </span>
                </div>
              </div>
            );
          })}

          <div className="flex justify-end mb-6">
            <p className="text-xl font-bold">
              Grand Total: <span className="text-accent-700">{total.toFixed(2)}</span>
            </p>
          </div>

          <div className="card mb-6">
            <h3 className="font-semibold mb-4">Delivery Address</h3>
            {addresses.length > 0 && (
              <div className="space-y-2 mb-4">
                {addresses.map((a) => (
                  <div
                    key={a.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      selectedAddressId === a.id && !editingAddress
                        ? "border-accent-500 bg-accent-50"
                        : "border-slate-200"
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === a.id && !editingAddress}
                        onChange={() => { setSelectedAddressId(a.id); setEditingAddress(null); }}
                        className="text-accent-600"
                      />
                      <div>
                        <p className="font-medium">{a.label || "Address"}</p>
                        <p className="text-sm text-slate-500">
                          {[a.district, a.street, a.city, a.state, a.postal_code, a.country].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </label>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => {
                          setEditingAddress({ ...a });
                          setShowNewAddressForm(false);
                        }}
                        className="text-sm text-accent-600 hover:text-accent-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(a.id)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {editingAddress && (
              <form onSubmit={handleUpdateAddress} className="space-y-3 mt-4 border-t border-slate-200 pt-4">
                <p className="text-sm font-medium text-slate-600">Editing address</p>
                <input className="input" placeholder="Label (e.g. Lab, Office)" value={editingAddress.label || ""} onChange={(e) => setEditingAddress({ ...editingAddress, label: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <input className="input" placeholder="Street" value={editingAddress.street || ""} onChange={(e) => setEditingAddress({ ...editingAddress, street: e.target.value })} required />
                  <input className="input" placeholder="District" value={editingAddress.district || ""} onChange={(e) => setEditingAddress({ ...editingAddress, district: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input className="input" placeholder="City" value={editingAddress.city || ""} onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })} />
                  <input className="input" placeholder="State" value={editingAddress.state || ""} onChange={(e) => setEditingAddress({ ...editingAddress, state: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input className="input" placeholder="Postal code" value={editingAddress.postal_code || ""} onChange={(e) => setEditingAddress({ ...editingAddress, postal_code: e.target.value })} />
                  <input className="input" placeholder="Country" value={editingAddress.country || ""} onChange={(e) => setEditingAddress({ ...editingAddress, country: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary">Save changes</button>
                  <button type="button" onClick={() => setEditingAddress(null)} className="btn-secondary">Cancel</button>
                </div>
              </form>
            )}

            {!editingAddress && (
              <details className="mt-2" open={showNewAddressForm} onToggle={(e) => setShowNewAddressForm(e.target.open)}>
                <summary className="cursor-pointer text-accent-600 text-sm font-medium">
                  Add new address
                </summary>
                <form onSubmit={handleAddAddress} className="space-y-3 mt-3">
                  <input className="input" placeholder="Label (e.g. Lab, Office)" value={newAddress.label} onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })} />
                  <div className="grid grid-cols-2 gap-3">
                    <input className="input" placeholder="Street" value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} required />
                    <input className="input" placeholder="District" value={newAddress.district} onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input className="input" placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                    <input className="input" placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input className="input" placeholder="Postal code" value={newAddress.postal_code} onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })} />
                    <input className="input" placeholder="Country" value={newAddress.country} onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })} />
                  </div>
                  <button type="submit" className="btn-primary">Save address</button>
                </form>
              </details>
            )}
          </div>

          <button
            disabled={!selectedAddressId || loading}
            onClick={() => setShowReview(true)}
            className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Review order
          </button>
        </>
      )}

      {showReview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Review your order</h2>
              {error && <p className="text-red-600 text-sm mb-4 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

              <div className="space-y-3 mb-4">
                {Object.entries(grouped).map(([seller, sellerItems]) => (
                  <div key={seller}>
                    <p className="text-sm font-semibold text-slate-700 mb-1">{seller}</p>
                    {sellerItems.map((item) => (
                      <div key={item.excipient} className="flex justify-between text-sm text-slate-600 pl-3">
                        <span>{item.name} × {item.quantity}</span>
                        <span className="font-medium">{(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-3 mb-4">
                <p className="text-sm text-slate-500">Delivering to:</p>
                <p className="text-sm font-medium text-slate-800">
                  {addresses.find((a) => a.id === selectedAddressId)?.label || ""}
                  {" — "}
                  {[addresses.find((a) => a.id === selectedAddressId)?.street, addresses.find((a) => a.id === selectedAddressId)?.city].filter(Boolean).join(", ")}
                </p>
              </div>

              <div className="border-t border-slate-200 pt-3 mb-6">
                <p className="text-lg font-bold text-right">
                  Total: <span className="text-accent-700">{total.toFixed(2)}</span>
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReview(false)}
                  className="btn-secondary flex-1"
                >
                  Go back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? "Placing..." : "Confirm order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
