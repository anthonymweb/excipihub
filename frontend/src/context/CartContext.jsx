import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // [{ excipient, name, unit_price, quantity }]

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
          quantity: 1,
        },
      ];
    });
  }

  function setQuantity(excipientId, quantity) {
    setItems((prev) =>
      prev
        .map((i) => (i.excipient === excipientId ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  function clear() {
    setItems([]);
  }

  const total = items.reduce((sum, i) => sum + Number(i.unit_price) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, setQuantity, clear, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
