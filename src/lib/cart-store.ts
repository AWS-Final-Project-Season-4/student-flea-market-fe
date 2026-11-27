
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductItem } from '@/data/mock-items';

interface CartState {
  carts: Record<string, ProductItem[]>;

  addToCart: (userId: string, product: ProductItem) => void;
  removeFromCart: (userId: string, productId: string) => void;
  clearCart: (userId: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      carts: {},

      addToCart: (userId, product) =>
        set((state) => {
          const items = state.carts[userId] ?? [];

          if (items.some((item) => item.id === product.id)) {
            return state;
          }

          return {
            carts: {
              ...state.carts,
              [userId]: [...items, product],
            },
          };
        }),

      removeFromCart: (userId, productId) =>
        set((state) => ({
          carts: {
            ...state.carts,
            [userId]: (state.carts[userId] ?? []).filter(
              (item) => item.id !== productId
            ),
          },
        })),

      clearCart: (userId) =>
        set((state) => ({
          carts: {
            ...state.carts,
            [userId]: [],
          },
        })),
    }),
    {
      name: 'sfm-cart-storage',
    }
  )
);
