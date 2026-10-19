import { usePosCartStore } from './posCartStore';
import { useSalesStore } from './salesStore';
import { useCustomerStore } from './customerStore';
import { useInventoryStore } from './inventoryStore';
import { useSupplierStore } from './supplierStore';
import { useAdminStore } from './adminStore';
import { useCurrencyStore } from './currencyStore';

/**
 * Drop everything cached for the previous company/user so a logout or company
 * switch can't show (or sell from) another company's cart, products or sales.
 * The offline queue is deliberately kept: it holds unsynced writes.
 */
export function resetCompanyScopedStores(): void {
  for (const store of [
    usePosCartStore,
    useSalesStore,
    useCustomerStore,
    useInventoryStore,
    useSupplierStore,
    useAdminStore,
    useCurrencyStore,
  ]) {
    // Each store's own initial state; `true` replaces instead of merging.
    (store as { setState: (s: unknown, replace: true) => void; getInitialState: () => unknown })
      .setState(store.getInitialState(), true);
  }
}
