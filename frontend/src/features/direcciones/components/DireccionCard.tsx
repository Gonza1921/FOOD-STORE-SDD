/**
 * DireccionCard - Single address card with actions
 *
 * States: renders address data with action buttons.
 * Loading/empty states handled by parent page.
 */

import { useState } from 'react';
import { Card, Badge, Button } from '@/shared/ui';
import type { DireccionResponse } from '../api/endpoints';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DireccionCardProps {
  direccion: DireccionResponse;
  onEdit: (direccion: DireccionResponse) => void;
  onDelete: (id: number) => void;
  onSetPrincipal: (id: number) => void;
  /** Disable actions (e.g. during mutation) */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DireccionCard({
  direccion,
  onEdit,
  onDelete,
  onSetPrincipal,
  disabled = false,
}: DireccionCardProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const addressLines = [
    direccion.linea1,
    direccion.linea2,
    `${direccion.ciudad}, ${direccion.provincia}`,
    `CP: ${direccion.codigo_postal}`,
  ].filter(Boolean);

  return (
    <Card variant="elevated" className="relative">
      {/* ── Header: alias + badges ── */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="material-symbols-outlined text-brand-600 flex-shrink-0"
            style={{ fontSize: '22px', fontVariationSettings: '"wght" 400' }}
          >
            {direccion.es_principal ? 'home' : 'location_on'}
          </span>

          <div className="min-w-0">
            {direccion.alias && (
              <p className="truncate text-sm font-semibold text-on-surface">
                {direccion.alias}
              </p>
            )}
          </div>
        </div>

        {direccion.es_principal && (
          <Badge variant="brand" size="sm">
            Principal
          </Badge>
        )}
      </div>

      {/* ── Address body ── */}
      <div className="mb-4 space-y-0.5">
        {addressLines.map((line, i) => (
          <p
            key={i}
            className={`text-sm ${
              i === 0
                ? 'font-medium text-on-surface'
                : 'text-on-surface-variant'
            }`}
          >
            {line}
          </p>
        ))}
        {direccion.referencia && (
          <p className="mt-1 text-xs italic text-on-surface-variant/70">
            Ref: {direccion.referencia}
          </p>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex flex-wrap items-center gap-2 border-t border-outline-variant/20 pt-3">
        {!direccion.es_principal && (
          <Button
            variant="ghost"
            size="sm"
            icon="star"
            disabled={disabled}
            onClick={() => onSetPrincipal(direccion.id)}
          >
            Principal
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          icon="edit"
          disabled={disabled}
          onClick={() => onEdit(direccion)}
        >
          Editar
        </Button>

        {showConfirmDelete ? (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-error font-medium">
              ¿Eliminar?
            </span>
            <Button
              variant="danger"
              size="sm"
              disabled={disabled}
              onClick={() => {
                setShowConfirmDelete(false);
                onDelete(direccion.id);
              }}
            >
              Sí
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => setShowConfirmDelete(false)}
            >
              No
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            icon="delete"
            disabled={disabled}
            className="ml-auto text-error hover:bg-error/10"
            onClick={() => setShowConfirmDelete(true)}
          >
            Eliminar
          </Button>
        )}
      </div>
    </Card>
  );
}
