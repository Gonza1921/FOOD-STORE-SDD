import { useEffect, useRef, useCallback } from 'react';
import { useSoundToggle } from './useSoundToggle';

export interface UseAudioAlertReturn {
  /** Reproduce un beep de 800Hz por 200ms. No-op si isMuted=true. */
  play: () => void;
  /** Indica si el sonido esta silenciado. */
  isMuted: boolean;
  /** Invierte el estado de mute y persiste a localStorage. */
  toggleMute: () => void;
}

/**
 * Hook que provee alerta sonora mediante Web Audio API.
 *
 * - OscillatorNode 800Hz tipo 'square' + GainNode 0.3
 * - Duracion 200ms con auto-stop
 * - Lazy AudioContext: se crea en el PRIMER play() (autoplay policy)
 * - Si isMuted=true, play() es no-op
 * - Limpia AudioContext al desmontar el hook
 */
export function useAudioAlert(): UseAudioAlertReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const { isMuted, toggleMute } = useSoundToggle();

  /**
   * Retorna el AudioContext actual, creandolo lazy si no existe.
   * El AudioContext SOLO se crea cuando el usuario hace una accion
   * (primer play()), respetando la autoplay policy del navegador.
   */
  const ensureContext = useCallback((): AudioContext | null => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new AudioContext();
      } catch {
        // AudioContext no disponible en este entorno
        return null;
      }
    }
    return audioContextRef.current;
  }, []);

  const play = useCallback(() => {
    if (isMuted) return;

    const ctx = ensureContext();
    if (!ctx) return;

    // Reanudar si esta suspendido (autoplay policy del navegador)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    try {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2); // 200ms
    } catch {
      // Fallo silencioso si el audio falla
    }
  }, [isMuted, ensureContext]);

  // Limpiar AudioContext al desmontar el hook
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, []);

  return { play, isMuted, toggleMute };
}
