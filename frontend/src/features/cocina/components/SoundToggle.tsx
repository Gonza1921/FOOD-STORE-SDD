interface SoundToggleProps {
  isMuted: boolean;
  onToggle: () => void;
}

/**
 * Boton toggle de sonido para el KDS.
 * Muestra icono de altavoz (verde) cuando activo, icono mute (gris) cuando silenciado.
 */
export function SoundToggle({ isMuted, onToggle }: SoundToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={isMuted ? 'Sonido silenciado' : 'Sonido activado'}
      aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
      className={`rounded-lg p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-container-lowest ${
        isMuted
          ? 'text-gray-400 hover:text-on-surface hover:bg-surface-container'
          : 'text-green-500 hover:text-green-400 hover:bg-green-500/10'
      }`}
    >
      {isMuted ? (
        /* Icono mute — altavoz tachado */
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        /* Icono altavoz con ondas */
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
        </svg>
      )}
    </button>
  );
}
