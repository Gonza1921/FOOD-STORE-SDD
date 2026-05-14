/**
 * DireccionForm - Create/edit delivery address form
 *
 * States:
 * - Create mode: empty fields, optional default=principal
 * - Edit mode: pre-filled fields from initialData
 * - Submitting: all fields disabled, loading indicator
 * - Validation errors: per-field error messages
 */

import { useState, useEffect, useCallback } from 'react';
import { Input, Button } from '@/shared/ui';
import type {
  DireccionResponse,
  DireccionCreatePayload,
  DireccionUpdatePayload,
} from '../api/endpoints';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DireccionFormProps {
  /** Address to edit (undefined = create mode) */
  initialData?: DireccionResponse;
  /** Called on successful submit */
  onSave: (
    data: DireccionCreatePayload | DireccionUpdatePayload
  ) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface FormState {
  alias: string;
  linea1: string;
  linea2: string;
  ciudad: string;
  provincia: string;
  codigo_postal: string;
  referencia: string;
  es_principal: boolean;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildInitialState(data?: DireccionResponse): FormState {
  return {
    alias: data?.alias ?? '',
    linea1: data?.linea1 ?? '',
    linea2: data?.linea2 ?? '',
    ciudad: data?.ciudad ?? '',
    provincia: data?.provincia ?? '',
    codigo_postal: data?.codigo_postal ?? '',
    referencia: data?.referencia ?? '',
    es_principal: data?.es_principal ?? false,
  };
}

function validate(state: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!state.linea1.trim()) {
    errors.linea1 = 'La calle es obligatoria';
  }
  if (!state.ciudad.trim()) {
    errors.ciudad = 'La ciudad es obligatoria';
  }
  if (!state.provincia.trim()) {
    errors.provincia = 'La provincia es obligatoria';
  }
  if (!state.codigo_postal.trim()) {
    errors.codigo_postal = 'El código postal es obligatorio';
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DireccionForm({
  initialData,
  onSave,
  onCancel,
  isSubmitting = false,
}: DireccionFormProps) {
  const isEdit = !!initialData;
  const [form, setForm] = useState<FormState>(() =>
    buildInitialState(initialData)
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Reset form when initialData changes
  useEffect(() => {
    setForm(buildInitialState(initialData));
    setFieldErrors({});
  }, [initialData]);

  const handleChange = useCallback(
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      // Clear field error on change
      if (fieldErrors[field]) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [fieldErrors]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const base = {
      alias: form.alias || null,
      linea1: form.linea1.trim(),
      linea2: form.linea2.trim() || null,
      ciudad: form.ciudad.trim(),
      provincia: form.provincia.trim(),
      codigo_postal: form.codigo_postal.trim(),
      referencia: form.referencia.trim() || null,
    };

    if (isEdit) {
      const payload: DireccionUpdatePayload = { ...base };
      // Only send es_principal if it differs from original
      if (form.es_principal !== initialData.es_principal) {
        payload.es_principal = form.es_principal;
      }
      await onSave(payload);
    } else {
      const payload: DireccionCreatePayload = {
        ...base,
        es_principal: form.es_principal,
      };
      await onSave(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ── Alias ── */}
      <Input
        label="Alias (opcional)"
        placeholder="Ej: Casa, Trabajo"
        icon="label"
        value={form.alias}
        onChange={handleChange('alias')}
        error={fieldErrors.alias}
        disabled={isSubmitting}
        maxLength={50}
      />

      {/* ── Street ── */}
      <Input
        label="Calle y número"
        placeholder="Ej: Av. Siempre Viva 123"
        icon="signpost"
        value={form.linea1}
        onChange={handleChange('linea1')}
        error={fieldErrors.linea1}
        disabled={isSubmitting}
        maxLength={200}
      />

      {/* ── Line 2 ── */}
      <Input
        label="Piso / Depto (opcional)"
        placeholder="Ej: Piso 3, Depto B"
        icon="floor"
        value={form.linea2}
        onChange={handleChange('linea2')}
        error={fieldErrors.linea2}
        disabled={isSubmitting}
        maxLength={200}
      />

      {/* ── City / Province / CP (row) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Ciudad"
          placeholder="Ciudad"
          icon="location_city"
          value={form.ciudad}
          onChange={handleChange('ciudad')}
          error={fieldErrors.ciudad}
          disabled={isSubmitting}
          maxLength={50}
        />
        <Input
          label="Provincia"
          placeholder="Provincia"
          icon="map"
          value={form.provincia}
          onChange={handleChange('provincia')}
          error={fieldErrors.provincia}
          disabled={isSubmitting}
          maxLength={50}
        />
        <Input
          label="CP"
          placeholder="C.P."
          icon="mail"
          value={form.codigo_postal}
          onChange={handleChange('codigo_postal')}
          error={fieldErrors.codigo_postal}
          disabled={isSubmitting}
          maxLength={10}
        />
      </div>

      {/* ── Referencia ── */}
      <Input
        label="Referencia (opcional)"
        placeholder="Ej: Cerca de la plaza"
        icon="near_me"
        value={form.referencia}
        onChange={handleChange('referencia')}
        error={fieldErrors.referencia}
        disabled={isSubmitting}
        maxLength={200}
      />

      {/* ── Es principal ── */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.es_principal}
          onChange={handleChange('es_principal')}
          disabled={isSubmitting}
          className="h-4 w-4 rounded border-outline-variant text-brand-600
                     focus:ring-brand-600/20 focus:ring-2 focus:ring-offset-0
                     disabled:opacity-50"
        />
        <span className="text-sm text-on-surface">
          Establecer como dirección principal
        </span>
      </label>

      {/* ── Actions ── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          icon={isEdit ? 'save' : 'add'}
        >
          {isEdit ? 'Guardar cambios' : 'Agregar dirección'}
        </Button>
      </div>
    </form>
  );
}
