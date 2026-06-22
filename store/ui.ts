import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UIState = {
  collapsedColumns: Record<string, boolean>;
  toggleColumn: (id: string) => void;
  isColumnCollapsed: (id: string) => boolean;
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      collapsedColumns: {},
      toggleColumn: (id) =>
        set((state) => ({
          collapsedColumns: {
            ...state.collapsedColumns,
            [id]: !state.collapsedColumns[id],
          },
        })),
      isColumnCollapsed: (id) => get().collapsedColumns[id] ?? false,
    }),
    { name: 'kanvi-ui' }
  )
);
