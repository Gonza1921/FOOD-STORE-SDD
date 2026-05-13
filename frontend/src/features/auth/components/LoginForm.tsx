import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/shared/components';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LoginFormProps {
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string })?.from || '/';

  // ---- Validation ----

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Email inválido';
    }
    if (!password) {
      errors.password = 'La contraseña es requerida';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ---- Submit ----

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login(email, password);
      onSuccess?.();
      navigate(from, { replace: true });
    } catch {
      // Error is already set in the hook
    }
  };

  // ---- Render ----

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ── Email ── */}
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm ${
            fieldErrors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="tu@email.com"
          autoComplete="email"
        />
        {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
      </div>

      {/* ── Password ── */}
      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm ${
            fieldErrors.password ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="••••••••"
          autoComplete="current-password"
        />
        {fieldErrors.password && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
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
        Iniciar Sesión
      </Button>
    </form>
  );
}
