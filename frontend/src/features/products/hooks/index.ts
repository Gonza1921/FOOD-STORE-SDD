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

// Types (re-export from API)
export type {
  Producto,
  ProductoCreate,
  ProductoUpdate,
  ProductoPublic,
  ProductoListResponse,
  ProductoPublicListResponse,
  CategoriaRef,
  IngredienteRef,
} from '../api/endpoints';

// Query types
export type { UseProductsReturn, UseProductsParams } from './useProducts';

export type { UseProductDetailReturn, UseProductDetailParams } from './useProductDetail';

export type { UsePublicCatalogReturn, UsePublicCatalogParams } from './usePublicCatalog';

// Mutation types
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
