/**
 * AuthRequiredModal — Modal que se muestra cuando un usuario no autenticado
 * intenta realizar una acción que requiere login (ej: agregar al carrito).
 *
 * Ofrece botones para:
 * - Iniciar sesión → redirige a /login
 * - Registrarse  → redirige a /registro
 */

import { useNavigate } from 'react-router-dom';
import { Modal } from '@/shared/ui';

interface AuthRequiredModalProps {
  open: boolean;
  onClose: () => void;
  /** Mensaje personalizable según la acción que se intentó */
  message?: string;
}

export default function AuthRequiredModal({
  open,
  onClose,
  message = 'Debés iniciar sesión o registrarte para agregar productos al carrito.',
}: AuthRequiredModalProps) {
  const navigate = useNavigate();

  return (
    <Modal open={open} onClose={onClose} title="Inicio de sesión requerido" maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center">
        {/* Icono */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 mb-4">
          <span
            className="material-symbols-outlined text-brand-600"
            style={{ fontSize: '32px', fontVariationSettings: '"wght" 400' }}
          >
            lock
          </span>
        </div>

        {/* Mensaje */}
        <p className="text-sm text-on-surface-variant mb-6 leading-relaxed max-w-[260px]">
          {message}
        </p>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/login');
            }}
            className="flex-1 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors active:scale-[0.98]"
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/registro');
            }}
            className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant/30 text-on-surface text-sm font-semibold hover:bg-surface-container transition-colors active:scale-[0.98]"
          >
            Registrarse
          </button>
        </div>
      </div>
    </Modal>
  );
}
