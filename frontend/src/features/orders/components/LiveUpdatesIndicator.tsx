/**
 * LiveUpdatesIndicator — Shows WebSocket connection status.
 */

interface LiveUpdatesIndicatorProps {
  status: 'conectado' | 'reconectando' | 'fallback';
}

export function LiveUpdatesIndicator({ status }: LiveUpdatesIndicatorProps) {
  const config = {
    conectado: {
      dot: 'bg-green-500',
      pulse: 'animate-pulse',
      text: 'En vivo',
      textColor: 'text-green-600',
    },
    reconectando: {
      dot: 'bg-yellow-500',
      pulse: 'animate-pulse',
      text: 'Reconectando...',
      textColor: 'text-yellow-600',
    },
    fallback: {
      dot: 'bg-gray-400',
      pulse: '',
      text: 'Actualizando cada 5s',
      textColor: 'text-gray-500',
    },
  };

  const c = config[status];

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${c.dot} ${c.pulse}`} />
      <span className={`text-xs ${c.textColor}`}>{c.text}</span>
    </div>
  );
}
