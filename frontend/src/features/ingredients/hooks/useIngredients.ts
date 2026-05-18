import { useState, useCallback, useEffect } from 'react';
import { axiosClient } from '@/shared/api/axiosClient';
import { API } from '@/shared/api/endpoints';

export interface Ingredient {
  id: number;
  nombre: string;
  descripcion?: string;
  es_alergeno: boolean;
}

export interface IngredientFormData {
  nombre: string;
  descripcion?: string;
  es_alergeno?: boolean;
}

export interface UseIngredientsReturn {
  ingredients: Ingredient[];
  isLoading: boolean;
  error: string | null;
  create: (data: IngredientFormData) => Promise<void>;
  update: (id: number, data: IngredientFormData) => Promise<void>;
  remove: (id: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useIngredients(): UseIngredientsReturn {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get(API.INGREDIENTS.LIST);
      setIngredients(response.data ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar ingredientes';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = useCallback(
    async (data: IngredientFormData) => {
      setError(null);
      try {
        await axiosClient.post(API.INGREDIENTS.CREATE, data);
        await refetch();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al crear ingrediente';
        setError(message);
        throw err;
      }
    },
    [refetch]
  );

  const update = useCallback(
    async (id: number, data: IngredientFormData) => {
      setError(null);
      try {
        await axiosClient.put(API.INGREDIENTS.UPDATE(id), data);
        await refetch();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al actualizar ingrediente';
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
        await axiosClient.delete(API.INGREDIENTS.DELETE(id));
        await refetch();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al eliminar ingrediente';
        setError(message);
        throw err;
      }
    },
    [refetch]
  );

  return { ingredients, isLoading, error, create, update, remove, refetch };
}
