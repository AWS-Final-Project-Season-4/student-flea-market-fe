
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductItem } from '@/data/mock-items';

export interface CartProductItem extends ProductItem {
  selectedQuantity?: number;
}

interface CartState {
  carts: Record<string, CartProductItem[]>;

  addToCart: (userId: string, product: CartProductItem) => void;
  updateQuantity: (userId: string, productId: string, quantity: number) => void;
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
          const existingIdx = items.findIndex((item) => item.id === product.id);
          const nextQty = Math.max(1, product.selectedQuantity ?? 1);

          if (existingIdx >= 0) {
            const updated = [...items];
            const existing = updated[existingIdx];
            const maxStock = product.quantity ?? existing.quantity ?? 999;
            updated[existingIdx] = {
              ...existing,
              ...product,
              selectedQuantity: Math.min(
                maxStock,
                (existing.selectedQuantity ?? 1) + nextQty
              ),
            };
            return {
              carts: {
                ...state.carts,
                [userId]: updated,
              },
            };
          }

          return {
            carts: {
              ...state.carts,
              [userId]: [...items, { ...product, selectedQuantity: nextQty }],
            },
          };
        }),

      updateQuantity: (userId, productId, quantity) =>
        set((state) => {
          const safeQty = Math.max(1, quantity);
          return {
            carts: {
              ...state.carts,
              [userId]: (state.carts[userId] ?? []).map((item) =>
                item.id === productId
                  ? {
                      ...item,
                      selectedQuantity: Math.min(item.quantity ?? 999, safeQty),
                    }
                  : item
              ),
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
