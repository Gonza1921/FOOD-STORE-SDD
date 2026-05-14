// Query hooks
export { usePedidos } from './usePedidos';
export { usePedidoDetail } from './usePedidoDetail';

// Mutation hooks
export {
  useCreatePedido,
  useConfirmPedido,
  useUpdatePedidoEstado,
} from './usePedidoMutations';

// Types (re-export from API)
export type {
  PedidoResponse,
  PedidoItemResponse,
  PedidoCreate,
  PedidoItemCreate,
  PedidoListResponse,
  PedidoEstadoUpdate,
  PedidoSummary,
} from '../api/endpoints';

// Query types
export type { UsePedidosReturn, UsePedidosParams } from './usePedidos';
export type { UsePedidoDetailReturn, UsePedidoDetailParams } from './usePedidoDetail';

// Mutation types
export type {
  UseCreatePedidoReturn,
  UseCreatePedidoParams,
  UseConfirmPedidoReturn,
  UseConfirmPedidoParams,
  UseUpdatePedidoEstadoReturn,
  UseUpdatePedidoEstadoParams,
} from './usePedidoMutations';
