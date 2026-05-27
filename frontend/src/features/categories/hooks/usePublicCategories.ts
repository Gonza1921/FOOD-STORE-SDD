import { useState, useCallback, useEffect } from 'react';
import { axiosClient } from '@/shared/api/axiosClient';
import { API } from '@/shared/api/endpoints';

export interface PublicCategory {
  id: number;
  nombre: string;
  slug: string;
  descripcion?: string;
  parent_id?: number | null;
  producto_count: number;
}

export interface UsePublicCategoriesReturn {
  categories: PublicCategory[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePublicCategories(): UsePublicCategoriesReturn {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get(API.CATEGORIES_PUBLIC.LIST);
      setCategories(response.data ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar categorías';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { categories, isLoading, error, refetch };
}
