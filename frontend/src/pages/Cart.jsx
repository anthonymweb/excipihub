import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function Cart() {
  const { items, setQuantity, total, clear } = useCart();
  const { token } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");
  const [newAddress, setNewAddress] = useState({
    label: "",
    district: "",
    street: "",
    latitude: "",
    longitude: "",
  });
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.listAddresses(token).then((addrs) => {
      setAddresses(addrs);
      if (addrs.length) setAddressId(addrs[0].id);
    });
  }, [token]);

  async function handleAddAddress(e) {
    e.preventDefault();
    setError("");
    try {
      const addr = await api.createAddress(newAddress, token);
      setAddresses((prev) => [...prev, addr]);
      setAddressId(addr.id);
      setNewAddress({ label: "", district: "", street: "", latitude: "", longitude: "" });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePlaceOrder() {
    setError("");
    try {
      const order = await api.createOrder(
        {
          delivery_address: addressId,
          items: items.map((i) => ({ excipient: i.excipient, quantity: i.quantity })),
        },
        token
      );
      setPlaced(order);
      clear();
    } catch (err) {
      setError(err.message);
    }
  }

  if (placed) {
    return (
      <div className="card">
        <h2>Order placed</h2>
        <p>
          Order <code>{placed.id}</code> — total {placed.total_amount}
        </p>
        <button onClick={() => navigate("/orders")}>View my orders</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Cart</h2>
      {error && <p className="error">{error}</p>}

      {items.length === 0 && <p className="muted">Your cart is empty.</p>}

      {items.map((i) => (
        <div className="card row" key={i.excipient}>
          <div>
            <strong>{i.name}</strong>
            <p className="muted">
              {i.unit_price} / {i.unit}
            </p>
          </div>
          <input
            type="number"
            min="0"
            value={i.quantity}
            onChange={(e) => setQuantity(i.excipient, Number(e.target.value))}
            style={{ width: "80px" }}
          />
        </div>
      ))}

      {items.length > 0 && (
        <>
          <p>
            <strong>Total: {total.toFixed(2)}</strong>
          </p>

          <div className="card">
            <h3>Delivery address</h3>
            {addresses.length > 0 && (
              <select value={addressId} onChange={(e) => setAddressId(e.target.value)}>
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} — {a.district}
                  </option>
                ))}
              </select>
            )}

            <details>
              <summary>Add a new address</summary>
              <form onSubmit={handleAddAddress}>
                <label>Label</label>
                <input
                  value={newAddress.label}
                  onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  required
                />
                <label>District</label>
                <input
                  value={newAddress.district}
                  onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                  required
                />
                <label>Street</label>
                <input
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  required
                />
                <label>Latitude</label>
                <input
                  value={newAddress.latitude}
                  onChange={(e) => setNewAddress({ ...newAddress, latitude: e.target.value })}
                  type="number"
                  step="0.000001"
                  required
                />
                <label>Longitude</label>
                <input
                  value={newAddress.longitude}
                  onChange={(e) => setNewAddress({ ...newAddress, longitude: e.target.value })}
                  type="number"
                  step="0.000001"
                  required
                />
                <button type="submit">Save address</button>
              </form>
            </details>
          </div>

          <button disabled={!addressId} onClick={handlePlaceOrder}>
            Place order
          </button>
        </>
      )}
    </div>
  );
}
