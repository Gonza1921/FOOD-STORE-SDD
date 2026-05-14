export { default as DireccionesListPage } from './components/DireccionesListPage';
export { default as DireccionCard } from './components/DireccionCard';
export { default as DireccionForm } from './components/DireccionForm';

export {
  useDirecciones,
  useDireccionDetail,
  useCreateDireccion,
  useUpdateDireccion,
  useDeleteDireccion,
  useSetDireccionPrincipal,
} from './hooks';

export type {
  DireccionResponse,
  DireccionCreatePayload,
  DireccionUpdatePayload,
} from './api/endpoints';
