import { useState, useCallback, useEffect } from 'react';
import { axiosClient } from '@/shared/api/axiosClient';
import { API } from '@/shared/api/endpoints';
import type { PublicCategory } from './usePublicCategories';

export interface ProductoPublicRef {
  id: number;
  nombre: string;
  precio_base: string;
  disponible: boolean;
}

export interface CategoryDetail {
  id: number;
  nombre: string;
  slug: string;
  descripcion?: string;
  parent_id?: number | null;
  subcategorias: PublicCategory[];
  productos: ProductoPublicRef[];
}

export interface UseCategoryDetailReturn {
  category: CategoryDetail | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCategoryDetail(slug: string): UseCategoryDetailReturn {
  const [category, setCategory] = useState<CategoryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get(API.CATEGORIES_PUBLIC.DETAIL(slug));
      setCategory(response.data ?? null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar la categoría';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { category, isLoading, error, refetch };
}
