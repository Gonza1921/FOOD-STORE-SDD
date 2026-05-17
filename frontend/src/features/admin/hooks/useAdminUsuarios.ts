import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '@/shared/api/axiosClient';

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  roles: string[];
  eliminado_en: string | null;
  creado_en: string;
}

export interface Rol {
  id: number;
  codigo: string;
  nombre: string;
}

interface CreateUsuarioData {
  email: string;
  nombre: string;
  password: string;
  roles: string[];
}

interface UpdateUsuarioData {
  nombre?: string;
  email?: string;
  roles?: string[];
}

// GET /api/v1/admin/usuarios
const getUsuarios = async (page = 1, limit = 20, search?: string): Promise<Usuario[]> => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.append('search', search);
  const response = await axiosClient.get<Usuario[]>(`/api/v1/admin/usuarios?${params}`);
  return response.data;
};

// GET /api/v1/admin/usuarios/roles
const getRoles = async (): Promise<Rol[]> => {
  const response = await axiosClient.get<Rol[]>('/api/v1/admin/usuarios/roles');
  return response.data;
};

// GET /api/v1/admin/usuarios/{id}
const getUsuario = async (id: number): Promise<Usuario> => {
  const response = await axiosClient.get<Usuario>(`/api/v1/admin/usuarios/${id}`);
  return response.data;
};

// POST /api/v1/admin/usuarios
const createUsuario = async (data: CreateUsuarioData): Promise<Usuario> => {
  const response = await axiosClient.post<Usuario>('/api/v1/admin/usuarios', data);
  return response.data;
};

// PATCH /api/v1/admin/usuarios/{id}
const updateUsuario = async ({ id, ...data }: UpdateUsuarioData & { id: number }): Promise<Usuario> => {
  const response = await axiosClient.patch<Usuario>(`/api/v1/admin/usuarios/${id}`, data);
  return response.data;
};

// DELETE /api/v1/admin/usuarios/{id}
const deleteUsuario = async (id: number): Promise<void> => {
  await axiosClient.delete(`/api/v1/admin/usuarios/${id}`);
};

// Hooks
export function useUsuarios(page = 1, search?: string) {
  return useQuery({
    queryKey: ['admin-usuarios', page, search],
    queryFn: () => getUsuarios(page, 20, search),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ['admin-roles'],
    queryFn: getRoles,
  });
}

export function useUsuario(id: number) {
  return useQuery({
    queryKey: ['admin-usuario', id],
    queryFn: () => getUsuario(id),
    enabled: !!id,
  });
}

export function useCreateUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
    },
  });
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUsuario,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['admin-usuario', variables.id] });
    },
  });
}

export function useDeleteUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
    },
  });
}