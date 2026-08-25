import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

const STORAGE_KEY = "excipihub_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(excipient) {
    setItems((prev) => {
      const existing = prev.find((i) => i.excipient === excipient.id);
      if (existing) {
        return prev.map((i) =>
          i.excipient === excipient.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          excipient: excipient.id,
          name: excipient.name,
          unit_price: excipient.unit_price,
          unit: excipient.unit,
          seller_name: excipient.seller_name,
          quantity: 1,
        },
      ];
    });
  }

  function setQuantity(excipientId, quantity) {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.excipient !== excipientId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.excipient === excipientId ? { ...i, quantity } : i))
      );
    }
  }

  function clear() {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  const total = items.reduce((sum, i) => sum + parseFloat(i.unit_price) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, setQuantity, clear, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
