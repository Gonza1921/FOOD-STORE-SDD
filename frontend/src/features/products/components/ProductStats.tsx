/**
 * ProductStats — Bento-style stats overview cards for the products dashboard.
 * Shows Total Stock count and Low Stock alert count from real data.
 */

import { type Producto } from '../hooks';

export interface ProductStatsProps {
  /** All products from the current query (may be paginated) */
  products?: Producto[];
  /** Total count of ALL products (not just current page) */
  totalCount?: number;
  /** Loading state */
  isLoading?: boolean;
}

const LOW_STOCK_THRESHOLD = 20;

export function ProductStats({ products, totalCount, isLoading }: ProductStatsProps) {
  const lowStockProducts = products?.filter((p) => p.stock_cantidad < LOW_STOCK_THRESHOLD) ?? [];
  const totalStock = products?.reduce((sum, p) => sum + p.stock_cantidad, 0) ?? 0;

  if (isLoading) {
    return (
      <section className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 animate-pulse">
          <div className="h-8 w-20 bg-surface-container rounded mb-3" />
          <div className="h-3 w-16 bg-surface-container rounded mb-2" />
          <div className="h-7 w-24 bg-surface-container rounded" />
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 animate-pulse">
          <div className="h-8 w-20 bg-surface-container rounded mb-3" />
          <div className="h-3 w-16 bg-surface-container rounded mb-2" />
          <div className="h-7 w-24 bg-surface-container rounded" />
        </div>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-2 gap-3 mb-8">
      {/* Total Stock card */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30">
        <span className="material-symbols-outlined text-brand-600 mb-2 text-[24px]">inventory_2</span>
        <p className="text-[11px] leading-[14px] font-medium tracking-[0.05em] uppercase text-on-surface-variant">
          TOTAL STOCK
        </p>
        <h3 className="text-[20px] leading-[28px] font-semibold text-on-surface mt-1">
          {totalCount?.toLocaleString() ?? totalStock.toLocaleString()}
        </h3>
      </div>

      {/* Low Stock card */}
      <div className="bg-error-container/20 p-4 rounded-xl border border-error/10">
        <span className="material-symbols-outlined text-error mb-2 text-[24px]">warning</span>
        <p className="text-[11px] leading-[14px] font-medium tracking-[0.05em] uppercase text-on-error-container">
          STOCK BAJO
        </p>
        <h3 className="text-[20px] leading-[28px] font-semibold text-on-error-container mt-1">
          {lowStockProducts.length}
        </h3>
      </div>
    </section>
  );
}

export default ProductStats;
