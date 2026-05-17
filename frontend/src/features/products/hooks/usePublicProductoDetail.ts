import { useQuery } from '@tanstack/react-query';
import { getPublicProductoDetail, ProductoPublicDetail, PRODUCT_QUERY_KEYS } from '../api/endpoints';

export function usePublicProductoDetail(productoId: number) {
  return useQuery<ProductoPublicDetail>({
    queryKey: [...PRODUCT_QUERY_KEYS.public(), 'detail', productoId],
    queryFn: () => getPublicProductoDetail(productoId),
    enabled: !!productoId,
  });
}
