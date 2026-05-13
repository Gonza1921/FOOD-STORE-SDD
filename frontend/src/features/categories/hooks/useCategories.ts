import { useState, useCallback } from 'react';
import { axiosClient } from '@/shared/api/axiosClient';
import { API } from '@/shared/api/endpoints';

export interface Category {
  id: number;
  nombre: string;
  descripcion?: string;
  parent_id?: number | null;
  children?: Category[];
}

export interface CategoryFormData {
  nombre: string;
  descripcion?: string;
  parent_id?: number | null;
}

export interface UseCategoriesReturn {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  create: (data: CategoryFormData) => Promise<void>;
  update: (id: number, data: CategoryFormData) => Promise<void>;
  remove: (id: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get(API.CATEGORIES.LIST);
      setCategories(response.data ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar categorías';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const create = useCallback(
    async (data: CategoryFormData) => {
      setError(null);
      try {
        await axiosClient.post(API.CATEGORIES.CREATE, data);
        await refetch();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al crear categoría';
        setError(message);
        throw err;
      }
    },
    [refetch]
  );

  const update = useCallback(
    async (id: number, data: CategoryFormData) => {
      setError(null);
      try {
        await axiosClient.put(API.CATEGORIES.UPDATE(id), data);
        await refetch();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al actualizar categoría';
        setError(message);
        throw err;
      }
    },
    [refetch]
  );

  const remove = useCallback(
    async (id: number) => {
      setError(null);
      try {
        await axiosClient.delete(API.CATEGORIES.DELETE(id));
        await refetch();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al eliminar categoría';
        setError(message);
        throw err;
      }
    },
    [refetch]
  );

  return { categories, isLoading, error, create, update, remove, refetch };
}
