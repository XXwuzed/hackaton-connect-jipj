import { lazy, Suspense } from 'react';
import { LoadingState } from '@club/ui';
import { publicMessages } from './messages/public';

const Register = lazy(() => import('./pages/Register'));
const Unsubscribe = lazy(() => import('./pages/Unsubscribe'));
const Success = lazy(() => import('./pages/Success'));

/** Selecciona la pantalla pública sin agregar un router. */
export function App(): JSX.Element {
  const path = window.location.pathname;
  const Screen = path.startsWith('/baja/')
    ? Unsubscribe
    : path === '/success'
      ? Success
      : Register;
  return (
    <Suspense fallback={<LoadingState label={publicMessages.loading} />}>
      <Screen />
    </Suspense>
  );
}
