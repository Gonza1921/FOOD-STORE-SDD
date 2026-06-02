import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'kds-sound-enabled';

/**
 * Hook que gestiona el mute del sonido del KDS.
 * Persiste en localStorage con key `kds-sound-enabled`.
 * Default: sonido habilitado (isMuted = false).
 */
export function useSoundToggle() {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // default: sound enabled → not muted
      const enabled = stored !== null ? stored === 'true' : true;
      return !enabled;
    } catch {
      return false;
    }
  });

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(!next));
      } catch {
        /* localStorage no disponible */
      }
      return next;
    });
  }, []);

  // Sincronizar si otra pestana cambia el valor
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const enabled = e.newValue === null ? true : e.newValue === 'true';
        setIsMuted(!enabled);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return { isMuted, toggleMute };
}
