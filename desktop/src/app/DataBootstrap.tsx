import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCurrencyStore } from '@/stores/currencyStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useSupplierStore } from '@/stores/supplierStore';
import { useSalesStore } from '@/stores/salesStore';
import { useOfflineStore } from '@/stores/offlineStore';

/** Loads domain data from API when company context is active. */
export function DataBootstrap({ children }: { children: React.ReactNode }) {
  const activeCompanyId = useAuthStore((s) => s.activeCompany?.id);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !activeCompanyId) {
      loadedFor.current = null;
      return;
    }
    if (loadedFor.current === activeCompanyId) return;
    loadedFor.current = activeCompanyId;

    void useCurrencyStore.getState().fetchRates();
    void useInventoryStore.getState().fetchAll();
    void useCustomerStore.getState().fetchCustomers();
    void useCustomerStore.getState().fetchPayments();
    void useSupplierStore.getState().fetchSuppliers();
    void useSupplierStore.getState().fetchPayments();
    void useSalesStore.getState().fetchSales();
    void useSalesStore.getState().fetchReturns();
  }, [isAuthenticated, activeCompanyId]);

  // Offline queue auto-sync trigger
  useEffect(() => {
    const handleOnline = () => {
      void useOfflineStore.getState().processSync();
    };
    window.addEventListener('online', handleOnline);

    void useOfflineStore.getState().processSync();
    const interval = setInterval(() => {
      void useOfflineStore.getState().processSync();
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, []);

  return <>{children}</>;
}
