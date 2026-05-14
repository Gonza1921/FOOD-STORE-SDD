import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button, Input } from '@/shared/ui';

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
      <Input
        id="login-email"
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
        id="login-password"
        label="Contraseña"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
        placeholder="••••••••"
        autoComplete="current-password"
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
        Iniciar Sesión
      </Button>
    </form>
  );
}
