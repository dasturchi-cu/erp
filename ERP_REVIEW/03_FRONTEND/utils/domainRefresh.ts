import { useCustomerStore } from '@/stores/customerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useSalesStore } from '@/stores/salesStore';
import { useSupplierStore } from '@/stores/supplierStore';

/** Refetch domain caches after mutations that affect stock, sales, or debt. */
export async function refreshAfterSaleMutation(): Promise<void> {
  await Promise.all([
    useInventoryStore.getState().fetchAll(),
    useSalesStore.getState().fetchSales(),
    useCustomerStore.getState().fetchCustomers(),
    useSupplierStore.getState().fetchSuppliers(),
  ]);
}

export async function refreshAfterReturnMutation(): Promise<void> {
  await Promise.all([
    useInventoryStore.getState().fetchAll(),
    useSalesStore.getState().fetchSales(),
    useSalesStore.getState().fetchReturns(),
    useCustomerStore.getState().fetchCustomers(),
  ]);
}
