import { lazy, Suspense } from 'react';

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
    <Suspense fallback={<p className="p-6">Cargando…</p>}>
      <Screen />
    </Suspense>
  );
}
