import { useMemo, useState } from 'react';
import { CocinaHeader } from '@/features/cocina/components/CocinaHeader';
import { ColumnaEstado } from '@/features/cocina/components/ColumnaEstado';
import { useWebSocketCocina } from '@/features/cocina/hooks/useWebSocketCocina';
import { useUrgenciaTimer } from '@/features/cocina/hooks/useUrgenciaTimer';
import { useUpdateEstado } from '@/features/cocina/hooks/useUpdateEstado';

export default function CocinaPage() {
  const [actingId, setActingId] = useState<number | null>(null);
  const { pedidos, connectionStatus } = useWebSocketCocina();
  const pedidosConUrgencia = useUrgenciaTimer(pedidos);
  const { mutate } = useUpdateEstado();

  const { confirmados, enPrep } = useMemo(() => {
    const confirmados = pedidosConUrgencia.filter((p) => p.estado_codigo === 'CONFIRMADO');
    const enPrep = pedidosConUrgencia.filter((p) => p.estado_codigo === 'EN_PREP');
    return { confirmados, enPrep };
  }, [pedidosConUrgencia]);

  const handleIniciar = (id: number) => {
    setActingId(id);
    mutate(
      { id, estado_nuevo: 'EN_PREP' },
      { onSettled: () => setActingId(null) },
    );
  };

  const handleListo = (id: number) => {
    setActingId(id);
    mutate(
      { id, estado_nuevo: 'EN_CAMINO' },
      { onSettled: () => setActingId(null) },
    );
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#1a1a2e]">
      <CocinaHeader connectionStatus={connectionStatus} />

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        <div className="flex-1 min-w-0">
          <ColumnaEstado
            titulo="Por preparar"
            pedidos={confirmados}
            onIniciar={handleIniciar}
            actingId={actingId}
            color="amber"
          />
        </div>
        <div className="flex-1 min-w-0">
          <ColumnaEstado
            titulo="En preparación"
            pedidos={enPrep}
            onListo={handleListo}
            actingId={actingId}
            color="blue"
          />
        </div>
      </div>
    </div>
  );
}
