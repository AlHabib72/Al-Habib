'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { Product, CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const SHIPPING_THRESHOLD = 499;
const SHIPPING_COST = 99;
const TAX_RATE = 0.18;

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // FIXED: Hydration mismatch — only load from localStorage after mount
    try {
      const saved = localStorage.getItem('glowaura_cart');
      if (saved) setItems(JSON.parse(saved));
    } catch { /* ignore parse errors */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem('glowaura_cart', JSON.stringify(items));
  }, [items, hydrated]);

  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock === 0) { toast.error('Product is out of stock'); return; }

    setItems((prev) => {
      const existing = prev.find((i) => i.product._id === product._id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > product.stock) { toast.error(`Only ${product.stock} items available`); return prev; }
        return prev.map((i) => i.product._id === product._id ? { ...i, quantity: newQty } : i);
      }
      return [...prev, { product, quantity }];
    });
    toast.success(`${product.name} added to cart`);
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product._id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setItems((prev) =>
      prev.map((i) => i.product._id === productId ? { ...i, quantity } : i)
    );
  };

  const clearCart = () => { setItems([]); localStorage.removeItem('glowaura_cart'); };

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + (i.product.discountPrice || i.product.price) * i.quantity, 0);
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = subtotal + shipping + tax;

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal, tax, shipping, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
