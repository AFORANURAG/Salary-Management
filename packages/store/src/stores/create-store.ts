import { create, type StateCreator } from "zustand";
import { devtools, persist, type PersistOptions } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

/**
 * Creates a Zustand store with devtools + immer middleware pre-configured.
 * Use this for non-persisted stores.
 *
 * @example
 * const useMyStore = createStore<MyState>('my-store', (set) => ({
 *   count: 0,
 *   increment: () => set((state) => { state.count++ }),
 * }));
 */
export function createStore<T>(
  name: string,
  initializer: StateCreator<T, [["zustand/devtools", never], ["zustand/immer", never]], []>
) {
  return create<T>()(
    devtools(immer(initializer), {
      name,
      enabled: process.env.NODE_ENV === "development",
    })
  );
}

/**
 * Creates a Zustand store with devtools + immer + localStorage persistence.
 * Use this for stores that need to survive page reloads.
 *
 * @example
 * const useMyStore = createPersistedStore<MyState>('my-store', (set) => ({
 *   theme: 'light',
 *   setTheme: (t) => set((state) => { state.theme = t }),
 * }), { partialize: (s) => ({ theme: s.theme }) as MyState });
 */
export function createPersistedStore<T>(
  name: string,
  initializer: StateCreator<
    T,
    [["zustand/devtools", never], ["zustand/persist", unknown], ["zustand/immer", never]],
    []
  >,
  persistOptions?: Omit<Partial<PersistOptions<T>>, "name">
) {
  return create<T>()(
    devtools(
      persist(immer(initializer), {
        name,
        ...(persistOptions as Partial<PersistOptions<T>>),
      }),
      {
        name,
        enabled: process.env.NODE_ENV === "development",
      }
    )
  );
}
