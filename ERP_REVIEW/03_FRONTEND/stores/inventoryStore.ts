import { create } from 'zustand';
import { inventoryApi, productsApi } from '@/api/services';
import type { Product, ProductBatch, StockLevelRow, StockMovement, StockTransfer, Warehouse } from '@/types/entities';

interface WarehouseDashboard {
  productCount: number;
  totalValueUzs: string;
  totalStockQty: string;
  batchCount: number;
  lowStockCount: number;
  movementsLast7Days: number;
  transfersLast30Days: number;
  receiptsLast30Days: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    sku: string;
    stock: string;
    valueUzs: string;
  }>;
}

interface InventoryState {
  products: Product[];
  warehouses: Warehouse[];
  stockLevels: StockLevelRow[];
  movements: StockMovement[];
  batches: ProductBatch[];
  transfers: StockTransfer[];
  branches: Array<{ id: string; name: string; address?: string | null; isDefault: boolean }>;
  isLoading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchWarehouses: () => Promise<void>;
  fetchStockLevels: (warehouseId?: string) => Promise<void>;
  fetchMovements: () => Promise<void>;
  fetchBatches: () => Promise<void>;
  fetchTransfers: (warehouseId?: string) => Promise<void>;
  fetchBranches: () => Promise<void>;
  fetchWarehouseDetail: (id: string) => Promise<{
    warehouse: Warehouse;
    batches: ProductBatch[];
    movements: StockMovement[];
    dashboard: WarehouseDashboard;
  }>;

  getProductById: (id: string) => Product | undefined;
  getWarehouseById: (id: string) => Warehouse | undefined;
  getMovementsByProduct: (productId: string) => StockMovement[];
  getBatchesByProduct: (productId: string) => ProductBatch[];

  createProduct: (input: Parameters<typeof productsApi.create>[0]) => Promise<Product>;
  updateProduct: (
    id: string,
    input: Parameters<typeof productsApi.update>[1],
  ) => Promise<Product>;
  updateProductPriceUzs: (id: string, priceUzs: number) => Promise<void>;
  updateProductPriceUsd: (id: string, priceUsd: number, rate: number) => Promise<void>;
  receiveStock: (input: {
    productId: string;
    quantity: number;
    costUzs: number;
    warehouseId: string;
    supplierId: string;
    paymentType: 'CASH' | 'CREDIT';
    note?: string;
    originalCurrency?: 'UZS' | 'USD';
    exchangeRateUsed?: number;
    batchNumber?: string;
    expiresAt?: string;
  }) => Promise<void>;
  adjustStock: (
    productId: string,
    quantityDelta: number,
    reason: string,
    warehouseId: string,
  ) => Promise<void>;
  transferStock: (input: {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    note?: string;
  }) => Promise<void>;
  createWarehouse: (input: {
    name: string;
    branchId: string;
    address?: string;
    isDefault?: boolean;
  }) => Promise<Warehouse>;
  updateWarehouse: (
    id: string,
    input: { name?: string; address?: string; branchId?: string; isDefault?: boolean },
  ) => Promise<Warehouse>;
  deactivateWarehouse: (id: string) => Promise<void>;
}

function mapTransfer(row: {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  quantity: string;
  performedBy: string;
  note?: string | null;
  createdAt: string;
}): StockTransfer {
  return {
    ...row,
    quantity: Number(row.quantity),
  };
}

function mapStockLevel(row: {
  productId: string;
  sku: string;
  productName: string;
  warehouseId: string;
  stock: string;
  batchCount: number;
}, warehouseName?: string): StockLevelRow {
  return {
    productId: row.productId,
    sku: row.sku,
    productName: row.productName,
    warehouseId: row.warehouseId,
    warehouseName,
    stock: Number(row.stock),
    batchCount: row.batchCount,
  };
}

