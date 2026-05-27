import { API } from '@/shared/api/endpoints';

export const COCINA_API = {
  PEDIDOS_LIST: API.COCINA?.PEDIDOS_LIST ?? '/cocina/pedidos',
  WS_URL: `${
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_WS_URL
      ? import.meta.env.VITE_WS_URL
      : 'ws://localhost:8000'
  }/api/v1/cocina/ws`,
};
