import { useState } from 'react';
import { useUsuarios, useRoles, useCreateUsuario, useUpdateUsuario, useDeleteUsuario, type Usuario } from '../hooks/useAdminUsuarios';
import Skeleton from '@/shared/ui/Skeleton';
import Modal from '@/shared/ui/Modal';
import Button from '@/shared/ui/Button';
import Input from '@/shared/ui/Input';
import Badge from '@/shared/ui/Badge';
import { useUiStore } from '@/features/ui/store';

export default function AdminUsuariosPage() {
  const { data: usuarios, isLoading } = useUsuarios();
  const { data: roles } = useRoles();
  const createMut = useCreateUsuario();
  const updateMut = useUpdateUsuario();
  const deleteMut = useDeleteUsuario();
  const { addToast } = useUiStore();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    password: '',
    roles: ['CLIENT'] as string[],
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ email: '', nombre: '', password: '', roles: ['CLIENT'] });
    setModalOpen(true);
  };

  const handleOpenEdit = (user: Usuario) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      nombre: user.nombre,
      password: '',
      roles: user.roles,
    });
    setModalOpen(true);
  };

  const handleOpenDelete = (user: Usuario) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const data: { id: number; nombre?: string; roles?: string[] } = { id: editingUser.id };
        if (formData.nombre !== editingUser.nombre) data.nombre = formData.nombre;
        if (formData.roles !== editingUser.roles) data.roles = formData.roles;
        await updateMut.mutateAsync(data);
        addToast({ type: 'success', message: 'Usuario actualizado correctamente' });
      } else {
        await createMut.mutateAsync(formData);
        addToast({ type: 'success', message: 'Usuario creado correctamente' });
      }
      setModalOpen(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      addToast({ type: 'error', message: err.response?.data?.detail || 'Error al guardar usuario' });
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteMut.mutateAsync(userToDelete.id);
      addToast({ type: 'success', message: 'Usuario eliminado correctamente' });
      setDeleteConfirmOpen(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      addToast({ type: 'error', message: err.response?.data?.detail || 'Error al eliminar usuario' });
    }
  };

  const toggleRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const filteredUsuarios = usuarios?.filter(u =>
    u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Gestión de Usuarios</h1>
          <p className="text-on-surface-variant">Administra los usuarios del sistema</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <span className="material-symbols-outlined mr-2">add</span>
          Nuevo Usuario
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
          search
        </span>
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Table */}
      <div className="bg-surface-container rounded-2xl border border-outline-variant/20 overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-container-high">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-on-surface-variant">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-on-surface-variant">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-on-surface-variant">Roles</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-on-surface-variant">Creado</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-on-surface-variant">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {filteredUsuarios.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-on-surface-variant">
                  No hay usuarios disponibles
                </td>
              </tr>
            ) : (
              filteredUsuarios.map((user) => (
                <tr key={user.id} className="hover:bg-surface-container-lowest/50">
                  <td className="px-4 py-3 text-on-surface">{user.nombre}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{user.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} variant={role === 'ADMIN' ? 'error' : role === 'STOCK' ? 'warning' : 'info'}>
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant text-sm">
                    {new Date(user.creado_en).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="p-2 rounded-lg hover:bg-surface-container transition-colors"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined text-on-surface-variant">edit</span>
                      </button>
                      <button
                        onClick={() => handleOpenDelete(user)}
                        className="p-2 rounded-lg hover:bg-error-container transition-colors"
                        title="Eliminar"
                      >
                        <span className="material-symbols-outlined text-error">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={!!editingUser}
          />
          {!editingUser && (
            <Input
              label="Contraseña"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          )}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Roles</label>
            <div className="flex flex-wrap gap-2">
              {roles?.map((rol) => (
                <button
                  key={rol.codigo}
                  type="button"
                  onClick={() => toggleRole(rol.codigo)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    formData.roles.includes(rol.codigo)
                      ? 'bg-primary-container border-primary text-on-primary-container'
                      : 'bg-surface-container border-outline-variant text-on-surface-variant'
                  }`}
                >
                  {rol.nombre}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createMut.isPending || updateMut.isPending}>
              {editingUser ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Confirmar Eliminación"
      >
        <p className="text-on-surface-variant mb-6">
          ¿Estás seguro de que deseas eliminar al usuario <strong>{userToDelete?.nombre}</strong>?
          Esta acción realiza un soft delete.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} isLoading={deleteMut.isPending}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}