export const useInventoryStore = create<InventoryState>()((set, get) => ({
  products: [],
  warehouses: [],
  stockLevels: [],
  movements: [],
  batches: [],
  transfers: [],
  branches: [],
  isLoading: false,
  error: null,

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all([
        get().fetchProducts(),
        get().fetchWarehouses(),
        get().fetchStockLevels(),
        get().fetchMovements(),
        get().fetchBatches(),
        get().fetchTransfers(),
      ]);
      set({ isLoading: false });
    } catch (err: unknown) {
      set({
        isLoading: false,
        error: (err as { message?: string }).message ?? 'Ma\'lumot yuklanmadi',
      });
    }
  },

  fetchProducts: async () => {
    const products = await productsApi.list();
    set({ products });
  },

  fetchWarehouses: async () => {
    const warehouses = await inventoryApi.listWarehouses();
    set({ warehouses });
  },

  fetchStockLevels: async (warehouseId?: string) => {
    const res = await inventoryApi.listStock(
      warehouseId ? { warehouseId } : undefined,
    );
    const whMap = new Map(get().warehouses.map((w) => [w.id, w.name]));
    const stockLevels = (res.data as Array<{
      productId: string;
      sku: string;
      productName: string;
      warehouseId: string;
      stock: string;
      batchCount: number;
    }>).map((row) => mapStockLevel(row, whMap.get(row.warehouseId)));
    set({ stockLevels });
  },

  fetchMovements: async () => {
    const movements = await inventoryApi.listMovements();
    set({ movements });
  },

  fetchBatches: async () => {
    const batches = await inventoryApi.listBatches();
    set({ batches });
  },

  fetchTransfers: async (warehouseId?: string) => {
    const res = await inventoryApi.listTransfers(
      warehouseId ? { warehouseId } : undefined,
    );
    set({
      transfers: (res.data as Parameters<typeof mapTransfer>[0][]).map(mapTransfer),
    });
  },

  fetchBranches: async () => {
    const branches = await inventoryApi.listBranches();
    set({ branches });
  },

  fetchWarehouseDetail: async (id) => {
    const [detail, dashboard] = await Promise.all([
      inventoryApi.getWarehouse(id),
      inventoryApi.getWarehouseDashboard(id),
    ]);
    return { ...detail, dashboard: dashboard as WarehouseDashboard };
  },

  getProductById: (id) => get().products.find((p) => p.id === id),

  getWarehouseById: (id) => get().warehouses.find((w) => w.id === id),

  getMovementsByProduct: (productId) => {
    const product = get().products.find((p) => p.id === productId);
    if (!product) return [];
    return get().movements.filter((m) => m.productName === product.name);
  },

  getBatchesByProduct: (productId) =>
    get()
      .batches.filter((b) => b.productId === productId && b.remaining > 0)
      .sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()),

  createProduct: async (input) => {
    const product = await productsApi.create(input);
    await get().fetchProducts();
    return product;
  },

  updateProduct: async (id, input) => {
    const product = await productsApi.update(id, input);
    await get().fetchProducts();
    return product;
  },

  updateProductPriceUzs: async (id, priceUzs) => {
    await productsApi.update(id, { salePriceUzs: priceUzs, purchasePriceUzs: priceUzs * 0.72 });
    await get().fetchProducts();
  },

  updateProductPriceUsd: async (id, priceUsd) => {
    await productsApi.update(id, { salePriceUsd: priceUsd });
    await get().fetchProducts();
  },

  receiveStock: async (input) => {
    await inventoryApi.receive({
      productId: input.productId,
      warehouseId: input.warehouseId,
      quantity: input.quantity,
      unitCostUzs: input.costUzs,
      supplierId: input.supplierId,
      paymentType: input.paymentType,
      note: input.note,
      originalCurrency: input.originalCurrency,
      exchangeRateUsed: input.exchangeRateUsed,
      batchNumber: input.batchNumber,
      expiresAt: input.expiresAt,
    });
    await get().fetchAll();
  },

  adjustStock: async (productId, quantityDelta, reason, warehouseId) => {
    await inventoryApi.adjust({ productId, warehouseId, quantityDelta, reason });
    await get().fetchAll();
  },

  transferStock: async (input) => {
    await inventoryApi.transfer(input);
    await get().fetchAll();
  },

  createWarehouse: async (input) => {
    const warehouse = await inventoryApi.createWarehouse(input);
    await get().fetchWarehouses();
    return warehouse;
  },

  updateWarehouse: async (id, input) => {
    const warehouse = await inventoryApi.updateWarehouse(id, input);
    await get().fetchWarehouses();
    return warehouse;
  },

  deactivateWarehouse: async (id) => {
    await inventoryApi.deactivateWarehouse(id);
    await get().fetchWarehouses();
  },
}));
