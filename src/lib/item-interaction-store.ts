import { create } from 'zustand';

export interface FavoriteStateEntry {
  isFavorited: boolean;
  favoriteCount: number;
}

interface ItemInteractionState {
  favorites: Record<string, FavoriteStateEntry>;

  seedFavorites: (
    items: Array<{ id: string; isFavorited: boolean; favoriteCount: number }>
  ) => void;
  setFavorite: (itemId: string, entry: FavoriteStateEntry) => void;
  clearFavorites: () => void;
}

export const useItemInteractionStore = create<ItemInteractionState>((set) => ({
  favorites: {},

  seedFavorites: (items) =>
    set((state) => {
      const next = { ...state.favorites };
      for (const item of items) {
        next[item.id] = {
          isFavorited: item.isFavorited,
          favoriteCount: item.favoriteCount,
        };
      }
      return { favorites: next };
    }),

  setFavorite: (itemId, entry) =>
    set((state) => ({
      favorites: {
        ...state.favorites,
        [itemId]: entry,
      },
    })),

  clearFavorites: () => set({ favorites: {} }),
}));
