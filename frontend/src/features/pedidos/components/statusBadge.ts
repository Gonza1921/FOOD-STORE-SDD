/**
 * Status badge helpers for Pedidos
 * Shared between OrdersPage, OrderDetailPage, and AdminOrdersPage
 */

const STATUS_BADGE_CLASSES: Record<string, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-800',
  CONFIRMADO: 'bg-blue-100 text-blue-800',
  EN_PREP: 'bg-indigo-100 text-indigo-800',
  EN_CAMINO: 'bg-purple-100 text-purple-800',
  ENTREGADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  EN_PREP: 'En Preparación',
  EN_CAMINO: 'En Camino',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

export function getStatusBadgeClasses(estado: string): string {
  return STATUS_BADGE_CLASSES[estado] || 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(estado: string): string {
  return STATUS_LABELS[estado] || estado;
}
