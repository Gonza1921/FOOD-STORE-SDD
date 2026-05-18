/**
 * DireccionesListPage — User's delivery addresses management page.
 * Shows list of address cards with create/edit/delete/principal actions.
 * Path: /mis-direcciones
 *
 * States:
 * - Loading: skeleton grid
 * - Error: error message + retry
 * - Empty: CTA to create first address
 * - Data: grid of DireccionCard + modal for create/edit
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Modal } from '@/shared/ui';
import { useDirecciones } from '../hooks/useDirecciones';
import {
  useCreateDireccion,
  useUpdateDireccion,
  useDeleteDireccion,
  useSetDireccionPrincipal,
} from '../hooks/useDireccionMutations';
import DireccionCard from './DireccionCard';
import DireccionForm from './DireccionForm';
import type {
  DireccionResponse,
  DireccionCreatePayload,
  DireccionUpdatePayload,
} from '../api/endpoints';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DireccionesListPage() {
  const location = useLocation();

  // ── Auto-open create modal if navigating from "Nueva dirección" link ──
  const isNuevaRoute = location.pathname.endsWith('/nueva');

  // ── List query ──
  const { data: direcciones, isLoading, isError, error, refetch } =
    useDirecciones();

  // ── Modal state ──
  const [modalOpen, setModalOpen] = useState(isNuevaRoute);
  const [editingAddress, setEditingAddress] = useState<
    DireccionResponse | undefined
  >(undefined);

  // Auto-open modal when navigating from /mis-direcciones/nueva
  useEffect(() => {
    if (isNuevaRoute && !modalOpen && !isLoading) {
      setModalOpen(true);
    }
  }, [isNuevaRoute, modalOpen, isLoading]);

  // ── Toast/feedback state ──
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // ── Mutations ──
  const createMutation = useCreateDireccion({
    onSuccess: () => {
      setModalOpen(false);
      setEditingAddress(undefined);
      showFeedback('success', 'Dirección creada correctamente');
    },
    onError: (err) => showFeedback('error', err.message),
  });

  const updateMutation = useUpdateDireccion({
    onSuccess: () => {
      setModalOpen(false);
      setEditingAddress(undefined);
      showFeedback('success', 'Dirección actualizada correctamente');
    },
    onError: (err) => showFeedback('error', err.message),
  });

  const deleteMutation = useDeleteDireccion({
    onSuccess: () =>
      showFeedback('success', 'Dirección eliminada correctamente'),
    onError: (err) => showFeedback('error', err.message),
  });

  const setPrincipalMutation = useSetDireccionPrincipal({
    onSuccess: () =>
      showFeedback('success', 'Dirección principal actualizada'),
    onError: (err) => showFeedback('error', err.message),
  });

  // ── Handlers ──
  const handleOpenCreate = () => {
    setEditingAddress(undefined);
    setModalOpen(true);
  };

  const handleOpenEdit = (direccion: DireccionResponse) => {
    setEditingAddress(direccion);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingAddress(undefined);
  };

  const handleSave = async (
    data: DireccionCreatePayload | DireccionUpdatePayload
  ) => {
    if (editingAddress) {
      await updateMutation.mutateAsync({
        id: editingAddress.id,
        data: data as DireccionUpdatePayload,
      });
    } else {
      await createMutation.mutateAsync(data as DireccionCreatePayload);
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleSetPrincipal = (id: number) => {
    setPrincipalMutation.mutate({ id, data: { es_principal: true } });
  };

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    setPrincipalMutation.isPending;

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <header className="mb-6">
            <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface">
              Mis Direcciones
            </h1>
            <p className="text-[14px] leading-[20px] text-on-surface-variant mt-0.5">
              Gestioná tus direcciones de entrega
            </p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-outline-variant/20 rounded-xl h-40"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (isError) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <header className="mb-6">
            <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface">
              Mis Direcciones
            </h1>
            <p className="text-[14px] leading-[20px] text-on-surface-variant mt-0.5">
              Gestioná tus direcciones de entrega
            </p>
          </header>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-8 text-center">
            <span
              className="material-symbols-outlined text-4xl text-red-400 mb-3 inline-block"
              style={{ fontVariationSettings: '"wght" 300' }}
            >
              error_outline
            </span>
            <p className="text-on-surface-variant mb-4">
              {error?.message || 'Error al cargar las direcciones'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty State ──
  if (!direcciones || direcciones.length === 0) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <header className="mb-6">
            <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface">
              Mis Direcciones
            </h1>
            <p className="text-[14px] leading-[20px] text-on-surface-variant mt-0.5">
              Gestioná tus direcciones de entrega
            </p>
          </header>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-12 text-center">
            <span
              className="material-symbols-outlined text-5xl text-outline-variant/50 mb-4 inline-block"
              style={{ fontVariationSettings: '"wght" 200' }}
            >
              location_off
            </span>
            <h2 className="text-lg font-semibold text-on-surface mb-2">
              No tenés direcciones guardadas
            </h2>
            <p className="text-sm text-on-surface-variant mb-6">
              Agregá una dirección para recibir tus pedidos
            </p>
            <Button
              variant="primary"
              icon="add"
              onClick={handleOpenCreate}
            >
              Agregar dirección
            </Button>
          </div>

          {/* Create modal from empty state */}
          <Modal
            open={modalOpen}
            onClose={handleCloseModal}
            title="Nueva dirección"
          >
            <DireccionForm
              onSave={handleSave}
              onCancel={handleCloseModal}
              isSubmitting={createMutation.isPending}
            />
          </Modal>
        </div>
      </div>
    );
  }

  // ── Data State ──
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── Feedback banner ── */}
        {feedback && (
          <div
            className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
              feedback.type === 'success'
                ? 'feedback-banner--success'
                : 'feedback-banner--error'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* ── Page Header ── */}
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface">
                Mis Direcciones
              </h1>
              <p className="text-[14px] leading-[20px] text-on-surface-variant mt-0.5">
                Gestioná tus direcciones de entrega
              </p>
            </div>
            <Button
              variant="primary"
              icon="add"
              onClick={handleOpenCreate}
            >
              Agregar
            </Button>
          </div>
        </header>

        {/* ── Address Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {direcciones.map((addr) => (
            <DireccionCard
              key={addr.id}
              direccion={addr}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              onSetPrincipal={handleSetPrincipal}
              disabled={isMutating}
            />
          ))}
        </div>

        {/* ── Create/Edit Modal ── */}
        <Modal
          open={modalOpen}
          onClose={handleCloseModal}
          title={editingAddress ? 'Editar dirección' : 'Nueva dirección'}
        >
          <DireccionForm
            key={editingAddress?.id ?? 'create'}
            initialData={editingAddress}
            onSave={handleSave}
            onCancel={handleCloseModal}
            isSubmitting={
              editingAddress
                ? updateMutation.isPending
                : createMutation.isPending
            }
          />
        </Modal>
      </div>
    </div>
  );
}
