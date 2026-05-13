// Query hooks
export { useProducts } from './useProducts';
export { useProductDetail } from './useProductDetail';
export { usePublicCatalog } from './usePublicCatalog';

// Mutation hooks
export {
  useProductCreate,
  useProductUpdate,
  useProductDelete,
  useProductStockUpdate,
} from './useProductMutations';

// Types
export type {
  UseProductsReturn,
  UseProductsParams,
} from './useProducts';

export type {
  UseProductDetailReturn,
  UseProductDetailParams,
} from './useProductDetail';

export type {
  UsePublicCatalogReturn,
  UsePublicCatalogParams,
} from './usePublicCatalog';

export type {
  UseProductCreateReturn,
  UseProductCreateParams,
  UseProductUpdateReturn,
  UseProductUpdateParams,
  UseProductDeleteReturn,
  UseProductDeleteParams,
  UseProductStockUpdateReturn,
  UseProductStockUpdateParams,
} from './useProductMutations';
