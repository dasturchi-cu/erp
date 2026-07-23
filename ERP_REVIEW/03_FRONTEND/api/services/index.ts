export { authApi } from './authApi';
export { productsApi, categoriesApi } from './catalogApi';
export {
  currencyApi,
  inventoryApi,
  customersApi,
  debtApi,
} from './domainApi';
export { suppliersApi } from './suppliersApi';
export { salesApi, type CreateSaleInput } from './salesApi';
export { adminApi } from './adminApi';
export { analyticsApi } from './analyticsApi';
export { notificationsApi } from './notificationsApi';
export { reportsApi } from './reportsApi';
export type { AdminOverview } from '@/types/entities';

/** @deprecated Use debtApi */
export { debtApi as paymentsApi } from './domainApi';
