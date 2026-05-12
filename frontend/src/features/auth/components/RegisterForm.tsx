import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/shared/components';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RegisterFormProps {
  onSuccess?: () => void;
}

interface FieldErrors {
  nombre?: string;
  apellido?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const { register, isLoading, error } = useAuth();
  const navigate = useNavigate();

  // ---- Validation ----

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    } else if (nombre.length > 50) {
      errors.nombre = 'Máximo 50 caracteres';
    }

    if (!apellido.trim()) {
      errors.apellido = 'El apellido es requerido';
    } else if (apellido.length > 50) {
      errors.apellido = 'Máximo 50 caracteres';
    }

    if (!email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Email inválido';
    }

    if (!password) {
      errors.password = 'La contraseña es requerida';
    } else if (password.length < 8) {
      errors.password = 'Mínimo 8 caracteres';
    } else if (password.length > 128) {
      errors.password = 'Máximo 128 caracteres';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ---- Submit ----

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register({ nombre, apellido, email, password });
      onSuccess?.();
      navigate('/', { replace: true });
    } catch {
      // Error is already set in the hook
    }
  };

  // ---- Input helper ----

  const inputClass = (field: keyof FieldErrors): string =>
    `mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm ${
      fieldErrors[field] ? 'border-red-500' : 'border-gray-300'
    }`;

  // ---- Render ----

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ── Nombre ── */}
      <div>
        <label
          htmlFor="reg-nombre"
          className="block text-sm font-medium text-gray-700"
        >
          Nombre
        </label>
        <input
          id="reg-nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className={inputClass('nombre')}
          placeholder="Juan"
          autoComplete="given-name"
        />
        {fieldErrors.nombre && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.nombre}</p>
        )}
      </div>

      {/* ── Apellido ── */}
      <div>
        <label
          htmlFor="reg-apellido"
          className="block text-sm font-medium text-gray-700"
        >
          Apellido
        </label>
        <input
          id="reg-apellido"
          type="text"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          className={inputClass('apellido')}
          placeholder="Pérez"
          autoComplete="family-name"
        />
        {fieldErrors.apellido && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.apellido}</p>
        )}
      </div>

      {/* ── Email ── */}
      <div>
        <label
          htmlFor="reg-email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass('email')}
          placeholder="tu@email.com"
          autoComplete="email"
        />
        {fieldErrors.email && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
        )}
      </div>

      {/* ── Password ── */}
      <div>
        <label
          htmlFor="reg-password"
          className="block text-sm font-medium text-gray-700"
        >
          Contraseña
        </label>
        <input
          id="reg-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass('password')}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
        />
        {fieldErrors.password && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
        )}
      </div>

      {/* ── Confirmar Password ── */}
      <div>
        <label
          htmlFor="reg-confirm-password"
          className="block text-sm font-medium text-gray-700"
        >
          Confirmar Contraseña
        </label>
        <input
          id="reg-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass('confirmPassword')}
          placeholder="Repetir contraseña"
          autoComplete="new-password"
        />
        {fieldErrors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      {/* ── API Error ── */}
      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ── Submit ── */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        className="w-full justify-center"
        disabled={isLoading}
      >
        Crear Cuenta
      </Button>
    </form>
  );
}
