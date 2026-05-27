export type ConnectionStatus = 'live' | 'reconnecting' | 'polling' | 'disconnected';

export type UrgencyLevel = 'normal' | 'warning' | 'urgent';

export interface CocinaPedidoItem {
  nombre_snapshot: string;
  cantidad: number;
  precio_snapshot: number;
  ingredientes_excluidos: string[];
}

export interface CocinaPedido {
  id: number;
  estado_codigo: 'CONFIRMADO' | 'EN_PREP';
  subtotal: number;
  total: number;
  notas: string | null;
  creado_en: string;
  tiempo_en_estado: number;
  cliente_nombre: string;
  items: CocinaPedidoItem[];
}

export interface CocinaPedidoConUrgencia extends CocinaPedido {
  urgencyLevel: UrgencyLevel;
}

export interface WSEvent {
  tipo: 'PEDIDO_CONFIRMADO' | 'PEDIDO_EN_PREPARACION' | 'PEDIDO_EN_CAMINO' | 'PEDIDO_CANCELADO' | 'PING';
  payload: {
    pedido_id: number;
    estado_anterior: string;
    estado_nuevo: string;
    timestamp: string;
    items?: CocinaPedidoItem[];
  };
}
