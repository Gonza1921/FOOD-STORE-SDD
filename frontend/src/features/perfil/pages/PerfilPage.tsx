import { useState } from 'react';
import { usePerfil, useUpdatePerfil, useCambiarContrasena } from '../hooks/usePerfil';

export default function PerfilPage() {
  const { data: perfil, isLoading, isError } = usePerfil();
  const updateMutation = useUpdatePerfil();
  const passwordMutation = useCambiarContrasena();

  // Form state
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [editMode, setEditMode] = useState(false);

  // Password form state
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Initialize form when perfil loads ──
  if (perfil && !editMode && nombre === '') {
    setNombre(perfil.nombre);
    setApellido(perfil.apellido);
    setTelefono(perfil.telefono ?? '');
  }

  // ── Handlers ──

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await updateMutation.mutateAsync({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim() || null,
      });
      setSuccessMsg('Perfil actualizado correctamente');
      setEditMode(false);
    } catch {
      setErrorMsg('Error al actualizar el perfil');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (nuevaContrasena !== confirmarContrasena) {
      setErrorMsg('Las contraseñas nuevas no coinciden');
      return;
    }

    try {
      const result = await passwordMutation.mutateAsync({
        contrasenaActual,
        nuevaContrasena,
      });
      setSuccessMsg(result.message);
      setShowPasswordForm(false);
      setContrasenaActual('');
      setNuevaContrasena('');
      setConfirmarContrasena('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setErrorMsg(axiosErr?.response?.data?.detail ?? 'Error al cambiar la contraseña');
    }
  };

  // ── Loading / Error states ──

  if (isLoading) {
    return <SkeletonPage />;
  }

  if (isError || !perfil) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-error-container/20 rounded-xl p-6 text-center">
          <p className="text-error font-medium">Error al cargar el perfil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* ── Page header ── */}
      <header>
        <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface">
          Mi Perfil
        </h1>
        <p className="text-[14px] leading-[20px] text-on-surface-variant mt-0.5">
          Gestioná tus datos personales y seguridad
        </p>
      </header>

      {/* ── Feedback messages ── */}
      {successMsg && (
        <div className="bg-success-container/20 text-success text-sm px-4 py-3 rounded-lg">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-error-container/20 text-error text-sm px-4 py-3 rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* ── Profile data / form ── */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-on-surface">Datos personales</h2>
          {!editMode && (
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
            >
              Editar
            </button>
          )}
        </div>

        {editMode ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">
                Apellido
              </label>
              <input
                type="text"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  setNombre(perfil.nombre);
                  setApellido(perfil.apellido);
                  setTelefono(perfil.telefono ?? '');
                }}
                className="px-4 py-2 text-on-surface-variant hover:text-on-surface transition-colors text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <InfoRow label="Nombre" value={`${perfil.nombre} ${perfil.apellido}`} />
            <InfoRow label="Email" value={perfil.email} />
            <InfoRow label="Teléfono" value={perfil.telefono ?? '—'} />
            <InfoRow
              label="Miembro desde"
              value={new Date(perfil.creadoEn).toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
          </div>
        )}
      </div>

      {/* ── Password section ── */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-on-surface">Seguridad</h2>
          {!showPasswordForm && (
            <button
              type="button"
              onClick={() => setShowPasswordForm(true)}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
            >
              Cambiar contraseña
            </button>
          )}
        </div>

        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">
                Contraseña actual
              </label>
              <input
                type="password"
                value={contrasenaActual}
                onChange={(e) => setContrasenaActual(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={nuevaContrasena}
                onChange={(e) => setNuevaContrasena(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
              />
              <p className="text-xs text-on-surface-variant mt-1">Mínimo 8 caracteres</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                value={confirmarContrasena}
                onChange={(e) => setConfirmarContrasena(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={passwordMutation.isPending}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {passwordMutation.isPending ? 'Cambiando...' : 'Cambiar contraseña'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setContrasenaActual('');
                  setNuevaContrasena('');
                  setConfirmarContrasena('');
                  setErrorMsg(null);
                }}
                className="px-4 py-2 text-on-surface-variant hover:text-on-surface transition-colors text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {!showPasswordForm && (
          <p className="text-sm text-on-surface-variant">
            Tu contraseña se actualizó por última vez al registrarte.
            Cambiarla periódicamente mejora la seguridad de tu cuenta.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Helper components ──

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-outline-variant/10 last:border-b-0">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span className="text-sm font-medium text-on-surface">{value}</span>
    </div>
  );
}

function SkeletonPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-pulse">
      <div className="h-8 w-32 bg-outline-variant/20 rounded-lg" />
      <div className="h-5 w-64 bg-outline-variant/20 rounded-lg" />
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-5 sm:p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-20 bg-outline-variant/20 rounded" />
            <div className="h-4 w-40 bg-outline-variant/20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
