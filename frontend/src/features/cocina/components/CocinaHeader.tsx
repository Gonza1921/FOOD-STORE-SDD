import type { ConnectionStatus } from '../types';

interface CocinaHeaderProps {
  connectionStatus: ConnectionStatus;
}

function StatusIndicator({ connectionStatus }: { connectionStatus: ConnectionStatus }) {
  switch (connectionStatus) {
    case 'live':
      return (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-success">
          <span className="flex h-2 w-2 rounded-full bg-success shadow-[0_0_6px_rgba(46,125,50,0.6)]" />
          En vivo
        </span>
      );
    case 'reconnecting':
      return (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-warning">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Reconectando...
        </span>
      );
    case 'polling':
      return (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-error">
          <span className="flex h-2 w-2 rounded-full bg-error" />
          Sin conexión — Actualizando cada 30s
        </span>
      );
    case 'disconnected':
      return (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant/60">
          <span className="flex h-2 w-2 rounded-full bg-outline-variant" />
          Desconectado
        </span>
      );
  }
}

export function CocinaHeader({ connectionStatus }: CocinaHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-surface-container-lowest/70 backdrop-blur-xl border-b border-outline-variant/10">
      <h1 className="text-xl font-bold text-on-surface tracking-tight">Cocina</h1>
      <StatusIndicator connectionStatus={connectionStatus} />
    </header>
  );
}
