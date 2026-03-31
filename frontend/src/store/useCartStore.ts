import { create } from 'zustand';
import { fetchApi } from '../api/fetchApi';

export interface CartItem {
  productId: string;
  productName: string;
  imageUrl: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface CartState {
  cartId?: string;
  userId?: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  isCartOpen: boolean;
  
  toggleCart: () => void;
  fetchCart: () => Promise<void>;
  addToCart: (product: { productId: string, productName: string, imageUrl: string, price: number, quantity?: number }) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCartState: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  totalItems: 0,
  totalAmount: 0,
  isCartOpen: false,

  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

  fetchCart: async () => {
    try {
      const cart: any = await fetchApi('/api/cart');
      set({
        cartId: cart.cartId,
        userId: cart.userId,
        items: cart.items || [],
        totalItems: cart.totalItems || 0,
        totalAmount: cart.totalAmount || 0,
      });
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      // Clean state on failure (potentially unauthenticated)
      set({ items: [], totalItems: 0, totalAmount: 0 });
    }
  },

  addToCart: async ({ productId, productName, imageUrl, price, quantity = 1 }) => {
    try {
      const cart: any = await fetchApi('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId, productName, imageUrl, price, quantity }),
      });
      set({
        items: cart.items,
        totalItems: cart.totalItems,
        totalAmount: cart.totalAmount,
      });
    } catch (error) {
      console.error('Add to cart failed', error);
      throw error;
    }
  },

  updateQuantity: async (productId, quantity) => {
    try {
      // API expects PATCH, quantity can be 0 or negative to remove
      const cart: any = await fetchApi(`/api/cart/items/${productId}?quantity=${quantity}`, {
        method: 'PATCH'
      });
      set({
        items: cart.items,
        totalItems: cart.totalItems,
        totalAmount: cart.totalAmount,
      });
    } catch (error) {
      console.error('Update quantity failed', error);
      throw error;
    }
  },

  removeFromCart: async (productId) => {
    try {
      const cart: any = await fetchApi(`/api/cart/items/${productId}`, {
        method: 'DELETE'
      });
      set({
        items: cart.items,
        totalItems: cart.totalItems,
        totalAmount: cart.totalAmount,
      });
    } catch (error) {
      console.error('Remove from cart failed', error);
      throw error;
    }
  },

  clearCartState: () => {
    set({ items: [], totalItems: 0, totalAmount: 0 });
  }
}));
