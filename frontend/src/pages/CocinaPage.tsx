import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { CocinaHeader } from '@/features/cocina/components/CocinaHeader';
import { ColumnaEstado } from '@/features/cocina/components/ColumnaEstado';
import { useWebSocketCocina } from '@/features/cocina/hooks/useWebSocketCocina';
import { useUrgenciaTimer } from '@/features/cocina/hooks/useUrgenciaTimer';
import { useUpdateEstado } from '@/features/cocina/hooks/useUpdateEstado';
import { useAudioAlert } from '@/features/cocina/hooks/useAudioAlert';
import { useToggleDisponibilidad } from '@/features/cocina/hooks/useToggleDisponibilidad';

export default function CocinaPage() {
  const [actingId, setActingId] = useState<number | null>(null);
  const [flashNewOrder, setFlashNewOrder] = useState(false);
  const prevConfirmadosLenRef = useRef(0);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { pedidos, connectionStatus } = useWebSocketCocina();
  const pedidosConUrgencia = useUrgenciaTimer(pedidos);
  const { mutate } = useUpdateEstado();
  const { play: playAlert, isMuted, toggleMute } = useAudioAlert();
  const disponibilidadMutation = useToggleDisponibilidad();

  const { confirmados, enPrep } = useMemo(() => {
    const confirmados = pedidosConUrgencia.filter((p) => p.estado_codigo === 'CONFIRMADO');
    const enPrep = pedidosConUrgencia.filter((p) => p.estado_codigo === 'EN_PREP');
    return { confirmados, enPrep };
  }, [pedidosConUrgencia]);

  // Detectar nuevos pedidos CONFIRMADOS → beep + flash
  useEffect(() => {
    if (confirmados.length > prevConfirmadosLenRef.current) {
      playAlert();
      setFlashNewOrder(true);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => {
        setFlashNewOrder(false);
      }, 300);
    }
    prevConfirmadosLenRef.current = confirmados.length;

    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, [confirmados.length, playAlert]);

  const handleIniciar = useCallback((id: number) => {
    setActingId(id);
    mutate(
      { id, estado_nuevo: 'EN_PREP' },
      { onSettled: () => setActingId(null) },
    );
  }, [mutate]);

  const handleListo = useCallback((id: number) => {
    setActingId(id);
    mutate(
      { id, estado_nuevo: 'EN_CAMINO' },
      { onSettled: () => setActingId(null) },
    );
  }, [mutate]);

  const handleToggleDisponibilidad = useCallback(
    (productoId: number, disponible: boolean) => {
      disponibilidadMutation.mutate({ productoId, disponible });
    },
    [disponibilidadMutation],
  );

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#1a1a2e]">
      <CocinaHeader
        connectionStatus={connectionStatus}
        isMuted={isMuted}
        onToggleSound={toggleMute}
        flashNewOrder={flashNewOrder}
      />

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        <div className="flex-1 min-w-0">
          <ColumnaEstado
            titulo="Por preparar"
            pedidos={confirmados}
            onIniciar={handleIniciar}
            actingId={actingId}
            color="amber"
            onToggleDisponibilidad={handleToggleDisponibilidad}
          />
        </div>
        <div className="flex-1 min-w-0">
          <ColumnaEstado
            titulo="En preparación"
            pedidos={enPrep}
            onListo={handleListo}
            actingId={actingId}
            color="blue"
            onToggleDisponibilidad={handleToggleDisponibilidad}
          />
        </div>
      </div>
    </div>
  );
}
