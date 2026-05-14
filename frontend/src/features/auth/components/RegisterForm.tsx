import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button, Input } from '@/shared/ui';

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

  // ---- Render ----

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ── Nombre ── */}
      <Input
        id="reg-nombre"
        label="Nombre"
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        error={fieldErrors.nombre}
        placeholder="Juan"
        autoComplete="given-name"
        icon="person"
      />

      {/* ── Apellido ── */}
      <Input
        id="reg-apellido"
        label="Apellido"
        type="text"
        value={apellido}
        onChange={(e) => setApellido(e.target.value)}
        error={fieldErrors.apellido}
        placeholder="Pérez"
        autoComplete="family-name"
        icon="badge"
      />

      {/* ── Email ── */}
      <Input
        id="reg-email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        placeholder="tu@email.com"
        autoComplete="email"
        icon="mail"
      />

      {/* ── Password ── */}
      <Input
        id="reg-password"
        label="Contraseña"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
        placeholder="Mínimo 8 caracteres"
        autoComplete="new-password"
        icon="lock"
      />

      {/* ── Confirmar Password ── */}
      <Input
        id="reg-confirm-password"
        label="Confirmar Contraseña"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={fieldErrors.confirmPassword}
        placeholder="Repetir contraseña"
        autoComplete="new-password"
        icon="lock"
      />

      {/* ── API Error ── */}
      {error && (
        <div className="feedback-banner--error">
          <span className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: '"wght" 500' }}
            >
              error
            </span>
            {error}
          </span>
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
