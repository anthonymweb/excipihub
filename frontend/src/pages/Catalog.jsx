import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function Catalog() {
  const [excipients, setExcipients] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [newListing, setNewListing] = useState({
    name: "",
    category: "",
    unit: "kg",
    unit_price: "",
    stock_quantity: "",
  });
  const { user, token } = useAuth();
  const { addItem } = useCart();

  const isSeller = user?.role === "manufacturer" || user?.role === "distributor";
  const isVerifiedSeller = isSeller && user?.verification_status === "verified";

  function loadCatalog() {
    api
      .listExcipients({ search })
      .then(setExcipients)
      .catch((err) => setError(err.message));
  }

  useEffect(loadCatalog, [search]);

  async function handleCreateListing(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createExcipient(newListing, token);
      setNewListing({ name: "", category: "", unit: "kg", unit_price: "", stock_quantity: "" });
      loadCatalog();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Excipient catalog</h2>
      {error && <p className="error">{error}</p>}
      <div className="card">
        <h3>Search ingredients</h3>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, category, or description"
        />
      </div>

      {isSeller && (
        <div className="card">
          <h3>Seller tools</h3>
          {isVerifiedSeller ? (
            <form onSubmit={handleCreateListing}>
            <label>Name</label>
            <input
              value={newListing.name}
              onChange={(e) => setNewListing({ ...newListing, name: e.target.value })}
              required
            />
            <label>Category</label>
            <input
              value={newListing.category}
              onChange={(e) => setNewListing({ ...newListing, category: e.target.value })}
              required
            />
            <label>Unit</label>
            <input
              value={newListing.unit}
              onChange={(e) => setNewListing({ ...newListing, unit: e.target.value })}
              required
            />
            <label>Unit price</label>
            <input
              value={newListing.unit_price}
              onChange={(e) => setNewListing({ ...newListing, unit_price: e.target.value })}
              type="number"
              step="0.01"
              required
            />
            <label>Stock quantity</label>
            <input
              value={newListing.stock_quantity}
              onChange={(e) => setNewListing({ ...newListing, stock_quantity: e.target.value })}
              type="number"
              required
            />
            <button type="submit">Add listing</button>
          </form>
          ) : (
            <div>
              <p className="muted">
                Your seller account is {user?.verification_status}. You must be verified before listing new excipients.
              </p>
              <p>
                Update your documentation on the <a href="/seller">seller dashboard</a> and wait for admin approval.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid">
        {excipients.map((x) => (
          <div className="card" key={x.id}>
            <h3>{x.name}</h3>
            <p className="muted">{x.category}</p>
            <p>
              {x.unit_price} / {x.unit}
            </p>
            <p className="muted">{x.stock_quantity} in stock — sold by {x.seller_name || "seller"}</p>
            {user?.role === "scientist" && (
              <button onClick={() => addItem(x)} disabled={x.stock_quantity === 0}>
                {x.stock_quantity === 0 ? "Out of stock" : "Add to cart"}
              </button>
            )}
          </div>
        ))}
        {excipients.length === 0 && <p className="muted">No excipients listed yet.</p>}
      </div>
    </div>
  );
}
