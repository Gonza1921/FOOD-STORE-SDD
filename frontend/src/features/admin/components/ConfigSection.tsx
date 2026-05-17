import { useState } from 'react';
import { useAdminConfiguracion, useUpdateConfiguracion, ConfigItem } from '../hooks/useAdminConfiguracion';
import Skeleton from '@/shared/ui/Skeleton';

export default function ConfigSection() {
  const { data: configs, isLoading, error } = useAdminConfiguracion();
  const updateMutation = useUpdateConfiguracion();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (item: ConfigItem) => {
    setEditingKey(item.clave);
    setEditValue(item.valor);
  };

  const handleSave = async () => {
    if (!editingKey) return;
    try {
      await updateMutation.mutateAsync([{ clave: editingKey, valor: editValue }]);
      setEditingKey(null);
    } catch {
      // Error handled by mutation
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
  };

  if (isLoading) {
    return (
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Configuración del Sistema</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Configuración del Sistema</h3>
        <div className="bg-error-container text-on-error-container p-3 rounded-xl text-sm">
          Error al cargar configuración
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-on-surface">Configuración del Sistema</h3>
        {updateMutation.isPending && (
          <span className="text-xs text-brand-600 animate-pulse">Guardando...</span>
        )}
        {updateMutation.isSuccess && !updateMutation.isPending && (
          <span className="text-xs text-green-600">✔ Guardado</span>
        )}
      </div>

      <div className="divide-y divide-outline-variant/10">
        {configs?.map((item) => (
          <div key={item.clave} className="py-3 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-on-surface truncate">
                {item.descripcion || item.clave}
              </p>
              <p className="text-xs text-on-surface-variant/60 font-mono mt-0.5">{item.clave}</p>
            </div>

            {editingKey === item.clave ? (
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-32 px-3 py-1.5 text-sm rounded-lg border border-outline-variant/30 bg-surface 
                             text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') handleCancel();
                  }}
                />
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-600 text-white 
                             hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {updateMutation.isPending ? '...' : 'Guardar'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-outline-variant/20 
                             text-on-surface hover:bg-outline-variant/30 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-medium text-on-surface">{item.valor}</span>
                <button
                  onClick={() => handleEdit(item)}
                  className="p-1.5 rounded-lg text-on-surface-variant/50 hover:text-brand-600 
                             hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-all"
                  title="Editar"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {(!configs || configs.length === 0) && (
        <p className="text-sm text-on-surface-variant text-center py-6">
          No hay configuraciones disponibles
        </p>
      )}
    </div>
  );
}
