import { create } from 'zustand';

interface PedidoItem {
  id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  nombre_snapshot?: string;
}

export interface PedidoTracking {
  id: number;
  usuario_id: number;
  estado: string;
  total: string;
  items: PedidoItem[];
  creado_en: string;
  actualizado_en: string;
  costo_envio?: number;
  direccion_snapshot?: string | null;
  confirmado_en?: string | null;
  en_preparacion_en?: string | null;
  listo_en?: string | null;
  en_camino_en?: string | null;
  entregado_en?: string | null;
}

interface OrderTrackingStore {
  order: PedidoTracking | null;
  connectionStatus: 'conectado' | 'reconectando' | 'fallback';
  lastUpdate: Date | null;
  setOrder: (order: PedidoTracking) => void;
  setConnectionStatus: (status: 'conectado' | 'reconectando' | 'fallback') => void;
}

export const useOrderTrackingStore = create<OrderTrackingStore>((set) => ({
  order: null,
  connectionStatus: 'fallback',
  lastUpdate: null,
  setOrder: (order) => set({ order, lastUpdate: new Date() }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
}));
