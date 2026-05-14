/**
 * ProductCard — Card component for displaying a product in the inventory list.
 * Stitch-inspired design with image placeholder, stock bar, and actions.
 */

import { type Producto } from '../hooks';

export interface ProductCardProps {
  product: Producto;
  onEdit?: (product: Producto) => void;
  onDelete?: (product: Producto) => void;
  onStockEdit?: (product: Producto) => void;
  /** When true, the stock area shows inline editing instead of the bar */
  isEditingStock?: boolean;
  /** Rendered when isEditingStock is true — receives the StockManager component */
  stockEditor?: React.ReactNode;
}

/** Compute a deterministic pastel color from a string */
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 75%)`;
}

/** Get the initials for the avatar placeholder */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Stock level helpers */
const LOW_STOCK_THRESHOLD = 20;

function getStockStatus(stock: number): { label: string; level: 'low' | 'medium' | 'ok'; colorClass: string; barColor: string; percentage: number } {
  // Cap percentage display at 100%
  const percentage = Math.min(stock, 100);

  if (stock <= LOW_STOCK_THRESHOLD) {
    return {
      label: `${stock} uds. (Bajo)`,
      level: 'low',
      colorClass: 'text-error',
      barColor: 'bg-error',
      percentage: Math.max((stock / LOW_STOCK_THRESHOLD) * 100, 5),
    };
  }

  if (stock <= 50) {
    return {
      label: `${stock} uds.`,
      level: 'medium',
      colorClass: 'text-amber-600',
      barColor: 'bg-amber-500',
      percentage: Math.min(percentage, 100),
    };
  }

  return {
    label: `${stock} uds.`,
    level: 'ok',
    colorClass: 'text-secondary-brand',
    barColor: 'bg-secondary-brand',
    percentage: Math.min(percentage, 100),
  };
}

export function ProductCard({ product, onEdit, onDelete, onStockEdit, isEditingStock, stockEditor }: ProductCardProps) {
  const categoryName = product.categorias[0]?.nombre ?? 'Sin categoría';
  const stockStatus = getStockStatus(product.stock_cantidad);
  const bgColor = stringToColor(product.nombre);
  const initials = getInitials(product.nombre);

  return (
    <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex gap-4">
        {/* Image / Placeholder */}
        <div
          className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold text-lg shadow-sm"
          style={{ backgroundColor: bgColor }}
        >
          {initials}
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          {/* Header row */}
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <h4 className="text-[16px] leading-[24px] font-semibold text-on-surface truncate">
                {product.nombre}
              </h4>
              <p className="text-[11px] leading-[14px] font-medium text-on-surface-variant mt-0.5">
                ID: {product.id} &middot; {categoryName}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(product)}
                  className="p-1.5 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant hover:text-brand-600"
                  title="Editar producto"
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(product)}
                  className="p-1.5 rounded-full hover:bg-error-container/30 transition-colors text-on-surface-variant hover:text-error"
                  title="Eliminar producto"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              )}
            </div>
          </div>

          {/* Stock bar/editor + price row */}
          <div className="mt-3 flex justify-between items-end gap-4">
            <div className="flex-1 min-w-0">
              {isEditingStock && stockEditor ? (
                stockEditor
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <p className={`text-[11px] leading-[14px] font-semibold mb-1 ${stockStatus.colorClass}`}>
                      Stock: {stockStatus.label}
                    </p>
                    {onStockEdit && (
                      <button
                        type="button"
                        onClick={() => onStockEdit(product)}
                        className="text-[11px] leading-[14px] text-brand-600 hover:text-brand-700 underline"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden max-w-[128px]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${stockStatus.barColor}`}
                      style={{ width: `${stockStatus.percentage}%` }}
                    />
                  </div>
                </>
              )}
            </div>
            <p className="text-[16px] leading-[24px] font-bold text-brand-600 flex-shrink-0">
              ${product.precio_base}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
