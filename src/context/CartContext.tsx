import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItemData } from '../api/pelanggan';

export interface CartItem {
  menu_item_id: number;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  subtotal: number;
  notes?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: MenuItemData, qty?: number, notes?: string) => void;
  updateQuantity: (menuItemId: number, quantity: number) => void;
  removeFromCart: (menuItemId: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  formatRupiah: (amount: number) => string;
}

const CART_KEY = 'etacafe_cart';

const CartContext = createContext<CartContextType | undefined>(undefined);

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Gagal menyimpan keranjang:', e);
    }
  }, [cart]);

  const addToCart = (menuItem: MenuItemData, qty: number = 1, notes: string = '') => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.menu_item_id === menuItem.id);
      if (existingIndex > -1) {
        const next = [...prev];
        const newQty = next[existingIndex].quantity + qty;
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: newQty,
          subtotal: next[existingIndex].price * newQty,
          notes: notes || next[existingIndex].notes || '',
        };
        return next;
      }
      return [
        ...prev,
        {
          menu_item_id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          image_url: menuItem.image_url,
          quantity: qty,
          subtotal: menuItem.price * qty,
          notes: notes || '',
        },
      ];
    });
  };

  const updateQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.menu_item_id === menuItemId
          ? { ...item, quantity, subtotal: item.price * quantity }
          : item
      )
    );
  };

  const removeFromCart = (menuItemId: number) => {
    setCart((prev) => prev.filter((item) => item.menu_item_id !== menuItemId));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(CART_KEY);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        subtotal,
        formatRupiah,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart harus digunakan di dalam CartProvider');
  }
  return context;
}

export default CartContext;
