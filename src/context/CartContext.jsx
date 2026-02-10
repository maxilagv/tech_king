import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "techking_cart";

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const maxStock = product.stockActual ?? Infinity;
      if (existing) {
        const nextQty = Math.min(existing.cantidad + quantity, maxStock);
        return prev.map((item) =>
          item.id === product.id ? { ...item, cantidad: nextQty } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          nombre: product.nombre ?? product.name,
          precio: product.precio ?? product.price,
          imagen: product.imagenes?.[0] ?? product.image_url,
          categorySlug: product.categorySlug ?? product.category,
          cantidad: Math.min(quantity, maxStock),
          stockMax: maxStock,
        },
      ];
    });
  };

  const updateQty = (productId, quantity) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId
          ? {
              ...item,
              cantidad: Math.min(
                Math.max(1, quantity),
                item.stockMax ?? Number.POSITIVE_INFINITY
              ),
            }
          : item
      )
    );
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const clear = () => setItems([]);

  const totalQty = useMemo(
    () => items.reduce((sum, item) => sum + item.cantidad, 0),
    [items]
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.precio * item.cantidad, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addItem, updateQty, removeItem, clear, totalQty, totalAmount }),
    [items, totalQty, totalAmount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
